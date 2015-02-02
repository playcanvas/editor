editor.once('load', function() {
    'use strict';

    var schema = {
        animation: {
            default: {
                enabled: true,
                assets: [],
                speed: 1,
                loop: true
            }
        },

        light: {
            default: {
                enabled: true,
                type: 'directional',
                color: [1, 1, 1],
                intensity: 1,
                castShadows: false,
                shadowDistance: 40,
                shadowResolution: 1024,
                shadowBias: 0.05,
                normalOffsetBias: 0,
                range: 10,
                falloffMode: 0,
                innerConeAngle: 40,
                outerConeAngle: 45
            },
            runtime: {
                color: pc.Color
            }
        }
    };

    editor.method('entities:addComponent', function (entity, componentName) {
        if (!schema[componentName]) {
            console.error('Invalid component name' + componentName);
            return;
        }

        var data = schema[componentName].default;
        entity.set('components.' + componentName, data);
    });

});


