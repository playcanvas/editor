editor.once('load', function () {
    'use strict';

    var validRuntimeAssets = {
        'material': 1, 'model': 1, 'cubemap': 1, 'text': 1, 'json': 1, 'html': 1, 'css': 1, 'script': 1, 'texture': 1, 'textureatlas': 1, 'sprite': 1
    };

    var create = function (data) {
        if (data.asset.source || data.asset.status !== 'complete' && !validRuntimeAssets.hasOwnProperty(data.asset.type))
            return;

        var uniqueId = parseInt(data.asset.id, 10);
        if (!uniqueId)
            return;

        editor.call('loadAsset', uniqueId);
    };

    // create or update
    editor.on('messenger:asset.new', create);

    // remove
    editor.on('messenger:asset.delete', function (data) {
        var asset = editor.call('assets:getUnique', data.asset.id);
        if (!asset) return;
        editor.call('assets:remove', asset);
    });

    // remove multiple
    editor.on('messenger:assets.delete', function (data) {
        for (var i = 0; i < data.assets.length; i++) {
            var asset = editor.call('assets:getUnique', parseInt(data.assets[i], 10));
            if (!asset) continue;
            editor.call('assets:remove', asset);
        }
    });
});
