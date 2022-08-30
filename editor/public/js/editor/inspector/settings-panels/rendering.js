Object.assign(pcui, (function () {
    'use strict';

    const ATTRIBUTES = [
        {
            observer: 'sceneSettings',
            label: 'Ambient Color',
            path: 'render.global_ambient',
            alias: 'ambientColor',
            type: 'rgb'
        },
        {
            label: 'Area Lights',
            alias: 'areaLights',
            type: 'button',
            args: {
                text: 'IMPORT AREA LIGHTS',
                icon: 'E228'
            }
        },
        {
            observer: 'projectSettings',
            label: 'Area Lights Data',
            path: 'areaLightDataAsset',
            alias: 'project:areaLightDataAsset',
            type: 'asset',
            args: {
                assetType: 'binary'
            }
        },
        {
            observer: 'sceneSettings',
            label: 'Skybox',
            path: 'render.skybox',
            type: 'asset',
            args: {
                assetType: 'cubemap'
            }
        },
        {
            observer: 'sceneSettings',
            label: 'Intensity',
            path: 'render.skyboxIntensity',
            type: 'slider',
            args: {
                min: 0,
                max: 8
            }
        },
        {
            observer: 'sceneSettings',
            label: 'Rotation',
            path: 'render.skyboxRotation',
            type: 'vec3',
            args: {
                placeholder: ['X', 'Y', 'Z']
            }
        },
        {
            observer: 'sceneSettings',
            label: 'Mip',
            path: 'render.skyboxMip',
            type: 'select',
            args: {
                type: 'number',
                options: [
                    {
                        v: 0,
                        t: '1'
                    },
                    {
                        v: 1,
                        t: '2'
                    },
                    {
                        v: 2,
                        t: '3'
                    },
                    {
                        v: 3,
                        t: '4'
                    },
                    {
                        v: 4,
                        t: '5'
                    }
                ]
            }
        },
        {
            type: 'divider'
        },
        {
            observer: 'sceneSettings',
            label: 'Clustered Lighting',
            type: 'boolean',
            path: 'render.clusteredLightingEnabled'
        },
        {
            observer: 'sceneSettings',
            label: 'Cells',
            path: 'render.lightingCells',
            type: 'vec3',
            args: {
                placeholder: ['X', 'Y', 'Z'],
                min: 1,
                max: 255,
                step: 1,
                precision: 0
            }
        },
        {
            observer: 'sceneSettings',
            label: 'Max Lights Per Cell',
            path: 'render.lightingMaxLightsPerCell',
            type: 'slider',
            args: {
                min: 4,
                max: 255,
                step: 1,
                precision: 0
            }
        },
        {
            observer: 'sceneSettings',
            label: 'Cookies Enabled',
            type: 'boolean',
            path: 'render.lightingCookiesEnabled'
        },
        {
            observer: 'sceneSettings',
            label: 'Cookie Atlas Resolution',
            path: 'render.lightingCookieAtlasResolution',
            type: 'number',
            args: {
                min: 16,
                step: 1,
                precision: 0
            }
        },
        {
            observer: 'sceneSettings',
            label: 'Shadows Enabled',
            type: 'boolean',
            path: 'render.lightingShadowsEnabled'
        },
        {
            observer: 'sceneSettings',
            label: 'Shadow Atlas Resolution',
            path: 'render.lightingShadowAtlasResolution',
            type: 'number',
            args: {
                min: 16,
                step: 1,
                precision: 0
            }
        },
        {
            observer: 'sceneSettings',
            label: 'Shadow Type',
            path: 'render.lightingShadowType',
            type: 'select',
            args: {
                type: 'number',
                options: [{
                    v: 5, t: 'Shadow Map PCF 1x1'
                }, {
                    v: 0, t: 'Shadow Map PCF 3x3'
                }, {
                    v: 4, t: 'Shadow Map PCF 5x5'
                }]
            }
        },
        {
            observer: 'sceneSettings',
            label: 'Area Lights Enabled',
            type: 'boolean',
            path: 'render.lightingAreaLightsEnabled'
        },
        {
            type: 'divider'
        },
        {
            observer: 'sceneSettings',
            label: 'Tonemapping',
            alias: 'toneMapping',
            path: 'render.tonemapping',
            type: 'select',
            args: {
                type: 'number',
                options: [
                    {
                        v: 0,
                        t: 'Linear'
                    },
                    {
                        v: 1,
                        t: 'Filmic'
                    },
                    {
                        v: 2,
                        t: 'Hejl'
                    },
                    {
                        v: 3,
                        t: 'ACES'
                    }
                ]
            }
        },
        {
            observer: 'sceneSettings',
            label: 'Exposure',
            path: 'render.exposure',
            type: 'slider',
            args: {
                min: 0,
                max: 8
            }
        },
        {
            observer: 'sceneSettings',
            label: 'Gamma',
            alias: 'gammaCorrection',
            path: 'render.gamma_correction',
            type: 'select',
            args: {
                type: 'number',
                options: [
                    {
                        v: 0,
                        t: '1.0'
                    },
                    {
                        v: 1,
                        t: '2.2'
                    }
                ]
            }
        },
        {
            type: 'divider'
        },
        {
            observer: 'sceneSettings',
            label: 'Fog',
            path: 'render.fog',
            type: 'select',
            args: {
                type: 'string',
                options: [
                    {
                        v: 'none',
                        t: 'None'
                    },
                    {
                        v: 'linear',
                        t: 'Linear'
                    },
                    {
                        v: 'exp',
                        t: 'Exponential'
                    },
                    {
                        v: 'exp2',
                        t: 'Exponential Squared'
                    }
                ]
            }
        },
        {
            observer: 'sceneSettings',
            label: 'Distance Start',
            alias: 'fogDistance',
            path: 'render.fog_start',
            type: 'number',
            args: {
                min: 0
            }
        },
        {
            observer: 'sceneSettings',
            label: 'Distance End',
            alias: 'fogDistance',
            path: 'render.fog_end',
            type: 'number',
            args: {
                min: 0
            }
        },
        {
            observer: 'sceneSettings',
            label: 'Density',
            alias: 'fogDensity',
            path: 'render.fog_density',
            type: 'number',
            args: {
                min: 0
            }
        },
        {
            observer: 'sceneSettings',
            label: 'Color',
            alias: 'fogColor',
            path: 'render.fog_color',
            type: 'rgb'
        },
        {
            type: 'divider'
        },
        {
            observer: 'projectSettings',
            label: 'Resolution Width',
            path: 'width',
            type: 'number',
            args: {
                min: 1
            },
            reference: 'settings:project:width'
        },
        {
            observer: 'projectSettings',
            label: 'Resolution Height',
            paths: 'height',
            type: 'number',
            args: {
                min: 1
            },
            reference: 'settings:project:height'
        },
        {
            observer: 'projectSettings',
            label: 'Resolution Mode',
            path: 'resolutionMode',
            alias: 'project:resolutionMode',
            type: 'select',
            args: {
                type: 'string',
                options: [
                    {
                        v: 'AUTO',
                        t: 'Auto'
                    },
                    {
                        v: 'FIXED',
                        t: 'Fixed'
                    }
                ]
            }
        },
        {
            observer: 'projectSettings',
            label: 'Fill Mode',
            path: 'fillMode',
            alias: 'project:fillMode',
            type: 'select',
            args: {
                type: 'string',
                options: [
                    {
                        v: 'NONE',
                        t: 'None'
                    },
                    {
                        v: 'KEEP_ASPECT',
                        t: 'Keep aspect ratio'
                    },
                    {
                        v: 'FILL_WINDOW',
                        t: 'Fill window'
                    }
                ]
            }
        },
        {
            observer: 'projectSettings',
            label: 'Prefer WebGL 2.0',
            type: 'boolean',
            alias: 'project:preferWebGl2',
            path: 'preferWebGl2'
        },
        {
            observer: 'projectSettings',
            label: 'Power Preference',
            type: 'select',
            alias: 'project:powerPreference',
            path: 'powerPreference',
            args: {
                type: 'string',
                options: [
                    {
                        v: 'default',
                        t: 'Default'
                    },
                    {
                        v: 'low-power',
                        t: 'Low Power'
                    },
                    {
                        v: 'high-performance',
                        t: 'High Performance'
                    }
                ]
            }
        },
        {
            observer: 'projectSettings',
            label: 'Anti-Alias',
            type: 'boolean',
            alias: 'project:antiAlias',
            path: 'antiAlias'
        },
        {
            observer: 'projectSettings',
            label: 'Device Pixel Ratio',
            type: 'boolean',
            alias: 'project:pixelRatio',
            path: 'useDevicePixelRatio'
        },
        {
            observer: 'projectSettings',
            label: 'Transparent Canvas',
            type: 'boolean',
            alias: 'project:transparentCanvas',
            path: 'transparentCanvas'
        },
        {
            observer: 'projectSettings',
            label: 'Preserve Drawing Buffer',
            type: 'boolean',
            alias: 'project:preserveDrawingBuffer',
            path: 'preserveDrawingBuffer'
        },
        {
            type: 'divider'
        },
        {
            label: 'Basis Library',
            alias: 'basis',
            type: 'button',
            args: {
                text: 'IMPORT BASIS',
                icon: 'E228'
            }
        }
    ];

    class RenderingSettingsPanel extends pcui.BaseSettingsPanel {
        constructor(args) {
            args = Object.assign({}, args);
            args.headerText = 'RENDERING';
            args.attributes = ATTRIBUTES;

            super(args);
            const fogAttribute = this._attributesInspector.getField('render.fog');
            const fogChangeEvt = fogAttribute.on('change', (value) => {
                switch (value) {
                    case 'none':
                        this._attributesInspector.getField('render.fog_start').parent.hidden = true;
                        this._attributesInspector.getField('render.fog_end').parent.hidden = true;
                        this._attributesInspector.getField('render.fog_density').parent.hidden = true;
                        this._attributesInspector.getField('render.fog_color').parent.hidden = true;
                        break;
                    case 'linear':
                        this._attributesInspector.getField('render.fog_start').parent.hidden = false;
                        this._attributesInspector.getField('render.fog_end').parent.hidden = false;
                        this._attributesInspector.getField('render.fog_density').parent.hidden = true;
                        this._attributesInspector.getField('render.fog_color').parent.hidden = false;
                        break;
                    case 'exp':
                        this._attributesInspector.getField('render.fog_start').parent.hidden = true;
                        this._attributesInspector.getField('render.fog_end').parent.hidden = true;
                        this._attributesInspector.getField('render.fog_density').parent.hidden = false;
                        this._attributesInspector.getField('render.fog_color').parent.hidden = false;
                        break;
                    case 'exp2':
                        this._attributesInspector.getField('render.fog_start').parent.hidden = true;
                        this._attributesInspector.getField('render.fog_end').parent.hidden = true;
                        this._attributesInspector.getField('render.fog_density').parent.hidden = false;
                        this._attributesInspector.getField('render.fog_color').parent.hidden = false;
                        break;
                    default:
                        break;
                }
            });
            this.once('destroy', () => {
                fogChangeEvt.unbind();
            });

            const clickBasisEvt = this._attributesInspector.getField('basis').on('click', () => {
                editor.call('project:module:addModule', 'basis.js', 'basis');
            });
            this.once('destroy', () => {
                clickBasisEvt.unbind();
            });

            var areaLightImportField = this._attributesInspector.getField('areaLights');
            var areaLightDataField = this._attributesInspector.getField('areaLightDataAsset');

            if (!editor.call('users:hasFlag', 'hasAreaLights')) {
                areaLightImportField.parent.hidden = true;
                areaLightDataField.hidden = true;
            }

            areaLightDataField.on('change', (value) => {
                if (!value) {
                    // show import button again
                    areaLightImportField.hidden = false;
                } else {
                    // hide import button
                    areaLightImportField.hidden = true;
                }
            });

            const handleAreaLightLutsImport = (name) => {
                if (name === 'area-light-luts') {
                    var lutAsset = editor.call('project:engineAsset:getEngineAsset', name);
                    if (lutAsset.length > 0) {
                        this._attributesInspector.getField('areaLightDataAsset').value = lutAsset[0][1].get('id');
                    } else {
                        editor.call('project:engineAsset:addEngineAsset', `${name}.bin`, name);
                        const importAreaLightEvt = editor.on('engineAssetImported', handleAreaLightLutsImport);
                        this.once('destroy', () => {
                            importAreaLightEvt.unbind();
                        });
                    }
                }
            };

            const clickAreaLightImportEvt = areaLightImportField.on('click', () => {
                handleAreaLightLutsImport('area-light-luts');
            });
            this.once('destroy', () => {
                clickAreaLightImportEvt.unbind();
            });

            const shadowsEnabled = this._attributesInspector.getField('render.lightingShadowsEnabled');
            const shadowsResolution = this._attributesInspector.getField('render.lightingShadowAtlasResolution');
            const shadowType = this._attributesInspector.getField('render.lightingShadowType');
            const cookiesEnabled = this._attributesInspector.getField('render.lightingCookiesEnabled');
            const cookieResolution = this._attributesInspector.getField('render.lightingCookieAtlasResolution');
            const cells = this._attributesInspector.getField('render.lightingCells');
            const lightsPerCell = this._attributesInspector.getField('render.lightingMaxLightsPerCell');
            const areaEnabled = this._attributesInspector.getField('render.lightingAreaLightsEnabled');
            const clusteredEnabled = this._attributesInspector.getField('render.clusteredLightingEnabled');

            // warning message, to be removed when engine 1.56 is promoted to the Editor
            clusteredEnabled.parent.parent.appendBefore(new pcui.Panel({
                headerText: 'Clustered lighting section is taken into account by the Engine 1.56+ only.'
            }), clusteredEnabled.parent);

            const sceneSettings = editor.call('sceneSettings');

            clusteredEnabled.on('change', (value) => {

                const oldclusteredEnabled = sceneSettings.get('render.clusteredLightingEnabled');

                // if the user changed clusteredLightingEnabled tickbox, reload the Editor
                if (oldclusteredEnabled !== value) {
                    this.showReloadDialog();
                }

                // update visibility
                cells.hidden = !value;
                cells.parent.hidden = !value;
                lightsPerCell.hidden = !value;
                lightsPerCell.parent.hidden = !value;

                const shadows = shadowsEnabled.value && value;
                shadowsEnabled.hidden = !value;
                shadowsEnabled.parent.hidden = !value;
                shadowsResolution.hidden = !shadows;
                shadowsResolution.parent.hidden = !shadows;
                shadowType.hidden = !shadows;
                shadowType.parent.hidden = !shadows;

                const cookies = cookiesEnabled.value && value;
                cookiesEnabled.hidden = !value;
                cookiesEnabled.parent.hidden = !value;
                cookieResolution.hidden = !cookies;
                cookieResolution.parent.hidden = !cookies;

                areaEnabled.hidden = !value;
                areaEnabled.parent.hidden = !value;
            });

            shadowsEnabled.on('change', (value) => {
                const visible = value && clusteredEnabled.value;
                shadowsResolution.hidden = !visible;
                shadowsResolution.parent.hidden = !visible;
                shadowType.hidden = !visible;
                shadowType.parent.hidden = !visible;
            });

            cookiesEnabled.on('change', (value) => {
                const visible = value && clusteredEnabled.value;
                cookieResolution.hidden = !visible;
                cookieResolution.parent.hidden = !visible;
            });
        }

        showReloadDialog() {

            const text = 'When the Clustered Lighting is toggled, the Editor needs to reload for the effect' +
            ' to take place. If you have the project launched, please reload it as well.';

            // display a modal window, only allowing the user to reload the Editor
            const root = editor.call('layout.root');
            const overlay = new ui.Overlay();
            overlay.class.add('rendering-settings-restart-modal');
            overlay.style.zIndex = 203;
            overlay.center = true;
            overlay.clickable = false;
            root.append(overlay);

            // label
            const label = new ui.Label({
                unsafe: true,
                text: text
            });
            label.class.add('header');
            overlay.append(label);

            // reload button
            const btnClose = new ui.Button();
            btnClose.class.add('close');
            btnClose.text = 'Reload';
            btnClose.on('click', function () {
                // reload the page
                window.location.reload();
            });
            overlay.append(btnClose);
        }
    }

    return {
        RenderingSettingsPanel: RenderingSettingsPanel
    };
})());
