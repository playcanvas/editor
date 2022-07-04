editor.once('load', function () {
    'use strict';

    editor.on('sceneSettings:load', function (settings) {
        if (!settings.sync) {
            settings.sync = new ObserverSync({
                item: settings,
                prefix: ['settings']
            });

            // client > server
            settings.sync.on('op', function (op) {
                editor.call('realtime:scene:op', op);
            });

            // server > client
            editor.on('realtime:scene:op:settings', function (op) {
                settings.sync.write(op);
            });
        }

        editor.emit('sceneSettings:ready');
    });
});
