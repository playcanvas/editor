app.once('load', function() {
    'use strict';

    var updateOrCreate = function(data) {
        // if (asset.syncTimeout) {
        //     clearTimeout(asset.syncTimeout);
        //     asset.syncTimeout = null;
        // }

        var assetId = null;

        if (data.asset.source) {
            var asset = app.call('assets:findOne', function(asset) {
                return asset.get('source_asset_id') === data.asset.id;
            });

            if (! asset)
                return;

            assetId = asset[1].get('id');
        }
        if (! data.asset.source)
            assetId = data.asset.id;

        if (! assetId)
            return;

        var asset = app.call('assets:get', assetId);

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

            if (! asset)
                asset = app.call('assets:get', data.id);

            if (asset) {
                asset.loadAjax = null;

                if (asset.syncing)
                    return;

                asset.set('modified_at', data.modified_at);
                asset.set('data', data.data);
                asset.set('file', data.file);
            } else {
                asset = new Observer(data);
                editor.call('assets:add', asset);
            }
        });

        if (asset)
            asset.loadAjax = xhr;
    };

    // create or update
    app.on('messenger:asset.new', updateOrCreate);
    app.on('messenger:asset.update', updateOrCreate);

    // remove
    app.on('messenger:asset.delete', function(data) {
        var asset = app.call('assets:get', data.asset.id);

        if (! asset)
            return;

        app.call('assets:remove', asset);
    });
});
