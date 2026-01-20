import type { AttributeReference } from '../reference.type';

export const fields: AttributeReference[]  = [{
    name: 'sound:component',
    title: 'pc.SoundComponent',
    subTitle: '{pc.Component}',
    description: 'The Sound Component controls playback of sounds',
    url: 'https://api.playcanvas.com/engine/classes/SoundComponent.html'
}, {
    name: 'sound:positional',
    title: 'positional',
    subTitle: '{Boolean}',
    description: 'If checked, the component will play back audio assets as if played from the location of the entity in 3D space.',
    url: 'https://api.playcanvas.com/engine/classes/SoundComponent.html#positional'
}, {
    name: 'sound:distance',
    title: 'distance',
    subTitle: '{Number}',
    description: 'refDistance - The reference distance for reducing volume as the sound source moves further from the listener. maxDistance - The maximum distance from the listener at which audio falloff stops. Note the volume of the audio is not 0 after this distance, but just doesn\'t fall off anymore.',
    url: 'https://api.playcanvas.com/engine/classes/SoundComponent.html#refdistance'
}, {
    name: 'sound:refDistance',
    title: 'refDistance',
    subTitle: '{Number}',
    description: 'The reference distance for reducing volume as the sound source moves further from the listener.',
    url: 'https://api.playcanvas.com/engine/classes/SoundComponent.html#refdistance'
}, {
    name: 'sound:maxDistance',
    title: 'maxDistance',
    subTitle: '{Number}',
    description: 'The maximum distance from the listener at which audio falloff stops. Note the volume of the audio is not 0 after this distance, but just doesn\'t fall off anymore.',
    url: 'https://api.playcanvas.com/engine/classes/SoundComponent.html#maxdistance'
}, {
    name: 'sound:pitch',
    title: 'pitch',
    subTitle: '{Number}',
    description: 'The pitch to playback the audio at. A value of 1 means the audio is played back at the original pitch. The pitch of each slot is multiplied with this value.',
    url: 'https://api.playcanvas.com/engine/classes/SoundComponent.html#pitch'
}, {
    name: 'sound:rollOffFactor',
    title: 'rollOffFactor',
    subTitle: '{Number}',
    description: 'The rate at which volume fall-off occurs.',
    url: 'https://api.playcanvas.com/engine/classes/SoundComponent.html#rollofffactor'
}, {
    name: 'sound:volume',
    title: 'volume',
    subTitle: '{Number}',
    description: 'The volume modifier to play the audio with. The volume of each slot is multiplied with this value.',
    url: 'https://api.playcanvas.com/engine/classes/SoundComponent.html#volume'
}, {
    name: 'sound:distanceModel',
    title: 'distanceModel',
    subTitle: '{pc.DISTANCE_*}',
    description: `Determines which algorithm to use to reduce the volume of the audio as it moves away from the listener.
<ul>
<li><b>Linear</b> (<code>pc.DISTANCE_LINEAR</code>): Volume decreases linearly between refDistance and maxDistance.</li>
<li><b>Inverse</b> (<code>pc.DISTANCE_INVERSE</code>): Volume is inversely proportional to distance.</li>
<li><b>Exponential</b> (<code>pc.DISTANCE_EXPONENTIAL</code>): Volume decreases exponentially with distance.</li>
</ul>`,
    url: 'https://api.playcanvas.com/engine/classes/SoundComponent.html#distancemodel'
}];
