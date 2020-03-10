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
