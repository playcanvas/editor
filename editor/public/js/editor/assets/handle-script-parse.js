editor.once('load', function () {
    'use strict';

    const WORKER_PATH = '/editor/scene/js/editor/assets/assets-script-parse-worker.js';

    editor.method('scripts:handleParse', function (asset, inEditor, callback) {
        new HandleScriptParse(asset, inEditor, callback).run();
    });

    editor.method('utils:makeGuid', function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;

            const v = (c == 'x') ? r : (r & 0x3 | 0x8);

            return v.toString(16);
        });
    });

    /**
     * Parse a script using the parse worker, and call the backend 'script-attributes'
     * task to set all defaults and update existing values as needed.
     * There are some differences in logic based on whether this is called in
     * the Editor or in the Script Editor, as signalled by the 'inEditor' param.
     */
    class HandleScriptParse {
        constructor(asset, inEditor, callback) {
            this.asset = asset;

            this.inEditor = inEditor;

            this.callback = callback;

            this.aName = asset.get('name');

            this.aId = asset.get('id');
        }

        run() {
            this.reportStartIfNeed();

            this.initWorker();

            this.worker.onmessage = this.onMsg.bind(this);

            this.worker.onerror = this.onErr.bind(this);

            this.postWorkerMsg();
        }

        initWorker() {
            this.worker = new Worker(WORKER_PATH);

            this.worker.asset = this.asset;

            this.worker.progress = 0;
        }

        onMsg(event) {
            if (event.data.name === 'results') {
                this.worker.terminate();

                this.parseRes = event.data.data;

                this.handleParseRes();
            }
        }

        handleParseRes() {
            if (this.inEditor) {
                this.checkErrors();
            }

            if (!this.errorsFound) {
                this.runScriptTask();
            }
        }

        runScriptTask() {
            this.jobId = editor.call('utils:makeGuid');

            this.startScriptJob();

            this.backendMsg = `messenger:scriptAttrsFinished:${this.jobId}`;

            editor.on(this.backendMsg, this.handleBackendRes.bind(this));
        }

        startScriptJob() {
            const h = {
                script_task_type: 'handle_parsed_script',
                job_id: this.jobId,
                parse_result: this.parseRes,
                project_id: config.project.id,
                branch_id: config.self.branch.id,
                asset_id: this.aId
            };

            editor.call('realtime:send', 'pipeline', {
                name: 'script-attributes',
                data: h
            });
        }

        handleBackendRes(data) {
            if (this.inEditor) {
                editor.call('status:clear');
            }

            this.callCb(null, this.parseRes);

            editor.unbind(this.backendMsg);
        }

        checkErrors() {
            this.errorsFound = this.parseRes.scriptsInvalid && this.parseRes.scriptsInvalid.length;

            this.errorsFound = this.errorsFound || this.attrErrors();

            if (this.errorsFound) {
                const s = `There was an error while parsing script asset '${this.aName}'`;

                editor.call('status:error', s);

                this.callCb(null, this.parseRes);
            }
        }

        attrErrors() {
            const names = Object.keys(this.parseRes.scripts);

            return names.find(s => {
                const h = this.parseRes.scripts[s];

                return h.attributesInvalid && h.attributesInvalid.length;
            });
        }

        callCb(er, res) {
            if (this.callback) {
                this.callback(er, res);
            }
        }

        reportStartIfNeed() {
            if (this.inEditor) {
                editor.call('status:text', `Parsing script asset '${this.aName}'...`);
            }
        }

        postWorkerMsg() {
            const url = this.inEditor ?
                this.asset.get('file.url') :
                this.makePostUrl();

            this.worker.postMessage({
                name: 'parse',
                asset: this.aId,
                url: url,
                engine: config.url.engine
            });
        }

        makePostUrl() {
            let s = this.asset.get('file.filename');

            s = encodeURIComponent(s);

            s = s.appendQuery('branchId=' + config.self.branch.id);

            return `/api/assets/${this.aId}/file/${s}`;
        }

        onErr(err) {
            if (this.inEditor) {
                editor.call('status:error', 'There was an error while parsing a script');
            }

            console.log('worker onerror', err);

            this.callCb(err, undefined);
        }
    }
});
