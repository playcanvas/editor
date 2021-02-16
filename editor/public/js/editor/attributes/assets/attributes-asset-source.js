editor.once('load', function () {
    'use strict';

    editor.on('attributes:inspect[asset]', function (assets) {
        if (assets.length !== 1 || ! assets[0].get('source'))
            return;
        const hasPcuiAssetInspectors = editor.call('users:hasFlag', 'hasPcuiAssetInspectors');
        if (hasPcuiAssetInspectors)
            return;

        var asset = assets[0];
        var events = [];

        // related assets
        var panelRelated = editor.call('attributes:addPanel', {
            name: 'Related Assets'
        });
        panelRelated.class.add('component');
        // reference
        editor.call('attributes:reference:attach', 'asset:source:related', panelRelated, panelRelated.headerElement);

        var list = new ui.List();
        list.class.add('related-assets');
        panelRelated.append(list);

        var assetId = asset.get('id');
        var assets = editor.call('assets:find', function (asset) {
            return parseInt(asset.get('source_asset_id'), 10) === assetId;
        });

        var addAsset = function (asset) {
            panelRelated.hidden = false;

            var item = new ui.ListItem({
                text: asset.get('name')
            });
            item.class.add('type-' + asset.get('type'));
            list.append(item);

            item.element.addEventListener('click', function () {
                editor.call('selector:set', 'asset', [asset]);
            }, false);

            var assetEvents = [];

            assetEvents.push(asset.on('name:set', function (name) {
                item.text = name;
            }));

            asset.once('destroy', function () {
                item.destroy();
                for (let i = 0; i < assetEvents.length; i++)
                    assetEvents[i].unbind();
            });

            events = events.concat(assetEvents);
        };

        for (let i = 0; i < assets.length; i++)
            addAsset(assets[i][1]);

        if (! assets.length)
            panelRelated.hidden = true;


        events.push(editor.on('assets:add', function (asset) {
            if (asset.get('source_asset_id') !== assetId)
                return;

            addAsset(asset);
        }));


        list.once('destroy', function () {
            for (let i = 0; i < events.length; i++)
                events[i].unbind();
        });
    });
});
