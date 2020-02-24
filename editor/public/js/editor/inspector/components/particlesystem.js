Object.assign(pcui, (function () {
    'use strict';

    const ATTRIBUTES = [{
        label: 'Auto Play',
        path: 'components.particlesystem.autoPlay',
        type: 'boolean'
    }, {
        label: 'Particle Count',
        path: 'components.particlesystem.numParticles',
        type: 'number'
    }, {
        label: 'Lifetime',
        path: 'components.particlesystem.lifetime',
        type: 'number',
        args: {
            placeholder: 'Seconds'
        }
    }, {
        label: 'Emission Rate',
        alias: 'components.particlesystem.emissionRate',
        type: 'vec2',
        args: {
            placeholder: ['From', 'To']
        },
        reference: 'particlesystem:rate'
    }, {
        label: 'Start Angle',
        alias: 'components.particlesystem.startAngle',
        type: 'vec2',
        args: {
            placeholder: ['From', 'To']
        }
    }, {
        label: 'Loop',
        path: 'components.particlesystem.loop',
        type: 'boolean'
    }, {
        label: 'Pre Warm',
        path: 'components.particlesystem.preWarm',
        type: 'boolean'
    }, {
        label: 'Lighting',
        path: 'components.particlesystem.lighting',
        type: 'boolean'
    }, {
        label: 'Half Lambert',
        path: 'components.particlesystem.halfLambert',
        type: 'boolean'
    }, {
        label: 'Intensity',
        path: 'components.particlesystem.intensity',
        type: 'number'
    }, {
        label: 'Depth Write',
        path: 'components.particlesystem.depthWrite',
        type: 'boolean'
    }, {
        label: 'Depth Softening',
        path: 'components.particlesystem.depthSoftening',
        type: 'number'
    }, {
        label: 'Sort',
        path: 'components.particlesystem.sort',
        type: 'select',
        args: {
            type: 'number',
            options: [{
                v: 0, t: 'None'
            }, {
                v: 1, t: 'Camera Distance'
            }, {
                v: 2, t: 'Newest First'
            }, {
                v: 3, t: 'Oldest First'
            }]
        }
    }, {
        label: 'Blend Type',
        path: 'components.particlesystem.blendType',
        type: 'select',
        args: {
            type: 'number',
            options: [{
                v: 2, t: 'Alpha'
            }, {
                v: 1, t: 'Additive'
            }, {
                v: 5, t: 'Multiply'
            }]
        },
        reference: 'particlesystem:blend'
    }, {
        label: 'Stretch',
        path: 'components.particlesystem.stretch',
        type: 'number'
    }, {
        label: 'Align To Motion',
        path: 'components.particlesystem.alignToMotion',
        type: 'boolean'
    }, {
        label: 'Emitter Shape',
        path: 'components.particlesystem.emitterShape',
        type: 'select',
        args: {
            type: 'number',
            options: [{
                v: 0, t: 'Box'
            }, {
                v: 1, t: 'Sphere'
            }]
        }
    }, {
        label: 'Emitter Extents',
        path: 'components.particlesystem.emitterExtents',
        type: 'vec3',
        args: {
            placeholder: ['X', 'Y', 'Z']
        }
    }, {
        label: 'Inner Extents',
        path: 'components.particlesystem.emitterExtentsInner',
        type: 'vec3',
        args: {
            placeholder: ['X', 'Y', 'Z']
        }
    }, {
        label: 'Emitter Radius',
        path: 'components.particlesystem.emitterRadius',
        type: 'number'
    }, {
        label: 'Inner Radius',
        path: 'components.particlesystem.emitterRadiusInner',
        type: 'number'
    }, {
        label: 'Wrap',
        path: 'components.particlesystem.wrap',
        type: 'boolean'
    }, {
        label: 'Local Space',
        path: 'components.particlesystem.localSpace',
        type: 'boolean'
    }, {
        label: 'Layers',
        path: 'components.particlesystem.layers',
        type: 'layers',
        args: {
            excludeLayers: [
                LAYERID_DEPTH,
                LAYERID_SKYBOX,
                LAYERID_IMMEDIATE
            ]
        }
    }, {
        label: 'Wrap Bounds',
        path: 'components.particlesystem.wrapBounds',
        type: 'vec3',
        args: {
            placeholder: ['X', 'Y', 'Z']
        }
    }, {
        label: 'Orientation',
        path: 'components.particlesystem.orientation',
        type: 'select',
        args: {
            type: 'number',
            options: [{
                v: 0, t: 'Screen'
            }, {
                v: 1, t: 'World Normal'
            }, {
                v: 2, t: 'Emitter Normal'
            }]
        }
    }, {
        label: 'Particle Normal',
        path: 'components.particlesystem.particleNormal',
        type: 'vec3',
        args: {
            placeholder: ['X', 'Y', 'Z']
        }
    }, {
        label: 'Color Map',
        path: 'components.particlesystem.colorMapAsset',
        type: 'asset',
        args: {
            assetType: 'texture'
        },
        reference: 'particlesystem:colorMap'
    }, {
        label: 'Normal Map',
        path: 'components.particlesystem.normalMapAsset',
        type: 'asset',
        args: {
            assetType: 'texture'
        },
        reference: 'particlesystem:normalMap'
    }, {
        label: 'Horizontal Tiles',
        path: 'components.particlesystem.animTilesX',
        type: 'number',
        args: {
            min: 1
        }
    }, {
        label: 'Vertical Tiles',
        path: 'components.particlesystem.animTilesY',
        type: 'number',
        args: {
            min: 1
        }
    }, {
        label: 'Start Frame',
        path: 'components.particlesystem.animStartFrame',
        type: 'number',
        args: {
            min: 0
        }
    }, {
        label: 'Frame Count',
        path: 'components.particlesystem.animNumFrames',
        type: 'number',
        args: {
            min: 1
        }
    }, {
        label: 'Animation Speed',
        path: 'components.particlesystem.animSpeed',
        type: 'number'
    }, {
        label: 'Animation Loop',
        path: 'components.particlesystem.animLoop',
        type: 'boolean'
    }, {
        label: 'Mesh',
        path: 'components.particlesystem.mesh',
        type: 'asset',
        args: {
            assetType: 'model'
        }
    }, {
        label: 'Local Velocity',
        paths: ['components.particlesystem.localVelocityGraph', 'components.particlesystem.localVelocityGraph2'],
        type: 'curveset',
        args: {
            curves: ['X', 'Y', 'Z']
        }
    }, {
        label: 'Velocity',
        paths: ['components.particlesystem.velocityGraph', 'components.particlesystem.velocityGraph2'],
        type: 'curveset',
        args: {
            curves: ['X', 'Y', 'Z']
        }
    }, {
        label: 'Radial Speed',
        paths: ['components.particlesystem.radialSpeedGraph', 'components.particlesystem.radialSpeedGraph2'],
        type: 'curveset',
        args: {
            curves: ['R']
        }
    }, {
        label: 'Rotation Speed',
        paths: ['components.particlesystem.rotationSpeedGraph', 'components.particlesystem.rotationSpeedGraph2'],
        type: 'curveset',
        args: {
            curves: ['Angle'],
            verticalValue: 180
        }
    }, {
        label: 'Scale',
        paths: ['components.particlesystem.scaleGraph', 'components.particlesystem.scaleGraph2'],
        type: 'curveset',
        args: {
            curves: ['Scale'],
            verticalValue: 1,
            min: 0
        }
    }, {
        label: 'Color',
        path: 'components.particlesystem.colorGraph',
        type: 'gradient',
        args: {
            channels: 3
        }
    }, {
        label: 'Opacity',
        paths: ['components.particlesystem.alphaGraph', 'components.particlesystem.alphaGraph2'],
        type: 'curveset',
        args: {
            curves: ['Opacity'],
            min: 0,
            max: 1
        }
    }];

    ATTRIBUTES.forEach(attr => {
        if (!attr.path && !attr.paths && !attr.alias || attr.reference) return;

        const parts = (attr.path || attr.alias || attr.paths[0]).split('.');
        attr.reference = `particlesystem:${parts[parts.length - 1]}`;
    });

    class ParticlesystemComponentInspector extends pcui.ComponentInspector {
        constructor(args) {
            args = Object.assign({}, args);
            args.component = 'particlesystem';

            super(args);

            this._attributesInspector = new pcui.AttributesInspector({
                assets: args.assets,
                projectSettings: args.projectSettings,
                history: args.history,
                attributes: !editor.call('users:hasFlag', 'hasParticleSystemAnimStartFrame') ?
                    ATTRIBUTES.filter(attr => attr.path !== 'components.particlesystem.animStartFrame') : ATTRIBUTES,
                templateOverridesSidebar: this._templateOverridesSidebar
            });
            this.append(this._attributesInspector);

            this._suppressToggleFields = false;

            [
                'loop',
                'lighting',
                'emitterShape',
                'wrap',
                'orientation',
                'colorMapAsset',
                'normalMapAsset'
            ].forEach(field => {
                this._field(field).on('change', this._toggleFields.bind(this));
            });

            // add control buttons
            const btnPlay = new pcui.Button({
                size: 'small',
                icon: 'E131',
                hidden: true
            });
            btnPlay.style.flex = 'initial';

            btnPlay.on('click', this._onClickPlay.bind(this));

            this._btnPlay = btnPlay;

            const btnPause = new pcui.Button({
                size: 'small',
                text: '&#10074;&#10074;',
                unsafe: true
            });
            btnPause.style.flex = 'initial';

            btnPause.on('click', this._onClickPause.bind(this));

            this._btnPause = btnPause;

            const btnStop = new pcui.Button({
                size: 'small',
                icon: 'E135'
            });
            btnStop.style.flex = 'initial';

            btnStop.on('click', this._onClickStop.bind(this));

            const btnReset = new pcui.Button({
                size: 'small',
                icon: 'E113'
            });
            btnReset.style.flex = 'initial';

            btnReset.on('click', this._onClickReset.bind(this));

            const controls = new pcui.LabelGroup({
                text: 'Controls'
            });
            controls.append(btnPlay);
            controls.append(btnPause);
            controls.append(btnStop);
            controls.append(btnReset);

            this._attributesInspector.prepend(controls);

            if (this._templateOverridesSidebar) {
                const emissionRate = this._field('emissionRate').inputs;
                this._templateOverridesSidebar.registerElementForPath(`components.particlesystem.rate`, emissionRate[0].dom);
                this._templateOverridesSidebar.registerElementForPath(`components.particlesystem.rate2`, emissionRate[1].dom);

                const startAngle = this._field('startAngle').inputs;
                this._templateOverridesSidebar.registerElementForPath(`components.particlesystem.startAngle`, startAngle[0].dom);
                this._templateOverridesSidebar.registerElementForPath(`components.particlesystem.startAngle2`, startAngle[1].dom);
            }
        }

        _field(name) {
            return this._attributesInspector.getField(`components.particlesystem.${name}`);
        }

        _toggleFields() {
            if (this._suppressToggleFields) return;

            const emitterShape = this._field('emitterShape').value;

            this._field('preWarm').parent.hidden = !this._field('loop').value;
            this._field('halfLambert').parent.hidden = !this._field('lighting').value;
            this._field('emitterExtents').parent.hidden = emitterShape !== 0;
            this._field('emitterExtentsInner').parent.hidden = emitterShape !== 0;
            this._field('emitterRadius').parent.hidden = emitterShape !== 1;
            this._field('emitterRadiusInner').parent.hidden = emitterShape !== 1;
            this._field('wrapBounds').parent.hidden = !this._field('wrap').value;
            this._field('particleNormal').parent.hidden = this._field('orientation').value === 0;

            const hideAnimTiles = !this._field('normalMapAsset').value && !this._field('colorMapAsset').value;
            this._field('animTilesX').parent.hidden = hideAnimTiles;
            this._field('animTilesY').parent.hidden = hideAnimTiles;
            this._field('animNumFrames').parent.hidden = hideAnimTiles;
            this._field('animSpeed').parent.hidden = hideAnimTiles;
            this._field('animLoop').parent.hidden = hideAnimTiles;
        }

        _onClickPlay() {
            if (!this._entities) return;

            this._btnPlay.hidden = true;
            this._btnPause.hidden = false;

            this._entities.forEach(e => {
                if (!e.entity || !e.entity.particlesystem || !e.entity.particlesystem.emitter) return;

                if (e.entity.particlesystem.data.paused) {
                    e.entity.particlesystem.unpause();
                } else {
                    e.entity.particlesystem.stop();
                    e.entity.particlesystem.reset();
                    e.entity.particlesystem.play();
                }
            });
        }

        _onClickPause() {
            if (!this._entities) return;

            this._btnPlay.hidden = false;
            this._btnPause.hidden = true;

            this._entities.forEach(e => {
                if (!e.entity || !e.entity.particlesystem || !e.entity.particlesystem.emitter) return;

                e.entity.particlesystem.pause();
            });

        }

        _onClickStop() {
            if (!this._entities) return;

            this._entities.forEach(e => {
                if (!e.entity || !e.entity.particlesystem || !e.entity.particlesystem.emitter) return;

                e.entity.particlesystem.stop();
            });

            this._btnPlay.hidden = false;
            this._btnPause.hidden = true;
        }

        _onClickReset() {
            if (!this._entities) return;

            this._entities.forEach(e => {
                if (!e.entity || !e.entity.particlesystem || !e.entity.particlesystem.emitter) return;

                e.entity.particlesystem.rebuild();
                e.entity.particlesystem.reset();
                e.entity.particlesystem.play();
            });
        }

        link(entities) {
            super.link(entities);

            this._suppressToggleFields = true;
            this._attributesInspector.link(entities);

            // link dummy vector fields to actual paths
            const emissionRate = this._field('emissionRate').inputs;
            emissionRate[0].link(entities, 'components.particlesystem.rate');
            emissionRate[1].link(entities, 'components.particlesystem.rate2');

            const startAngle = this._field('startAngle').inputs;
            startAngle[0].link(entities, 'components.particlesystem.startAngle');
            startAngle[1].link(entities, 'components.particlesystem.startAngle2');

            this._suppressToggleFields = false;
            this._toggleFields();

            // play particles from the beginning
            this._onClickPlay();
        }

        unlink() {
            super.unlink();
            this._attributesInspector.unlink();

            ['emissionRate', 'startAngle'].forEach(field => {
                const inputs = this._field(field).inputs;
                for (let i = 0; i < inputs.length; i++) {
                    inputs[i].unlink();
                }
            });
        }

        destroy() {
            if (this._destroyed) return;

            if (this._templateOverridesSidebar) {
                this._templateOverridesSidebar.unregisterElementForPath(`components.particlesystem.rate`);
                this._templateOverridesSidebar.unregisterElementForPath(`components.particlesystem.rate2`);
                this._templateOverridesSidebar.unregisterElementForPath(`components.particlesystem.startAngle`);
                this._templateOverridesSidebar.unregisterElementForPath(`components.particlesystem.startAngle2`);
            }

            super.destroy();
        }
    }

    return {
        ParticlesystemComponentInspector: ParticlesystemComponentInspector
    };
})());
