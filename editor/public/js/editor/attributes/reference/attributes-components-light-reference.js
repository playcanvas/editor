editor.once('load', function() {
    'use strict';

    var create = function(args) {
        var tooltip = editor.call('attributes:reference', args);

        editor.method('attributes:reference:light' + (args.name ? (':' + args.name) : '') + ':attach', function(target, element) {
            tooltip.attach({
                target: target,
                element: element || target.element
            });
        });
    };

    var fields = [
        {
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
            subTitle: '{string}',
            description: 'The type of light. Can be: directional, point, spot.',
            url: 'http://developer.playcanvas.com/api/pc.LightComponent.html#type'
        }
    ];

    // component reference
    create({
        title: 'pc.LightComponent',
        subTitle: '{pc.Component}',
        description: 'The Light Component enables the Entity to light the scene.',
        url: 'http://developer.playcanvas.com/api/pc.LightComponent.html'
    });

    // fields reference
    for(var i = 0; i < fields.length; i++) {
        fields[i].name = fields[i].title;
        create(fields[i]);
    }
});
