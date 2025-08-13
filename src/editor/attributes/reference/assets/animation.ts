import type { AttributeReference } from '../reference.type.ts';

export const fields: AttributeReference[]  = [{
    name: 'asset:animation:asset',
    title: 'pc.Animation',
    subTitle: '{Class}',
    description: 'An animation is a sequence of keyframe arrays which map to the nodes of a skeletal hierarchy. It controls how the nodes of the hierarchy are transformed over time.',
    url: 'https://api.playcanvas.com/engine/classes/Animation.html'
}, {
    name: 'asset:animation:name',
    title: 'name',
    description: 'The name of the animation',
    url: 'https://api.playcanvas.com/engine/classes/Animation.html#name'
}, {
    name: 'asset:animation:duration',
    title: 'duration',
    description: 'Duration of the animation in seconds.',
    url: 'https://api.playcanvas.com/engine/classes/Animation.html#duration'
}];
