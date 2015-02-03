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


        // enabled
        var fieldEnabled = new ui.Checkbox();
        fieldEnabled.style.float = 'left';
        fieldEnabled.style.backgroundColor = '#323f42';
        fieldEnabled.style.margin = '3px 4px 3px -5px';
        fieldEnabled.link(entity, 'components.audiosource.enabled');
        panel.headerElement.appendChild(fieldEnabled.element);
        panel.on('destroy', function() {
            fieldEnabled.destroy();
        });

        // remove
        var fieldRemove = new ui.Checkbox();
        fieldRemove.style.float = 'right';
        fieldRemove.style.backgroundColor = '#323f42';
        fieldRemove.style.margin = '3px 4px 3px -5px';
        fieldRemove.on('change', function (value) {
            if (value) {
                entity.unset('components.audiosource');
                fieldRemove.value = false;
            }
        });
        panel.headerElement.appendChild(fieldRemove.element);
        panel.on('destroy', function() {
            fieldRemove.destroy();
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
        var label = new ui.Label({ text: 'Activate' });
        label.style.verticalAlign = 'top';
        label.style.fontSize = '12px';
        label.style.lineHeight = '26px';
        panelPlayback.append(label);

        // audiosource.loop
        var fieldLoop = new ui.Checkbox();
        fieldLoop.link(entity, 'components.audiosource.loop');
        panelPlayback.append(fieldLoop);
        var label = new ui.Label({ text: 'Loop' });
        label.style.verticalAlign = 'top';
        label.style.fontSize = '12px';
        label.style.lineHeight = '26px';
        panelPlayback.append(label);

        // audiosource.3d
        var fieldLoop = new ui.Checkbox();
        fieldLoop.link(entity, 'components.audiosource.3d');
        panelPlayback.append(fieldLoop);
        var label = new ui.Label({ text: '3D' });
        label.style.verticalAlign = 'top';
        label.style.fontSize = '12px';
        label.style.lineHeight = '26px';
        panelPlayback.append(label);


        // sound
        var panelSound = editor.call('attributes:addField', {
            parent: panel,
            name: 'Sound'
        });

        var label = panelSound;
        panelSound = panelSound.parent;
        label.destroy();

        // minDistance
        var fieldVolume = new ui.NumberField();
        fieldVolume.placeholder = 'Volume';
        fieldVolume.style.width = '32px';
        fieldVolume.flexGrow = 1;
        fieldVolume.link(entity, 'components.audiosource.volume');
        panelSound.append(fieldVolume);

        // maxDistance
        var fieldPitch = new ui.NumberField();
        fieldPitch.placeholder = 'Pitch';
        fieldPitch.style.width = '32px';
        fieldPitch.flexGrow = 1;
        fieldPitch.link(entity, 'components.audiosource.pitch');
        panelSound.append(fieldPitch);


        // distance
        var panelDistance = editor.call('attributes:addField', {
            parent: panel,
            name: 'Distance'
        });

        var label = panelDistance;
        panelDistance = panelDistance.parent;
        label.destroy();

        // minDistance
        var fieldMinDistance = new ui.NumberField();
        fieldMinDistance.placeholder = 'Min';
        fieldMinDistance.style.width = '32px';
        fieldMinDistance.flexGrow = 1;
        fieldMinDistance.link(entity, 'components.audiosource.minDistance');
        panelDistance.append(fieldMinDistance);

        // maxDistance
        var fieldMaxDistance = new ui.NumberField();
        fieldMaxDistance.placeholder = 'Max';
        fieldMaxDistance.style.width = '32px';
        fieldMaxDistance.flexGrow = 1;
        fieldMaxDistance.link(entity, 'components.audiosource.maxDistance');
        panelDistance.append(fieldMaxDistance);


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
