(function() {
    'use strict';

    var updateOrCreate = function(data) {
        var assetId = null;

        if (data.asset.source) {
            var asset = msg.call('assets:findOne', function(asset) {
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

        Ajax({
            url: '{{url.api}}/assets/' + assetId,
            query: {
                access_token: '{{accessToken}}'
            }
        })
        .on('load', function(status, data) {
            data = data.response[0];

            if (data.type == 'material') {
                data.data = msg.call('material:listToMap', data.data);
            }

            var asset = msg.call('assets:get', data.id);
            if (asset) {
                asset.sync = false;
                asset.patch(data);
                asset.sync = true;
            } else {
                asset = new Observer(data);
                msg.call('assets:add', asset);
            }
        });
    };

    // create or update
    msg.on('messenger:asset.new', updateOrCreate);
    msg.on('messenger:asset.update', updateOrCreate);

    // remove
    msg.on('messenger:asset.delete', function(data) {
        var asset = msg.call('assets:get', data.asset.id);

        if (! asset)
            return;

        msg.call('assets:remove', asset);
    });
})();
