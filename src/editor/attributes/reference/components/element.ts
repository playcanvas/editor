import type { AttributeReference } from '../reference.type.ts';

export const fields: AttributeReference[]  = [{
    name: 'element:component',
    title: 'pc.ElementComponent',
    subTitle: '{pc.Component}',
    description: '',
    url: 'https://api.playcanvas.com/engine/classes/ElementComponent.html'
}, {
    name: 'element:type',
    title: 'type',
    subTitle: '{String}',
    description: 'The type of the Element.',
    url: 'https://api.playcanvas.com/engine/classes/ElementComponent.html#type'
}, {
    name: 'element:preset',
    title: 'preset',
    subTitle: 'Anchor / Pivot preset',
    description: 'Quickly change the anchor and the pivot of the Element to common presets.'
}, {
    name: 'element:anchor',
    title: 'anchor',
    subTitle: '{pc.Vec4}',
    description: 'The left, bottom, right and top anchors of the Element. These range from 0 to 1. If the horizontal or vertical anchors are split (not equal) then the Element will grow to fill the difference.',
    url: 'https://api.playcanvas.com/engine/classes/ElementComponent.html#anchor'
}, {
    name: 'element:pivot',
    title: 'pivot',
    subTitle: '{pc.Vec2}',
    description: 'The origin of the Element. Rotation and scaling is done based on the pivot.',
    url: 'https://api.playcanvas.com/engine/classes/ElementComponent.html#pivot'
}, {
    name: 'element:text',
    title: 'text',
    subTitle: '{String}',
    description: 'The text content of the Element. Hit Shift+Enter to add new lines.',
    url: 'https://api.playcanvas.com/engine/classes/ElementComponent.html#text'
}, {
    name: 'element:key',
    title: 'key',
    subTitle: '{String}',
    description: 'The localization key of the Element. Hit Shift+Enter to add new lines.',
    url: 'https://api.playcanvas.com/engine/classes/ElementComponent.html#key'
}, {
    name: 'element:localized',
    title: 'Localized',
    description: 'Enable this to set the localization key of the Element. The localization key will be used to get the translation of the element\'s text at runtime.'
}, {
    name: 'element:fontAsset',
    title: 'fontAsset',
    subTitle: '{pc.Asset}',
    description: 'The font asset used by the Element.',
    url: 'https://api.playcanvas.com/engine/classes/ElementComponent.html#fontasset'
}, {
    name: 'element:textureAsset',
    title: 'textureAsset',
    subTitle: '{pc.Asset}',
    description: 'The texture to be used by the Element.',
    url: 'https://api.playcanvas.com/engine/classes/ElementComponent.html#textureasset'
}, {
    name: 'element:spriteAsset',
    title: 'spriteAsset',
    subTitle: '{pc.Asset}',
    description: 'The sprite to be used by the Element.',
    url: 'https://api.playcanvas.com/engine/classes/ElementComponent.html#spriteasset'
}, {
    name: 'element:spriteFrame',
    title: 'spriteFrame',
    subTitle: '{Number}',
    description: 'The frame from the Sprite Asset to render.',
    url: 'https://api.playcanvas.com/engine/classes/ElementComponent.html#spriteframe'
}, {
    name: 'element:pixelsPerUnit',
    title: 'pixelsPerUnit',
    subTitle: '{Number}',
    description: 'The number of pixels that correspond to one PlayCanvas unit. Used when using 9 Sliced Sprite Assets to control the thickness of the borders. If this value is not specified the Element component will use the pixelsPerUnit value from the Sprite Asset.',
    url: 'https://api.playcanvas.com/engine/classes/ElementComponent.html#pixelsperunit'
}, {
    name: 'element:materialAsset',
    title: 'materialAsset',
    subTitle: '{pc.Asset}',
    description: 'The material to be used by the element.',
    url: 'https://api.playcanvas.com/engine/classes/ElementComponent.html#materialasset'
}, {
    name: 'element:fitMode',
    title: 'fitMode',
    subTitle: '{String}',
    description: 'Set how the content should be fitted and preserve the aspect ratio of the source texture or sprite. Use \'Stretch\' to always stretch the content to fit the entire Element; Use \'Contain\' to resize the content to fit within this Element\'s bounding box; Use \'Cover\' to cover the entire Element\'s bounding box.',
    url: 'https://api.playcanvas.com/engine/classes/ElementComponent.html#fitmode'
}, {
    name: 'element:autoWidth',
    title: 'autoWidth',
    subTitle: '{Boolean}',
    description: 'Make the width of the element match the width of the text content automatically.',
    url: 'https://api.playcanvas.com/engine/classes/ElementComponent.html#autowidth'
}, {
    name: 'element:autoHeight',
    title: 'autoHeight',
    subTitle: '{Boolean}',
    description: 'Make the height of the element match the height of the text content automatically.',
    url: 'https://api.playcanvas.com/engine/classes/ElementComponent.html#autoheight'
}, {
    name: 'element:autoFitWidth',
    title: 'autoFitWidth',
    subTitle: '{Boolean}',
    description: 'If enabled then the font size and the line height of the Element will scale automatically so that it fits the Element\'s width. The value of this field will be ignored if autoWidth is enabled. The font size will scale between the values of minFontSize and fontSize. The lineHeight will scale proportionately.',
    url: 'https://api.playcanvas.com/engine/classes/ElementComponent.html#autofitwidth'
}, {
    name: 'element:autoFitHeight',
    title: 'autoFitHeight',
    subTitle: '{Boolean}',
    description: 'If enabled then the font size of the Element will scale automatically so that it fits the Element\'s height. The value of this field will be ignored if autoHeight is enabled. The font size will scale between the values of minFontSize and fontSize. The lineHeight will scale proportionately.',
    url: 'https://api.playcanvas.com/engine/classes/ElementComponent.html#autofitheight'
}, {
    name: 'element:autoHeight',
    title: 'autoHeight',
    subTitle: '{Boolean}',
    description: 'Make the height of the element match the height of the text content automatically.',
    url: 'https://api.playcanvas.com/engine/classes/ElementComponent.html#autoheight'
}, {
    name: 'element:size',
    title: 'size',
    subTitle: 'width / height {Number}',
    description: 'The width and height of the Element. You can only edit the width or the height if the corresponding anchors of the Element are not split.',
    url: 'https://api.playcanvas.com/engine/classes/ElementComponent.html#width'
}, {
    name: 'element:width',
    title: 'width',
    description: 'The width of the Element. You can only edit the width if the corresponding anchors of the Element are not split.',
    url: 'https://api.playcanvas.com/engine/classes/ElementComponent.html#width'
}, {
    name: 'element:height',
    title: 'height',
    description: 'The height of the Element. You can only edit the height if the corresponding anchors of the Element are not split.',
    url: 'https://api.playcanvas.com/engine/classes/ElementComponent.html#height'
}, {
    name: 'element:margin',
    title: 'margin',
    subTitle: 'margin {pc.Vec4}',
    description: 'Controls the spacing between each edge of the Element and the respective anchor. You can only edit the margin if the related anchors are split.',
    url: 'https://api.playcanvas.com/engine/classes/ElementComponent.html#margin'
}, {
    name: 'element:alignment',
    title: 'alignment',
    subTitle: 'alignment {pc.Vec2}',
    description: 'Controls the horizontal and vertical alignment of the text relative to its element transform.',
    url: 'https://api.playcanvas.com/engine/classes/ElementComponent.html#alignment'
}, {
    name: 'element:rect',
    title: 'rect',
    subTitle: '{pc.Vec4}',
    description: 'The u, v, width and height of the rectangle that represents the portion of the texture that this image maps to.',
    url: 'https://api.playcanvas.com/engine/classes/ElementComponent.html#rect'
}, {
    name: 'element:fontSize',
    title: 'fontSize',
    subTitle: '{Number}',
    description: 'The size of the font used by the Element. When autoFitWidth or autoFitHeight are true then it scales between minFontSize and maxFontSize depending on the size of the Element.',
    url: 'https://api.playcanvas.com/engine/classes/ElementComponent.html#fontsize'
}, {
    name: 'element:minFontSize',
    title: 'minFontSize',
    subTitle: '{Number}',
    description: 'The minimum size of the font that the Element can scale to when using autoFitWidth or autoFitHeight.',
    url: 'https://api.playcanvas.com/engine/classes/ElementComponent.html#fontsize'
}, {
    name: 'element:maxFontSize',
    title: 'maxFontSize',
    subTitle: '{Number}',
    description: 'The maximum size of the font that the Element can scale to when using autoFitWidth or autoFitHeight.',
    url: 'https://api.playcanvas.com/engine/classes/ElementComponent.html#fontsize'
}, {
    name: 'element:lineHeight',
    title: 'lineHeight',
    subTitle: '{Number}',
    description: 'The height of each line of text. If autoFitWidth or autoFitHeight are enabled then the lineHeight will scale with the font.',
    url: 'https://api.playcanvas.com/engine/classes/ElementComponent.html#lineheight'
}, {
    name: 'element:wrapLines',
    title: 'wrapLines',
    subTitle: '{Boolean}',
    description: 'Whether to automatically wrap lines based on the element width.',
    url: 'https://api.playcanvas.com/engine/classes/ElementComponent.html#wraplines'
}, {
    name: 'element:maxLines',
    title: 'maxLines',
    subTitle: '{Number}',
    description: 'The maximum number of lines that this Element can display. Any left-over text will be appended to the last line of the Element. You can delete this value if you wish to have unlimited lines.',
    url: 'https://api.playcanvas.com/engine/classes/ElementComponent.html#maxlines'
}, {
    name: 'element:spacing',
    title: 'spacing',
    subTitle: '{Number}',
    description: 'The spacing between each letter of the text.',
    url: 'https://api.playcanvas.com/engine/classes/ElementComponent.html#spacing'
}, {
    name: 'element:color',
    title: 'color',
    subTitle: '{pc.Color}',
    description: 'The color of the Element.',
    url: 'https://api.playcanvas.com/engine/classes/ElementComponent.html#color'
}, {
    name: 'element:opacity',
    title: 'opacity',
    subTitle: '{Number}',
    description: 'The opacity of the Element.',
    url: 'https://api.playcanvas.com/engine/classes/ElementComponent.html#opacity'
}, {
    name: 'element:useInput',
    title: 'useInput',
    subTitle: '{Boolean}',
    description: 'Enable this if you want the element to receive input events.',
    url: 'https://api.playcanvas.com/engine/classes/ElementComponent.html#useinput'
}, {
    name: 'element:batchGroupId',
    title: 'batchGroupId',
    subTitle: '{Number}',
    description: 'The batch group that this Element belongs to. The engine will attempt to batch Elements in the same batch group to reduce draw calls.',
    url: 'https://api.playcanvas.com/engine/classes/ElementComponent.html#batchgroupid'
}, {
    name: 'element:layers',
    title: 'layers',
    subTitle: '{Number[]}',
    description: 'The layers that this Element belongs to. When an Element belongs to multiple layers it will be rendered multiple times.',
    url: 'https://api.playcanvas.com/engine/classes/ElementComponent.html#layers'
}, {
    name: 'element:outlineColor',
    title: 'outlineColor',
    subTitle: '{pc.Color}',
    description: 'The text outline effect color and opacity.',
    url: 'https://api.playcanvas.com/engine/classes/ElementComponent.html#outlinecolor'
}, {
    name: 'element:outlineThickness',
    title: 'outlineThickness',
    subTitle: '{Number}',
    description: 'The text outline effect width. These range from 0 to 1. To disable outline effect set to 0.',
    url: 'https://api.playcanvas.com/engine/classes/ElementComponent.html#outlinethickness'
}, {
    name: 'element:shadowColor',
    title: 'shadowColor',
    subTitle: '{pc.Color}',
    description: 'The text shadow cast effect color and opacity.',
    url: 'https://api.playcanvas.com/engine/classes/ElementComponent.html#shadowcolor'
}, {
    name: 'element:shadowOffset',
    title: 'shadowOffset',
    subTitle: '{pc.Vec2}',
    description: 'Controls the horizontal and vertical shift of the text shadow cast effect. The rage of both components is form -1 to 1. To disable effect set both to 0.',
    url: 'https://api.playcanvas.com/engine/classes/ElementComponent.html#shadowoffset'
}, {
    name: 'element:enableMarkup',
    title: 'enableMarkup',
    subTitle: '{Boolean}',
    description: 'Flag for enabling markup processing. Only works for text types.',
    url: 'https://api.playcanvas.com/engine/classes/ElementComponent.html#enablemarkup'
}, {
    name: 'element:mask',
    title: 'mask',
    subTitle: '{Boolean}',
    description: 'Switch Image Element into a mask. Masks do not render into the scene, but instead limit child elements to only be rendered where this element is rendered.',
    url: 'https://api.playcanvas.com/engine/classes/ElementComponent.html#mask'
}];
