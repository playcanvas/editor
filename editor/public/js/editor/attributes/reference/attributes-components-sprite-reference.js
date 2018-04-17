editor.once('load', function() {
    'use strict';

    var fields = [{
        name: 'sprite',
        title: 'pc.SpriteComponent',
        subTitle: '{pc.Component}',
        description: 'The Sprite Component enables an Entity to render a simple static Sprite or Sprite Animation Clips.',
        url: 'http://developer.playcanvas.com/api/pc.SpriteComponent.html'
    }, {
        title: 'type',
        subTitle: '{Boolean}',
        description: 'A Sprite Component can either be Simple or Animated. Simple Sprite Components only show a single frame of a Sprite Asset. Animated Sprite Components can play Sprite Animation Clips.',
        url: 'http://developer.playcanvas.com/api/pc.SpriteComponent.html#type'
    }, {
        title: 'color',
        subTitle: '{pc.Color}',
        description: 'The color tint of the Sprite.',
        url: 'http://developer.playcanvas.com/api/pc.SpriteComponent.html#color'
    }, {
        title: 'opacity',
        subTitle: '{Number}',
        description: 'The opacity of the Sprite.',
        url: 'http://developer.playcanvas.com/api/pc.SpriteComponent.html#opacity'
    }, {
        title: 'spriteAsset',
        subTitle: '{pc.Asset}',
        description: 'The Sprite Asset used by the Sprite Component.',
        url: 'http://developer.playcanvas.com/api/pc.SpriteComponent.html#spriteAsset'
    }, {
        title: 'frame',
        subTitle: '{Number}',
        description: 'The frame of the Sprite Asset that the Sprite Component will render.',
        url: 'http://developer.playcanvas.com/api/pc.SpriteComponent.html#frame'
    }, {
        title: 'flipX',
        subTitle: '{Boolean}',
        description: 'Flips the X axis when rendering a Sprite.',
        url: 'http://developer.playcanvas.com/api/pc.SpriteComponent.html#flipX'
    }, {
        title: 'flipY',
        subTitle: '{Boolean}',
        description: 'Flips the Y axis when rendering a Sprite.',
        url: 'http://developer.playcanvas.com/api/pc.SpriteComponent.html#flipY'
    }, {
        title: 'size',
        subTitle: 'width / height {Number}',
        description: 'The width and height of the Sprite when rendering using 9-Slicing. The width and height are only used when the render mode of the Sprite Asset is Sliced or Tiled.',
        url: 'http://developer.playcanvas.com/api/pc.SpriteComponent.html#width'
    }, {
        title: 'drawOrder',
        subTitle: '{Number}',
        description: 'The draw order of the sprite. A higher value means that the component will be rendered on top of other components in the same layer. For this work the sprite must be in a layer that uses Manual sort order.',
        url: 'http://developer.playcanvas.com/api/pc.SpriteComponent.html#drawOrder'
    }, {
        title: 'speed',
        subTitle: '{Number}',
        description: 'A global speed modifier used when playing Sprite Animation Clips.',
        url: 'http://developer.playcanvas.com/api/pc.SpriteComponent.html#flipY'
    }, {
        title: 'autoPlayClip',
        subTitle: '{String}',
        description: 'The Sprite Animation Clip to play automatically when the Sprite Component is enabled.',
        url: 'http://developer.playcanvas.com/api/pc.SpriteComponent.html#autoPlayClip'
    }, {
        title: 'batchGroupId',
        subTitle: '{Number}',
        description: 'The batch group that this sprite belongs to. The engine will attempt to batch sprites in the same batch group to reduce draw calls.',
        url: 'http://developer.playcanvas.com/api/pc.SpriteComponent.html#batchGroupId'
    }, {
        name: 'addClip',
        title: 'Add Clip',
        description: 'Add a new Sprite Animation Clip.'
    }, {
        name: 'layers',
        title: 'layers',
        subTitle: '{Number[]}',
        description: 'The layers that this sprite belongs to. When a sprite belongs to multiple layers it will be rendered multiple times.',
        url: 'http://developer.playcanvas.com/api/pc.SpriteComponent.html#layers'
    }];

    for(var i = 0; i < fields.length; i++) {
        fields[i].name = 'sprite:' + (fields[i].name || fields[i].title);
        editor.call('attributes:reference:add', fields[i]);
    }
});
