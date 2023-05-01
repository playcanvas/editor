editor.once('load', function () {
    var fields = [{
        name: 'component',
        title: 'pc.RenderComponent',
        subTitle: '{pc.Component}',
        description: 'Enables an Entity to render a mesh or a primitive shape. This component attaches geometry to the Entity.',
        url: 'https://developer.playcanvas.com/api/pc.RenderComponent.html'
    }, {
        title: 'type',
        subTitle: '{String}',
        description: 'The type of the Render Component.',
        url: 'https://developer.playcanvas.com/api/pc.RenderComponent.html#type'
    }, {
        title: 'asset',
        subTitle: '{pc.Asset}',
        description: 'The Render Asset for the Render Component (only applies to type "asset").',
        url: 'https://developer.playcanvas.com/api/pc.RenderComponent.html#asset'
    }, {
        title: 'materialAssets',
        subTitle: '{pc.Asset[]}',
        description: 'The Material Assets that will be used to render the meshes. Each material corresponds to the respective mesh instance.',
        url: 'https://developer.playcanvas.com/api/pc.RenderComponent.html#materialAssets'
    }, {
        title: 'castShadows',
        subTitle: '{Boolean}',
        description: 'If true, attached meshes will cast shadows for lights that have shadow casting enabled.',
        url: 'https://developer.playcanvas.com/api/pc.RenderComponent.html#castShadows'
    }, {
        title: 'receiveShadows',
        subTitle: '{Boolean}',
        description: 'If true, shadows will be cast on attached meshes.',
        url: 'https://developer.playcanvas.com/api/pc.RenderComponent.html#receiveShadows'
    }, {
        title: 'castShadowsLightmap',
        subTitle: '{Boolean}',
        description: 'If true, the meshes will cast shadows when rendering lightmaps.',
        url: 'https://developer.playcanvas.com/api/pc.RenderComponent.html#castShadowsLightmap'
    }, {
        title: 'lightmapped',
        subTitle: '{Boolean}',
        description: 'If true, the meshes will be lightmapped after using lightmapper.bake().',
        url: 'https://developer.playcanvas.com/api/pc.RenderComponent.html#lightmapped'
    }, {
        title: 'lightmapSizeMultiplier',
        subTitle: '{Number}',
        description: 'Lightmap resolution multiplier.',
        url: 'https://developer.playcanvas.com/api/pc.RenderComponent.html#lightmapSizeMultiplier'
    }, {
        title: 'isStatic',
        subTitle: '{Boolean}',
        description: 'Mark meshes as non-movable (optimization).',
        url: 'https://developer.playcanvas.com/api/pc.RenderComponent.html#isStatic'
    }, {
        title: 'batchGroupId',
        subTitle: '{Number}',
        description: 'Assign meshes to a specific batch group.',
        url: 'https://developer.playcanvas.com/api/pc.RenderComponent.html#batchGroupId'
    }, {
        title: 'layers',
        subTitle: '{Number[]}',
        description: 'The layers to which the meshes should belong.',
        url: 'https://developer.playcanvas.com/api/pc.RenderComponent.html#layers'
    }, {
        title: 'rootBone',
        subTitle: '{pc.Entity}',
        description: 'A reference to the entity to be used as the root bone for any skinned meshes that are rendered by this component.',
        url: 'https://developer.playcanvas.com/api/pc.RenderComponent.html#rootBone'
    }, {
        name: 'customAabb',
        title: 'Custom AABB',
        description: 'If true, then a user provided bounding box will be used for visibility culling of attached mesh instances. This is an optimization allowing an oversized bounding box to be specified for skinned characters in order to avoid per frame bounding box computations based on bone positions.'
    }, {
        name: 'aabbCenter',
        title: 'AABB Center',
        description: 'The center of the AABB to be used when Override AABB is enabled.'
    }, {
        name: 'aabbHalfExtents',
        title: 'AABB Half Extents',
        description: 'The half extents of the AABB to be used when Override AABB is enabled.'
    }];

    for (let i = 0; i < fields.length; i++) {
        fields[i].name = 'render:' + (fields[i].name || fields[i].title);
        editor.call('attributes:reference:add', fields[i]);
    }
});
