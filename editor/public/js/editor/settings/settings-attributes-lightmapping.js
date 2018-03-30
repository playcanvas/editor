editor.once('load', function() {
    'use strict';

    var sceneSettings = editor.call('sceneSettings');

    var folded = true;

    editor.on('attributes:inspect[editorSettings]', function() {
        // lightmapping
        var panelLightmapping = editor.call('attributes:addPanel', {
            name: 'Lightmapping'
        });
        panelLightmapping.foldable = true;
        panelLightmapping.folded = folded;
        panelLightmapping.on('fold', function() { folded = true; });
        panelLightmapping.on('unfold', function() { folded = false; });
        panelLightmapping.class.add('component', 'lightmapping');

        // lightmapSizeMultiplier
        var fieldLightmapSizeMultiplier = editor.call('attributes:addField', {
            parent: panelLightmapping,
            name: 'Size Multiplier',
            type: 'number',
            min: 0,
            link: sceneSettings,
            path: 'render.lightmapSizeMultiplier'
        });
        // reference
        editor.call('attributes:reference:attach', 'settings:lightmapSizeMultiplier', fieldLightmapSizeMultiplier.parent.innerElement.firstChild.ui);

        // lightmapMaxResolution
        var fieldLightmapMaxResolution = editor.call('attributes:addField', {
            parent: panelLightmapping,
            name: 'Max Resolution',
            type: 'number',
            min: 2,
            link: sceneSettings,
            path: 'render.lightmapMaxResolution'
        });
        // reference
        editor.call('attributes:reference:attach', 'settings:lightmapMaxResolution', fieldLightmapMaxResolution.parent.innerElement.firstChild.ui);


        // lightmapMode
        var fieldLightmapMode = editor.call('attributes:addField', {
            parent: panelLightmapping,
            name: 'Mode',
            type: 'number',
            enum: {
                0: "Color Only",
                1: "Color and Direction"
            },
            link: sceneSettings,
            path: 'render.lightmapMode'
        });
        // reference
        editor.call('attributes:reference:attach', 'settings:lightmapMode', fieldLightmapMode.parent.innerElement.firstChild.ui);

    });
});
