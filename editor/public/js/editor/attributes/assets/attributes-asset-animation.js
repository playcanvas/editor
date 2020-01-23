editor.once('load', function() {
    'use strict';

    editor.on('attributes:inspect[asset]', function(assets) {
        const hasPcuiAssetInspectors = editor.call('users:hasFlag', 'hasPcuiAssetInspectors');
        if (!hasPcuiAssetInspectors) {
            if (assets.length !== 1 || assets[0].get('type') !== 'animation' || assets[0].get('source'))
                return;

            var asset = assets[0];

            // panel
            var panel = editor.call('attributes:addPanel', {
                name: 'Animation'
            });
            panel.class.add('component');
            // reference
            editor.call('attributes:reference:attach', 'asset:animation:asset', panel, panel.headerElement);


            // duration
            var fieldDuration = editor.call('attributes:addField', {
                parent: panel,
                name: 'Duration',
                placeholder: 'Seconds',
                link: asset,
                path: 'meta.duration'
            });
            // reference
            editor.call('attributes:reference:attach', 'asset:animation:duration', fieldDuration.parent.innerElement.firstChild.ui);


            // name
            var fieldName = editor.call('attributes:addField', {
                parent: panel,
                name: 'Name',
                link: asset,
                path: 'meta.name'
            });
            // reference
            editor.call('attributes:reference:attach', 'asset:animation:name', fieldName.parent.innerElement.firstChild.ui);
        }
    });
});