import type { AttributeReference } from '../reference.type.ts';

export const fields: AttributeReference[]  = [{
    name: 'anim:component',
    title: 'pc.AnimComponent',
    subTitle: '{pc.Component}',
    description: 'Enables an entity to animate its model component using the supplied anim state graph asset and attached animation assets.',
    url: 'https://api.playcanvas.com/engine/classes/AnimComponent.html'
}, {
    name: 'anim:activate',
    title: 'activate',
    subTitle: '{Boolean}',
    description: 'If checked, the component will start playing the anim state graph on load.',
    url: 'https://api.playcanvas.com/engine/classes/AnimComponent.html#activate'
}, {
    name: 'anim:speed',
    title: 'speed',
    subTitle: '{Number}',
    description: 'A multiplier for animation playback speed. 0 will freeze animation playback, and 1 represents the normal playback speed.',
    url: 'https://api.playcanvas.com/engine/classes/AnimComponent.html#speed'
}, {
    name: 'anim:rootBone',
    title: 'rootBone',
    subTitle: '{pc.Entity}',
    description: 'The root of the entity hierarchy that all model transform animations should play on.',
    url: 'https://api.playcanvas.com/engine/classes/AnimComponent.html#rootbone'
}, {
    name: 'anim:normalizeWeights',
    title: 'normalizeWeights',
    subTitle: '{Boolean}',
    description: 'If true, the weights of all layers will be normalized together. Otherwise, the animations of each layer will be applied independently.',
    url: 'https://api.playcanvas.com/engine/classes/AnimComponent.html#normalizeweights'
}, {
    name: 'anim:stateGraphAsset',
    title: 'stateGraphAsset',
    subTitle: '{Number}',
    description: 'The anim state graph asset that will control the animation playback for this entity.',
    url: 'https://api.playcanvas.com/engine/classes/AnimComponent.html#stategraphasset'
}];
