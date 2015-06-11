editor.once('load', function() {
    'use strict';

    var updateOrCreate = function(data) {
        var assetId = data.asset.id;

        if (data.asset.source) {
            if ([ 'scene', 'texture' ].indexOf(data.asset.type) === -1 || data.asset.status !== 'complete')
                return;

            var asset = editor.call('assets:findOne', function(asset) {
                return asset.get('source_asset_id') === data.asset.id && asset.get('type') === ((data.asset.type === 'scene') ? 'model' : data.asset.type);
            });

            if (! asset)
                return;

            assetId = asset[1].get('id');
        } else if (data.asset.status !== 'complete' && [ 'material', 'model', 'cubemap', 'text', 'json' ].indexOf(data.asset.type) === -1) {
            return;
        }

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

            if (data.type == 'material')
                data.data = editor.call('material:listToMap', data.data);

            if (! asset)
                asset = editor.call('assets:get', data.id);

            if (asset) {
                asset.loadAjax = null;

                if (asset.syncing)
                    return;

                var isAssetSelected = false;
                if (editor.call('selector:type') === 'asset') {
                    var items = editor.call('selector:items');
                    for(var i = 0; i < items.length; i++) {
                        if (items[i].get('id') === data.id) {
                            isAssetSelected = true;
                            break;
                        }
                    }
                }

                // TODO
                // WORKAROUND
                // prevent asset being updated if it is selected
                // keep it until assets are updated through sharejs
                var fields = isAssetSelected ? [ 'modified_at', 'file', 'name', 'has_thumbnail' ] : [ 'modified_at', 'data', 'file', 'name', 'has_thumbnail' ];

                asset.sync = false;
                asset.history.enabled = false;

                var fileHash = asset.get('file.hash');
                var thumbnailSet = data.has_thumbnail !== asset.get('has_thumbnail');

                for(var i = 0; i < fields.length; i++) {
                    asset.set(fields[i], data[fields[i]]);
                }

                // reset thumbnails
                if (data.thumbnails && ! (asset.get('type') === 'texture' && fileHash === asset.get('file.hash') && ! thumbnailSet)) {
                    asset.unset('thumbnails');
                    asset.set('thumbnails', data.thumbnails);
                    asset.set('has_thumbnail', true);
                }

                asset.history.enabled = true;
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
