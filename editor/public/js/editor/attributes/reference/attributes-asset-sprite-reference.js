editor.once('load', function () {
    'use strict';

    var fields = [{
        name: 'sprite',
        title: 'pc.Sprite',
        subTitle: '{Class}',
        description: 'A Sprite Asset can contain one or multiple Frames from a Texture Atlas Asset. It can be used by the Sprite Component or the Element component to render those frames. You can also implement sprite animations by adding multiple Frames to a Sprite Asset.',
        url: 'http://developer.playcanvas.com/api/pc.Sprite.html'
    }, {
        title: 'pixelsPerUnit',
        subTitle: '{Number}',
        description: 'The number of pixels that represent one PlayCanvas unit. You can use this value to change the rendered size of your sprites.',
        url: 'http://developer.playcanvas.com/api/pc.Sprite.html#pixelsPerUnit'
    }, {
        title: 'renderMode',
        subTitle: '{Number}',
        description: 'The render mode of the Sprite Asset. It can be Simple, Sliced or Tiled.',
        url: 'http://developer.playcanvas.com/api/pc.Sprite.html#renderMode'
    }, {
        title: 'textureAtlasAsset',
        subTitle: '{Number}',
        description: 'The Texture Atlas asset that contains all the frames that this Sprite Asset is referencing.',
        url: 'http://developer.playcanvas.com/api/pc.Sprite.html#textureAtlasAsset'
    }];

    // fields reference
    for (var i = 0; i < fields.length; i++) {
        fields[i].name = 'asset:sprite:' + (fields[i].name || fields[i].title);
        editor.call('attributes:reference:add', fields[i]);
    }
});
