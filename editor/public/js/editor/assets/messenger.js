editor.once('load', function() {
    'use strict';

    var updateOrCreate = function(data) {
        // if (asset.syncTimeout) {
        //     clearTimeout(asset.syncTimeout);
        //     asset.syncTimeout = null;
        // }

        var assetId = null;

        if (data.asset.source) {
            var asset = editor.call('assets:findOne', function(asset) {
                return asset.source_asset_id === data.asset.id;
            })
            if (! asset)
                return;

            assetId = asset[1].id;
        }
        if (! data.asset.source)
            assetId = data.asset.id;

        if (! assetId)
            return;

        var asset = editor.call('assets:get', assetId);

        if (asset && asset.loadAjax) {
            asset.loadAjax.abort();
            asset.loadAjax = null;
        }

        var xhr = Ajax({
            url: '{{url.api}}/assets/' + assetId,
            query: {
                access_token: '{{accessToken}}'
            }
        });

        xhr.on('load', function(status, data) {
            data = data.response[0];

            if (data.type == 'material') {
                data.data = editor.call('material:listToMap', data.data);
            }

            if (! asset)
                asset = editor.call('assets:get', data.id);

            if (asset) {
                asset.loadAjax = null;

                if (asset.syncing)
                    return;

                asset.sync = false;
                asset.patch(data);
                asset.sync = true;
            } else {
                asset = new Observer(data);
                editor.call('assets:add', asset);
            }
        });

        if (asset)
            asset.loadAjax = xhr;
    };

    // create or update
    editor.on('messenger:asset.new', updateOrCreate);
    editor.on('messenger:asset.update', updateOrCreate);

    // remove
    editor.on('messenger:asset.delete', function(data) {
        var asset = editor.call('assets:get', data.asset.id);

        if (! asset)
            return;

        editor.call('assets:remove', asset);
    });
});
