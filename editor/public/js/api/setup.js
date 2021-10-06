// Initialize API globals
api.globals.accessToken = config.accessToken;
api.globals.projectId = config.project.id;
api.globals.branchId = config.self.branch.id;
api.globals.history = new api.History();
api.globals.selection = new api.Selection();
api.globals.schema = new api.Schema(config.schema);
api.globals.realtime = new api.Realtime();
api.globals.assets = new api.Assets();
api.globals.entities = new api.Entities();
api.globals.messenger = new api.Messenger(new Messenger());
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
        'messenger',
        'jobs',
        'clipboard'
    ].forEach(name => {
        editor[name] = api.globals[name];
    });

    // custom confirm function
    api.globals.confirmFn = function (text, options) {
        return new Promise(resolve => {
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
});
