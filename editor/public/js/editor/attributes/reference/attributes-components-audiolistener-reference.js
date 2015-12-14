editor.once('load', function() {
    'use strict';

    var create = function(args) {
        var tooltip = editor.call('attributes:reference', args);

        editor.method('attributes:reference:audiolistener' + (args.name ? (':' + args.name) : '') + ':attach', function(target, element) {
            tooltip.attach({
                target: target,
                element: element || target.element
            });
        });
    };

    var fields = [ ];

    // component reference
    create({
        title: 'pc.AudioListenerComponent',
        subTitle: '{pc.Component}',
        description: 'Specifies the listener\'s position in 3D space. All 3D audio playback will be relative to this position.',
        url: 'http://developer.playcanvas.com/api/pc.AudioListenerComponent.html'
    });

    // fields reference
    for(var i = 0; i < fields.length; i++) {
        fields[i].name = fields[i].title;
        create(fields[i]);
    }
});
