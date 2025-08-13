import type { AttributeReference } from '../reference.type.ts';

export const fields: AttributeReference[] = [{
    name: 'audiosource:component',
    title: 'pc.AudioSourceComponent',
    subTitle: '{pc.Component}',
    description: `The AudioSource Component controls playback of an audio sample. ${editor.projectEngineV2 ? 'This class has been removed' : 'This class will be deprecated'} in favor of {@link pc.SoundComponent}.`,
    url: 'https://api.playcanvas.com/engine/classes/AudioSourceComponent.html'
}, {
    name: 'audiosource:3d',
    title: '3d',
    subTitle: '{Boolean}',
    description: 'If checked, the component will play back audio assets as if played from the location of the entity in 3D space.',
    url: 'https://api.playcanvas.com/engine/classes/AudioSourceComponent.html#3d'
}, {
    name: 'audiosource:activate',
    title: 'activate',
    subTitle: '{Boolean}',
    description: 'If checked, the first audio asset specified by the Assets property will be played on load. Otherwise, audio assets will need to be played using script.',
    url: 'https://api.playcanvas.com/engine/classes/AudioSourceComponent.html#activate'
}, {
    name: 'audiosource:assets',
    title: 'assets',
    subTitle: '{Number[]}',
    description: 'The audio assets that can be played from this audio source. Multiple audio assets can be specified by the picker control.',
    url: 'https://api.playcanvas.com/engine/classes/AudioSourceComponent.html#assets'
}, {
    name: 'audiosource:loop',
    title: 'loop',
    subTitle: '{Boolean}',
    description: 'If checked, the component will loop played audio assets continuously. Otherwise, audio assets are played once to completion.',
    url: 'https://api.playcanvas.com/engine/classes/AudioSourceComponent.html#loop'
}, {
    name: 'audiosource:distance',
    title: 'distance',
    subTitle: '{Number}',
    description: 'minDistance - the distance at which the volume of playback begins to fall from its maximum. maxDistance - The distance at which the volume of playback falls to zero.',
    url: 'https://api.playcanvas.com/engine/classes/AudioSourceComponent.html#maxdistance'
}, {
    name: 'audiosource:minDistance',
    title: 'minDistance',
    subTitle: '{Number}',
    description: 'The distance at which the volume of playback begins to fall from its maximum',
    url: 'https://api.playcanvas.com/engine/classes/AudioSourceComponent.html#mindistance'
}, {
    name: 'audiosource:maxDistance',
    title: 'maxDistance',
    subTitle: '{Number}',
    description: 'The distance at which the volume of playback falls to zero.',
    url: 'https://api.playcanvas.com/engine/classes/AudioSourceComponent.html#maxdistance'
}, {
    name: 'audiosource:pitch',
    title: 'pitch',
    subTitle: '{Number}',
    description: 'The pitch to playback the audio at. A value of 1 means the audio is played back at the original pitch.',
    url: 'https://api.playcanvas.com/engine/classes/AudioSourceComponent.html#pitch'
}, {
    name: 'audiosource:rollOffFactor',
    title: 'rollOffFactor',
    subTitle: '{Number}',
    description: 'The rate at which volume fall-off occurs.',
    url: 'https://api.playcanvas.com/engine/classes/AudioSourceComponent.html#rollofffactor'
}, {
    name: 'audiosource:volume',
    title: 'volume',
    subTitle: '{Number}',
    description: 'The volume of the audio assets played back by the component.',
    url: 'https://api.playcanvas.com/engine/classes/AudioSourceComponent.html#volume'
}, {
    name: 'audiosource:audio:assets',
    title: 'assets',
    subTitle: '{Number[]}',
    description: 'The audio assets that can be played from this audio source. Multiple audio assets can be specified by the picker control.',
    url: 'https://api.playcanvas.com/engine/classes/AudioSourceComponent.html#assets'
}];
