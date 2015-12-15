editor.once('load', function() {
    'use strict';

    var create = function(args) {
        var tooltip = editor.call('attributes:reference', args);

        editor.method('attributes:reference:asset:texture' + (args.name ? (':' + args.name) : '') + ':attach', function(target, element) {
            tooltip.attach({
                target: target,
                element: element || target.element
            });
        });
    };

    var fields = [
        {
            name: 'asset',
            title: 'pc.Texture',
            subTitle: '{Class}',
            description: 'Textures assets are image files which are used as part of a material to give a 3D model a realistic appearance.',
            url: 'http://developer.playcanvas.com/api/pc.Texture.html'
        }, {
            name: 'dimensions',
            title: 'width / height',
            subTitle: '{Number}',
            description: 'The width and height of the texture.',
            url: 'http://developer.playcanvas.com/api/pc.Texture.html#width'
        }, {
            title: 'magFilter',
            subTitle: '{pc.FILTER_*}',
            description: 'The magnification filter to be applied to the texture.',
            url: 'http://developer.playcanvas.com/api/pc.Texture.html#magFilter'
        }, {
            title: 'mipFilter',
            subTitle: '{pc.FILTER_*}',
            description: 'The minification mipmap filter to be applied to the texture.',
            url: 'http://developer.playcanvas.com/api/pc.Texture.html#mipFilter'
        }, {
            title: 'minFilter',
            subTitle: '{pc.FILTER_*}',
            description: 'The minification filter to be applied to the texture.',
            url: 'http://developer.playcanvas.com/api/pc.Texture.html#minFilter'
        }, {
            title: 'addressU',
            subTitle: '{pc.ADDRESS_*}',
            description: 'The addressing mode to be applied to the texture.',
            url: 'http://developer.playcanvas.com/api/pc.Texture.html#addressU'
        }, {
            title: 'addressV',
            subTitle: '{pc.ADDRESS_*}',
            description: 'The addressing mode to be applied to the texture.',
            url: 'http://developer.playcanvas.com/api/pc.Texture.html#addressV'
        }, {
            title: 'anisotropy',
            subTitle: '{Number}',
            description: 'Integer value specifying the level of anisotropic to apply to the texture ranging from 1 (no anisotropic filtering) to the pc.GraphicsDevice property maxAnisotropy.',
            url: 'http://developer.playcanvas.com/api/pc.Texture.html#anisotropy'
        }
    ];

    // fields reference
    for(var i = 0; i < fields.length; i++) {
        fields[i].name = fields[i].name || fields[i].title;
        create(fields[i]);
    }
});
