/**
 * @type {AttributeReference[]}
 */
export const fields  = [{
    name: 'scrollbar:component',
    title: 'pc.ScrollbarComponent',
    subTitle: '{pc.Component}',
    description: 'A ScrollbarComponent enables a group of entities to behave like a scrollbar, with different visual states for hover and press interactions.',
    url: 'https://api.playcanvas.com/engine/classes/ScrollbarComponent.html'
}, {
    name: 'scrollbar:orientation',
    title: 'orientation',
    subTitle: '{pc.ORIENTATION}',
    description: 'Whether the scrollbar moves horizontally or vertically.',
    url: 'https://api.playcanvas.com/engine/classes/ScrollbarComponent.html#orientation'
}, {
    name: 'scrollbar:handleEntity',
    title: 'handleEntity',
    subTitle: '{pc.Entity}',
    description: 'The entity to be used as the scrollbar handle. This entity must have a Scrollbar component.',
    url: 'https://api.playcanvas.com/engine/classes/ScrollbarComponent.html#handleentity'
}, {
    name: 'scrollbar:value',
    title: 'value',
    subTitle: '{Number}',
    description: 'The current position value of the scrollbar, in the range 0...1.',
    url: 'https://api.playcanvas.com/engine/classes/ScrollbarComponent.html#value'
}, {
    name: 'scrollbar:handleSize',
    title: 'handleSize',
    subTitle: '{Number}',
    description: 'The size of the handle relative to the size of the track, in the range 0...1. For a vertical scrollbar, a value of 1 means that the handle will take up the full height of the track.',
    url: 'https://api.playcanvas.com/engine/classes/ScrollbarComponent.html#handlesize'
}];
