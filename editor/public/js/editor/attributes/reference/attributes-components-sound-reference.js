editor.once('load', function() {
    'use strict';

    var create = function(args) {
        var tooltip = editor.call('attributes:reference', args);

        editor.method('attributes:reference:sound' + (args.name ? (':' + args.name) : '') + ':attach', function(target, element) {
            tooltip.attach({
                target: target,
                element: element || target.element
            });
        });
    };

    var fields = [
        {
            title: 'positional',
            subTitle: '{Boolean}',
            description: 'If checked, the component will play back audio assets as if played from the location of the entity in 3D space.',
            url: 'http://developer.playcanvas.com/api/pc.SoundComponent.html#positional'
        }, {
            title: 'distance',
            subTitle: '{Number}',
            description: "refDistance - The reference distance for reducing volume as the sound source moves further from the listener.<br />maxDistance - The maximum distance from the listener at which audio falloff stops. Note the volume of the audio is not 0 after this distance, but just doesn't fall off anymore.",
            url: 'http://developer.playcanvas.com/api/pc.SoundComponent.html#refDistance'
        }, {
            title: 'pitch',
            subTitle: '{Number}',
            description: 'The pitch to playback the audio at. A value of 1 means the audio is played back at the original pitch. The pitch of each slot is multiplied with this value.',
            url: 'http://developer.playcanvas.com/api/pc.SoundComponent.html#pitch'
        }, {
            title: 'rollOffFactor',
            subTitle: '{Number}',
            description: 'The rate at which volume fall-off occurs.',
            url: 'http://developer.playcanvas.com/api/pc.SoundComponent.html#rollOffFactor'
        }, {
            title: 'volume',
            subTitle: '{Number}',
            description: 'The volume modifier to play the audio with. The volume of each slot is multiplied with this value.',
            url: 'http://developer.playcanvas.com/api/pc.SoundComponent.html#volume'
        }, {
            title: 'distanceModel',
            subTitle: '{String}',
            description: 'Determines which algorithm to use to reduce the volume of the audio as it moves away from the listener.'
        }
    ];

    // component reference
    create({
        title: 'pc.SoundComponent',
        subTitle: '{pc.Component}',
        description: 'The Sound Component controls playback of sounds',
        url: 'http://developer.playcanvas.com/api/pc.SoundComponent.html'
    });

    // fields reference
    for(var i = 0; i < fields.length; i++) {
        fields[i].name = fields[i].title;
        create(fields[i]);
    }
});
