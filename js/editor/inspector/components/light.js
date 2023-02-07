Object.assign(pcui, (function () {
    const ATTRIBUTES = [{
        label: 'Type',
        path: 'components.light.type',
        type: 'select',
        args: {
            type: 'string',
            options: [{
                v: 'directional', t: 'Directional'
            }, {
                v: 'spot', t: 'Spot'
            }, {
                v: 'point', t: 'Omni'
            }]
        }
    }, {
        label: 'Color',
        path: 'components.light.color',
        type: 'rgb'
    }, {
        label: 'Intensity',
        path: 'components.light.intensity',
        type: 'slider',
        args: {
            precision: 2,
            min: 0,
            max: 32,
            step: 0.1
        }
    }, {
        label: 'Range',
        path: 'components.light.range',
        type: 'number',
        args: {
            precision: 2,
            step: 0.1,
            min: 0
        }
    }, {
        label: 'Falloff Mode',
        path: 'components.light.falloffMode',
        type: 'select',
        args: {
            type: 'number',
            options: [{
                v: 0, t: 'Linear'
            }, {
                v: 1, t: 'Inverse Squared'
            }]
        }
    }, {
        label: 'Inner Cone Angle',
        path: 'components.light.innerConeAngle',
        type: 'number',
        args: {
            precision: 2,
            step: 1,
            min: 0,
            max: 90
        }
    }, {
        label: 'Outer Cone Angle',
        path: 'components.light.outerConeAngle',
        type: 'number',
        args: {
            precision: 2,
            step: 1,
            min: 0,
            max: 90
        }
    }, {
        label: 'Shape',
        path: 'components.light.shape',
        type: 'select',
        args: {
            type: 'number',
            options: [{
                v: 0, t: 'Punctual'
            }, {
                v: 1, t: 'Rectangle'
            }, {
                v: 2, t: 'Disk'
            }, {
                v: 3, t: 'Sphere'
            }]
        }
    }, {
        type: 'divider'
    }, {
        label: 'Static',
        path: 'components.light.isStatic',
        type: 'boolean'
    }, {
        label: 'Bake Lightmap',
        path: 'components.light.bake',
        type: 'boolean'
    }, {
        label: 'Bake Direction',
        path: 'components.light.bakeDir',
        type: 'boolean'
    }, {
        label: 'Bake Samples',
        path: 'components.light.bakeNumSamples',
        type: 'number',
        args: {
            min: 1,
            max: 255,
            step: 1,
            precision: 0
        }
    }, {
        label: 'Bake Area',
        path: 'components.light.bakeArea',
        type: 'slider',
        args: {
            min: 0,
            max: 180
        }
    }, {
        label: 'Affect Lightmapped',
        path: 'components.light.affectLightmapped',
        type: 'boolean'
    }, {
        label: 'Affect Dynamic',
        path: 'components.light.affectDynamic',
        type: 'boolean'
    }, {
        type: 'divider'
    }, {
        label: 'Cast Shadows',
        path: 'components.light.castShadows',
        type: 'boolean'
    }, {
        label: 'Shadow Update Mode',
        path: 'components.light.shadowUpdateMode',
        type: 'select',
        args: {
            type: 'number',
            options: [{
                v: pc.SHADOWUPDATE_THISFRAME, t: 'Once'
            }, {
                v: pc.SHADOWUPDATE_REALTIME, t: 'Realtime'
            }]
        }
    }, {
        label: 'Resolution',
        path: 'components.light.shadowResolution',
        type: 'select',
        args: {
            type: 'number',
            options: [{
                v: 16, t: '16 x 16'
            }, {
                v: 32, t: '32 x 32'
            }, {
                v: 64, t: '64 x 64'
            }, {
                v: 128, t: '128 x 128'
            }, {
                v: 256, t: '256 x 256'
            }, {
                v: 512, t: '512 x 512'
            },  {
                v: 1024, t: '1024 x 1024'
            }, {
                v: 2048, t: '2048 x 2048'
            }, {
                v: 4096, t: '4096 x 4096'
            }]
        }
    }, {
        label: 'Cascades',
        path: 'components.light.numCascades',
        type: 'select',
        args: {
            type: 'number',
            options: [{
                v: 1, t: '1'
            }, {
                v: 2, t: '2'
            }, {
                v: 3, t: '3'
            }, {
                v: 4, t: '4'
            }]
        }
    }, {
        label: 'Cascade Distribution',
        path: 'components.light.cascadeDistribution',
        type: 'number',
        args: {
            precision: 2,
            step: 0.01,
            min: 0,
            max: 1
        }
    }, {
        label: 'Distance',
        path: 'components.light.shadowDistance',
        type: 'number',
        args: {
            precision: 2,
            step: 1,
            min: 0
        }
    }, {
        label: 'Shadow Intensity',
        path: 'components.light.shadowIntensity',
        type: 'slider',
        args: {
            precision: 2,
            step: 0.01,
            min: 0,
            max: 1
        }
    }, {
        label: 'Shadow Type',
        path: 'components.light.shadowType',
        type: 'select',
        args: {
            type: 'number',
            options: [{
                v: 0, t: 'Shadow Map PCF 3x3'
            }, {
                v: 4, t: 'Shadow Map PCF 5x5'
            }, {
                v: 1, t: 'Variance Shadow Map (8bit)'
            }, {
                v: 2, t: 'Variance Shadow Map (16bit)'
            }, {
                v: 3, t: 'Variance Shadow Map (32bit)'
            }]
        }
    }, {
        label: 'VSM Blur Mode',
        path: 'components.light.vsmBlurMode',
        type: 'select',
        args: {
            type: 'number',
            options: [{
                v: 0, t: 'Box'
            }, {
                v: 1, t: 'Gaussian'
            }]
        }
    }, {
        label: 'VSM Blur Size',
        path: 'components.light.vsmBlurSize',
        type: 'slider',
        args: {
            min: 1,
            max: 25,
            precision: 0,
            step: 1
        }
    }, {
        label: 'VSM Bias',
        path: 'components.light.vsmBias',
        type: 'number',
        args: {
            min: 0,
            max: 1,
            precision: 4,
            step: 0.001
        }
    }, {
        label: 'Shadow Bias',
        path: 'components.light.shadowBias',
        type: 'number',
        args: {
            min: 0,
            max: 1,
            precision: 4,
            step: 0.001
        }
    }, {
        label: 'Normal Offset Bias',
        path: 'components.light.normalOffsetBias',
        type: 'number',
        args: {
            min: 0,
            max: 1,
            precision: 3,
            step: 0.001
        }
    }, {
        type: 'divider',
        alias: 'components.light.cookieDivider'
    }, {
        label: 'Cookie',
        path: 'components.light.cookieAsset',
        type: 'asset'
    }, {
        label: 'Cookie Intensity',
        path: 'components.light.cookieIntensity',
        type: 'slider',
        args: {
            min: 0,
            max: 1,
            precision: 3
        }
    }, {
        label: 'Cookie Angle',
        path: 'components.light.cookieAngle',
        type: 'slider',
        args: {
            min: 0,
            max: 360,
            placeholder: '°',
            precision: 1
        }
    }, {
        label: 'Cookie Offset',
        path: 'components.light.cookieOffset',
        type: 'vec2',
        args: {
            precision: 3,
            step: 0.01,
            placeholder: ['U', 'V']
        }
    }, {
        label: 'Cookie Scale',
        path: 'components.light.cookieScale',
        type: 'vec2',
        args: {
            precision: 3,
            step: 0.01,
            placeholder: ['U', 'V']
        }
    }, {
        label: 'Cookie Falloff',
        path: 'components.light.cookieFalloff',
        type: 'boolean'
    }, {
        label: 'Cookie Channel',
        path: 'components.light.cookieChannel',
        type: 'select',
        args: {
            type: 'string',
            options: [{
                v: 'r', t: 'R'
            }, {
                v: 'g', t: 'G'
            }, {
                v: 'b', t: 'B'
            }, {
                v: 'a', t: 'A'
            }, {
                v: 'rgb', t: 'RGB'
            }]
        }
    }, {
        type: 'divider'
    }, {
        label: 'Layers',
        path: 'components.light.layers',
        type: 'layers',
        args: {
            excludeLayers: [
                LAYERID_DEPTH,
                LAYERID_SKYBOX,
                LAYERID_IMMEDIATE
            ]
        }
    }];

    ATTRIBUTES.forEach((attr) => {
        if (!attr.path) return;
        const parts = attr.path.split('.');
        attr.reference = `light:${parts[parts.length - 1]}`;
    });

    class LightComponentInspector extends pcui.ComponentInspector {
        constructor(args) {
            args = Object.assign({}, args);
            args.component = 'light';

            super(args);

            this._attributesInspector = new pcui.AttributesInspector({
                assets: args.assets,
                projectSettings: args.projectSettings,
                history: args.history,
                attributes: ATTRIBUTES,
                templateOverridesInspector: this._templateOverridesInspector
            });
            this.append(this._attributesInspector);

            [
                'type',
                'cookieAsset',
                'bake',
                'bakeDir',
                'castShadows',
                'shadowType',
                'shadowUpdateMode',
                'affectDynamic',
                'shape',
                'numCascades'
            ].forEach((field) => {
                this._field(field).on('change', this._toggleFields.bind(this));
            });

            // add update shadow button
            this._btnUpdateShadow = new pcui.Button({
                size: 'small',
                icon: 'E128'
            });
            this._field('shadowUpdateMode').parent.append(this._btnUpdateShadow);

            this._eventUpdateShadow = null;

            const tooltip = Tooltip.attach({
                target: this._btnUpdateShadow.dom,
                text: 'Update Shadows',
                align: 'bottom',
                root: editor.call('layout.root')
            });
            this._btnUpdateShadow.once('destroy', () => {
                tooltip.destroy();
            });

            this._skipToggleFields = false;
        }

        _field(name) {
            return this._attributesInspector.getField(`components.light.${name}`);
        }

        _toggleFields() {
            if (this._skipToggleFields) return;

            const type = this._field('type').value;
            const isDirectional = type === 'directional';
            const isSpot = type === 'spot';
            const isPoint = type === 'point';
            const castShadows = this._field('castShadows').value;
            const shadowType = this._field('shadowType').value;
            let shadowTypeVsm = shadowType === pc.SHADOW_VSM8 || shadowType === pc.SHADOW_VSM16 ||
                shadowType === pc.SHADOW_VSM32;
            const cookie = this._field('cookieAsset').value;
            const numCascades = this._field('numCascades').value;
            const isCLustered = editor.call('sceneSettings').get('render.clusteredLightingEnabled') && !isDirectional;
            if (isCLustered) {
                shadowTypeVsm = false;
            }
            const areaEnabled = editor.call('sceneSettings').get('render.lightingAreaLightsEnabled');
            const shape = this._field('shape').value;

            this._field('shape').parent.hidden = !areaEnabled;

            ['range', 'falloffMode'].forEach((field) => {
                this._field(field).parent.hidden = isDirectional;
            });

            // falloff mode is ignored on area lights
            if (shape !== 0) {
                this._field('falloffMode').parent.hidden = true;
            }

            ['innerConeAngle', 'outerConeAngle'].forEach((field) => {
                this._field(field).parent.hidden = !isSpot;
            });

            // Avoid inner cone angle from being larger than outer cone angle
            this._resetInnerConeAngleLimit();
            this._field('outerConeAngle').on('change', this._resetInnerConeAngleLimit.bind(this));

            const bakeEnabled = this._field('bake').value;
            const bakeDirEnabled = this._field('bakeDir').value;

            this._field('bakeDir').parent.disabled = !bakeEnabled;
            this._field('bakeNumSamples').parent.disabled = !bakeEnabled || bakeDirEnabled;
            this._field('bakeArea').parent.disabled = !bakeEnabled || bakeDirEnabled;
            this._field('affectLightmapped').parent.disabled = bakeEnabled;

            [
                'cookieIntensity',
                'cookieChannel'
            ].forEach((field) => {
                this._field(field).parent.hidden = isDirectional || !cookie;
            });

            [
                'cookieAngle',
                'cookieOffset',
                'cookieScale'
            ].forEach((field) => {
                this._field(field).parent.hidden = isDirectional || isPoint || !cookie || isCLustered;
            });

            this._field('cookieAsset').hidden = isDirectional;
            this._field('cookieDivider').hidden = this._field('cookieAsset').hidden;
            this._field('cookieAsset').assetType = (isPoint ? 'cubemap' : 'texture');

            this._field('cookieFalloff').parent.hidden = !isSpot || !cookie || isCLustered;

            this._field('shadowResolution').parent.hidden = !castShadows || isCLustered;
            this._field('shadowType').parent.hidden = !castShadows || isCLustered;
            this._field('shadowDistance').parent.hidden = !castShadows;
            this._field('shadowIntensity').parent.hidden = !castShadows;

            this._field('numCascades').parent.hidden = !(castShadows && isDirectional);
            this._field('cascadeDistribution').parent.hidden = !(castShadows && isDirectional && numCascades > 1);

            this._field('shadowUpdateMode').parent.hidden = !castShadows || this._field('bake').value && !this._field('affectDynamic').value;

            [
                'vsmBlurMode',
                'vsmBlurSize',
                'vsmBias'
            ].forEach((field) => {
                this._field(field).parent.hidden = !castShadows || !shadowTypeVsm || isCLustered;
            });

            [
                'shadowBias',
                'normalOffsetBias'
            ].forEach((field) => {
                this._field(field).parent.hidden = !castShadows || shadowTypeVsm;
            });

            this._btnUpdateShadow.hidden = this._field('shadowUpdateMode').value !== pc.SHADOWUPDATE_THISFRAME;
        }

        _updateShadows(entities) {
            for (let i = 0; i < entities.length; i++) {
                if (entities[i].entity && entities[i].entity.light && entities[i].entity.light.shadowUpdateMode === pc.SHADOWUPDATE_THISFRAME)
                    entities[i].entity.light.light.shadowUpdateMode = pc.SHADOWUPDATE_THISFRAME;
            }
            editor.call('viewport:render');
        }

        _resetInnerConeAngleLimit() {
            this._field('innerConeAngle').max = this._field('outerConeAngle').value;
        }

        link(entities) {
            super.link(entities);

            this._skipToggleFields = true;
            this._attributesInspector.link(entities);

            this._eventUpdateShadow = this._btnUpdateShadow.on('click', () => {
                this._updateShadows(entities);
            });

            this._skipToggleFields = false;

            this._toggleFields();
        }

        unlink() {
            super.unlink();
            this._attributesInspector.unlink();
            if (this._eventUpdateShadow) {
                this._eventUpdateShadow.unbind();
                this._eventUpdateShadow = null;
            }
        }
    }

    return {
        LightComponentInspector: LightComponentInspector
    };
})());
