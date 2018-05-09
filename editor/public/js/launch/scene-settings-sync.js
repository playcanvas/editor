editor.once('load', function() {
    'use strict';

    editor.on('sceneSettings:load', function(settings) {
        if (settings.sync) return;

        settings.sync = new ObserverSync({
            item: settings,
            prefix: [ 'settings' ]
        });

        // client > server
        settings.sync.on('op', function(op) {
            editor.call('realtime:op', op);
        });

        // server > client
        editor.on('realtime:op:settings', function(op) {
            settings.sync.write(op);
        });
    });
});
