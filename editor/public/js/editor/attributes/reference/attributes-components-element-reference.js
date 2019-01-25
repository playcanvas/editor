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
        title: 'key',
        subTitle: '{String}',
        description: 'The localization key of the Element. Hit Shift+Enter to add new lines.',
        url: 'http://developer.playcanvas.com/api/pc.ElementComponent.html#key'
    }, {
        name: 'localized',
        title: 'Localized',
        description: 'Enable this to set the localization key of the Element. The localization key will be used to get the translation of the element\'s text at runtime.'
    }, {
        title: 'fontAsset',
        subTitle: '{pc.Asset}',
        description: 'The font asset used by the Element.',
        url: 'http://developer.playcanvas.com/api/pc.ElementComponent.html#fontAsset'
    }, {
        title: 'textureAsset',
        subTitle: '{pc.Asset}',
        description: 'The texture to be used by the Element.',
        url: 'http://developer.playcanvas.com/api/pc.ElementComponent.html#textureAsset'
    }, {
        title: 'spriteAsset',
        subTitle: '{pc.Asset}',
        description: 'The sprite to be used by the Element.',
        url: 'http://developer.playcanvas.com/api/pc.ElementComponent.html#spriteAsset'
    }, {
        title: 'spriteFrame',
        subTitle: '{Number}',
        description: 'The frame from the Sprite Asset to render.',
        url: 'http://developer.playcanvas.com/api/pc.ElementComponent.html#spriteFrame'
    }, {
        title: 'pixelsPerUnit',
        subTitle: '{Number}',
        description: 'The number of pixels that correspond to one PlayCanvas unit. Used when using 9 Sliced Sprite Assets to control the thickness of the borders. If this value is not specified the Element component will use the pixelsPerUnit value from the Sprite Asset.',
        url: 'http://developer.playcanvas.com/api/pc.ElementComponent.html#pixelsPerUnit'
    }, {
        title: 'materialAsset',
        subTitle: '{pc.Asset}',
        description: 'The material to be used by the element.',
        url: 'http://developer.playcanvas.com/api/pc.ElementComponent.html#materialAsset'
    }, {
        title: 'autoWidth',
        subTitle: '{Booelan}',
        description: 'Make the width of the element match the width of the text content automatically.',
        url: 'http://developer.playcanvas.com/api/pc.ElementComponent.html#autoWidth'
    }, {
        title: 'autoHeight',
        subTitle: '{Booelan}',
        description: 'Make the height of the element match the height of the text content automatically.',
        url: 'http://developer.playcanvas.com/api/pc.ElementComponent.html#autoHeight'
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
        description: 'The height of each line of text.',
        url: 'http://developer.playcanvas.com/api/pc.ElementComponent.html#lineHeight'
    }, {
        title: 'wrapLines',
        subTitle: '{Boolean}',
        description: 'Whether to automatically wrap lines based on the element width.',
        url: 'http://developer.playcanvas.com/api/pc.ElementComponent.html#wrapLines'
    }, {
        title: 'spacing',
        subTitle: '{Number}',
        description: 'The spacing between each letter of the text.',
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
    }, {
        title: 'useInput',
        subTitle: '{Boolean}',
        description: 'Enable this if you want the element to receive input events.',
        url: 'http://developer.playcanvas.com/api/pc.ElementComponent.html#useInput'
    }, {
        title: 'batchGroupId',
        subTitle: '{Number}',
        description: 'The batch group that this Element belongs to. The engine will attempt to batch Elements in the same batch group to reduce draw calls.',
        url: 'http://developer.playcanvas.com/api/pc.ElementComponent.html#batchGroupId'
    }, {
        name: 'layers',
        title: 'layers',
        subTitle: '{Number[]}',
        description: 'The layers that this Element belongs to. When an Element belongs to multiple layers it will be rendered multiple times.',
        url: 'http://developer.playcanvas.com/api/pc.ElementComponent.html#layers'
    }, {
        title: 'outlineColor',
        subTitle: '{pc.Color}',
        description: 'The text outline effect color and opacity.',
        url: 'http://developer.playcanvas.com/api/pc.ElementComponent.html#outlineColor'
    }, {
        title: 'outlineThickness',
        subTitle: '{Number}',
        description: 'The text outline effect width. These range from 0 to 1. To disable outline effect set to 0.',
        url: 'http://developer.playcanvas.com/api/pc.ElementComponent.html#outlineThickness'
    }, {
        title: 'shadowColor',
        subTitle: '{pc.Color}',
        description: 'The text shadow cast effect color and opacity.',
        url: 'http://developer.playcanvas.com/api/pc.ElementComponent.html#shadowColor'
    }, {
        title: 'shadowOffset',
        subTitle: '{pc.Vec2}',
        description: 'Controls the horizontal and vertical shift of the text shadow cast effect. The rage of both components is form -1 to 1. To disable effect set both to 0.',
        url: 'http://developer.playcanvas.com/api/pc.ElementComponent.html#shadowOffset'
    }];

    for(var i = 0; i < fields.length; i++) {
        fields[i].name = 'element:' + (fields[i].name || fields[i].title);
        editor.call('attributes:reference:add', fields[i]);
    }
});
