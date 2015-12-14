editor.once('load', function() {
    'use strict';

    var create = function(args) {
        var tooltip = editor.call('attributes:reference', args);

        editor.method('attributes:reference:asset:animation' + (args.name ? (':' + args.name) : '') + ':attach', function(target, element) {
            tooltip.attach({
                target: target,
                element: element || target.element
            });
        });
    };

    var fields = [
        {
            name: 'asset',
            title: 'pc.Animation',
            subTitle: '{Class}',
            description: 'An animation is a sequence of keyframe arrays which map to the nodes of a skeletal hierarchy. It controls how the nodes of the hierarchy are transformed over time.',
            url: 'http://developer.playcanvas.com/api/pc.Animation.html'
        }, {
            title: 'duration',
            description: 'Duration of the animation in seconds.',
            url: 'http://developer.playcanvas.com/api/pc.Animation.html'
        }
    ];

    // fields reference
    for(var i = 0; i < fields.length; i++) {
        fields[i].name = fields[i].name || fields[i].title;
        create(fields[i]);
    }
});
