/**
 * @type {AttributeReference[]}
 */
export const fields  = [{
    name: 'sound:slot:slot',
    title: 'pc.SoundSlot',
    description: 'The SoundSlot controls playback of an audio asset.',
    url: 'https://api.playcanvas.com/engine/classes/SoundSlot.html'
}, {
    name: 'sound:slot:name',
    title: 'name',
    subTitle: '{String}',
    description: 'The name of the slot',
    url: 'https://api.playcanvas.com/engine/classes/SoundSlot.html#name'
}, {
    name: 'sound:slot:startTime',
    title: 'startTime',
    subTitle: '{Number}',
    description: 'The start time from which the sound will start playing.',
    url: 'https://api.playcanvas.com/engine/classes/SoundSlot.html#starttime'
}, {
    name: 'sound:slot:duration',
    title: 'duration',
    subTitle: '{String}',
    description: 'The duration of the sound that the slot will play starting from startTime.',
    url: 'https://api.playcanvas.com/engine/classes/SoundSlot.html#duration'
}, {
    name: 'sound:slot:autoPlay',
    title: 'autoPlay',
    subTitle: '{Boolean}',
    description: 'If checked, the slot will be played on load. Otherwise, sound slots will need to be played by scripts.',
    url: 'https://api.playcanvas.com/engine/classes/SoundSlot.html#autoplay'
}, {
    name: 'sound:slot:overlap',
    title: 'overlap',
    subTitle: '{Boolean}',
    description: 'If true then sounds played from slot will be played independently of each other. Otherwise the slot will first stop the current sound before starting the new one.',
    url: 'https://api.playcanvas.com/engine/classes/SoundSlot.html#overlap'
}, {
    name: 'sound:slot:asset',
    title: 'asset',
    subTitle: '{Number}',
    description: 'The audio asset that can be played from this sound slot.',
    url: 'https://api.playcanvas.com/engine/classes/SoundSlot.html#asset'
}, {
    name: 'sound:slot:loop',
    title: 'loop',
    subTitle: '{Boolean}',
    description: 'If checked, the slot will loop playback continuously. Otherwise, it will be played once to completion.',
    url: 'https://api.playcanvas.com/engine/classes/SoundSlot.html#loop'
}, {
    name: 'sound:slot:pitch',
    title: 'pitch',
    subTitle: '{Number}',
    description: 'The pitch to playback the audio at. A value of 1 means the audio is played back at the original pitch.',
    url: 'https://api.playcanvas.com/engine/classes/SoundComponent.html#pitch'
}, {
    name: 'sound:slot:volume',
    title: 'volume',
    subTitle: '{Number}',
    description: 'The volume modifier to play the audio with.',
    url: 'https://api.playcanvas.com/engine/classes/SoundComponent.html#volume'
}];
