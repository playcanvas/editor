editor.once('load', function() {
    'use strict';

    editor.on('sceneSettings:load', function(settings) {
        settings.sync = new ObserverSync({
            item: settings,
            prefix: [ 'settings' ]
        });

        var events = [];

        // client > server
        events.push(settings.sync.on('op', function(op) {
            editor.call('realtime:scene:op', op);
        }));

        // server > client
        events.push(editor.on('realtime:scene:op:settings', function(op) {
            settings.sync.write(op);
        }));

        editor.on('scene:unload', function () {
            for (var i = 0; i < events.length; i++)
                events[i].unbind();
        });
    });
});
