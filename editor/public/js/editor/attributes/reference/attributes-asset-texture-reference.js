editor.once('load', function () {
    'use strict';

    var fields = [{
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
    }, {
        title: 'width',
        subTitle: '{Number}',
        description: 'The width of the base mip level in pixels.',
        url: 'http://developer.playcanvas.com/api/pc.Texture.html#width'
    }, {
        title: 'height',
        subTitle: '{Number}',
        description: 'The height of the base mip level in pixels.',
        url: 'http://developer.playcanvas.com/api/pc.Texture.html#height'
    }, {
        title: 'depth',
        description: 'Bits per pixel.'
    }, {
        title: 'alpha',
        description: 'If picture has alpha data.'
    }, {
        title: 'interlaced',
        description: 'If picture is Interlaced. This picture (PNG, JPG) format feature is unavailable for WebGL but is available for use in DOM, making pictures to appear before fully loaded, and load progresively.'
    }, {
        title: 'rgbm',
        subTitle: '{Boolean}',
        description: 'Specifies whether the texture contains RGBM-encoded HDR data. Defaults to false.',
        url: 'http://developer.playcanvas.com/api/pc.Texture.html#rgbm'
    }, {
        title: 'filtering',
        subTitle: '{pc.FILTER_*}',
        description: 'This property is exposed as minFilter and magFilter to specify how texture is filtered.',
        url: 'http://developer.playcanvas.com/api/pc.Texture.html#magFilter'
    }, {
        name: 'compression',
        title: 'Compression',
        description: 'Compressed textures load faster and consume much less VRAM on GPU allowing texture intense applications to have bigger scale.'
    }, {
        name: 'compress:alpha',
        title: 'Compress Alpha',
        description: 'If compressed texture should have alpha.'
    }, {
        name: 'compress:normals',
        title: 'Compress Normals',
        description: 'If the compressed texture should treat pixels as normal data.'
    }, {
        name: 'compress:original',
        title: 'Original Format',
        description: 'Original file format.'
    }, {
        name: 'compress:dxt',
        title: 'DXT (S3 Texture Compression)',
        description: 'S3TC is widely available on Desktop machines. It is very GZIP friendly, download sizes shown are gzip\'ed. It offers two formats available to WebGL: DXT1 and DXT5. Second has extra alpha available and is twice bigger than DXT1. Texture must be power of two resolution. Compression is Lossy and does leak RGB channel values.'
    }, {
        name: 'compress:pvr',
        title: 'PVTC (PowerVR Texture Compression)',
        description: 'Widely available on iOS devices. It is very GZIP friendly, download sizes shown are gzip\'ed. Version 1 of compresison offers four formats to WebGL, differs in BPP and extra Alpha channel. Texture resolution must be square and power of two otherwise will be upscaled to nearest pot square. This format allows to store alpha. Compression is Lossy and does leak RGB channel values, as well as Alpha channel but much less than RGB.'
    }, {
        name: 'compress:pvrBpp',
        title: 'PVR Bits Per Pixel',
        description: 'Bits Per Pixel to store. With options to store 2 or 4 bits per pixel. 2bpp is twice smaller with worse quality.'
    }, {
        name: 'compress:etc',
        title: 'ETC (Ericsson Texture Compression)',
        description: 'This format covers well some Android devices as well as Destop. It is very GZIP friendly, download sizes shown are gzip\'ed. WebGL exposes support for ETC1 only whcih only stores RGB so this format is not available for storing Alpha channel. It is Lossy and suffers from RGB channel leaking.'
    }, {
        name: 'compress:quality',
        title: 'Compression quality',
        description: 'Set the compression quality for the texture.'
    }];

    for (let i = 0; i < fields.length; i++) {
        fields[i].name = 'asset:texture:' + (fields[i].name || fields[i].title);
        editor.call('attributes:reference:add', fields[i]);
    }
});
