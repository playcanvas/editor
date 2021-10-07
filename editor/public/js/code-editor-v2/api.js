// Initialize API globals
api.globals.accessToken = config.accessToken;
api.globals.projectId = config.project.id;
api.globals.branchId = config.self.branch.id;

if (typeof(Messenger) !== 'undefined') {
    api.globals.messenger = new api.Messenger(new Messenger());
}

editor.once('load', function () {
    'use strict';

    if (api.globals.messenger) {
        editor.messenger = api.globals.messenger;
    }
});
