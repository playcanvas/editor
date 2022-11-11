Object.assign(pcui, (function () {
    'use strict';

    const ATTRIBUTES = [
        {
            observer: 'sceneSettings',
            label: 'Size Multiplier',
            path: 'render.lightmapSizeMultiplier',
            type: 'number',
            args: {
                min: 0
            }
        },
        {
            observer: 'sceneSettings',
            label: 'Max Resolution',
            path: 'render.lightmapMaxResolution',
            type: 'number',
            args: {
                min: 2
            }
        },
        {
            observer: 'sceneSettings',
            label: 'Mode',
            path: 'render.lightmapMode',
            type: 'select',
            args: {
                type: 'number',
                options: [
                    {
                        v: 0,
                        t: "Color Only"
                    },
                    {
                        v: 1,
                        t: "Color and Direction"
                    }
                ]
            }
        },
        {
            type: 'divider'
        },
        {
            observer: 'sceneSettings',
            label: 'Filter',
            alias: 'project:lightmapFilterEnabled',
            path: 'render.lightmapFilterEnabled',
            type: 'boolean'
        },
        {
            observer: 'sceneSettings',
            label: 'Range',
            alias: 'project:lightmapFilterRange',
            path: 'render.lightmapFilterRange',
            type: 'number',
            args: {
                min: 0
            }
        },
        {
            observer: 'sceneSettings',
            label: 'Smoothness',
            alias: 'project:lightmapFilterSmoothness',
            path: 'render.lightmapFilterSmoothness',
            type: 'slider',
            args: {
                min: 0,
                max: 1
            }
        },
        {
            type: 'divider'
        },
        {
            observer: 'sceneSettings',
            label: 'Ambient Bake',
            alias: 'project:ambientBake',
            path: 'render.ambientBake',
            type: 'boolean'
        },
        {
            observer: 'sceneSettings',
            label: 'Samples',
            alias: 'project:ambientBakeNumSamples',
            path: 'render.ambientBakeNumSamples',
            type: 'number',
            args: {
                min: 1,
                max: 255,
                step: 1,
                precision: 0
            }
        },
        {
            observer: 'sceneSettings',
            label: 'Sphere Part',
            alias: 'project:ambientBakeSpherePart',
            path: 'render.ambientBakeSpherePart',
            type: 'slider',
            args: {
                min: 0,
                max: 1
            }
        },
        {
            observer: 'sceneSettings',
            label: 'Occlusion Brightness',
            alias: 'project:ambientBakeOcclusionBrightness',
            path: 'render.ambientBakeOcclusionBrightness',
            type: 'slider',
            args: {
                min: -1,
                max: 1
            }
        },
        {
            observer: 'sceneSettings',
            label: 'Occlusion Contrast',
            alias: 'project:ambientBakeOcclusionContrast',
            path: 'render.ambientBakeOcclusionContrast',
            type: 'slider',
            args: {
                min: -1,
                max: 1
            }
        }
    ];

    class LightmappingSettingsPanel extends pcui.BaseSettingsPanel {
        constructor(args) {
            args = Object.assign({}, args);
            args.headerText = 'LIGHTMAPPING';
            args.attributes = ATTRIBUTES;

            super(args);
        }
    }

    return {
        LightmappingSettingsPanel: LightmappingSettingsPanel
    };
})());
