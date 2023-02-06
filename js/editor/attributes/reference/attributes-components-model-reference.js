editor.once('load', function () {
    var fields = [{
        name: 'component',
        title: 'pc.ModelComponent',
        subTitle: '{pc.Component}',
        description: 'Enables an Entity to render a model or a primitive shape. This Component attaches additional model geometry in to the scene graph below the Entity.',
        url: 'http://developer.playcanvas.com/api/pc.ModelComponent.html'
    }, {
        title: 'isStatic',
        subTitle: '{Boolean}',
        description: 'Mark model as non-movable (optimization).',
        url: 'http://developer.playcanvas.com/api/pc.ModelComponent.html#isStatic'
    }, {
        title: 'asset',
        subTitle: '{Number}',
        description: 'The model asset rendered by this model component. Only a single model can be rendered per model component.',
        url: 'http://developer.playcanvas.com/api/pc.ModelComponent.html#asset'
    }, {
        title: 'castShadows',
        subTitle: '{Boolean}',
        description: 'If enabled, the model rendered by this component will cast shadows onto other models in the scene.',
        url: 'http://developer.playcanvas.com/api/pc.ModelComponent.html#castShadows'
    }, {
        title: 'materialAsset',
        subTitle: '{Number}',
        description: 'The material that will be used to render the model (only applies to primitives)',
        url: 'http://developer.playcanvas.com/api/pc.ModelComponent.html#materialAsset'
    }, {
        title: 'receiveShadows',
        subTitle: '{Boolean}',
        description: 'If enabled, the model rendered by this component will receive shadows cast by other models in the scene.',
        url: 'http://developer.playcanvas.com/api/pc.ModelComponent.html#receiveShadows'
    }, {
        title: 'type',
        subTitle: '{String}',
        description: 'The type of the model to be rendered. Can be: asset, box, capsule, cone, cylinder, sphere.',
        url: 'http://developer.playcanvas.com/api/pc.ModelComponent.html#type'
    }, {
        title: 'castShadowsLightmap',
        subTitle: '{Boolean}',
        description: 'If true, this model will cast shadows when rendering lightmaps',
        url: 'http://developer.playcanvas.com/api/pc.ModelComponent.html#castShadowsLightmap'
    }, {
        title: 'lightmapped',
        subTitle: '{Boolean}',
        description: 'If true, this model will be lightmapped after using lightmapper.bake()',
        url: 'http://developer.playcanvas.com/api/pc.ModelComponent.html#lightmapped'
    }, {
        title: 'lightmapSizeMultiplier',
        subTitle: '{Number}',
        description: 'Changing this value will affect resolution of lightmaps for this model',
        url: 'http://developer.playcanvas.com/api/pc.ModelComponent.html#lightmapSizeMultiplier'
    }, {
        title: 'batchGroupId',
        subTitle: '{Number}',
        description: 'The batch group that this model belongs to. The engine will attempt to batch models in the same batch group to reduce draw calls.',
        url: 'http://developer.playcanvas.com/api/pc.ModelComponent.html#batchGroupId'
    }, {
        name: 'resolution',
        description: 'Auto-generated lightmap textures resolution is calculated using area of geometry in world space and size multiplier of model and scene.',
        url: 'http://developer.playcanvas.com/en/user-manual/graphics/lighting/lightmaps/#lightmap-size-multipliers'
    }, {
        name: 'layers',
        title: 'layers',
        subTitle: '{Number[]}',
        description: 'The layers that this model belongs to. When a model belongs to multiple layers it will be rendered multiple times.',
        url: 'http://developer.playcanvas.com/api/pc.ModelComponent.html#layers'
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
        fields[i].name = 'model:' + (fields[i].name || fields[i].title);
        editor.call('attributes:reference:add', fields[i]);
    }
});
