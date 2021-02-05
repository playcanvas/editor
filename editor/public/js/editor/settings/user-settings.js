editor.once('load', function () {
    'use strict';

    var settings = editor.call('settings:create', {
        name: 'user',
        id: 'user_' + config.self.id,
        data: {
            editor: {
                howdoi: true,
                iconSize: 0.2,
                showSkeleton: true
            }
        }
    });

    // add history
    settings.history = new ObserverHistory({
        item: settings,
        history: editor.call('editor:history')
    });

    // migrations
    editor.on('settings:user:load', function () {
        setTimeout(function () {
            var history = settings.history.enabled;
            settings.history.enabled = false;

            if (! settings.has('editor.showSkeleton'))
                settings.set('editor.showSkeleton', true);

            settings.history.enabled = history;
        });
    });
});
