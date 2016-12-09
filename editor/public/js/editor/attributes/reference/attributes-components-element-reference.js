editor.once('load', function() {
    'use strict';

    var fields = [{
        name: 'component',
        title: 'pc.ElementComponent',
        subTitle: '{pc.Component}',
        description: 'TODO',
        url: 'http://developer.playcanvas.com/api/pc.ElementComponent.html'
    }, {
        title: 'type',
        subTitle: '{String}',
        description: 'TODO',
        url: 'http://developer.playcanvas.com/api/pc.ElementComponent.html#type'
    }, {
        title: 'anchor',
        subTitle: '{pc.Vec4}',
        description: 'TODO',
        url: 'http://developer.playcanvas.com/api/pc.ElementComponent.html#anchor'
    }, {
        title: 'pivot',
        subTitle: '{pc.Vec2}',
        description: 'TODO',
        url: 'http://developer.playcanvas.com/api/pc.ElementComponent.html#pivot'
    }, {
        title: 'text',
        subTitle: '{String}',
        description: 'TODO',
        url: 'http://developer.playcanvas.com/api/pc.ElementComponent.html#text'
    }, {
        title: 'fontAsset',
        subTitle: '{pc.Asset}',
        description: 'TODO',
        url: 'http://developer.playcanvas.com/api/pc.ElementComponent.html#fontAsset'
    }, {
        title: 'textureAsset',
        subTitle: '{pc.Asset}',
        description: 'TODO',
        url: 'http://developer.playcanvas.com/api/pc.ElementComponent.html#textureAsset'
    }, {
        title: 'materialAsset',
        subTitle: '{pc.Asset}',
        description: 'TODO',
        url: 'http://developer.playcanvas.com/api/pc.ElementComponent.html#materialAsset'
    }, {
        title: 'size',
        subTitle: 'width / height {Number}',
        description: 'TODO',
        url: 'http://developer.playcanvas.com/api/pc.ElementComponent.html#width'
    }, {
        title: 'height',
        subTitle: '{Number}',
        description: 'TODO',
        url: 'http://developer.playcanvas.com/api/pc.ElementComponent.html#height'
    }, {
        title: 'rect',
        subTitle: '{pc.Vec4}',
        description: 'TODO',
        url: 'http://developer.playcanvas.com/api/pc.ElementComponent.html#rect'
    }, {
        title: 'fontSize',
        subTitle: '{Number}',
        description: 'TODO',
        url: 'http://developer.playcanvas.com/api/pc.ElementComponent.html#fontSize'
    }, {
        title: 'lineHeight',
        subTitle: '{Number}',
        description: 'TODO',
        url: 'http://developer.playcanvas.com/api/pc.ElementComponent.html#lineHeight'
    }, {
        title: 'spacing',
        subTitle: '{Number}',
        description: 'TODO',
        url: 'http://developer.playcanvas.com/api/pc.ElementComponent.html#spacing'
    }, {
        title: 'color',
        subTitle: '{pc.Color}',
        description: 'TODO',
        url: 'http://developer.playcanvas.com/api/pc.ElementComponent.html#color'
    }, {
        title: 'opacity',
        subTitle: '{Number}',
        description: 'TODO',
        url: 'http://developer.playcanvas.com/api/pc.ElementComponent.html#opacity'
    }];

    for(var i = 0; i < fields.length; i++) {
        fields[i].name = 'element:' + (fields[i].name || fields[i].title);
        editor.call('attributes:reference:add', fields[i]);
    }
});
