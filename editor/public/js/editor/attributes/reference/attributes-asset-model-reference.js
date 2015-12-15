editor.once('load', function() {
    'use strict';

    var create = function(args) {
        var tooltip = editor.call('attributes:reference', args);

        editor.method('attributes:reference:asset:model' + (args.name ? (':' + args.name) : '') + ':attach', function(target, element) {
            tooltip.attach({
                target: target,
                element: element || target.element
            });
        });
    };

    var fields = [
        {
            title: 'meshInstances',
            subTitle: '{pc.MeshInstance[]}',
            description: 'An array of meshInstances contained in this model. Materials are defined for each individual Mesh Instance.',
            url: 'http://developer.playcanvas.com/api/pc.Model.html#meshInstances'
        }
    ];

    // fields reference
    for(var i = 0; i < fields.length; i++) {
        fields[i].name = fields[i].title;
        create(fields[i]);
    }
});
