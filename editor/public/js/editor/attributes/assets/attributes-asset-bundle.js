editor.once('load', function () {
    'use strict';

    editor.on('attributes:inspect[asset]', function (assets) {
        for (var i = 0; i < assets.length; i++) {
            if (assets[i].get('type') !== 'bundle')
                return;
        }

        var events = [];

        // panel
        var panel = editor.call('attributes:assets:panel');

        var panelAttributes = editor.call('attributes:addPanel', {
            name: 'ASSETS'
        });
        panelAttributes.class.add('component');

        // assets list
        var fieldAssets = editor.call('attributes:addAssetsList', {
            panel: panelAttributes,
            type: '*',
            filterFn: function (asset) {
                if (! asset) return false;
                if (asset.get('source')) return false;
                var type = asset.get('type');
                if (type === 'script' || type === 'folder' || type === 'bundle') return false;

                return true;
            },
            link: assets,
            path: 'data.assets'
        });

        panel.once('destroy', function () {
            for (var i = 0; i < events.length; i++) {
                events[i].unbind();
            }
            events.length = 0;
        });
    });
});
