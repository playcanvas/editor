editor.once('load', function () {
    'use strict';

    var settings = editor.call('settings:create', {
        name: 'projectUser',
        scopeType: 'project',
        scopeId: config.project.id,
        data: {
            editor: {
                cameraNearClip: 0.1,
                cameraFarClip: 1000,
                cameraClearColor: [
                    0.118,
                    0.118,
                    0.118,
                    1
                ],
                gridDivisions: 8,
                gridDivisionSize: 1,
                snapIncrement: 1,
                localServer: 'http://localhost:51000',
                launchDebug: true
            }
        },
        userId: config.self.id
    });

    // add history
    settings.history = true;
    settings.on('*:set', function(path, value, oldValue) {
        if (! settings.history)
            return;

        editor.call('history:add', {
            name: 'changed project-user settings ' + path,
            undo: function() {
                settings.history = false;
                settings.set(path, oldValue);
                settings.history = true;
            },
            redo: function() {
                settings.history = false;
                settings.set(path, value);
                settings.history = true;
            }
        });
    });
});
