editor.once('load', function() {
    'use strict';

    editor.on('attributes:inspect[entity]', function(entities) {
        if (entities.length !== 1)
            return;

        var entity = entities[0];

        var panelComponents = editor.call('attributes:entity.panelComponents');
        if (! panelComponents)
            return;


        // audiosource
        var panel = editor.call('attributes:addPanel', {
            parent: panelComponents,
            name: 'Audio Source'
        });
        if (! entity.get('components.audiosource')) {
            panel.disabled = true;
            panel.hidden = true;
        }
        var evtComponentSet = entity.on('components.audiosource:set', function(value) {
            panel.disabled = ! value;
            panel.hidden = ! value;
        });
        var evtComponentUnset = entity.on('components.audiosource:unset', function() {
            panel.disabled = true;
            panel.hidden = true;
        });
        panel.on('destroy', function() {
            evtComponentSet.unbind();
            evtComponentUnset.unbind();
        });

        // audiosource.enabled
        editor.call('attributes:addField', {
            parent: panel,
            name: 'Enabled',
            type: 'checkbox',
            link: entity,
            path: 'components.audiosource.enabled'
        });

        // audiosource.assets
        // TODO
        // ability to add new assets
        var fieldAssetsList = new ui.List();
        fieldAssetsList.flexGrow = 1;

        editor.call('attributes:addField', {
            parent: panel,
            name: 'Assets',
            type: 'element',
            element: fieldAssetsList
        });

        // animation.assets.list
        var assets = entity.get('components.audiosource.assets');
        if (assets) {
            for(var i = 0; i < assets.length; i++) {
                var item = new ui.ListItem({
                    text: assets[i]
                });
                fieldAssetsList.append(item);
            }
        }

        // audiosource.volume
        editor.call('attributes:addField', {
            parent: panel,
            name: 'Volume',
            type: 'number',
            link: entity,
            path: 'components.audiosource.volume'
        });

        // audiosource.pitch
        editor.call('attributes:addField', {
            parent: panel,
            name: 'Pitch',
            type: 'number',
            link: entity,
            path: 'components.audiosource.pitch'
        });

        // audiosource.playback
        var panelPlayback = new ui.Panel();
        editor.call('attributes:addField', {
            parent: panel,
            name: 'Playback',
            type: 'element',
            element: panelPlayback
        });

        // audiosource.activate
        var fieldActivate = new ui.Checkbox();
        fieldActivate.link(entity, 'components.audiosource.activate');
        panelPlayback.append(fieldActivate);
        var label = new ui.Label('Activate');
        label.style.verticalAlign = 'top';
        label.style.fontSize = '12px';
        label.style.lineHeight = '26px';
        panelPlayback.append(label);

        // audiosource.loop
        var fieldLoop = new ui.Checkbox();
        fieldLoop.link(entity, 'components.audiosource.loop');
        panelPlayback.append(fieldLoop);
        var label = new ui.Label('Loop');
        label.style.verticalAlign = 'top';
        label.style.paddingRight = '12px';
        label.style.fontSize = '12px';
        label.style.lineHeight = '26px';
        panelPlayback.append(label);

        // audiosource.3d
        editor.call('attributes:addField', {
            parent: panel,
            name: '3D',
            type: 'checkbox',
            link: entity,
            path: 'components.audiosource.3d'
        });

        // audiosource.minDistance
        editor.call('attributes:addField', {
            parent: panel,
            name: 'Min Distance',
            type: 'number',
            link: entity,
            path: 'components.audiosource.minDistance'
        });

        // audiosource.maxDistance
        editor.call('attributes:addField', {
            parent: panel,
            name: 'Max Distance',
            type: 'number',
            link: entity,
            path: 'components.audiosource.maxDistance'
        });

        // audiosource.rollOffFactor
        editor.call('attributes:addField', {
            parent: panel,
            name: 'Roll-off factor',
            type: 'number',
            link: entity,
            path: 'components.audiosource.rollOffFactor'
        });
    });
});
