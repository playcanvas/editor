editor.once('load', function () {
    'use strict';

    var settings = editor.call('settings:create', {
        name: 'user',
        scopeType: 'user',
        scopeId: config.self.id,
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
        getItemFn: function () {return settings;}
    });

    // record history
    settings.history.on('record', function(action, data) {
        editor.call('history:' + action, data);
    });
});
