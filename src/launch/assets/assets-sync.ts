import { Observer } from '@playcanvas/observer';

import { ObserverSync } from '@/common/observer-sync';

editor.once('load', () => {
    const app = editor.call('viewport:app');
    if (!app) {
        return;
    } // webgl not available

    const settings = editor.call('settings:project');
    const docs: Record<string, { unsubscribe: () => void; destroy: () => void }> = { };

    const assetNames: Record<string, string> = { };

    const queryParams = (new pc.URI(window.location.href)).getQuery() as Record<string, string>;
    const concatenateScripts = (queryParams.concatenateScripts === 'true');
    const concatenatedScriptsUrl = `projects/${(config.project as { id: string }).id}/concatenated-scripts/scripts.js?branchId=${(config.self as { branch: { id: string } }).branch.id}`;
    const useBundles = (queryParams.useBundles !== 'false');

    const getFileUrl = function (folders: string[], id: string | number, revision: string | number, filename: string, useBundles?: boolean) {
        if (useBundles) {
            // if we are using bundles then this URL should be the URL
            // in the tar archive
            return ['files/assets', id, revision, filename].join('/');
        }

        let path = '';
        for (let i = 0; i < folders.length; i++) {
            const folder = editor.call('assets:get', folders[i]);
            if (folder) {
                path += `${encodeURIComponent(folder.get('name'))}/`;
            } else {
                path += `${encodeURIComponent(assetNames[folders[i]] || 'unknown')}/`;
            }
        }
        return `assets/files/${path}${encodeURIComponent(filename)}?id=${id}&branchId=${(config.self as { branch: { id: string } }).branch.id}`;
    };

    editor.method('loadAsset', (uniqueId: string, callback?: (asset?: Observer) => void) => {
        const connection = editor.call('realtime:connection');

        const doc = connection.get('assets', `${uniqueId}`);

        docs[uniqueId] = doc;

        // error
        doc.on('error', (err: unknown) => {
            if (connection.state === 'connected') {
                console.log(err);
                return;
            }

            editor.emit('realtime:assets:error', err);
        });

        // ready to sync
        doc.on('load', () => {
            let key;

            const assetData = doc.data;
            if (!assetData) {
                log.error(`Could not load asset: ${uniqueId}`);
                doc.unsubscribe();
                doc.destroy();
                return callback?.();
            }

            // notify of operations
            doc.on('op', (ops: unknown[], local: boolean) => {
                if (local) {
                    return;
                }

                for (let i = 0; i < ops.length; i++) {
                    editor.emit('realtime:op:assets', ops[i], uniqueId);
                }
            });

            assetData.id = parseInt(assetData.item_id, 10);
            assetData.uniqueId = parseInt(uniqueId, 10);

            // delete unnecessary fields
            delete assetData.item_id;
            delete assetData.branch_id;

            if (assetData.type === 'template' && !assetData.preload) {
                // handle async template
                assetData.file = {
                    filename: `${assetData.name}.json`
                };
            }

            if (assetData.file) {
                if (concatenateScripts && assetData.type === 'script' && assetData.file.filename.endsWith('.js') && assetData.preload && !assetData.data.loadingType) {
                    assetData.file.url = concatenatedScriptsUrl;
                } else {
                    assetData.file.url = getFileUrl(assetData.path, assetData.id, assetData.revision, assetData.file.filename);
                }

                if (assetData.file.variants) {
                    for (key in assetData.file.variants) {
                        assetData.file.variants[key].url = getFileUrl(assetData.path, assetData.id, assetData.revision, assetData.file.variants[key].filename);
                    }
                }
            }

            let asset = editor.call('assets:get', assetData.id);
            // asset can exist if we are reconnecting to collab-server
            const assetExists = !!asset;

            if (!assetExists) {
                let options;

                // allow duplicate values in data.frameKeys of sprite asset
                if (assetData.type === 'sprite') {
                    options = {
                        pathsWithDuplicates: ['data.frameKeys']
                    };
                }

                asset = new Observer(assetData, options);
                editor.call('assets:add', asset);

                const _asset = asset.asset = new pc.Asset(assetData.name, assetData.type, assetData.file, assetData.data);
                _asset.id = parseInt(assetData.id, 10);
                _asset.preload = assetData.preload ? assetData.preload : false;

                // tags
                _asset.tags.add(assetData.tags);

                // i18n
                if (assetData.i18n) {
                    for (const locale in assetData.i18n) {
                        _asset.addLocalizedAssetId(locale, assetData.i18n[locale]);
                    }
                }
            } else {
                for (key in assetData) {
                    asset.set(key, assetData[key]);
                }
            }

            if (callback) {
                callback(asset);
            }
        });

        // subscribe for realtime events
        doc.subscribe();
    });

    const createEngineAsset = function (asset: Observer, wasmAssetIds: Record<string, number>) {
        let sync;

        // if engine asset already exists return
        if (app.assets.get(asset.get('id'))) {
            return;
        }

        // handle bundle assets
        if (useBundles && asset.get('type') === 'bundle') {
            sync = asset.sync.enabled;
            asset.sync.enabled = false;

            // get the assets in this bundle
            // that have a file
            const assetsInBundle = asset.get('data.assets').map((id: number) => {
                return editor.call('assets:get', id);
            }).filter((a: Observer | undefined) => {
                return a && a.has('file.filename');
            });

            if (assetsInBundle.length) {
                // set the main filename and url for the bundle asset
                asset.set('file', {});
                asset.set('file.filename', `${asset.get('name')}.tar`);
                asset.set('file.url', getFileUrl(asset.get('path'), asset.get('id'), asset.get('revision'), asset.get('file.filename')));

                // find assets with variants
                const assetsWithVariants = assetsInBundle.filter((a: Observer) => {
                    return asset.has('file.variants');
                });

                ['dxt', 'etc1', 'etc2', 'pvr', 'basis'].forEach((variant: string) => {
                    // search for assets with the specified variants and if some
                    // exist then generate the variant file
                    for (let i = 0, len = assetsWithVariants.length; i < len; i++) {
                        if (assetsWithVariants[i].has(`file.variants.${variant}`)) {
                            if (!asset.has('file.variants')) {
                                asset.set('file.variants', {});
                            }

                            const filename = `${asset.get('name')}-${variant}.tar`;
                            asset.set(`file.variants.${variant}`, {
                                filename: filename,
                                url: getFileUrl(asset.get('path'), asset.get('id'), asset.get('revision'), filename)

                            });
                            return;
                        }
                    }
                });
            }

            asset.sync.enabled = sync;
        }

        if (useBundles && asset.get('type') !== 'bundle') {
            // if the asset is in a bundle then replace its url with the url that it's supposed to have in the bundle
            if (editor.call('assets:bundles:containAsset', asset.get('id'))) {
                const file = asset.get('file');
                if (file) {
                    sync = asset.sync.enabled;
                    asset.sync.enabled = false;

                    asset.set('file.url', getFileUrl(asset.get('path'), asset.get('id'), asset.get('revision'), file.filename, true));
                    if (file.variants) {
                        for (const key in file.variants) {
                            asset.set(`file.variants.${key}.url`, getFileUrl(asset.get('path'), asset.get('id'), asset.get('revision'), file.variants[key].filename, true));
                        }
                    }

                    asset.sync.enabled = sync;
                }
            }
        }

        // create the engine asset
        const assetData = asset.json();
        const engineAsset = (asset as Observer & { asset?: pc.Asset }).asset = new pc.Asset(assetData.name, assetData.type, assetData.file, assetData.data);
        engineAsset.id = parseInt(assetData.id, 10);
        engineAsset.preload = assetData.preload ? assetData.preload : false;
        if (assetData.type === 'script' &&
            assetData.data &&
            assetData.data.loadingType > 0) {
            // disable load on script before/after engine scripts
            engineAsset.loaded = true;
        } else if (wasmAssetIds.hasOwnProperty(assetData.id)) {
            // disable load on module assets
            engineAsset.loaded = true;
        }

        // tags
        engineAsset.tags.add(assetData.tags);

        // i18n
        if (assetData.i18n) {
            for (const locale in assetData.i18n) {
                engineAsset.addLocalizedAssetId(locale, assetData.i18n[locale]);
            }
        }

        // add to the asset registry
        app.assets.add(engineAsset);
    };

    const onLoad = function (data: Array<{ id: string; uniqueId: string; name?: string }>) {
        editor.call('assets:progress', 0.5);

        const total = data.length;
        if (!total) {
            editor.call('assets:progress', 1);
            editor.emit('assets:load');
        }

        let count = 0;
        const scripts = { };

        const legacyScripts = settings.get('useLegacyScripts');

        // get the set of wasm asset ids i.e. the wasm module ids and linked glue/fallback
        // script ids. the list is used to suppress the asset system from the loading
        // the scripts again.
        const getWasmAssetIds = function (): Record<string, number> {
            const result: Record<string, number> = { };
            editor.call('assets:list')
            .forEach((a: Observer) => {
                const asset = (a as Observer & { asset?: pc.Asset }).asset;
                if (asset.type !== 'wasm' || !asset.data) {
                    return;
                }
                result[asset.id] = 1;
                if (asset.data.glueScriptId) {
                    result[asset.data.glueScriptId] = 1;
                }
                if (asset.data.fallbackScriptId) {
                    result[asset.data.fallbackScriptId] = 1;
                }
            });
            return result;
        };

        const loadScripts = function (wasmAssetIds: Record<string, number>) {
            const order = settings.get('scripts');

            for (let i = 0; i < order.length; i++) {
                if (!scripts[order[i]]) {
                    continue;
                }

                const asset = editor.call('assets:get', order[i]);
                if (asset) {
                    createEngineAsset(asset, wasmAssetIds);
                }
            }
        };

        const load = function (uniqueId: string) {
            editor.call('loadAsset', uniqueId, async (asset: Observer) => {
                count++;
                editor.call('assets:progress', (count / total) * 0.5 + 0.5);

                if (!legacyScripts && asset && asset.get('type') === 'script') {
                    scripts[asset.get('id')] = asset;
                }

                if (count === total) {
                    const wasmAssetIds = getWasmAssetIds();

                    // Initialize the Mapping SW which handles url mappings
                    await editor.call('sw:initialize');

                    if (!legacyScripts) {
                        loadScripts(wasmAssetIds);
                    }

                    // sort assets by script first and then by bundle
                    const assets = editor.call('assets:list');
                    assets.sort((a: Observer, b: Observer) => {
                        const typeA = a.get('type');
                        const typeB = b.get('type');
                        if (typeA === 'script' && typeB !== 'script') {
                            return -1;
                        }
                        if (typeB === 'script' && typeA !== 'script') {
                            return 1;
                        }
                        if (typeA === 'bundle' && typeB !== 'bundle') {
                            return -1;
                        }
                        if (typeB === 'bundle' && typeA !== 'bundle') {
                            return 1;
                        }
                        return 0;
                    });

                    // create runtime asset for every asset observer
                    assets.forEach((a: Observer) => {
                        createEngineAsset(a, wasmAssetIds);
                    });

                    editor.call('assets:progress', 1);
                    editor.emit('assets:load');
                }
            });
        };

        const connection = editor.call('realtime:connection');

        // do bulk subscribe in batches of 'batchSize' assets
        const batchSize = 256;
        let startBatch = 0;

        while (startBatch < total) {
            // start bulk subscribe
            connection.startBulk();
            for (let i = startBatch; i < startBatch + batchSize && i < total; i++) {
                assetNames[data[i].id] = data[i].name;
                load(data[i].uniqueId);
            }
            // end bulk subscribe and send message to server
            connection.endBulk();

            startBatch += batchSize;
        }
    };

    // load all assets
    editor.on('realtime:authenticated', () => {
        editor.api.globals.rest.projects.projectAssets('launcher', true)
        .on('load', (_status: number, data: Array<{ id: string; uniqueId: string; name?: string }>) => {
            onLoad(data);
        })
        .on('progress', (progress: number) => {
            editor.call('assets:progress', 0.1 + progress * 0.4);
        })
        .on('error', (status: number, evt: unknown) => {
            console.log(status, evt);
        });
    });

    editor.call('assets:progress', 0.1);

    editor.on('assets:remove', (asset: Observer) => {
        const id = asset.get('uniqueId');
        const doc = docs[id];
        if (doc) {
            doc.unsubscribe();
            doc.destroy();
            delete docs[id];
        }
    });

    // hook sync to new assets
    editor.on('assets:add', (asset: Observer) => {
        if (asset.sync) {
            return;
        }

        asset.sync = new ObserverSync({
            item: asset
        });

        let setting = false;

        asset.on('*:set', (path: string, value: unknown) => {
            if (setting || !path.startsWith('file') || path.endsWith('.url') || !asset.get('file')) {
                return;
            }

            setting = true;

            const parts = path.split('.');

            // NOTE: if we have concatenated scripts then this will reset the file URL to the original URL and not the
            // concatenated URL which is what we want for hot reloading
            if ((parts.length === 1 || parts.length === 2) && parts[1] !== 'variants') {
                asset.set('file.url', getFileUrl(asset.get('path'), asset.get('id'), asset.get('revision'), asset.get('file.filename')));
            } else if (parts.length >= 3 && parts[1] === 'variants') {
                const format = parts[2];
                asset.set(`file.variants.${format}.url`, getFileUrl(asset.get('path'), asset.get('id'), asset.get('revision'), asset.get(`file.variants.${format}.filename`)));
            }

            setting = false;
        });
    });

    // server > client
    editor.on('realtime:op:assets', (op: { p: unknown[] }, uniqueId: string) => {
        const asset = editor.call('assets:getUnique', uniqueId);
        if (asset) {
            asset.sync.write(op);
        } else {
            log.error(`realtime operation on missing asset: ${op.p[1]}`);
        }
    });
});
