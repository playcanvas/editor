editor.once('load', function() {
    'use strict';

    editor.on('assets:add', function(asset) {
        if (asset.history)
            return;

        asset.history = new ObserverHistory({
            item: asset,
            prefix: 'asset.' + asset.get('id') + '.',
            // TODO
            // allowed paths
        });

        // record history
        asset.history.on('record', function(action, data) {
            editor.call('history:' + action, data);
        });
    });
});
