editor.once('load', function() {
    'use strict';

    var fields = [{
        name: 'asset',
        title: 'pc.Texture',
        subTitle: '{Class}',
        description: 'Cube maps are a special type of texture asset. They are formed from 6 texture assets where each texture represents the face of a cube. They typically have two uses: A cube map can define your scene\'s sky box. A sky box contains imagery of the distant visuals of your scene such as hills, mountains, the sky and so on. A cube map can add reflections to any material. Imagine a shiny, chrome ball bearing in your scene. The ball reflects the surrounding scene. For open environments, you would normally set the scene\'s sky box cube map as the cube map on a reflective object\'s materials.',
        url: 'http://developer.playcanvas.com/api/pc.Texture.html'
    }, {
        title: 'anisotropy',
        subTitle: '{Number}',
        description: 'Integer value specifying the level of anisotropic to apply to the texture ranging from 1 (no anisotropic filtering) to the pc.GraphicsDevice property maxAnisotropy.',
        url: 'http://developer.playcanvas.com/api/pc.Texture.html#anisotropy'
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
        name: 'slots',
        title: 'Texture Slots',
        description: 'The six texture assets that correspond to the faces of a cube. Helping you to connect faces together correctly. Think of the preview as a box unfolded to a flat plane.'
    }, {
        name: 'prefilter',
        title: 'Prefiltering',
        description: 'Prefilter button generates a set of low-resolution filtered textures which are used in the environment map of the Physical material. Prefiltering the cube map is essential for using the Physical material.'
    }];

    for(var i = 0; i < fields.length; i++) {
        fields[i].name = 'asset:cubemap:' + (fields[i].name || fields[i].title);
        editor.call('attributes:reference:add', fields[i]);
    }
});
