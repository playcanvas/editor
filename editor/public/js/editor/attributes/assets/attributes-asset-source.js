editor.once('load', function() {
    'use strict';

    editor.on('attributes:inspect[asset]', function(assets) {
        if (assets.length !== 1 || ! assets[0].get('source'))
            return;

        var asset = assets[0];
        var events = [ ];

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

            item.on('click', function() {
                editor.call('selector:set', 'asset', [ asset ]);
            });

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

        // // edit
        // var btnEdit = new ui.Button();
        // btnEdit.text = editor.call('permissions:write') ? 'Edit' : 'View';
        // btnEdit.class.add('edit-script');
        // btnEdit.element.addEventListener('click', function(evt) {
        //     window.open('/editor/asset/' + asset.get('id'));
        // }, false);
        // panel.append(btnEdit);

        // // loading
        // var loading = editor.call('attributes:addField', {
        //     type: 'progress'
        // });
        // loading.on('progress:100', function() {
        //     this.destroy();
        // });

        // var panelRaw = editor.call('attributes:addPanel', {
        //     name: 'TEXT'
        // });
        // panelRaw.class.add('component');
        // // reference
        // editor.call('attributes:reference:asset:text:asset:attach', panelRaw, panelRaw.headerElement);

        // // code
        // var fieldText = editor.call('attributes:addField', {
        //     parent: panelRaw,
        //     type: 'code'
        // });
        // fieldText.style.margin = '-8px -6px';

        // // load data
        // new AjaxRequest({
        //     url: '{{url.home}}/' + asset.get('file.url'),
        //     notJson: true
        // })
        // .on('load', function(status, data) {
        //     fieldText.text = data;
        //     loading.progress = 1;
        // })
        // .on('progress', function(progress) {
        //     loading.progress = .1 + progress * .8;
        // })
        // .on('error', function(status, err) {
        //     loading.failed = true;
        //     fieldText.destroy();

        //     var error = new ui.Label({ text: 'failed loading data' });
        //     error.textContent = 'failed loading data';
        //     error.style.display = 'block';
        //     error.style.textAlign = 'center';
        //     error.style.fontWeight = '100';
        //     error.style.fontSize = '12px';
        //     error.style.color = '#f66';
        //     editor.call('attributes.rootPanel').append(error);

        //     loading.progress = 1;
        // });

        // loading.progress = .1;
    });
});
