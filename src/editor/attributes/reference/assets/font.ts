import type { AttributeReference } from '../reference.type';

export const fields: AttributeReference[] = [
    {
        name: 'asset:font:asset',
        title: 'FONT',
        subTitle: '{Font}',
        description: 'A Font that can be used to render text using the Text Component.'
    },
    {
        name: 'asset:font:intensity',
        title: 'intensity',
        description:
            'Intensity is used to boost the value read from the signed distance field, 0 is no boost, 1 is max boost. This can be useful if the font does not render with clean smooth edges with the default intensity or if you are rendering the font at small font sizes.'
    },
    {
        name: 'asset:font:customRange',
        title: 'CUSTOM CHARACTER RANGE',
        description:
            'Add a custom range of characters by entering their Unicode codes in the From and To fields. E.g. to add all basic Latin characters you could enter 0x20 - 0x7e and click the + button.'
    },
    {
        name: 'asset:font:presets',
        title: 'CHARACTER PRESETS',
        description: 'Click on a character preset to add it to the selected font'
    },
    {
        name: 'asset:font:characters',
        title: 'INCLUDED CHARACTERS',
        description:
            'The final set of characters generated into the runtime font. A character must be supported by the source font. Regenerate the font assets after making changes.'
    },
    {
        name: 'asset:font:jsonAsset',
        title: 'JSON',
        description:
            'The JSON asset holding the generated MSDF character data. Repointing this rebuilds the runtime font.'
    },
    {
        name: 'asset:font:textureAssets',
        title: 'TEXTURES',
        description:
            'The MSDF atlas pages, in the order the JSON descriptor indexes them. These textures are reconfigured for MSDF sampling when the font loads (no sRGB, no mipmaps, linear filtering), so avoid pointing them at textures used elsewhere.'
    },
    {
        name: 'asset:font:invert',
        title: 'INVERT TEXTURE ATLAS',
        description: 'Invert the generated font texture. Regenerate the font assets after changing this option.'
    },
    {
        name: 'asset:font:pxrange',
        title: 'MULTI-CHANNEL SIGNED DISTANCE PIXEL RANGE',
        description:
            'Specifies the width of the range around each font glyph between the minimum and maximum representable signed distance, in pixels. Click Process Font after changing this option.'
    }
];
