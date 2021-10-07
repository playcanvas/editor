// Initialize API globals
api.globals.accessToken = config.accessToken;
api.globals.projectId = config.project.id;
api.globals.branchId = config.self.branch.id;
api.globals.messenger = new api.Messenger(new Messenger());

editor.once('load', function () {
    'use strict';

    editor.messenger = api.globals.messenger;
});
