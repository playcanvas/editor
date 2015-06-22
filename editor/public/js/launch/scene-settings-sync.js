app.once('load', function() {
    'use strict';

    app.on('sceneSettings:load', function(settings) {
        settings.sync = new ObserverSync({
            item: settings,
            prefix: [ 'settings' ]
        });

        // client > server
        settings.sync.on('op', function(op) {
            app.call('realtime:op', op);
        });

        // server > client
        app.on('realtime:op:settings', function(op) {
            settings.sync.write(op);
        });
    });
});
