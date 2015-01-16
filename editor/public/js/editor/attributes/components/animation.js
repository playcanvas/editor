editor.once('load', function() {
    'use strict';

    editor.on('attributes:inspect[entity]', function(entities) {
        if (entities.length !== 1)
            return;

        var entity = entities[0];

        var panelComponents = editor.call('attributes:entity.panelComponents');
        if (! panelComponents)
            return;


        // animation
        var panel = editor.call('attributes:addPanel', {
            parent: panelComponents,
            name: 'Animation'
        });
        if (! entity.get('components.animation')) {
            panel.disabled = true;
            panel.hidden = true;
        }
        var evtComponentSet = entity.on('components.animation:set', function(value) {
            panel.disabled = ! value;
            panel.hidden = ! value;
        });
        var evtComponentUnset = entity.on('components.animation:unset', function() {
            panel.disabled = true;
            panel.hidden = true;
        });
        panel.on('destroy', function() {
            evtComponentSet.unbind();
            evtComponentUnset.unbind();
        });


        // enabled
        var fieldEnabled = new ui.Checkbox();
        fieldEnabled.style.float = 'left';
        fieldEnabled.style.backgroundColor = '#323f42';
        fieldEnabled.style.margin = '3px 4px 3px -5px';
        fieldEnabled.link(entity, 'components.animation.enabled');
        panel.headerElement.appendChild(fieldEnabled.element);
        panel.on('destroy', function() {
            fieldEnabled.destroy();
        });

        // animation.assets
        // TODO
        // ability to add new assets
        var fieldAssetsList = new ui.List();
        fieldAssetsList.flexGrow = 1;

        var fieldAssets = editor.call('attributes:addField', {
            parent: panel,
            name: 'Assets',
            type: 'element',
            element: fieldAssetsList
        });

        // animation.assets.list
        var assets = entity.get('components.animation.assets');
        if (assets) {
            for(var i = 0; i < assets.length; i++) {
                var item = new ui.ListItem({
                    text: assets[i]
                });
                fieldAssetsList.append(item);
            }
        }

        // animation.speed
        var fieldSpeed = editor.call('attributes:addField', {
            parent: panel,
            name: 'Speed',
            type: 'number',
            link: entity,
            path: 'components.animation.speed'
        });

        // animation.playback
        var panelPlayback = new ui.Panel();
        editor.call('attributes:addField', {
            parent: panel,
            name: 'Playback',
            type: 'element',
            element: panelPlayback
        });

        // animation.activate
        var fieldActivate = new ui.Checkbox();
        fieldActivate.link(entity, 'components.animation.activate');
        panelPlayback.append(fieldActivate);
        // label
        var label = new ui.Label({ text: 'Activate' });
        label.style.verticalAlign = 'top';
        label.style.paddingRight = '12px';
        label.style.fontSize = '12px';
        label.style.lineHeight = '26px';
        panelPlayback.append(label);

        // animation.loop
        var fieldLoop = new ui.Checkbox();
        fieldLoop.link(entity, 'components.animation.loop');
        panelPlayback.append(fieldLoop);
        // label
        var label = new ui.Label({ text: 'Loop' });
        label.style.verticalAlign = 'top';
        label.style.fontSize = '12px';
        label.style.lineHeight = '26px';
        panelPlayback.append(label);
    });
});
