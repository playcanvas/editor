import type { AttributeReference } from '../reference.type';

export const fields: AttributeReference[]  = [{
    name: 'model:component',
    title: 'pc.ModelComponent',
    subTitle: '{pc.Component}',
    description: 'Enables an Entity to render a model or a primitive shape. This Component attaches additional model geometry in to the scene graph below the Entity.',
    url: 'https://api.playcanvas.com/engine/classes/ModelComponent.html'
}, {
    name: 'model:isStatic',
    title: 'isStatic',
    subTitle: '{Boolean}',
    description: 'Mark model as non-movable (optimization).',
    url: 'https://api.playcanvas.com/engine/classes/ModelComponent.html#isstatic'
}, {
    name: 'model:asset',
    title: 'asset',
    subTitle: '{Number}',
    description: 'The model asset rendered by this model component. Only a single model can be rendered per model component.',
    url: 'https://api.playcanvas.com/engine/classes/ModelComponent.html#asset'
}, {
    name: 'model:castShadows',
    title: 'castShadows',
    subTitle: '{Boolean}',
    description: 'If enabled, the model rendered by this component will cast shadows onto other models in the scene.',
    url: 'https://api.playcanvas.com/engine/classes/ModelComponent.html#castshadows'
}, {
    name: 'model:materialAsset',
    title: 'materialAsset',
    subTitle: '{Number}',
    description: 'The material that will be used to render the model (only applies to primitives)',
    url: 'https://api.playcanvas.com/engine/classes/ModelComponent.html#materialasset'
}, {
    name: 'model:receiveShadows',
    title: 'receiveShadows',
    subTitle: '{Boolean}',
    description: 'If enabled, the model rendered by this component will receive shadows cast by other models in the scene.',
    url: 'https://api.playcanvas.com/engine/classes/ModelComponent.html#receiveshadows'
}, {
    name: 'model:type',
    title: 'type',
    subTitle: '{String}',
    description: 'The type of the model to be rendered. Can be: asset, box, capsule, cone, cylinder, sphere.',
    url: 'https://api.playcanvas.com/engine/classes/ModelComponent.html#type'
}, {
    name: 'model:castShadowsLightmap',
    title: 'castShadowsLightmap',
    subTitle: '{Boolean}',
    description: 'If true, this model will cast shadows when rendering lightmaps',
    url: 'https://api.playcanvas.com/engine/classes/ModelComponent.html#castshadowslightmap'
}, {
    name: 'model:lightmapped',
    title: 'lightmapped',
    subTitle: '{Boolean}',
    description: 'If true, this model will be lightmapped after using lightmapper.bake()',
    url: 'https://api.playcanvas.com/engine/classes/ModelComponent.html#lightmapped'
}, {
    name: 'model:lightmapSizeMultiplier',
    title: 'lightmapSizeMultiplier',
    subTitle: '{Number}',
    description: 'Changing this value will affect resolution of lightmaps for this model',
    url: 'https://api.playcanvas.com/engine/classes/ModelComponent.html#lightmapsizemultiplier'
}, {
    name: 'model:batchGroupId',
    title: 'batchGroupId',
    subTitle: '{Number}',
    description: 'The batch group that this model belongs to. The engine will attempt to batch models in the same batch group to reduce draw calls.',
    url: 'https://api.playcanvas.com/engine/classes/ModelComponent.html#batchgroupid'
}, {
    name: 'model:resolution',
    description: 'Auto-generated lightmap textures resolution is calculated using area of geometry in world space and size multiplier of model and scene.',
    url: 'https://developer.playcanvas.com/user-manual/graphics/lighting/runtime-lightmaps/#lightmapping-settings'
}, {
    name: 'model:layers',
    title: 'layers',
    subTitle: '{Number[]}',
    description: 'The layers that this model belongs to. When a model belongs to multiple layers it will be rendered multiple times.',
    url: 'https://api.playcanvas.com/engine/classes/ModelComponent.html#layers'
}, {
    name: 'model:customAabb',
    title: 'Custom AABB',
    description: 'If true, then a user provided bounding box will be used for visibility culling of attached mesh instances. This is an optimization allowing an oversized bounding box to be specified for skinned characters in order to avoid per frame bounding box computations based on bone positions.'
}, {
    name: 'model:aabbCenter',
    title: 'AABB Center',
    description: 'The center of the AABB to be used when Override AABB is enabled.'
}, {
    name: 'model:aabbHalfExtents',
    title: 'AABB Half Extents',
    description: 'The half extents of the AABB to be used when Override AABB is enabled.'
}];
