import type { AttributeReference } from '../reference.type';

export const fields: AttributeReference[]  = [{
    name: 'asset:texture:asset',
    title: 'pc.Texture',
    subTitle: '{Class}',
    description: 'Textures assets are image files which are used as part of a material to give a 3D model a realistic appearance.',
    url: 'https://api.playcanvas.com/engine/classes/Texture.html'
}, {
    name: 'asset:texture:dimensions',
    title: 'width / height',
    subTitle: '{Number}',
    description: 'The width and height of the texture.',
    url: 'https://api.playcanvas.com/engine/classes/Texture.html#width'
}, {
    name: 'asset:texture:magFilter',
    title: 'magFilter',
    subTitle: '{pc.FILTER_*}',
    description: 'The magnification filter to be applied to the texture.',
    url: 'https://api.playcanvas.com/engine/classes/Texture.html#magfilter'
}, {
    name: 'asset:texture:mipFilter',
    title: 'mipFilter',
    subTitle: '{pc.FILTER_*}',
    description: 'The minification mipmap filter to be applied to the texture.',
    url: 'https://api.playcanvas.com/engine/classes/Texture.html#mipfilter'
}, {
    name: 'asset:texture:minFilter',
    title: 'minFilter',
    subTitle: '{pc.FILTER_*}',
    description: 'The minification filter to be applied to the texture.',
    url: 'https://api.playcanvas.com/engine/classes/Texture.html#minfilter'
}, {
    name: 'asset:texture:addressU',
    title: 'addressU',
    subTitle: '{pc.ADDRESS_*}',
    description: `The horizontal (U) addressing mode for texture coordinates outside 0-1.
<ul>
<li><b>Repeat</b> (<code>pc.ADDRESS_REPEAT</code>): Texture tiles/repeats infinitely.</li>
<li><b>Clamp</b> (<code>pc.ADDRESS_CLAMP_TO_EDGE</code>): Texture edge pixels are stretched.</li>
<li><b>Mirror Repeat</b> (<code>pc.ADDRESS_MIRRORED_REPEAT</code>): Texture tiles with alternating mirroring.</li>
</ul>`,
    url: 'https://api.playcanvas.com/engine/classes/Texture.html#addressu'
}, {
    name: 'asset:texture:addressV',
    title: 'addressV',
    subTitle: '{pc.ADDRESS_*}',
    description: `The vertical (V) addressing mode for texture coordinates outside 0-1.
<ul>
<li><b>Repeat</b> (<code>pc.ADDRESS_REPEAT</code>): Texture tiles/repeats infinitely.</li>
<li><b>Clamp</b> (<code>pc.ADDRESS_CLAMP_TO_EDGE</code>): Texture edge pixels are stretched.</li>
<li><b>Mirror Repeat</b> (<code>pc.ADDRESS_MIRRORED_REPEAT</code>): Texture tiles with alternating mirroring.</li>
</ul>`,
    url: 'https://api.playcanvas.com/engine/classes/Texture.html#addressv'
}, {
    name: 'asset:texture:anisotropy',
    title: 'anisotropy',
    subTitle: '{Number}',
    description: 'Integer value specifying the level of anisotropic to apply to the texture ranging from 1 (no anisotropic filtering) to the pc.GraphicsDevice property maxAnisotropy.',
    url: 'https://api.playcanvas.com/engine/classes/Texture.html#anisotropy'
}, {
    name: 'asset:texture:width',
    title: 'width',
    subTitle: '{Number}',
    description: 'The width of the base mip level in pixels.',
    url: 'https://api.playcanvas.com/engine/classes/Texture.html#width'
}, {
    name: 'asset:texture:height',
    title: 'height',
    subTitle: '{Number}',
    description: 'The height of the base mip level in pixels.',
    url: 'https://api.playcanvas.com/engine/classes/Texture.html#height'
}, {
    name: 'asset:texture:depth',
    title: 'depth',
    description: 'Bits per pixel.'
}, {
    name: 'asset:texture:alpha',
    title: 'alpha',
    description: 'If picture has alpha data.'
}, {
    name: 'asset:texture:interlaced',
    title: 'interlaced',
    description: 'If picture is Interlaced. This picture (PNG, JPG) format feature is unavailable for WebGL but is available for use in DOM, making pictures to appear before fully loaded, and load progressively.'
}, {
    name: 'asset:texture:rgbm',
    title: 'rgbm',
    description: 'Specifies whether the texture contains RGBM-encoded HDR data. Mutually exclusive with sRGB. Defaults to false.'
}, {
    name: 'asset:texture:srgb',
    title: 'srgb',
    description: 'Specifies whether the texture is sRGB (standard RGB) or not. Texture representing colors (albedo, emissive, specular, sheen) should have this enabled, while other textures (normal, roughness, occlusion, ...) should be this disabled. Mutually exclusive with RGBM. Defaults to true.'
}, {
    name: 'asset:texture:filtering',
    title: 'filtering',
    subTitle: '{pc.FILTER_*}',
    description: `Controls how the texture is sampled when magnified or minified.
<ul>
<li><b>Point</b> (<code>pc.FILTER_NEAREST</code>): No filtering, nearest pixel is used. Sharp pixels, good for retro/pixel art.</li>
<li><b>Linear</b> (<code>pc.FILTER_LINEAR</code>): Bilinear filtering, smooth interpolation between pixels.</li>
</ul>`,
    url: 'https://api.playcanvas.com/engine/classes/Texture.html#magfilter'
}, {
    name: 'asset:texture:compression',
    title: 'Compression',
    description: 'Compressed textures load faster and consume much less VRAM on GPU allowing texture intense applications to have bigger scale.'
}, {
    name: 'asset:texture:compress:alpha',
    title: 'Compress Alpha',
    description: 'If compressed texture should have alpha.'
}, {
    name: 'asset:texture:compress:normals',
    title: 'Compress Normals',
    description: 'If the compressed texture should treat pixels as normal data.'
}, {
    name: 'asset:texture:compress:original',
    title: 'Original Format',
    description: 'Original file format.'
}, {
    name: 'asset:texture:compress:dxt',
    title: 'DXT (S3 Texture Compression)',
    description: 'S3TC is widely available on Desktop machines. It is very GZIP friendly, download sizes shown are gzip\'ed. It offers two formats available to WebGL: DXT1 and DXT5. Second has extra alpha available and is twice bigger than DXT1. Texture must be power of two resolution. Compression is Lossy and does leak RGB channel values.'
}, {
    name: 'asset:texture:compress:pvr',
    title: 'PVTC (PowerVR Texture Compression)',
    description: 'Widely available on iOS devices. It is very GZIP friendly, download sizes shown are gzip\'ed. Version 1 of compression offers four formats to WebGL, differs in BPP and extra Alpha channel. Texture resolution must be square and power of two otherwise will be upscaled to nearest pot square. This format allows to store alpha. Compression is Lossy and does leak RGB channel values, as well as Alpha channel but much less than RGB.'
}, {
    name: 'asset:texture:compress:pvrBpp',
    title: 'PVR Bits Per Pixel',
    description: 'Bits Per Pixel to store. With options to store 2 or 4 bits per pixel. 2bpp is twice smaller with worse quality.'
}, {
    name: 'asset:texture:compress:etc',
    title: 'ETC (Ericsson Texture Compression)',
    description: 'This format covers well some Android devices as well as Desktop. It is very GZIP friendly, download sizes shown are gzip\'ed. WebGL exposes support for ETC1 only which only stores RGB so this format is not available for storing Alpha channel. It is Lossy and suffers from RGB channel leaking.'
}, {
    name: 'asset:texture:compress:compressionMode',
    title: 'Compression Mode',
    description: `Set the compression mode for the Basis texture.
<ul>
<li><b>ETC (smaller size, lower quality)</b>: Generates a smaller Basis file but with lower visual quality.</li>
<li><b>ASTC (larger size, higher quality)</b>: Generates a larger Basis file but with higher visual quality.</li>
</ul>`
}, {
    name: 'asset:texture:compress:quality',
    title: 'Compression Quality',
    description: `Set the compression quality for the Basis texture. Higher quality looks better but takes longer to compress and generates larger files.
<ul>
<li><b>Lowest</b>: Fastest compression, smallest file, lowest quality.</li>
<li><b>Low</b>: Fast compression with low quality.</li>
<li><b>Default</b>: Balanced compression time and quality.</li>
<li><b>High</b>: Slower compression with higher quality.</li>
<li><b>Highest</b>: Slowest compression, largest file, best quality.</li>
</ul>`
}];
