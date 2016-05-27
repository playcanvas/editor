editor.once('load', function() {
    'use strict';

    var fields = [{
        name: 'slot',
        title: 'pc.SoundSlot',
        description: 'The SoundSlot controls playback of an audio asset.',
        url: 'http://developer.playcanvas.com/api/pc.SoundSlot.html'
    }, {
        title: 'name',
        subTitle: '{String}',
        description: 'The name of the slot',
        url: 'http://developer.playcanvas.com/api/pc.SoundSlot.html#name'
    }, {
        title: 'startTime',
        subTitle: '{Number}',
        description: 'The start time from which the sound will start playing.',
        url: 'http://developer.playcanvas.com/api/pc.SoundSlot.html#startTime'
    }, {
        title: 'duration',
        subTitle: '{String}',
        description: 'The duration of the sound that the slot will play starting from startTime.',
        url: 'http://developer.playcanvas.com/api/pc.SoundSlot.html#duration'
    }, {
        title: 'autoPlay',
        subTitle: '{Boolean}',
        description: 'If checked, the slot will be played on load. Otherwise, sound slots will need to be played by scripts.',
        url: 'http://developer.playcanvas.com/api/pc.SoundSlot.html#autoPlay'
    }, {
        title: 'overlap',
        subTitle: '{Boolean}',
        description: 'If true then sounds played from slot will be played independently of each other. Otherwise the slot will first stop the current sound before starting the new one.',
        url: 'http://developer.playcanvas.com/api/pc.SoundSlot.html#overlap'
    }, {
        title: 'asset',
        subTitle: '{Number}',
        description: 'The audio asset that can be played from this sound slot.',
        url: 'http://developer.playcanvas.com/api/pc.SoundSlot.html#asset'
    }, {
        title: 'loop',
        subTitle: '{Boolean}',
        description: 'If checked, the slot will loop playback continuously. Otherwise, it will be played once to completion.',
        url: 'http://developer.playcanvas.com/api/pc.SoundSlot.html#loop'
    }, {
        title: 'pitch',
        subTitle: '{Number}',
        description: 'The pitch to playback the audio at. A value of 1 means the audio is played back at the original pitch.',
        url: 'http://developer.playcanvas.com/api/pc.SoundComponent.html#pitch'
    }, {
        title: 'volume',
        subTitle: '{Number}',
        description: 'The volume modifier to play the audio with.',
        url: 'http://developer.playcanvas.com/api/pc.SoundComponent.html#volume'
    }];

    for(var i = 0; i < fields.length; i++) {
        fields[i].name = 'sound:slot:' + (fields[i].name || fields[i].title);
        editor.call('attributes:reference:add', fields[i]);
    }
});
