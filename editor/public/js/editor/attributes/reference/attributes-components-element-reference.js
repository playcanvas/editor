editor.once('load', function() {
    'use strict';

    var fields = [{
        name: 'component',
        title: 'pc.ElementComponent',
        subTitle: '{pc.Component}',
        description: '',
        url: 'http://developer.playcanvas.com/api/pc.ElementComponent.html'
    }, {
        title: 'type',
        subTitle: '{String}',
        description: 'The type of the Element.',
        url: 'http://developer.playcanvas.com/api/pc.ElementComponent.html#type'
    }, {
        title: 'preset',
        subTitle: 'Anchor / Pivot preset',
        description: 'Quickly change the anchor and the pivot of the Element to common presets.'
    }, {
        title: 'anchor',
        subTitle: '{pc.Vec4}',
        description: 'The left, bottom, right and top anchors of the Element. These range from 0 to 1. If the horizontal or vertical anchors are split (not equal) then the Element will grow to fill the difference.',
        url: 'http://developer.playcanvas.com/api/pc.ElementComponent.html#anchor'
    }, {
        title: 'pivot',
        subTitle: '{pc.Vec2}',
        description: 'The origin of the Element. Rotation and scaling is done based on the pivot.',
        url: 'http://developer.playcanvas.com/api/pc.ElementComponent.html#pivot'
    }, {
        title: 'text',
        subTitle: '{String}',
        description: 'The text content of the Element. Hit Shift+Enter to add new lines.',
        url: 'http://developer.playcanvas.com/api/pc.ElementComponent.html#text'
    }, {
        title: 'fontAsset',
        subTitle: '{pc.Asset}',
        description: 'The font asset used by the Element.',
        url: 'http://developer.playcanvas.com/api/pc.ElementComponent.html#fontAsset'
    }, {
        title: 'textureAsset',
        subTitle: '{pc.Asset}',
        description: 'The texture used by the Element.',
        url: 'http://developer.playcanvas.com/api/pc.ElementComponent.html#textureAsset'
    }, {
        title: 'materialAsset',
        subTitle: '{pc.Asset}',
        description: 'The material used by the element.',
        url: 'http://developer.playcanvas.com/api/pc.ElementComponent.html#materialAsset'
    }, {
        title: 'size',
        subTitle: 'width / height {Number}',
        description: 'The width and height of the Element. You can only edit the width or the height if the corresponding anchors of the Element are not split.',
        url: 'http://developer.playcanvas.com/api/pc.ElementComponent.html#width'
    }, {
        title: 'margin',
        subTitle: 'margin {pc.Vec4}',
        description: 'Controls the spacing between each edge of the Element and the respective anchor. You can only edit the margin if the related anchors are split.',
        url: 'http://developer.playcanvas.com/api/pc.ElementComponent.html#margin'
    }, {
        title: 'alignment',
        subTitle: 'alignment {pc.Vec2}',
        description: 'Controls the horizontal and vertical alignment of the text relative to its element transform.',
        url: 'http://developer.playcanvas.com/api/pc.ElementComponent.html#alignment'
    }, {
        title: 'rect',
        subTitle: '{pc.Vec4}',
        description: 'The u, v, width and height of the rectangle that represents the portion of the texture that this image maps to.',
        url: 'http://developer.playcanvas.com/api/pc.ElementComponent.html#rect'
    }, {
        title: 'fontSize',
        subTitle: '{Number}',
        description: 'The size of the font used by the Element.',
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
        description: 'The color of the Element.',
        url: 'http://developer.playcanvas.com/api/pc.ElementComponent.html#color'
    }, {
        title: 'opacity',
        subTitle: '{Number}',
        description: 'The opacity of the Element.',
        url: 'http://developer.playcanvas.com/api/pc.ElementComponent.html#opacity'
    }];

    for(var i = 0; i < fields.length; i++) {
        fields[i].name = 'element:' + (fields[i].name || fields[i].title);
        editor.call('attributes:reference:add', fields[i]);
    }
});
