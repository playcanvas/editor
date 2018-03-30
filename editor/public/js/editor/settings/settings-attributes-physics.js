editor.once('load', function() {
    'use strict';

    var sceneSettings = editor.call('sceneSettings');
    var projectSettings = editor.call('settings:project');

    var folded = true;

    editor.on('attributes:inspect[editorSettings]', function() {
        // physics
        var physicsPanel = editor.call('attributes:addPanel', {
            name: 'Physics'
        });
        physicsPanel.foldable = true;
        physicsPanel.folded = folded;
        physicsPanel.on('fold', function() { folded = true; });
        physicsPanel.on('unfold', function() { folded = false; });
        physicsPanel.class.add('component');

        // enable 3d physics
        var fieldPhysics = editor.call('attributes:addField', {
            parent: physicsPanel,
            name: 'Enable',
            type: 'checkbox',
            link: projectSettings,
            path: 'use3dPhysics'
        });
        editor.call('attributes:reference:attach', 'settings:project:physics', fieldPhysics.parent.innerElement.firstChild.ui);

        // gravity
        var fieldGravity = editor.call('attributes:addField', {
            parent: physicsPanel,
            name: 'Gravity',
            placeholder: [ 'X', 'Y', 'Z' ],
            precision: 2,
            step: .1,
            type: 'vec3',
            link: sceneSettings,
            path: 'physics.gravity'
        });
        // reference
        editor.call('attributes:reference:attach', 'settings:gravity', fieldGravity[0].parent.innerElement.firstChild.ui);

    });
});
