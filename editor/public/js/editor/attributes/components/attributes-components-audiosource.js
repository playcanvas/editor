editor.once('load', function() {
    'use strict';

    if (editor.call('users:hasFlag', 'hasPcuiComponentInspectors')) return;

    editor.on('attributes:inspect[entity]', function(entities) {
        var panelComponents = editor.call('attributes:entity.panelComponents');
        if (! panelComponents)
            return;

        var panel = editor.call('attributes:entity:addComponentPanel', {
            title: 'Audio Source',
            name: 'audiosource',
            entities: entities
        });

        // audiosource.assets
        var fieldAssets = editor.call('attributes:addAssetsList', {
            type: 'audio',
            name: 'Assets',
            link: entities,
            panel: panel,
            path: 'components.audiosource.assets',
            reference: 'audiosource:assets'
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
        var fieldActivate = editor.call('attributes:addField', {
            panel: panelPlayback,
            type: 'checkbox',
            link: entities,
            path: 'components.audiosource.activate'
        });
        // label
        var label = new ui.Label({ text: 'Activate' });
        label.class.add('label-infield');
        panelPlayback.append(label);
        // reference
        editor.call('attributes:reference:attach', 'audiosource:activate', label);

        // audiosource.loop
        var fieldLoop = editor.call('attributes:addField', {
            panel: panelPlayback,
            type: 'checkbox',
            link: entities,
            path: 'components.audiosource.loop'
        });
        // label
        var label = new ui.Label({ text: 'Loop' });
        label.class.add('label-infield');
        panelPlayback.append(label);
        // reference
        editor.call('attributes:reference:attach', 'audiosource:loop', label);

        // audiosource.3d
        var field3d = editor.call('attributes:addField', {
            panel: panelPlayback,
            type: 'checkbox',
            link: entities,
            path: 'components.audiosource.3d'
        });
        field3d.on('change', function (value) {
            panelDistance.hidden = fieldRollOffFactor.parent.hidden = ! (field3d.value || field3d.class.contains('null'));
        });
        // label
        label = new ui.Label({ text: '3D' });
        label.class.add('label-infield');
        panelPlayback.append(label);
        // reference
        editor.call('attributes:reference:attach', 'audiosource:3d', label);


        // volume
        var fieldVolume = editor.call('attributes:addField', {
            parent: panel,
            name: 'Volume',
            type: 'number',
            precision: 2,
            step: 0.01,
            min: 0,
            max: 1,
            link: entities,
            path: 'components.audiosource.volume'
        });
        fieldVolume.style.width = '32px';
        // reference
        editor.call('attributes:reference:attach', 'audiosource:volume', fieldVolume.parent.innerElement.firstChild.ui);

        // volume slider
        var fieldVolumeSlider = editor.call('attributes:addField', {
            panel: fieldVolume.parent,
            precision: 2,
            step: 0.01,
            min: 0,
            max: 1,
            type: 'number',
            slider: true,
            link: entities,
            path: 'components.audiosource.volume'
        });
        fieldVolumeSlider.flexGrow = 4;

        // pitch
        var fieldPitch = editor.call('attributes:addField', {
            parent: panel,
            name: 'Pitch',
            type: 'number',
            precision: 2,
            step: 0.1,
            min: 0,
            link: entities,
            path: 'components.audiosource.pitch'
        });
        // reference
        editor.call('attributes:reference:attach', 'audiosource:pitch', fieldPitch.parent.innerElement.firstChild.ui);


        // distance
        var panelDistance = editor.call('attributes:addField', {
            parent: panel,
            name: 'Distance'
        });
        var label = panelDistance;
        panelDistance = panelDistance.parent;
        label.destroy();
        panelDistance.hidden = ! (field3d.value || field3d.class.contains('null'));

        // reference
        editor.call('attributes:reference:attach', 'audiosource:distance', panelDistance.innerElement.firstChild.ui);

        // minDistance
        var fieldMinDistance = editor.call('attributes:addField', {
            panel: panelDistance,
            placeholder: 'Min',
            type: 'number',
            precision: 2,
            step: 1,
            min: 0,
            link: entities,
            path: 'components.audiosource.minDistance'
        });
        fieldMinDistance.style.width = '32px';
        fieldMinDistance.flexGrow = 1;

        // maxDistance
        var fieldMaxDistance = editor.call('attributes:addField', {
            panel: panelDistance,
            placeholder: 'Max',
            type: 'number',
            precision: 2,
            step: 1,
            min: 0,
            link: entities,
            path: 'components.audiosource.maxDistance'
        });
        fieldMaxDistance.style.width = '32px';
        fieldMaxDistance.flexGrow = 1;

        // audiosource.rollOffFactor
        var fieldRollOffFactor = editor.call('attributes:addField', {
            parent: panel,
            name: 'Roll-off factor',
            type: 'number',
            precision: 2,
            step: 0.1,
            min: 0,
            link: entities,
            path: 'components.audiosource.rollOffFactor'
        });
        fieldRollOffFactor.parent.hidden = ! (field3d.value || field3d.class.contains('null'));
        // reference
        editor.call('attributes:reference:attach', 'audiosource:rollOffFactor', fieldRollOffFactor.parent.innerElement.firstChild.ui);
    });
});
