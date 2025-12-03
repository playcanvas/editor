import type { AttributeReference } from '../reference.type';

export const fields: AttributeReference[]  = [{
    name: 'asset:sprite:sprite',
    title: 'pc.Sprite',
    subTitle: '{Class}',
    description: 'A Sprite Asset can contain one or multiple Frames from a Texture Atlas Asset. It can be used by the Sprite Component or the Element component to render those frames. You can also implement sprite animations by adding multiple Frames to a Sprite Asset.',
    url: 'https://api.playcanvas.com/engine/classes/Sprite.html'
}, {
    name: 'asset:sprite:pixelsPerUnit',
    title: 'pixelsPerUnit',
    subTitle: '{Number}',
    description: 'The number of pixels that represent one PlayCanvas unit. You can use this value to change the rendered size of your sprites.',
    url: 'https://api.playcanvas.com/engine/classes/Sprite.html#pixelsperunit'
}, {
    name: 'asset:sprite:renderMode',
    title: 'renderMode',
    subTitle: '{Number}',
    description: 'The render mode of the Sprite Asset. It can be Simple, Sliced or Tiled.',
    url: 'https://api.playcanvas.com/engine/classes/Sprite.html#rendermode'
}, {
    name: 'asset:sprite:textureAtlasAsset',
    title: 'textureAtlasAsset',
    subTitle: '{Number}',
    description: 'The Texture Atlas asset that contains all the frames that this Sprite Asset is referencing.',
    url: 'https://api.playcanvas.com/engine/classes/Sprite.html#textureatlasasset'
}];
