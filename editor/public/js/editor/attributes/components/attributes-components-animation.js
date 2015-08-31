editor.once('load', function() {
    'use strict';


    editor.on('attributes:inspect[entity]', function(entities) {
        var panelComponents = editor.call('attributes:entity.panelComponents');
        if (! panelComponents)
            return;


        var panel = editor.call('attributes:entity:addComponentPanel', {
            title: 'Animation',
            name: 'animation',
            entities: entities
        });

        // animation.assets
        var fieldAssets = editor.call('attributes:addAssetsList', {
            panel: panel,
            title: 'Animation',
            type: 'animation',
            link: entities,
            path: 'components.animation.assets'
        });

        // animation.speed
        var fieldSpeed = editor.call('attributes:addField', {
            parent: panel,
            name: 'Speed',
            type: 'number',
            precision: 2,
            step: .1,
            link: entities,
            path: 'components.animation.speed'
        });
        // reference speed
        editor.call('attributes:reference:animation:speed:attach', fieldSpeed.parent.innerElement.firstChild.ui);

        // animation.playback
        var panelPlayback = new ui.Panel();
        editor.call('attributes:addField', {
            parent: panel,
            name: 'Playback',
            type: 'element',
            element: panelPlayback
        });

        // animation.activate
        var fieldActivate = editor.call('attributes:addField', {
            panel: panelPlayback,
            type: 'checkbox',
            link: entities,
            path: 'components.animation.activate'
        });
        // label
        var label = new ui.Label({ text: 'Activate' });
        label.class.add('label-infield');
        label.style.paddingRight = '12px';
        panelPlayback.append(label);
        // reference activate
        editor.call('attributes:reference:animation:activate:attach', label);

        // animation.loop
        var fieldLoop = editor.call('attributes:addField', {
            panel: panelPlayback,
            type: 'checkbox',
            link: entities,
            path: 'components.animation.loop'
        });
        // label
        var label = new ui.Label({ text: 'Loop' });
        label.class.add('label-infield');
        panelPlayback.append(label);
        // reference loop
        editor.call('attributes:reference:animation:loop:attach', label);
    });
});
