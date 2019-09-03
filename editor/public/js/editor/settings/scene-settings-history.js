editor.once('load', function() {
    'use strict';

    editor.on('sceneSettings:load', function(settings) {
        if (settings.history)
            settings.history.destroy();

        settings.history = new ObserverHistory({
            item: settings,
            prefix: 'settings.',
            history: editor.call('editor:history')
        });
    });
});
