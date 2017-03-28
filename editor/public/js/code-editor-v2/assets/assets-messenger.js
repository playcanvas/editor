editor.once('load', function() {
    'use strict';

    var validTypes = [
        'css',
        'folder',
        'html',
        'json',
        'script',
        'shader',
        'text'
    ];

    // create new asset
    editor.on('messenger:asset.new', function (data) {
        var assetId = data.asset.id;

        if (data.asset.source === false && data.asset.status && data.asset.status !== 'complete')
            return;

        if (validTypes.indexOf(data.asset.type) === -1)
            return;

        var asset = editor.call('assets:get', assetId);
        if (! asset) {
            editor.call('assets:loadOne', assetId);
        }
    });

    // remove
    editor.on('messenger:asset.delete', function(data) {
        var asset = editor.call('assets:get', data.asset.id);
        if (! asset) return;
        editor.call('assets:remove', asset);
    });

    // remove multiple
    editor.on('messenger:assets.delete', function(data) {
        for(var i = 0; i < data.assets.length; i++) {
            var asset = editor.call('assets:get', parseInt(data.assets[i], 10));
            if (! asset) continue;
            editor.call('assets:remove', asset);
        }
    });
});
