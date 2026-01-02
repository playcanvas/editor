import type { AttributeReference } from './reference.type';

const fields: AttributeReference[] = [{
    name: 'spriteeditor:atlas:width',
    title: 'width',
    subTitle: '{Number}',
    description: 'The width of the texture atlas in pixels.',
    url: 'https://api.playcanvas.com/engine/classes/Texture.html#width'
}, {
    name: 'spriteeditor:atlas:height',
    title: 'height',
    subTitle: '{Number}',
    description: 'The height of the texture atlas in pixels.',
    url: 'https://api.playcanvas.com/engine/classes/Texture.html#height'
}, {
    name: 'spriteeditor:atlas:frames',
    title: 'Frames',
    description: 'The number of frames in the texture atlas. Each frame defines a region in the atlas.'
}, {
    name: 'spriteeditor:generate:method',
    title: 'Method',
    description: '"Delete Existing" will delete all frames from the texture atlas first and then create new frames. "Only Append" will append the new frames to the texture atlas without deleting the old ones.'
}, {
    name: 'spriteeditor:generate:type',
    title: 'Type',
    description: '"Grid By Frame Count" will create a grid of frames using the specified number of columns and rows. "Grid By Frame Size" will create a grid of frames using the specified frame size. Frames will only be created in areas of the atlas that are not completely transparent.'
}, {
    name: 'spriteeditor:generate:count',
    title: 'Frame Count',
    description: 'The number of columns and rows in the texture atlas.'
}, {
    name: 'spriteeditor:generate:size',
    title: 'Frame Size',
    description: 'The size of each frame in pixels.'
}, {
    name: 'spriteeditor:generate:offset',
    title: 'Offset',
    description: 'The offset from the top-left of the texture atlas in pixels, from where to start generating frames.'
}, {
    name: 'spriteeditor:generate:spacing',
    title: 'Spacing',
    description: 'The spacing between each frame in pixels.'
}, {
    name: 'spriteeditor:generate:pivot',
    title: 'Pivot',
    description: 'The pivot to use for each new frame.'
}, {
    name: 'spriteeditor:frame:name',
    title: 'Name',
    description: 'The name of the frame(s).'
}, {
    name: 'spriteeditor:frame:position',
    title: 'Position',
    description: 'The left / bottom coordinates of the frame(s) in pixels.'
}, {
    name: 'spriteeditor:frame:size',
    title: 'Size',
    description: 'The size of the frame(s) in pixels.'
}, {
    name: 'spriteeditor:frame:pivotPreset',
    title: 'Pivot Preset',
    description: 'Presets for the pivot of the frame(s).'
}, {
    name: 'spriteeditor:frame:pivot',
    title: 'Pivot',
    description: 'The pivot of the frame(s) in 0-1 units starting from the left / bottom coordinates of the frame(s).'
}, {
    name: 'spriteeditor:frame:border',
    title: 'Border',
    description: 'The border of the frame(s) in pixels when using 9 Slicing. Each field specifies the distance from the left / bottom / right / top edges of the frame(s) respectively.'
}];

editor.once('load', () => {
    fields.forEach(field => editor.call('attributes:reference:add', field));
});
