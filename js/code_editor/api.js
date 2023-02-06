// Initialize API globals
api.globals.accessToken = config.accessToken;
api.globals.projectId = config.project.id;
api.globals.messenger = new api.Messenger(new Messenger());

editor.once('load', function () {
    editor.messenger = api.globals.messenger;
});
