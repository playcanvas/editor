// Initialize API globals - order matters
api.globals.accessToken = config.accessToken;
api.globals.projectId = config.project.id;
api.globals.branchId = config.self.branch.id;
api.globals.history = new api.History();
api.globals.selection = new api.Selection();
api.globals.schema = new api.Schema(config.schema);
api.globals.realtime = new api.Realtime();
api.globals.settings = new api.Settings();
api.globals.messenger = new api.Messenger(new Messenger());
api.globals.assets = new api.Assets({
    autoSubscribe: true
});
api.globals.entities = new api.Entities();
api.globals.jobs = new api.Jobs();
api.globals.clipboard = new api.Clipboard('playcanvas_editor_clipboard');

editor.once('load', function () {
    'use strict';

    [
        'history',
        'selection',
        'schema',
        'realtime',
        'assets',
        'entities',
        'settings',
        'messenger',
        'jobs',
        'clipboard'
    ].forEach((name) => {
        editor[name] = api.globals[name];
    });

    // custom confirm function
    api.globals.confirmFn = function (text, options) {
        return new Promise((resolve) => {
            let resolved = false;
            editor.call('picker:confirm', text, () => {
                if (resolved) return;
                resolved = true;
                resolve(true);
            }, options);

            editor.once('picker:confirm:close', () => {
                if (resolved) return;
                resolved = true;
                resolve(false);
            });
        });
    };

    // asset upload completed callback (clear progress)
    editor.assets.defaultUploadCompletedCallback = (uploadId, asset) => {
        editor.call('status:job', 'asset-upload:' + uploadId);
    };
    // asset upload progress callback
    editor.assets.defaultUploadProgressCallback = (uploadId, progress) => {
        editor.call('status:job', 'asset-upload:' + uploadId, progress);
    };
    // asset upload error callback (clear progress)
    editor.assets.defaultUploadErrorCallback = (uploadId, err) => {
        editor.call('status:job', 'asset-upload:' + uploadId);
    };

    // set parse script callback
    editor.assets.parseScriptCallback = (asset) => {
        return new Promise((resolve, reject) => {
            editor.call('scripts:parse', asset._observer, function (err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(Object.keys(result.scripts || {}));
                }
            });
        });
    };
});
