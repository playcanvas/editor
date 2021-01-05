editor.once('load', function() {
    'use strict';

    var fields = [{
        name: 'component',
        title: 'pc.RenderComponent',
        subTitle: '{pc.Component}',
        description: 'Enables an Entity to render a mesh or a primitive shape. This component attaches geometry to the Entity.',
        url: 'http://developer.playcanvas.com/api/pc.RenderComponent.html'
    }, {
        title: 'type',
        subTitle: '{String}',
        description: 'The type of the Render Component.',
        url: 'http://developer.playcanvas.com/api/pc.RenderComponent.html#type'
    }, {
        title: 'asset',
        subTitle: '{pc.Asset}',
        description: 'The Render Asset for the Render Component (only applies to type "asset").',
        url: 'http://developer.playcanvas.com/api/pc.RenderComponent.html#asset'
    }, {
        title: 'materialAssets',
        subTitle: '{pc.Asset[]}',
        description: 'The Material Assets that will be used to render the meshes. Each material corresponds to the respective mesh instance.',
        url: 'http://developer.playcanvas.com/api/pc.RenderComponent.html#materialAssets'
    }, {
        title: 'castShadows',
        subTitle: '{Boolean}',
        description: 'If true, attached meshes will cast shadows for lights that have shadow casting enabled.',
        url: 'http://developer.playcanvas.com/api/pc.RenderComponent.html#castShadows'
    }, {
        title: 'receiveShadows',
        subTitle: '{Boolean}',
        description: 'If true, shadows will be cast on attached meshes.',
        url: 'http://developer.playcanvas.com/api/pc.RenderComponent.html#receiveShadows'
    }, {
        title: 'castShadowsLightmap',
        subTitle: '{Boolean}',
        description: 'If true, the meshes will cast shadows when rendering lightmaps.',
        url: 'http://developer.playcanvas.com/api/pc.RenderComponent.html#castShadowsLightmap'
    }, {
        title: 'lightmapped',
        subTitle: '{Boolean}',
        description: 'If true, the meshes will be lightmapped after using lightmapper.bake().',
        url: 'http://developer.playcanvas.com/api/pc.RenderComponent.html#lightmapped'
    }, {
        title: 'lightmapSizeMultiplier',
        subTitle: '{Number}',
        description: 'Lightmap resolution multiplier.',
        url: 'http://developer.playcanvas.com/api/pc.RenderComponent.html#lightmapSizeMultiplier'
    }, {
        title: 'isStatic',
        subTitle: '{Boolean}',
        description: 'Mark meshes as non-movable (optimization).',
        url: 'http://developer.playcanvas.com/api/pc.RenderComponent.html#isStatic'
    }, {
        title: 'batchGroupId',
        subTitle: '{Number}',
        description: 'Assign meshes to a specific batch group.',
        url: 'http://developer.playcanvas.com/api/pc.RenderComponent.html#batchGroupId'
    }, {
        title: 'layers',
        subTitle: '{Number[]}',
        description: 'The layers to which the meshes should belong.',
        url: 'http://developer.playcanvas.com/api/pc.RenderComponent.html#layers'
    }, {
        title: 'rootBone',
        subTitle: '{pc.Entity}',
        description: 'A reference to the entity to be used as the root bone for any skinned meshes that are rendered by this component.',
        url: 'http://developer.playcanvas.com/api/pc.RenderComponent.html#rootBone'
    }];

    for(var i = 0; i < fields.length; i++) {
        fields[i].name = 'render:' + (fields[i].name || fields[i].title);
        editor.call('attributes:reference:add', fields[i]);
    }
});
