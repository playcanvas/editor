editor.once('load', function() {
    'use strict';

    var create = function(args) {
        var tooltip = editor.call('attributes:reference', args);

        editor.method('attributes:reference:asset' + (args.name ? (':' + args.name) : '') + ':attach', function(target, element) {
            tooltip.attach({
                target: target,
                element: element || target.element
            });
        });
    };

    var fields = [
        {
            title: 'id',
            subTitle: '{Number}',
            description: 'Unique identifier of an Asset.',
            url: 'http://developer.playcanvas.com/api/pc.asset.Asset.html'
        }, {
            title: 'name',
            subTitle: '{String}',
            description: 'The name of the asset.',
            url: 'http://developer.playcanvas.com/api/pc.asset.Asset.html#name'
        }, {
            title: 'type',
            subTitle: '{String}',
            description: 'The type of the asset. One of: animation, audio, image, json, material, model, text, texture.',
            url: 'http://developer.playcanvas.com/api/pc.asset.Asset.html#type'
        }, {
            name: 'size',
            description: 'Size of an asset. Keeping this value as tiny as possible will lead to faster application loading and less bandwidth required to launch the app.'
        }
    ];

    // fields reference
    for(var i = 0; i < fields.length; i++) {
        fields[i].name = fields[i].name || fields[i].title;
        create(fields[i]);
    }
});
