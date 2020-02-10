editor.once('load', function() {
    'use strict';

    editor.on('attributes:inspect[asset]', function(assets) {
        if (assets.length !== 1 || assets[0].get('type') !== 'text' || assets[0].get('source'))
            return;
        const hasPcuiAssetInspectors = editor.call('users:hasFlag', 'hasPcuiAssetInspectors');
        if (hasPcuiAssetInspectors)
            return;

        var asset = assets[0];

         // panel
        var panel = editor.call('attributes:assets:panel');

        var panelRaw = editor.call('attributes:addPanel', {
            name: 'TEXT'
        });
        panelRaw.class.add('component');
        // reference
        editor.call('attributes:reference:attach', 'asset:text:asset', panelRaw, panelRaw.headerElement);

        // loading
        var loading = editor.call('attributes:addField', {
            type: 'progress',
        });
        loading.progress = 1;

        // code
        var fieldText = editor.call('attributes:addField', {
            parent: panelRaw,
            type: 'code'
        });
        fieldText.style.margin = '-8px -6px';

        var fieldError = new ui.Label({
            text: 'failed loading data'
        });
        fieldError.class.add('asset-loading-error');
        fieldError.hidden = true;
        editor.call('attributes.rootPanel').append(fieldError);

        var loadContent = function() {
            if (asset.get('file.size') > 128 * 1024) {
                panelRaw.hidden = true;
                loading.hidden = true;
                return;
            } else {
                panelRaw.hidden = false;
                loading.hidden = false;
            }
            // load data
            Ajax({
                url: '{{url.home}}' + asset.get('file.url').appendQuery('t=' + asset.get('file.hash')),
                notJson: true
            })
            .on('load', function(status, data) {
                fieldText.text = data;
                fieldText.hidden = false;
                fieldError.hidden = true;
                loading.hidden = true;
            })
            .on('error', function(status, err) {
                loading.hidden = false;
                loading.failed = true;
                fieldText.hidden = true;
                fieldError.hidden = false;
            });
        };
        if (asset.has('file.url'))
            loadContent();

        var evtReload = asset.on('file.hash:set', function() {
            loadContent();
        });
        panel.once('destroy', function() {
            evtReload.unbind();
        });
    });
});
