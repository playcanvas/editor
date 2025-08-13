import type { AttributeReference } from '../reference.type.ts';

export const fields: AttributeReference[]  = [{
    name: 'asset:font:asset',
    title: 'FONT',
    subTitle: '{Font}',
    description: 'A Font that can be used to render text using the Text Component.'
}, {
    name: 'asset:font:intensity',
    title: 'intensity',
    description: 'Intensity is used to boost the value read from the signed distance field, 0 is no boost, 1 is max boost. This can be useful if the font does not render with clean smooth edges with the default intensity or if you are rendering the font at small font sizes.'
}, {
    name: 'asset:font:customRange',
    title: 'CUSTOM CHARACTER RANGE',
    description: 'Add a custom range of characters by entering their Unicode codes in the From and To fields. E.g. to add all basic Latin characters you could enter 0x20 - 0x7e and click the + button.'
}, {
    name: 'asset:font:presets',
    title: 'CHARACTER PRESETS',
    description: 'Click on a character preset to add it to the selected font'
}, {
    name: 'asset:font:characters',
    title: 'CHARACTERS',
    description: 'All the characters that should be included in the runtime font asset. Note that in order for a character to be included in the runtime font, it must be supported by the source font. Click Process Font after you make changes to the characters.'
}, {
    name: 'asset:font:invert',
    title: 'INVERT',
    description: 'Enable this to invert the generated font texture. Click Process Font after changing this option.'
}, {
    name: 'asset:font:pxrange',
    title: 'MULTI-CHANNEL SIGNED DISTANCE PIXEL RANGE',
    description: 'Specifies the width of the range around each font glyph between the minimum and maximum representable signed distance, in pixels. Click Process Font after changing this option.'
}];
