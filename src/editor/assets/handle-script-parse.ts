import { buildQueryUrl } from '@/common/utils';
import { WorkerClient } from '@/core/worker/worker-client';

editor.once('load', () => {
    const genGUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    const importEngine = async (url) => {
        if (url.endsWith('.mjs')) {
            // @ts-ignore
            return await import(url);
        }

        const res = await fetch(url);
        const text = await res.text();
        const module = {
            exports: {}
        };
        // eslint-disable-next-line no-new-func
        return (Function('module', 'exports', text).call(module, module, module.exports), module).exports;
    };

    const isEsmSupportedInEngine = async (url) => {
        const pc = await importEngine(url);
        return !!pc.Script;
    };

    const workerClient = new WorkerClient(`${config.url.frontend}js/esm-script.worker.js`);
    workerClient.once('init', async () => {

        const typesURL = config.url.engine.replace(/(\.min|\.dbg|\.prf)?\.js$/, '.d.ts');
        const res = await fetch(typesURL);
        const types = await res.text();
        let hasIncludedTypes = false;

        const reqState = new Map();

        const logStartParse = (asset, inEditor) => {
            if (inEditor) {
                editor.call('status:text', `Parsing script asset '${asset.get('name')}'...`);
            }
        };

        const checkForErrors = (res) => {
            if (res.scriptsInvalid?.length) {
                return res.scriptsInvalid;
            }
            for (const key in res.scripts) {
                const script = res.scripts[key];
                if (script.attributesInvalid?.length) {
                    return script.attributesInvalid;
                }
            }
            return null;
        };

        const handleParseResult = (guid, res, asset, callback, inEditor) => {
            if (inEditor) {
                const errors = checkForErrors(res);
                if (errors) {
                    editor.call('status:error', `There was an error while parsing script asset '${asset.get('name')}'`);
                    callback?.(null, res);
                    return;
                }
            }

            // Wait for the backend to finish setting the script attributes
            editor.on(`messenger:scriptAttrsFinished:${guid}`, () => {
                if (inEditor) {
                    editor.call('status:clear');
                }
                callback?.(null, res);
                editor.unbind(`messenger:scriptAttrsFinished:${guid}`);
            });

            // Send the parsed script to the backend
            editor.call('realtime:send', 'pipeline', {
                name: 'script-attributes',
                data: {
                    script_task_type: 'handle_parsed_script',
                    job_id: guid,
                    parse_result: res,
                    project_id: config.project.id,
                    branch_id: config.self.branch.id,
                    asset_id: asset.get('id')
                }
            });
        };

        const postUrl = (asset) => {
            const encodedFileName = encodeURIComponent(asset.get('file.filename'));
            return buildQueryUrl(`/api/assets/${asset.get('id')}/file/${encodedFileName}`, { branchId: config.self.branch.id });
        };

        workerClient.on('attributes:parse', (guid, scripts, scriptsInvalid) => {
            if (!reqState.has(guid)) {
                return;
            }

            // Unpack request state
            const { callback, asset, inEditor } = reqState.get(guid);
            reqState.delete(guid);

            const res = {
                scripts,
                scriptsInvalid,
                loading: false
            };
            handleParseResult(guid, res, asset, callback, inEditor);
        });

        const fileCache = new Map();
        const getScripts = async (pathFilter = []) => {
            const assets = editor.call('assets:list') ?? [];

            // Get all the files that no longer exist. ie files in the cache, but not in esmScripts
            const deletedFiles = [];
            const esmPaths = new Set(assets
            .filter(asset => editor.call('assets:isModule', asset))
            .map(asset => editor.call('assets:virtualPath', asset)));

            // loop over the file cache, remove any files that do no exist in the script assets
            for (const path of fileCache.keys()) {
                if (!esmPaths.has(path)) {
                    deletedFiles.push(path);
                    fileCache.delete(path);
                }
            }

            const scripts = await Promise.all(assets.map(async (asset) => {
                if (!editor.call('assets:isModule', asset)) {
                    return;
                }

                const path = editor.call('assets:virtualPath', asset);
                if (pathFilter.includes(path)) {
                    return;
                }

                const hash = asset.get('file.hash');
                if (fileCache.get(path) === hash) {
                    return;
                }

                // Attempt to fetch the script
                try {
                    const url = editor.call('assets:realPath', asset);
                    const res = await fetch(url);
                    const content = await res.text();
                    fileCache.set(path, hash);
                    return [path, content];
                } catch (e) {
                    console.error(`Failed to fetch ESM script ${path}`, e);
                }
            }));

            return [scripts.filter(script => !!script), deletedFiles];
        };

        const classicParse = (asset, inEditor, callback) => {
            const worker = new Worker('/editor/scene/js/classic-script.worker.js');
            worker.onmessage = (evt) => {
                worker.terminate();
                const res = evt.data;
                const guid = genGUID();
                handleParseResult(guid, res, asset, callback, inEditor);
            };

            worker.onerror = (err) => {
                if (inEditor) {
                    editor.call('status:error', 'There was an error while parsing a script');
                }
                console.log('worker onerror', err);
                callback?.(err, undefined);
            };

            logStartParse(asset, inEditor);

            worker.postMessage({
                url: inEditor ? asset.get('file.url') : postUrl(asset),
                engine: config.url.engine
            });
        };

        editor.method('scripts:handleParse', async (asset, inEditor, callback) => {
            if (editor.call('assets:isModule', asset)) {
                // FIXME: just check engine version directly
                if (!(await isEsmSupportedInEngine(config.url.engine))) {
                    editor.call('status:error', 'ESM scripts are not supported in this version of the engine. Please update to the latest version.');
                    return;
                }

                logStartParse(asset, inEditor);

                // Construct scripts
                const [newOrUpdatedScripts, deletedFiles] = await getScripts();

                // Include the types file if it hasn't been included yet
                if (!hasIncludedTypes) {
                    newOrUpdatedScripts.push(['/playcanvas.d.ts', types]);
                    hasIncludedTypes = true;
                }

                const url = editor.call('assets:virtualPath', asset).split('?')[0];
                const guid = genGUID();

                // Cache the request state
                reqState.set(guid, { callback, asset, inEditor });

                workerClient.send('attributes:parse', guid, newOrUpdatedScripts, deletedFiles, url);
                return;
            }

            classicParse(asset, inEditor, callback);
        });
    });

    workerClient.once('ready', () => workerClient.send('init', config.url.frontend));
    workerClient.start();

    window.addEventListener('beforeunload', () => {
        workerClient.stop();
    });
});
