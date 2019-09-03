editor.once('load', function () {
    'use strict';

    var settings = editor.call('settings:create', {
        name: 'user',
        id: 'user_' + config.self.id,
        data: {
            editor: {
                howdoi: true,
                iconSize: 0.2
            }
        }
    });

    // add history
    settings.history = new ObserverHistory({
        item: settings,
        history: editor.call('editor:history')
    });

});
