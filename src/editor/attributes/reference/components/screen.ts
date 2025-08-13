import type { AttributeReference } from '../reference.type.ts';

export const fields: AttributeReference[]  = [{
    name: 'screen:component',
    title: 'pc.ScreenComponent',
    subTitle: '{pc.Component}',
    description: '',
    url: 'https://api.playcanvas.com/engine/classes/ScreenComponent.html'
}, {
    name: 'screen:screenSpace',
    title: 'screenSpace',
    subTitle: '{Boolean}',
    description: 'If true then the screen will display its child Elements in 2D. Set this to false to make this a 3D screen.',
    url: 'https://api.playcanvas.com/engine/classes/ScreenComponent.html#screenspace'
}, {
    name: 'screen:resolution',
    title: 'resolution',
    subTitle: '{pc.Vec2}',
    description: 'The resolution of the screen.',
    url: 'https://api.playcanvas.com/engine/classes/ScreenComponent.html#resolution'
}, {
    name: 'screen:referenceResolution',
    title: 'referenceResolution',
    subTitle: '{pc.Vec2}',
    description: 'The reference resolution of the screen. If the window size changes the screen will adjust its size based on scaleMode using the reference resolution.',
    url: 'https://api.playcanvas.com/engine/classes/ScreenComponent.html#referenceresolution'
}, {
    name: 'screen:scaleMode',
    title: 'scaleMode',
    subTitle: '{String}',
    description: 'Controls how a screen-space screen is resized when the window size changes. Use Blend to have the screen adjust between the difference of the window resolution and the screen\'s reference resolution. Use None to make the screen always have a size equal to its resolution.',
    url: 'https://api.playcanvas.com/engine/classes/ScreenComponent.html#scalemode'
}, {
    name: 'screen:scaleBlend',
    title: 'scaleBlend',
    subTitle: '{Number}',
    description: 'Set this to 0 to only adjust to changes between the width of the window and the x of the reference resolution. Set this to 1 to only adjust to changes between the window height and the y of the reference resolution. A value in the middle will try to adjust to both.',
    url: 'https://api.playcanvas.com/engine/classes/ScreenComponent.html#scaleblend'
}, {
    name: 'screen:priority',
    title: 'priority',
    subTitle: '{Number}',
    description: 'Determines the order in which Screen components in the same layer are rendered (higher priority is rendered on top). Number must be an integer between 0 and 127.',
    url: 'https://api.playcanvas.com/engine/classes/ScreenComponent.html#priority'
}];
