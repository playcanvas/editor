editor.once('load', function() {
    'use strict';

    var fields = [{
        name: 'component',
        title: 'pc.AudioSourceComponent',
        subTitle: '{pc.Component}',
        description: 'The AudioSource Component controls playback of an audio sample. This class will be deprecated in favor of {@link pc.SoundComponent}.',
        url: 'http://developer.playcanvas.com/api/pc.AudioSourceComponent.html'
    }, {
        title: '3d',
        subTitle: '{Boolean}',
        description: 'If checked, the component will play back audio assets as if played from the location of the entity in 3D space.',
        url: 'http://developer.playcanvas.com/api/pc.AudioSourceComponent.html#3d'
    }, {
        title: 'activate',
        subTitle: '{Boolean}',
        description: 'If checked, the first audio asset specified by the Assets property will be played on load. Otherwise, audio assets will need to be played using script.',
        url: 'http://developer.playcanvas.com/api/pc.AudioSourceComponent.html#activate'
    }, {
        title: 'assets',
        subTitle: '{Number[]}',
        description: 'The audio assets that can be played from this audio source. Multiple audio assets can be specified by the picker control.',
        url: 'http://developer.playcanvas.com/api/pc.AudioSourceComponent.html#assets'
    }, {
        title: 'loop',
        subTitle: '{Boolean}',
        description: 'If checked, the component will loop played audio assets continuously. Otherwise, audio assets are played once to completion.',
        url: 'http://developer.playcanvas.com/api/pc.AudioSourceComponent.html#loop'
    }, {
        title: 'distance',
        subTitle: '{Number}',
        description: 'minDistance - the distance at which the volume of playback begins to fall from its maximum. maxDistance - The distance at which the volume of playback falls to zero.',
        url: 'http://developer.playcanvas.com/api/pc.AudioSourceComponent.html#maxDistance'
    }, {
        title: 'pitch',
        subTitle: '{Number}',
        description: 'The pitch to playback the audio at. A value of 1 means the audio is played back at the original pitch.',
        url: 'http://developer.playcanvas.com/api/pc.AudioSourceComponent.html#pitch'
    }, {
        title: 'rollOffFactor',
        subTitle: '{Number}',
        description: 'The rate at which volume fall-off occurs.',
        url: 'http://developer.playcanvas.com/api/pc.AudioSourceComponent.html#rollOffFactor'
    }, {
        title: 'volume',
        subTitle: '{Number}',
        description: 'The volume of the audio assets played back by the component.',
        url: 'http://developer.playcanvas.com/api/pc.AudioSourceComponent.html#volume'
    }];

    for(var i = 0; i < fields.length; i++) {
        fields[i].name = 'audiosource:' + (fields[i].name || fields[i].title);
        editor.call('attributes:reference:add', fields[i]);
    }

    editor.call('attributes:reference:add', {
        name: 'audio:assets',
        title: 'assets',
        subTitle: '{Number[]}',
        description: 'The audio assets that can be played from this audio source. Multiple audio assets can be specified by the picker control.',
        url: 'http://developer.playcanvas.com/api/pc.AudioSourceComponent.html#assets'
    });
});
