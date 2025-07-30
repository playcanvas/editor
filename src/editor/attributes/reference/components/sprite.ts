/**
 * @type {AttributeReference[]}
 */
export const fields  = [{
    name: 'sprite:component',
    title: 'pc.SpriteComponent',
    subTitle: '{pc.Component}',
    description: 'The Sprite Component enables an Entity to render a simple static Sprite or Sprite Animation Clips.',
    url: 'https://api.playcanvas.com/engine/classes/SpriteComponent.html'
}, {
    name: 'sprite:type',
    title: 'type',
    subTitle: '{Boolean}',
    description: 'A Sprite Component can either be Simple or Animated. Simple Sprite Components only show a single frame of a Sprite Asset. Animated Sprite Components can play Sprite Animation Clips.',
    url: 'https://api.playcanvas.com/engine/classes/SpriteComponent.html#type'
}, {
    name: 'sprite:color',
    title: 'color',
    subTitle: '{pc.Color}',
    description: 'The color tint of the Sprite.',
    url: 'https://api.playcanvas.com/engine/classes/SpriteComponent.html#color'
}, {
    name: 'sprite:opacity',
    title: 'opacity',
    subTitle: '{Number}',
    description: 'The opacity of the Sprite.',
    url: 'https://api.playcanvas.com/engine/classes/SpriteComponent.html#opacity'
}, {
    name: 'sprite:spriteAsset',
    title: 'spriteAsset',
    subTitle: '{pc.Asset}',
    description: 'The Sprite Asset used by the Sprite Component.',
    url: 'https://api.playcanvas.com/engine/classes/SpriteComponent.html#spriteasset'
}, {
    name: 'sprite:frame',
    title: 'frame',
    subTitle: '{Number}',
    description: 'The frame of the Sprite Asset that the Sprite Component will render.',
    url: 'https://api.playcanvas.com/engine/classes/SpriteComponent.html#frame'
}, {
    name: 'sprite:flipX',
    title: 'flipX',
    subTitle: '{Boolean}',
    description: 'Flips the X axis when rendering a Sprite.',
    url: 'https://api.playcanvas.com/engine/classes/SpriteComponent.html#flipx'
}, {
    name: 'sprite:flipY',
    title: 'flipY',
    subTitle: '{Boolean}',
    description: 'Flips the Y axis when rendering a Sprite.',
    url: 'https://api.playcanvas.com/engine/classes/SpriteComponent.html#flipy'
}, {
    name: 'sprite:size',
    title: 'size',
    subTitle: 'width / height {Number}',
    description: 'The width and height of the Sprite when rendering using 9-Slicing. The width and height are only used when the render mode of the Sprite Asset is Sliced or Tiled.',
    url: 'https://api.playcanvas.com/engine/classes/SpriteComponent.html#width'
}, {
    name: 'sprite:width',
    title: 'width',
    subTitle: '{Number}',
    description: 'The width of the Sprite when rendering using 9-Slicing. The width is only used when the render mode of the Sprite Asset is Sliced or Tiled.',
    url: 'https://api.playcanvas.com/engine/classes/SpriteComponent.html#width'
}, {
    name: 'sprite:height',
    title: 'height',
    subTitle: '{Number}',
    description: 'The height of the Sprite when rendering using 9-Slicing. The height is only used when the render mode of the Sprite Asset is Sliced or Tiled.',
    url: 'https://api.playcanvas.com/engine/classes/SpriteComponent.html#height'
}, {
    name: 'sprite:drawOrder',
    title: 'drawOrder',
    subTitle: '{Number}',
    description: 'The draw order of the sprite. A higher value means that the component will be rendered on top of other components in the same layer. For this work the sprite must be in a layer that uses Manual sort order.',
    url: 'https://api.playcanvas.com/engine/classes/SpriteComponent.html#draworder'
}, {
    name: 'sprite:speed',
    title: 'speed',
    subTitle: '{Number}',
    description: 'A global speed modifier used when playing Sprite Animation Clips.',
    url: 'https://api.playcanvas.com/engine/classes/SpriteComponent.html#flipy'
}, {
    name: 'sprite:autoPlayClip',
    title: 'autoPlayClip',
    subTitle: '{String}',
    description: 'The Sprite Animation Clip to play automatically when the Sprite Component is enabled.',
    url: 'https://api.playcanvas.com/engine/classes/SpriteComponent.html#autoplayclip'
}, {
    name: 'sprite:batchGroupId',
    title: 'batchGroupId',
    subTitle: '{Number}',
    description: 'The batch group that this sprite belongs to. The engine will attempt to batch sprites in the same batch group to reduce draw calls.',
    url: 'https://api.playcanvas.com/engine/classes/SpriteComponent.html#batchgroupid'
}, {
    name: 'sprite:addClip',
    title: 'Add Clip',
    description: 'Add a new Sprite Animation Clip.'
}, {
    name: 'sprite:layers',
    title: 'layers',
    subTitle: '{Number[]}',
    description: 'The layers that this sprite belongs to. When a sprite belongs to multiple layers it will be rendered multiple times.',
    url: 'https://api.playcanvas.com/engine/classes/SpriteComponent.html#layers'
}];
