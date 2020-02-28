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
