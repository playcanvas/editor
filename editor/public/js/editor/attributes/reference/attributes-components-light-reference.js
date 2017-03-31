editor.once('load', function() {
    'use strict';

    var fields = [{
        name: 'component',
        title: 'pc.LightComponent',
        subTitle: '{pc.Component}',
        description: 'The Light Component enables the Entity to light the scene.',
        url: 'http://developer.playcanvas.com/api/pc.LightComponent.html'
    }, {
        title: 'isStatic',
        subTitle: '{Boolean}',
        description: 'Mark light as non-movable (optimization).',
        url: 'http://developer.playcanvas.com/api/pc.LightComponent.html#isStatic'
    }, {
        title: 'castShadows',
        subTitle: '{Boolean}',
        description: 'If checked, the light will cause shadow casting models to cast shadows.',
        url: 'http://developer.playcanvas.com/api/pc.LightComponent.html#castShadows'
    }, {
        title: 'color',
        subTitle: '{pc.Color}',
        description: 'The color of the emitted light.',
        url: 'http://developer.playcanvas.com/api/pc.LightComponent.html#color'
    }, {
        title: 'falloffMode',
        subTitle: '{pc.LIGHTFALLOFF_*}',
        description: 'Controls the rate at which a light attentuates from its position.',
        url: 'http://developer.playcanvas.com/api/pc.LightComponent.html#falloffMode'
    }, {
        title: 'coneAngles',
        subTitle: '{Number}',
        description: 'The angles from the spotlight\'s direction at which light begins to fall from its maximum (innerConeAngle) and zero value (outerConeAngle).',
        url: 'http://developer.playcanvas.com/api/pc.LightComponent.html#innerConeAngle'
    }, {
        title: 'intensity',
        subTitle: '{Number}',
        description: 'The intensity of the light, this acts as a scalar value for the light\'s color. This value can exceed 1.',
        url: 'http://developer.playcanvas.com/api/pc.LightComponent.html#intensity'
    }, {
        title: 'normalOffsetBias',
        subTitle: '{Number}',
        description: 'Normal offset depth bias.',
        url: 'http://developer.playcanvas.com/api/pc.LightComponent.html#normalOffsetBias'
    }, {
        title: 'range',
        subTitle: '{Number}',
        description: 'The distance from the spotlight source at which its contribution falls to zero.',
        url: 'http://developer.playcanvas.com/api/pc.LightComponent.html#range'
    }, {
        title: 'shadowBias',
        subTitle: '{Number}',
        description: 'Constant depth offset applied to a shadow map that enables the tuning of shadows in order to eliminate rendering artifacts, namely \'shadow acne\' and \'peter-panning\'.',
        url: 'http://developer.playcanvas.com/api/pc.LightComponent.html#shadowBias'
    }, {
        title: 'shadowDistance',
        subTitle: '{Number}',
        description: 'The shadow distance is the maximum distance from the camera beyond which shadows that come from Directional Lights are no longer visible. Smaller values produce more detailed shadows. The closer the limit the less shadow data has to be mapped to, and represented by, any shadow map; shadow map pixels are mapped spatially and so the less distance the shadow map has to cover, the smaller the pixels and so the more resolution any shadow has.',
        url: 'http://developer.playcanvas.com/api/pc.LightComponent.html#shadowDistance'
    }, {
        title: 'shadowResolution',
        subTitle: '{Number}',
        description: 'The size of the texture used for the shadow map.',
        url: 'http://developer.playcanvas.com/api/pc.LightComponent.html#shadowResolution'
    },{
        title: 'type',
        subTitle: '{String}',
        description: 'The type of light. Can be: directional, point, spot.',
        url: 'http://developer.playcanvas.com/api/pc.LightComponent.html#type'
    }, {
        title: 'affectDynamic',
        subTitle: '{Boolean}',
        description: 'If enabled the light will affect non-lightmapped objects.',
        url: 'http://developer.playcanvas.com/api/pc.LightComponent.html#affectDynamic'
    }, {
        title: 'affectLightmapped',
        subTitle: '{Boolean}',
        description: 'If enabled the light will affect lightmapped objects.',
        url: 'http://developer.playcanvas.com/api/pc.LightComponent.html#affectLightmapped'
    }, {
        title: 'bake',
        subTitle: '{Boolean}',
        description: 'If enabled the light will be rendered into lightmaps.',
        url: 'http://developer.playcanvas.com/api/pc.LightComponent.html#bake'
    }, {
        title: 'bakeDir',
        subTitle: '{Boolean}',
        description: 'If enabled and bake=true, the light\'s direction will contribute to directional lightmaps.',
        url: 'http://developer.playcanvas.com/api/pc.LightComponent.html#bakeDir'
    }, {
        title: 'shadowUpdateMode',
        subTitle: '{pc.SHADOWUPDATE_*}',
        description: 'Tells the renderer how often shadows must be updated for this light. Options:\n<b>pc.SHADOWUPDATE_NONE</b>: Don\'t render shadows.\n<b>pc.SHADOWUPDATE_THISFRAME</b>: Render shadows only once (then automatically switches to pc.SHADOWUPDATE_NONE).\n<b>pc.SHADOWUPDATE_REALTIME</b>: Render shadows every frame (default)',
        url: 'http://developer.playcanvas.com/api/pc.LightComponent.html#shadowUpdateMode'
    }, {
        title: 'shadowType',
        subTitle: '{pc.SHADOW_*}',
        description: 'Type of shadows being rendered by this light. Options:\n<b>pc.SHADOW_PCF3</b>: Render packed depth, can be used for PCF sampling.\n<b>pc.SHADOW_PCF5</b>: Render depth buffer only, can be used for better hardware-accelerated PCF sampling. Requires WebGL2. Falls back to pc.SHADOW_PCF3 on WebGL 1.0.\n<b>pc.SHADOW_VSM8</b>: Render packed variance shadow map. All shadow receivers must also cast shadows for this mode to work correctly.\n<b>pc.SHADOW_VSM16</b>: Render 16-bit exponential variance shadow map. Requires OES_texture_half_float extension. Falls back to pc.SHADOW_VSM8, if not supported.\n<b>pc.SHADOW_VSM32</b>: Render 32-bit exponential variance shadow map. Requires OES_texture_float extension. Falls back to pc.SHADOW_VSM16, if not supported.',
        url: 'http://developer.playcanvas.com/api/pc.LightComponent.html#shadowType'
    }, {
        title: 'vsmBlurMode',
        subTitle: '{pc.BLUR_*}',
        description: 'Blurring mode for variance shadow maps:\n<b>pc.BLUR_BOX</b>: Box filter.\n<b>pc.BLUR_GAUSSIAN</b>: Gaussian filter. May look smoother than box, but requires more samples.',
        url: 'http://developer.playcanvas.com/api/pc.LightComponent.html#vsmBlurMode'
    }, {
        title: 'vsmBlurSize',
        subTitle: '{Number}',
        description: 'Number of samples used for blurring a variance shadow map. Only uneven numbers work, even are incremented. Minimum value is 1, maximum is 25',
        url: 'http://developer.playcanvas.com/api/pc.LightComponent.html#vsmBlurSize'
    }, {
        title: 'vsmBias',
        subTitle: '{Number}',
        description: 'Constant depth offset applied to a shadow map that enables the tuning of shadows in order to eliminate rendering artifacts, namely \'shadow acne\' and \'peter-panning\'',
        url: 'http://developer.playcanvas.com/api/pc.LightComponent.html#vsmBias'
    }, {
        title: 'cookie',
        subTitle: '{pc.Texture}',
        description: 'Projection texture. Must be 2D for spot and cubemap for point (ignored if incorrect type is used).',
        url: 'http://developer.playcanvas.com/api/pc.LightComponent.html#cookie'
    }, {
        title: 'cookieAsset',
        subTitle: '{pc.Asset}',
        description: 'Asset that has texture that will be assigned to cookie internally once asset resource is available.',
        url: 'http://developer.playcanvas.com/api/pc.LightComponent.html#cookieAsset'
    }, {
        title: 'cookieIntensity',
        subTitle: '{Number}',
        description: 'Projection texture intensity.',
        url: 'http://developer.playcanvas.com/api/pc.LightComponent.html#cookieIntensity'
    }, {
        title: 'cookieFalloff',
        subTitle: '{Boolean}',
        description: 'Toggle normal spotlight falloff when projection texture is used. When set to false, spotlight will work like a pure texture projector (only fading with distance)',
        url: 'http://developer.playcanvas.com/api/pc.LightComponent.html#cookieFalloff'
    }, {
        title: 'cookieChannel',
        subTitle: '{String}',
        description: 'Color channels of the projection texture to use. Can be "r", "g", "b", "a", "rgb" or any swizzled combination.',
        url: 'http://developer.playcanvas.com/api/pc.LightComponent.html#cookieChannel'
    }, {
        title: 'cookieAngle',
        subTitle: '{Number}',
        description: 'Angle for spotlight cookie rotation.',
        url: 'http://developer.playcanvas.com/api/pc.LightComponent.html#cookieAngle'
    }, {
        title: 'cookieOffset',
        subTitle: '{pc.Vec2}',
        description: 'Spotlight cookie position offset.',
        url: 'http://developer.playcanvas.com/api/pc.LightComponent.html#cookieOffset'
    }, {
        title: 'cookieScale',
        subTitle: '{pc.Vec2}',
        description: 'Spotlight cookie scale.',
        url: 'http://developer.playcanvas.com/api/pc.LightComponent.html#cookieScale'
    }];

    for(var i = 0; i < fields.length; i++) {
        fields[i].name = 'light:' + (fields[i].name || fields[i].title);
        editor.call('attributes:reference:add', fields[i]);
    }
});
