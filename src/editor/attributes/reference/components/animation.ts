/**
 * @type {AttributeReference[]}
 */
export const fields  = [{
    name: 'animation:component',
    title: 'pc.AnimationComponent',
    subTitle: '{pc.Component}',
    description: 'Enables an entity to specify which animations can be applied to the model assigned to its model component.',
    url: 'https://api.playcanvas.com/engine/classes/AnimationComponent.html'
}, {
    name: 'animation:assets',
    title: 'assets',
    subTitle: '{Number[]}',
    description: 'The animation assets that can be utilized by this entity. Multiple animations can be assigned via the picker control.',
    url: 'https://api.playcanvas.com/engine/classes/AnimationComponent.html#assets'
}, {
    name: 'animation:speed',
    title: 'speed',
    subTitle: '{Number}',
    description: 'A multiplier for animation playback speed. 0 will freeze animation playback, and 1 represents the normal playback speed of the asset.',
    url: 'https://api.playcanvas.com/engine/classes/AnimationComponent.html#speed'
}, {
    name: 'animation:activate',
    title: 'activate',
    subTitle: '{Boolean}',
    description: 'If checked, the component will start playing the animation on load.',
    url: 'https://api.playcanvas.com/engine/classes/AnimationComponent.html#activate'
}, {
    name: 'animation:loop',
    title: 'loop',
    subTitle: '{Boolean}',
    description: 'If checked, the animation will continue to loop back to the start on completion. Otherwise, the animation will come to a stop on its final frame.',
    url: 'https://api.playcanvas.com/engine/classes/AnimationComponent.html#loop'
}];
