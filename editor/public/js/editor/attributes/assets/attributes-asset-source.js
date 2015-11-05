editor.once('load', function() {
    'use strict';

    editor.on('attributes:inspect[asset]', function(assets) {
        if (assets.length !== 1 || ! assets[0].get('source'))
            return;

        var asset = assets[0];
        var events = [ ];

        if ((! config.project.privateAssets || (config.project.privateAssets && editor.call('permissions:read'))) && asset.get('type') !== 'scene' && asset.get('type') !== 'folder') {
            // panel
            var panel = editor.call('attributes:addPanel');
            panel.class.add('component');

            // download
            var btnDownload = new ui.Button();
            btnDownload.text = 'Download';
            btnDownload.class.add('download-asset');
            btnDownload.element.addEventListener('click', function(evt) {
                window.open(asset.get('file.url'));
            }, false);
            panel.append(btnDownload);
        }

        // related assets
        var panelRelated = editor.call('attributes:addPanel', {
            name: 'Related Assets'
        });
        panelRelated.class.add('component');
        // reference
        editor.call('attributes:reference:asset:source:related:attach', panelRelated, panelRelated.headerElement);

        var list = new ui.List();
        list.class.add('related-assets');
        panelRelated.append(list);

        var assetId = asset.get('id');
        var assets = editor.call('assets:find', function(asset) {
            return asset.get('source_asset_id') === assetId;
        });

        var addAsset = function(asset) {
            panelRelated.hidden = false;

            var item = new ui.ListItem({
                text: asset.get('name')
            });
            item.class.add('type-' + asset.get('type'));
            list.append(item);

            item.element.addEventListener('click', function() {
                editor.call('selector:set', 'asset', [ asset ]);
            }, false);

            var assetEvents = [ ];

            assetEvents.push(asset.on('name:set', function(name) {
                item.text = name;
            }));

            asset.once('destroy', function() {
                item.destroy();
                for(var i = 0; i < assetEvents.length; i++)
                    assetEvents[i].unbind();
            });

            events = events.concat(assetEvents);
        };

        for(var i = 0; i < assets.length; i++)
            addAsset(assets[i][1]);

        if (! assets.length)
            panelRelated.hidden = true;


        events.push(editor.on('assets:add', function(asset) {
            if (asset.get('source_asset_id') !== assetId)
                return;

            addAsset(asset);
        }));


        list.once('destroy', function() {
            for(var i = 0; i < events.length; i++)
                events[i].unbind();
        });
    });
});
