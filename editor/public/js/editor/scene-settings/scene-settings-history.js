editor.once('load', function() {
    'use strict';

    editor.once('sceneSettings:load', function(settings) {
        settings.history = new ObserverHistory({
            item: settings
        });

        // register history action
        settings.history.on('add', function(data) {
            editor.call('history:add', data);
        });
    });
});
