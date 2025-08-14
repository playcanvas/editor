import type { AttributeReference } from '../reference.type.ts';

export const fields: AttributeReference[]  = [{
    name: 'render:component',
    title: 'pc.RenderComponent',
    subTitle: '{pc.Component}',
    description: 'Enables an Entity to render a mesh or a primitive shape. This component attaches geometry to the Entity.',
    url: 'https://api.playcanvas.com/engine/classes/RenderComponent.html'
}, {
    name: 'render:type',
    title: 'type',
    subTitle: '{String}',
    description: 'The type of the Render Component.',
    url: 'https://api.playcanvas.com/engine/classes/RenderComponent.html#type'
}, {
    name: 'render:asset',
    title: 'asset',
    subTitle: '{pc.Asset}',
    description: 'The Render Asset for the Render Component (only applies to type "asset").',
    url: 'https://api.playcanvas.com/engine/classes/RenderComponent.html#asset'
}, {
    name: 'render:materialAssets',
    title: 'materialAssets',
    subTitle: '{pc.Asset[]}',
    description: 'The Material Assets that will be used to render the meshes. Each material corresponds to the respective mesh instance.',
    url: 'https://api.playcanvas.com/engine/classes/RenderComponent.html#materialassets'
}, {
    name: 'render:castShadows',
    title: 'castShadows',
    subTitle: '{Boolean}',
    description: 'If true, attached meshes will cast shadows for lights that have shadow casting enabled.',
    url: 'https://api.playcanvas.com/engine/classes/RenderComponent.html#castshadows'
}, {
    name: 'render:receiveShadows',
    title: 'receiveShadows',
    subTitle: '{Boolean}',
    description: 'If true, shadows will be cast on attached meshes.',
    url: 'https://api.playcanvas.com/engine/classes/RenderComponent.html#receiveshadows'
}, {
    name: 'render:castShadowsLightmap',
    title: 'castShadowsLightmap',
    subTitle: '{Boolean}',
    description: 'If true, the meshes will cast shadows when rendering lightmaps.',
    url: 'https://api.playcanvas.com/engine/classes/RenderComponent.html#castshadowslightmap'
}, {
    name: 'render:lightmapped',
    title: 'lightmapped',
    subTitle: '{Boolean}',
    description: 'If true, the meshes will be lightmapped after using lightmapper.bake().',
    url: 'https://api.playcanvas.com/engine/classes/RenderComponent.html#lightmapped'
}, {
    name: 'render:lightmapSizeMultiplier',
    title: 'lightmapSizeMultiplier',
    subTitle: '{Number}',
    description: 'Lightmap resolution multiplier.',
    url: 'https://api.playcanvas.com/engine/classes/RenderComponent.html#lightmapsizemultiplier'
}, {
    name: 'render:isStatic',
    title: 'isStatic',
    subTitle: '{Boolean}',
    description: 'Mark meshes as non-movable (optimization).',
    url: 'https://api.playcanvas.com/engine/classes/RenderComponent.html#isstatic'
}, {
    name: 'render:batchGroupId',
    title: 'batchGroupId',
    subTitle: '{Number}',
    description: 'Assign meshes to a specific batch group.',
    url: 'https://api.playcanvas.com/engine/classes/RenderComponent.html#batchgroupid'
}, {
    name: 'render:layers',
    title: 'layers',
    subTitle: '{Number[]}',
    description: 'The layers to which the meshes should belong.',
    url: 'https://api.playcanvas.com/engine/classes/RenderComponent.html#layers'
}, {
    name: 'render:rootBone',
    title: 'rootBone',
    subTitle: '{pc.Entity}',
    description: 'A reference to the entity to be used as the root bone for any skinned meshes that are rendered by this component.',
    url: 'https://api.playcanvas.com/engine/classes/RenderComponent.html#rootbone'
}, {
    name: 'render:customAabb',
    title: 'Custom AABB',
    description: 'If true, then a user provided bounding box will be used for visibility culling of attached mesh instances. This is an optimization allowing an oversized bounding box to be specified for skinned characters in order to avoid per frame bounding box computations based on bone positions.'
}, {
    name: 'render:aabbCenter',
    title: 'AABB Center',
    description: 'The center of the AABB to be used when Override AABB is enabled.'
}, {
    name: 'render:aabbHalfExtents',
    title: 'AABB Half Extents',
    description: 'The half extents of the AABB to be used when Override AABB is enabled.'
}];
