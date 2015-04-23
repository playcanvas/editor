editor.once('load', function() {
    'use strict';

    var create = function(args) {
        var tooltip = editor.call('attributes:reference', args);

        editor.method('attributes:reference:animation' + (args.name ? (':' + args.name) : '') + ':attach', function(target, element) {
            tooltip.attach({
                target: target,
                element: element || target.element
            });
        });
    };

    var fields = [
        {
            title: 'assets',
            subTitle: '{Number[]}',
            description: 'The animation assets that can be utilized by this entity. Multiple animations can be assigned via the picker control.',
            url: 'http://developer.playcanvas.com/engine/api/stable/symbols/pc.AnimationComponent.html#assets'
        }, {
            title: 'speed',
            subTitle: '{Number}',
            description: 'A multiplier for animation playback speed. 0 will freeze animation playback, and 1 represents the normal playback speed of the asset.',
            url: 'http://developer.playcanvas.com/engine/api/stable/symbols/pc.AnimationComponent.html#speed'
        }, {
            title: 'activate',
            subTitle: '{Boolean}',
            description: 'If checked, the component will start playing the animation on load.',
            url: 'http://developer.playcanvas.com/engine/api/stable/symbols/pc.AnimationComponent.html#activate'
        }, {
            title: 'loop',
            subTitle: '{Boolean}',
            description: 'If checked, the animation will continue to loop back to the start on completion. Otherwise, the animation will come to a stop on its final frame.',
            url: 'http://developer.playcanvas.com/engine/api/stable/symbols/pc.AnimationComponent.html#loop'
        }
    ];

    // component reference
    create({
        title: 'pc.AnimationComponent',
        subTitle: '{pc.Component}',
        description: 'Enables an entity to specify which animations can be applied to the model assigned to its model component.',
        url: 'http://developer.playcanvas.com/engine/api/stable/symbols/pc.AnimationComponent.html'
    });

    // fields reference
    for(var i = 0; i < fields.length; i++) {
        fields[i].name = fields[i].title;
        create(fields[i]);
    }
});
