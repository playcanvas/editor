import type { AttributeReference } from '../reference.type';

export const fields: AttributeReference[]  = [{
    name: 'light:component',
    title: 'pc.LightComponent',
    subTitle: '{pc.Component}',
    description: 'The Light Component enables the Entity to light the scene.',
    url: 'https://api.playcanvas.com/engine/classes/LightComponent.html'
}, {
    name: 'light:isStatic',
    title: 'isStatic',
    subTitle: '{Boolean}',
    description: 'Mark light as non-movable (optimization).',
    url: 'https://api.playcanvas.com/engine/classes/LightComponent.html#isstatic'
}, {
    name: 'light:castShadows',
    title: 'castShadows',
    subTitle: '{Boolean}',
    description: 'If checked, the light will cause shadow casting models to cast shadows.',
    url: 'https://api.playcanvas.com/engine/classes/LightComponent.html#castshadows'
}, {
    name: 'light:color',
    title: 'color',
    subTitle: '{pc.Color}',
    description: 'The color of the emitted light.',
    url: 'https://api.playcanvas.com/engine/classes/LightComponent.html#color'
}, {
    name: 'light:falloffMode',
    title: 'falloffMode',
    subTitle: '{pc.LIGHTFALLOFF_*}',
    description: `Controls the rate at which a light attenuates from its position.
<ul>
<li><b>Linear</b> (<code>pc.LIGHTFALLOFF_LINEAR</code>): Light intensity decreases linearly with distance.</li>
<li><b>Inverse Squared</b> (<code>pc.LIGHTFALLOFF_INVERSESQUARED</code>): Physically accurate falloff where intensity decreases with the square of distance.</li>
</ul>`,
    url: 'https://api.playcanvas.com/engine/classes/LightComponent.html#falloffmode'
}, {
    name: 'light:innerConeAngle',
    title: 'innerConeAngle',
    subTitle: '{Number}',
    description: 'The angle at which the spotlight cone starts to fade off. The angle is specified in degrees. Affects spot lights only.',
    url: 'https://api.playcanvas.com/engine/classes/LightComponent.html#innerconeangle'
}, {
    name: 'light:outerConeAngle',
    title: 'outerConeAngle',
    subTitle: '{Number}',
    description: 'The angle at which the spotlight cone has faded to nothing. The angle is specified in degrees. Affects spot lights only.',
    url: 'https://api.playcanvas.com/engine/classes/LightComponent.html#outerconeangle'
}, {
    name: 'light:shape',
    title: 'shape',
    subTitle: '{pc.LIGHTSHAPE_*}',
    description: 'The shape of the light source',
    url: 'https://api.playcanvas.com/engine/classes/LightComponent.html#shape'
}, {
    name: 'light:intensity',
    title: 'intensity',
    subTitle: '{Number}',
    description: 'The intensity of the light, this acts as a scalar value for the light\'s color. This value can exceed 1.',
    url: 'https://api.playcanvas.com/engine/classes/LightComponent.html#intensity'
}, {
    name: 'light:normalOffsetBias',
    title: 'normalOffsetBias',
    subTitle: '{Number}',
    description: 'Normal offset depth bias.',
    url: 'https://api.playcanvas.com/engine/classes/LightComponent.html#normaloffsetbias'
}, {
    name: 'light:range',
    title: 'range',
    subTitle: '{Number}',
    description: 'The distance from the spotlight source at which its contribution falls to zero.',
    url: 'https://api.playcanvas.com/engine/classes/LightComponent.html#range'
}, {
    name: 'light:shadowBias',
    title: 'shadowBias',
    subTitle: '{Number}',
    description: 'Constant depth offset applied to a shadow map that enables the tuning of shadows in order to eliminate rendering artifacts, namely \'shadow acne\' and \'peter-panning\'.',
    url: 'https://api.playcanvas.com/engine/classes/LightComponent.html#shadowbias'
}, {
    name: 'light:shadowDistance',
    title: 'shadowDistance',
    subTitle: '{Number}',
    description: 'The shadow distance is the maximum distance from the camera beyond which shadows that come from Directional Lights are no longer visible. Smaller values produce more detailed shadows. The closer the limit the less shadow data has to be mapped to, and represented by, any shadow map; shadow map pixels are mapped spatially and so the less distance the shadow map has to cover, the smaller the pixels and so the more resolution any shadow has.',
    url: 'https://api.playcanvas.com/engine/classes/LightComponent.html#shadowdistance'
}, {
    name: 'light:shadowIntensity',
    title: 'shadowIntensity',
    subTitle: '{Number}',
    description: 'The intensity of the shadow darkening, 1 being shadows are entirely black.',
    url: 'https://api.playcanvas.com/engine/classes/LightComponent.html#shadowintensity'
}, {
    name: 'light:numCascades',
    title: 'numCascades',
    subTitle: '{Number}',
    description: 'Number of shadow cascades.',
    url: 'https://api.playcanvas.com/engine/classes/LightComponent.html#numcascades'
}, {
    name: 'light:cascadeDistribution',
    title: 'cascadeDistribution',
    subTitle: '{Number}',
    description: 'The distribution of subdivision of the camera frustum for individual shadow cascades.',
    url: 'https://api.playcanvas.com/engine/classes/LightComponent.html#cascadedistribution'
}, {
    name: 'light:shadowResolution',
    title: 'shadowResolution',
    subTitle: '{Number}',
    description: 'The size of the texture used for the shadow map.',
    url: 'https://api.playcanvas.com/engine/classes/LightComponent.html#shadowresolution'
}, {
    name: 'light:type',
    title: 'type',
    subTitle: '{String}',
    description: `The type of light.
<ul>
<li><b>Directional</b> (<code>"directional"</code>): Simulates sunlight. Casts parallel rays across the entire scene.</li>
<li><b>Omni</b> (<code>"point"</code>): Emits light in all directions from a single point, like a light bulb.</li>
<li><b>Spot</b> (<code>"spot"</code>): Emits light in a cone shape, like a flashlight or stage light.</li>
</ul>`,
    url: 'https://api.playcanvas.com/engine/classes/LightComponent.html#type'
}, {
    name: 'light:affectDynamic',
    title: 'affectDynamic',
    subTitle: '{Boolean}',
    description: 'If enabled the light will affect non-lightmapped objects.',
    url: 'https://api.playcanvas.com/engine/classes/LightComponent.html#affectdynamic'
}, {
    name: 'light:affectLightmapped',
    title: 'affectLightmapped',
    subTitle: '{Boolean}',
    description: 'If enabled the light will affect lightmapped objects.',
    url: 'https://api.playcanvas.com/engine/classes/LightComponent.html#affectlightmapped'
}, {
    name: 'light:affectSpecularity',
    title: 'affectSpecularity',
    subTitle: '{Boolean}',
    description: 'If enabled the material specularity will be affected by this light. Affects directional lights only.',
    url: 'https://api.playcanvas.com/engine/classes/LightComponent.html#affectspecularity'
}, {
    name: 'light:bake',
    title: 'bake',
    subTitle: '{Boolean}',
    description: 'If enabled the light will be rendered into lightmaps.',
    url: 'https://api.playcanvas.com/engine/classes/LightComponent.html#bake'
}, {
    name: 'light:bakeNumSamples',
    title: 'bakeNumSamples',
    subTitle: '{number}',
    description: 'Number of samples used to bake this light into the lightmap.',
    url: 'https://api.playcanvas.com/engine/classes/LightComponent.html#bakenumsamples'
}, {
    name: 'light:bakeArea',
    title: 'bakeArea',
    subTitle: '{number}',
    description: 'Penumbra angle in degrees, allowing a soft shadow boundary.',
    url: 'https://api.playcanvas.com/engine/classes/LightComponent.html#bakearea'
}, {
    name: 'light:bakeDir',
    title: 'bakeDir',
    subTitle: '{Boolean}',
    description: 'If enabled and bake=true, the light\'s direction will contribute to directional lightmaps.',
    url: 'https://api.playcanvas.com/engine/classes/LightComponent.html#bakedir'
}, {
    name: 'light:shadowUpdateMode',
    title: 'shadowUpdateMode',
    subTitle: '{pc.SHADOWUPDATE_*}',
    description: 'Tells the renderer how often shadows must be updated for this light. Options:\npc.SHADOWUPDATE_NONE: Don\'t render shadows.\npc.SHADOWUPDATE_THISFRAME: Render shadows only once (then automatically switches to pc.SHADOWUPDATE_NONE).\npc.SHADOWUPDATE_REALTIME: Render shadows every frame (default)',
    url: 'https://api.playcanvas.com/engine/classes/LightComponent.html#shadowupdatemode'
}, {
    name: 'light:shadowType',
    title: 'shadowType',
    subTitle: '{pc.SHADOW_*}',
    description: 'Type of shadows being rendered by this light. Options:\npc.SHADOW_PCF3: Render packed depth, can be used for PCF sampling.\npc.SHADOW_PCF5: Render depth buffer only, can be used for better hardware-accelerated PCF sampling. Requires WebGL2. Falls back to pc.SHADOW_PCF3 on WebGL 1.0.\npc.SHADOW_VSM8: Render packed variance shadow map. All shadow receivers must also cast shadows for this mode to work correctly.\npc.SHADOW_VSM16: Render 16-bit exponential variance shadow map. Requires OES_texture_half_float extension. Falls back to pc.SHADOW_VSM8, if not supported.\npc.SHADOW_VSM32: Render 32-bit exponential variance shadow map. Requires OES_texture_float extension. Falls back to pc.SHADOW_VSM16, if not supported.',
    url: 'https://api.playcanvas.com/engine/classes/LightComponent.html#shadowtype'
}, {
    name: 'light:vsmBlurMode',
    title: 'vsmBlurMode',
    subTitle: '{pc.BLUR_*}',
    description: 'Blurring mode for variance shadow maps:\npc.BLUR_BOX: Box filter.\npc.BLUR_GAUSSIAN: Gaussian filter. May look smoother than box, but requires more samples.',
    url: 'https://api.playcanvas.com/engine/classes/LightComponent.html#vsmblurmode'
}, {
    name: 'light:vsmBlurSize',
    title: 'vsmBlurSize',
    subTitle: '{Number}',
    description: 'Number of samples used for blurring a variance shadow map. Only uneven numbers work, even are incremented. Minimum value is 1, maximum is 25',
    url: 'https://api.playcanvas.com/engine/classes/LightComponent.html#vsmblursize'
}, {
    name: 'light:vsmBias',
    title: 'vsmBias',
    subTitle: '{Number}',
    description: 'Constant depth offset applied to a shadow map that enables the tuning of shadows in order to eliminate rendering artifacts, namely \'shadow acne\' and \'peter-panning\'',
    url: 'https://api.playcanvas.com/engine/classes/LightComponent.html#vsmbias'
}, {
    name: 'light:cookieAsset',
    title: 'cookieAsset',
    subTitle: '{pc.Asset}',
    description: 'Projection texture asset. Spot lights require a texture asset, omni lights require a cubemap asset.',
    url: 'https://api.playcanvas.com/engine/classes/LightComponent.html#cookieasset'
}, {
    name: 'light:cookieIntensity',
    title: 'cookieIntensity',
    subTitle: '{Number}',
    description: 'Projection texture intensity.',
    url: 'https://api.playcanvas.com/engine/classes/LightComponent.html#cookieintensity'
}, {
    name: 'light:cookieFalloff',
    title: 'cookieFalloff',
    subTitle: '{Boolean}',
    description: 'Toggle normal spotlight falloff when projection texture is used. When set to false, spotlight will work like a pure texture projector (only fading with distance)',
    url: 'https://api.playcanvas.com/engine/classes/LightComponent.html#cookiefalloff'
}, {
    name: 'light:cookieChannel',
    title: 'cookieChannel',
    subTitle: '{String}',
    description: 'Color channels of the projection texture to use. Can be "r", "g", "b", "a", "rgb" or any swizzled combination.',
    url: 'https://api.playcanvas.com/engine/classes/LightComponent.html#cookiechannel'
}, {
    name: 'light:cookieAngle',
    title: 'cookieAngle',
    subTitle: '{Number}',
    description: 'Angle for spotlight cookie rotation.',
    url: 'https://api.playcanvas.com/engine/classes/LightComponent.html#cookieangle'
}, {
    name: 'light:cookieOffset',
    title: 'cookieOffset',
    subTitle: '{pc.Vec2}',
    description: 'Spotlight cookie position offset.',
    url: 'https://api.playcanvas.com/engine/classes/LightComponent.html#cookieoffset'
}, {
    name: 'light:cookieScale',
    title: 'cookieScale',
    subTitle: '{pc.Vec2}',
    description: 'Spotlight cookie scale.',
    url: 'https://api.playcanvas.com/engine/classes/LightComponent.html#cookiescale'
}, {
    name: 'light:layers',
    title: 'layers',
    subTitle: '{Number[]}',
    description: 'The layers that this light will affect.',
    url: 'https://api.playcanvas.com/engine/classes/LightComponent.html#layers'
}];
