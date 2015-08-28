editor.once('load', function() {
    'use strict';

    editor.on('sceneSettings:load', function(settings) {
        settings.history = new ObserverHistory({
            item: settings,
            prefix: 'settings.',
            getItemFn: function () {
                return editor.call('sceneSettings');
            }
        });

        // record history
        settings.history.on('record', function(action, data) {
            editor.call('history:' + action, data);
        });
    });
});
