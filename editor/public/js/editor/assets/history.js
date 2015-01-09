editor.once('load', function() {
    'use strict';

    editor.on('assets:add', function(asset) {
        asset.history = true;

        asset.on('*:set', function(path, value, oldValue) {
            if (! this.history || (path !== 'name' && path.indexOf('data.') === -1))
                return;

            editor.call('history:add', {
                name: 'asset[' + asset.id + ']:set[' + path + ']',
                undo: function() {
                    asset.history = false;
                    asset.set(path, oldValue);
                    asset.history = true;
                },
                redo: function() {
                    asset.history = false;
                    asset.set(path, value);
                    asset.history = true;
                }
            });
        });
    });
});
