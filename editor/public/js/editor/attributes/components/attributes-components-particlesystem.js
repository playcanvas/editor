editor.once('load', function () {
    'use strict';

    if (editor.call('users:hasFlag', 'hasPcuiComponentInspectors')) return;

    editor.on('attributes:inspect[entity]', function (entities) {
        var panelComponents = editor.call('attributes:entity.panelComponents');
        if (! panelComponents)
            return;

        var projectSettings = editor.call('settings:project');

        // particlesystem
        var panel = editor.call('attributes:entity:addComponentPanel', {
            title: 'Particles',
            name: 'particlesystem',
            entities: entities
        });


        // controls
        var fieldControls = editor.call('attributes:addField', {
            parent: panel,
            name: 'Controls'
        });
        var label = fieldControls;
        fieldControls = fieldControls.parent;
        label.destroy();
        fieldControls.class.add('controls');

        var btnPlay = new ui.Button({
            text: '&#57649;'
        });
        btnPlay.on('click', function () {
            for (let i = 0; i < entities.length; i++) {
                if (! entities[i].entity || ! entities[i].entity.particlesystem)
                    continue;

                if (playingState === 1) {
                    entities[i].entity.particlesystem.pause();
                } else if (entities[i].entity.particlesystem.data.paused) {
                    entities[i].entity.particlesystem.unpause();
                } else {
                    entities[i].entity.particlesystem.stop();
                    entities[i].entity.particlesystem.reset();
                    entities[i].entity.particlesystem.play();
                }
            }
            checkPlayingState();
        });
        fieldControls.append(btnPlay);

        var playingState = -1;
        var loopingState = -1;

        var checkPlayingState = function () {
            var playing = -1;
            var looping = -1;

            for (let i = 0; i < entities.length; i++) {
                if (! entities[i].entity || ! entities[i].entity.particlesystem)
                    continue;

                if (entities[i].entity.particlesystem.emitter && entities[i].entity.particlesystem.isPlaying()) {
                    if (playing === -1) {
                        playing = 1;
                    } else if (playing === 0) {
                        playing = 2;
                    }
                } else {
                    if (playing === -1) {
                        playing = 0;
                    } else if (playing === 1) {
                        playing = 2;
                    }
                }

                if (entities[i].entity.particlesystem.emitter && entities[i].entity.particlesystem.emitter.loop) {
                    if (looping === -1) {
                        looping = 1;
                    } else if (looping === 0) {
                        looping = 2;
                    }
                } else {
                    if (looping === -1) {
                        looping = 0;
                    } else if (looping === 1) {
                        looping = 2;
                    }
                }
            }

            if (playingState !== playing) {
                playingState = playing;

                if (playingState === 1) {
                    btnPlay.text = '&#10074;&#10074;'; // pause
                    btnPlay.class.add('pause');
                } else {
                    btnPlay.text = '&#57649;'; // play
                    btnPlay.class.remove('pause');
                }
            }

            if (loopingState !== looping) {
                loopingState = looping;

                if (loopingState === 0) {
                    btnStop.disabled = true;
                } else {
                    btnStop.disabled = false;
                }
            }
        };

        var evtCheckPlayingState = setInterval(checkPlayingState, 100);
        btnPlay.once('destroy', function () {
            clearInterval(evtCheckPlayingState);
        });


        var btnStop = new ui.Button({
            text: '	&#57653;'
        });
        btnStop.on('click', function () {
            for (let i = 0; i < entities.length; i++) {
                if (! entities[i].entity || ! entities[i].entity.particlesystem)
                    continue;

                if (playingState === 1) {
                    entities[i].entity.particlesystem.stop();
                } else {
                    entities[i].entity.particlesystem.stop();
                    entities[i].entity.particlesystem.reset();
                }
            }

            checkPlayingState();
        });
        fieldControls.append(btnStop);

        var btnReset = new ui.Button({
            text: '&#57619;'
        });
        btnReset.on('click', function () {
            for (let i = 0; i < entities.length; i++) {
                if (! entities[i].entity || ! entities[i].entity.particlesystem)
                    continue;

                entities[i].entity.particlesystem.rebuild();
                entities[i].entity.particlesystem.reset();
                entities[i].entity.particlesystem.play();
            }

            checkPlayingState();
        });
        fieldControls.append(btnReset);

        checkPlayingState();

        editor.once('viewport:update', function () {
            for (let i = 0; i < entities.length; i++) {
                if (! entities[i].entity || ! entities[i].entity.particlesystem)
                    continue;

                entities[i].entity.particlesystem.rebuild();
                entities[i].entity.particlesystem.reset();
                entities[i].entity.particlesystem.play();
            }
        });
        editor.call('viewport:render');


        // autoPlay
        var fieldAutoPlay = editor.call('attributes:addField', {
            parent: panel,
            name: 'Auto Play',
            type: 'checkbox',
            link: entities,
            path: 'components.particlesystem.autoPlay',
            canOverrideTemplate: true
        });
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:autoPlay', fieldAutoPlay.parent.innerElement.firstChild.ui);

        // numParticles
        var fieldNumParticles = editor.call('attributes:addField', {
            parent: panel,
            name: 'Particle Count',
            type: 'number',
            link: entities,
            path: 'components.particlesystem.numParticles',
            canOverrideTemplate: true
        });
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:numParticles', fieldNumParticles.parent.innerElement.firstChild.ui);


        // lifetime
        var fieldLifetime = editor.call('attributes:addField', {
            parent: panel,
            name: 'Lifetime',
            placeholder: 'Seconds',
            type: 'number',
            link: entities,
            path: 'components.particlesystem.lifetime',
            canOverrideTemplate: true
        });
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:lifetime', fieldLifetime.parent.innerElement.firstChild.ui);


        // emission rate
        var panelEmissionRate = editor.call('attributes:addField', {
            parent: panel,
            name: 'Emission Rate'
        });
        var label = panelEmissionRate;
        panelEmissionRate = panelEmissionRate.parent;
        label.destroy();
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:rate', panelEmissionRate.innerElement.firstChild.ui);

        // emission rate from
        var fieldEmissionRateFrom = editor.call('attributes:addField', {
            panel: panelEmissionRate,
            placeholder: 'From',
            type: 'number',
            link: entities,
            path: 'components.particlesystem.rate'
        });
        fieldEmissionRateFrom.style.width = '32px';

        editor.call('attributes:registerOverridePath', 'components.particlesystem.rate', fieldEmissionRateFrom.element);

        // emission rate to
        var fieldEmissionRateTo = editor.call('attributes:addField', {
            panel: panelEmissionRate,
            placeholder: 'To',
            type: 'number',
            link: entities,
            path: 'components.particlesystem.rate2'
        });
        fieldEmissionRateTo.style.width = '32px';

        editor.call('attributes:registerOverridePath', 'components.particlesystem.rate2', fieldEmissionRateTo.element);


        // start angle
        var panelStartAngle = editor.call('attributes:addField', {
            parent: panel,
            name: 'Start Angle'
        });
        var label = panelStartAngle;
        panelStartAngle = panelStartAngle.parent;
        label.destroy();
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:startAngle', panelStartAngle.innerElement.firstChild.ui);

        // start angle from
        var fieldStartAngleFrom = editor.call('attributes:addField', {
            panel: panelStartAngle,
            placeholder: 'From',
            type: 'number',
            link: entities,
            path: 'components.particlesystem.startAngle'
        });
        fieldStartAngleFrom.style.width = '32px';

        editor.call('attributes:registerOverridePath', 'components.particlesystem.startAngle', fieldStartAngleFrom.element);

        // start angle to
        var fieldStartAngleTo = editor.call('attributes:addField', {
            panel: panelStartAngle,
            placeholder: 'To',
            type: 'number',
            link: entities,
            path: 'components.particlesystem.startAngle2',
            canOverrideTemplate: true
        });
        fieldStartAngleTo.style.width = '32px';

        editor.call('attributes:registerOverridePath', 'components.particlesystem.startAngle2', fieldStartAngleTo.element);

        // playback
        var panelPlayback = editor.call('attributes:addField', {
            parent: panel,
            name: 'Playback'
        });
        var label = panelPlayback;
        panelPlayback = panelPlayback.parent;
        label.destroy();

        // loop
        var fieldLoop = editor.call('attributes:addField', {
            panel: panelPlayback,
            type: 'checkbox',
            link: entities,
            path: 'components.particlesystem.loop'
        });

        editor.call('attributes:registerOverridePath', 'components.particlesystem.loop', fieldLoop.element);

        // label
        var label = new ui.Label({ text: 'Loop' });
        label.class.add('label-infield');
        label.style.paddingRight = '12px';
        panelPlayback.append(label);
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:loop', label);


        // preWarm
        var fieldPreWarm = editor.call('attributes:addField', {
            panel: panelPlayback,
            type: 'checkbox',
            link: entities,
            path: 'components.particlesystem.preWarm',
            canOverrideTemplate: true
        });

        editor.call('attributes:registerOverridePath', 'components.particlesystem.preWarm', fieldPreWarm.element);

        // label
        var labelPreWarm = new ui.Label({ text: 'Pre Warm' });
        labelPreWarm.class.add('label-infield');
        labelPreWarm.style.paddingRight = '12px';
        panelPlayback.append(labelPreWarm);
        // states
        fieldPreWarm.hidden = labelPreWarm.hidden = ! fieldLoop.value && ! fieldLoop.class.contains('null');
        fieldLoop.on('change', function (value) {
            fieldPreWarm.hidden = labelPreWarm.hidden = ! value && ! this.class.contains('null');
        });
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:preWarm', labelPreWarm);


        // lighting
        var panelLighting = editor.call('attributes:addField', {
            parent: panel,
            name: 'Lighting'
        });
        var label = panelLighting;
        panelLighting = panelLighting.parent;
        label.destroy();

        // lighting
        var fieldLighting = editor.call('attributes:addField', {
            panel: panelLighting,
            type: 'checkbox',
            link: entities,
            path: 'components.particlesystem.lighting',
            canOverrideTemplate: true
        });
        // label
        var label = new ui.Label({ text: 'Enabled' });
        label.class.add('label-infield');
        label.style.paddingRight = '12px';
        label.class.add('label-infield');
        panelLighting.append(label);
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:lighting', label);


        // halfLambert
        var fieldHalfLambert = editor.call('attributes:addField', {
            panel: panelLighting,
            type: 'checkbox',
            link: entities,
            path: 'components.particlesystem.halfLambert',
            canOverrideTemplate: true
        });
        // label
        var labelHalfLambert = new ui.Label({ text: 'Half Lambert' });
        labelHalfLambert.class.add('label-infield');
        labelHalfLambert.style.paddingRight = '12px';
        panelLighting.append(labelHalfLambert);
        // state
        fieldHalfLambert.hidden = labelHalfLambert.hidden = ! fieldLighting.value && ! fieldLighting.class.contains('null');
        fieldLighting.on('change', function (value) {
            fieldHalfLambert.hidden = labelHalfLambert.hidden = ! value && ! this.class.contains('null');
        });
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:halfLambert', labelHalfLambert);


        // intensity
        var fieldIntensity = editor.call('attributes:addField', {
            parent: panel,
            name: 'Intensity',
            type: 'number',
            link: entities,
            path: 'components.particlesystem.intensity',
            canOverrideTemplate: true
        });
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:intensity', fieldIntensity.parent.innerElement.firstChild.ui);


        // depth
        var panelDepth = editor.call('attributes:addField', {
            parent: panel,
            name: 'Depth'
        });
        var label = panelDepth;
        panelDepth = panelDepth.parent;
        label.destroy();

        // depthWrite
        var fieldDepthWrite = editor.call('attributes:addField', {
            panel: panelDepth,
            type: 'checkbox',
            link: entities,
            path: 'components.particlesystem.depthWrite'
        });

        editor.call('attributes:registerOverridePath', 'components.particlesystem.depthWrite', fieldDepthWrite.element);

        // label
        var label = new ui.Label({ text: 'Write' });
        label.class.add('label-infield');
        label.style.paddingRight = '12px';
        panelDepth.append(label);
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:depthWrite', label);

        // depthSoftening
        var fieldDepthSoftening = editor.call('attributes:addField', {
            panel: panelDepth,
            placeholder: 'Softening',
            type: 'number',
            link: entities,
            path: 'components.particlesystem.depthSoftening'
        });
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:depthSoftening', fieldDepthSoftening);

        editor.call('attributes:registerOverridePath', 'components.particlesystem.depthSoftening', fieldDepthSoftening.element);

        // sort
        var fieldSort = editor.call('attributes:addField', {
            parent: panel,
            name: 'Sort',
            type: 'number',
            enum: [
                { v: '', t: '...' },
                { v: 0, t: 'None' },
                { v: 1, t: 'Camera Distance' },
                { v: 2, t: 'Newest First' },
                { v: 3, t: 'Oldest First' }
            ],
            link: entities,
            path: 'components.particlesystem.sort',
            canOverrideTemplate: true
        });
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:sort', fieldSort.parent.innerElement.firstChild.ui);


        // blendType
        var fieldBlendType = editor.call('attributes:addField', {
            parent: panel,
            name: 'Blend Type',
            type: 'number',
            enum: [
                { v: '', t: '...' },
                { v: 2, t: 'Alpha' },
                { v: 1, t: 'Additive' },
                { v: 5, t: 'Multiply' }
            ],
            link: entities,
            path: 'components.particlesystem.blendType',
            canOverrideTemplate: true
        });
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:blend', fieldBlendType.parent.innerElement.firstChild.ui);


        // stretch
        var fieldStretch = editor.call('attributes:addField', {
            parent: panel,
            name: 'Stretch',
            type: 'number',
            link: entities,
            path: 'components.particlesystem.stretch',
            canOverrideTemplate: true
        });
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:stretch', fieldStretch.parent.innerElement.firstChild.ui);


        // alignToMotion
        var fieldAlignToMotion = editor.call('attributes:addField', {
            parent: panel,
            name: 'Align To Motion',
            type: 'checkbox',
            link: entities,
            path: 'components.particlesystem.alignToMotion',
            canOverrideTemplate: true
        });
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:alignToMotion', fieldAlignToMotion.parent.innerElement.firstChild.ui);


        // emitterShape
        var fieldEmitterShape = editor.call('attributes:addField', {
            parent: panel,
            name: 'Emitter Shape',
            type: 'number',
            enum: [
                { v: '', t: '...' },
                { v: 0, t: 'Box' },
                { v: 1, t: 'Sphere' }
            ],
            link: entities,
            path: 'components.particlesystem.emitterShape',
            canOverrideTemplate: true
        });
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:emitterShape', fieldEmitterShape.parent.innerElement.firstChild.ui);


        // emitterExtents
        var fieldSpawnBounds = editor.call('attributes:addField', {
            parent: panel,
            name: 'Emitter Extents',
            placeholder: ['X', 'Y', 'Z'],
            type: 'vec3',
            link: entities,
            path: 'components.particlesystem.emitterExtents',
            canOverrideTemplate: true
        });
        fieldSpawnBounds[0].parent.hidden = fieldEmitterShape.value !== 0 || fieldEmitterShape.class.contains('null');
        fieldEmitterShape.on('change', function (value) {
            fieldSpawnBounds[0].parent.hidden = value !== 0 || this.class.contains('null');
        });
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:emitterExtents', fieldSpawnBounds[0].parent.innerElement.firstChild.ui);


        // emitterExtentsInner
        var fieldSpawnBoundsInner = editor.call('attributes:addField', {
            parent: panel,
            name: 'Emitter Extents Inner',
            placeholder: ['X', 'Y', 'Z'],
            type: 'vec3',
            link: entities,
            path: 'components.particlesystem.emitterExtentsInner',
            canOverrideTemplate: true
        });
        fieldSpawnBoundsInner[0].parent.hidden = fieldEmitterShape.value !== 0 || fieldEmitterShape.class.contains('null');
        fieldEmitterShape.on('change', function (value) {
            fieldSpawnBoundsInner[0].parent.hidden = value !== 0 || this.class.contains('null');
        });
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:emitterExtentsInner', fieldSpawnBoundsInner[0].parent.innerElement.firstChild.ui);


        // emitterRadius
        var fieldSpawnRadius = editor.call('attributes:addField', {
            parent: panel,
            name: 'Emitter Radius',
            type: 'number',
            link: entities,
            path: 'components.particlesystem.emitterRadius',
            canOverrideTemplate: true
        });
        fieldSpawnRadius.parent.hidden = fieldEmitterShape.value !== 1 || fieldEmitterShape.class.contains('null');
        fieldEmitterShape.on('change', function (value) {
            fieldSpawnRadius.parent.hidden = value !== 1 || this.class.contains('null');
        });
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:emitterRadius', fieldSpawnRadius.parent.innerElement.firstChild.ui);


        // emitterRadiusInner
        var fieldSpawnRadiusInner = editor.call('attributes:addField', {
            parent: panel,
            name: 'Emitter Radius Inner',
            type: 'number',
            link: entities,
            path: 'components.particlesystem.emitterRadiusInner',
            canOverrideTemplate: true
        });
        fieldSpawnRadiusInner.parent.hidden = fieldEmitterShape.value !== 1 || fieldEmitterShape.class.contains('null');
        fieldEmitterShape.on('change', function (value) {
            fieldSpawnRadiusInner.parent.hidden = value !== 1 || this.class.contains('null');
        });
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:emitterRadiusInner', fieldSpawnRadiusInner.parent.innerElement.firstChild.ui);


        // wrap
        var fieldWrap = editor.call('attributes:addField', {
            parent: panel,
            name: 'Wrap',
            type: 'checkbox',
            link: entities,
            path: 'components.particlesystem.wrap',
            canOverrideTemplate: true
        });
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:wrap', fieldWrap.parent.innerElement.firstChild.ui);

        // localSpace
        var fieldLocalSpace = editor.call('attributes:addField', {
            parent: panel,
            name: 'Local Space',
            type: 'checkbox',
            link: entities,
            path: 'components.particlesystem.localSpace',
            canOverrideTemplate: true
        });
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:localSpace', fieldLocalSpace.parent.innerElement.firstChild.ui);

        // layers
        var layers = projectSettings.get('layers');
        var layersEnum = {
            '': ''
        };
        for (var key in layers) {
            layersEnum[key] = layers[key].name;
        }
        delete layersEnum[LAYERID_DEPTH];
        delete layersEnum[LAYERID_SKYBOX];
        delete layersEnum[LAYERID_IMMEDIATE];

        var fieldLayers = editor.call('attributes:addField', {
            parent: panel,
            name: 'Layers',
            type: 'tags',
            tagType: 'number',
            enum: layersEnum,
            placeholder: 'Add Layer',
            link: entities,
            path: 'components.particlesystem.layers',
            canOverrideTemplate: true,
            tagToString: function (tag) {
                return projectSettings.get('layers.' + tag + '.name') || 'Missing';
            },
            onClickTag: function () {
                // focus layer
                var layerId = this.originalValue;
                editor.call('selector:set', 'editorSettings', [editor.call('settings:projectUser')]);
                setTimeout(function () {
                    editor.call('editorSettings:layers:focus', layerId);
                });
            }
        });

        // reference
        editor.call('attributes:reference:attach', 'particlesystem:layers', fieldLayers.parent.parent.innerElement.firstChild.ui);


        // wrapBounds
        var fieldWrapBounds = editor.call('attributes:addField', {
            parent: panel,
            name: 'Wrap Bounds',
            placeholder: ['X', 'Y', 'Z'],
            type: 'vec3',
            link: entities,
            path: 'components.particlesystem.wrapBounds',
            canOverrideTemplate: true
        });
        fieldWrapBounds[0].parent.hidden = ! fieldWrap.value && ! fieldWrap.class.contains('null');
        fieldWrap.on('change', function (value) {
            fieldWrapBounds[0].parent.hidden = ! value && ! this.class.contains('null');
        });
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:wrapBounds', fieldWrapBounds[0].parent.innerElement.firstChild.ui);

        // orientation
        var fieldOrientation = editor.call('attributes:addField', {
            parent: panel,
            name: 'Orientation',
            type: 'number',
            enum: [
                { v: '', t: '...' },
                { v: 0, t: 'Screen' },
                { v: 1, t: 'World Normal' },
                { v: 2, t: 'Emitter Normal' }
            ],
            link: entities,
            path: 'components.particlesystem.orientation',
            canOverrideTemplate: true
        });
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:orientation', fieldOrientation.parent.innerElement.firstChild.ui);

        // particleNormal
        var fieldParticleNormal = editor.call('attributes:addField', {
            parent: panel,
            name: 'Particle Normal',
            placeholder: ['X', 'Y', 'Z'],
            type: 'vec3',
            link: entities,
            path: 'components.particlesystem.particleNormal',
            canOverrideTemplate: true
        });
        fieldParticleNormal[0].parent.hidden = fieldOrientation.value === 0 || fieldOrientation.class.contains('null');
        fieldOrientation.on('change', function (value) {
            fieldParticleNormal[0].parent.hidden = value === 0 || this.class.contains('null');
        });
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:particleNormal', fieldParticleNormal[0].parent.innerElement.firstChild.ui);

        // colorMapAsset
        var fieldColorMap = editor.call('attributes:addField', {
            parent: panel,
            name: 'Color Map',
            type: 'asset',
            kind: 'texture',
            link: entities,
            path: 'components.particlesystem.colorMapAsset',
            canOverrideTemplate: true
        });
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:colorMap', fieldColorMap._label);

        fieldColorMap.on('change', function (value) {
            panelFrames.hidden = !value && !fieldNormalMap.value;
            fieldAnimatedTextureNumFrames.parent.hidden = panelFrames.hidden;
            panelAnimationPlayback.hidden = panelFrames.hidden;
        });

        // normalMapAsset
        var fieldNormalMap = editor.call('attributes:addField', {
            parent: panel,
            name: 'Normal Map',
            type: 'asset',
            kind: 'texture',
            link: entities,
            path: 'components.particlesystem.normalMapAsset',
            canOverrideTemplate: true
        });
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:normalMap', fieldNormalMap._label);

        fieldNormalMap.on('change', function (value) {
            panelFrames.hidden = !value && !fieldColorMap.value;
            fieldAnimatedTextureNumFrames.hidden = panelFrames.hidden;
            panelAnimationPlayback.hidden = panelFrames.hidden;
        });

        // frames
        var panelFrames = editor.call('attributes:addField', {
            parent: panel,
            name: 'Map Tiles'
        });

        var label = panelFrames;
        panelFrames = panelFrames.parent;
        label.destroy();

        // number of x tiles
        var fieldAnimatedTextureTilesX = editor.call('attributes:addField', {
            parent: panelFrames,
            type: 'number',
            placeholder: 'X',
            min: 1,
            link: entities,
            path: 'components.particlesystem.animTilesX',
            canOverrideTemplate: true
        });
        fieldAnimatedTextureTilesX.style.width = '50%';
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:animTilesX', fieldAnimatedTextureTilesX.parent.innerElement.firstChild.ui);

        // number of y tiles
        var fieldAnimatedTextureTilesY = editor.call('attributes:addField', {
            parent: panelFrames,
            type: 'number',
            placeholder: 'Y',
            min: 1,
            link: entities,
            path: 'components.particlesystem.animTilesY',
            canOverrideTemplate: true
        });
        fieldAnimatedTextureTilesY.style.width = '50%';
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:animTilesY', fieldAnimatedTextureTilesY.parent.innerElement.firstChild.ui);

        panelFrames.hidden = !fieldColorMap.value && !fieldNormalMap.value;

        if (editor.call('users:hasFlag', 'hasParticleSystemSpriteAnimationUpdates')) {
            // frame to play from
            var fieldAnimatedTextureStartFrame = editor.call('attributes:addField', {
                parent: panel,
                type: 'number',
                name: 'Start Frame',
                min: 0,
                link: entities,
                path: 'components.particlesystem.animStartFrame',
                canOverrideTemplate: true
            });
            // reference
            editor.call('attributes:reference:attach', 'particlesystem:animStartFrame', fieldAnimatedTextureStartFrame.parent.innerElement.firstChild.nextSibling.ui);

            fieldAnimatedTextureStartFrame.parent.hidden = !fieldColorMap.value && !fieldNormalMap.value;
        }


        // frames to play
        var fieldAnimatedTextureNumFrames = editor.call('attributes:addField', {
            parent: panel,
            type: 'number',
            name: 'Frame Count',
            min: 1,
            link: entities,
            path: 'components.particlesystem.animNumFrames',
            canOverrideTemplate: true
        });
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:animNumFrames', fieldAnimatedTextureNumFrames.parent.innerElement.firstChild.nextSibling.ui);

        fieldAnimatedTextureNumFrames.parent.hidden = !fieldColorMap.value && !fieldNormalMap.value;

        var panelAnimationPlayback = editor.call('attributes:addField', {
            parent: panel,
            name: 'Animation'
        });

        var label = panelAnimationPlayback;
        panelAnimationPlayback = panelAnimationPlayback.parent;
        label.destroy();

        // animation speed
        var fieldAnimatedTextureSpeed = editor.call('attributes:addField', {
            parent: panelAnimationPlayback,
            placeholder: 'Speed',
            type: 'number',
            link: entities,
            path: 'components.particlesystem.animSpeed',
            canOverrideTemplate: true
        });
        fieldAnimatedTextureSpeed.style.width = '50%';
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:animSpeed', fieldAnimatedTextureSpeed.parent.innerElement.firstChild.ui);


        // animation loop
        var fieldAnimatedTextureLoop = editor.call('attributes:addField', {
            parent: panelAnimationPlayback,
            type: 'checkbox',
            link: entities,
            path: 'components.particlesystem.animLoop',
            canOverrideTemplate: true
        });

        // label
        var label = new ui.Label({ text: 'Loop' });
        label.class.add('label-infield');
        label.style.paddingRight = '12px';
        panelAnimationPlayback.append(label);

        // reference
        editor.call('attributes:reference:attach', 'particlesystem:animLoop', label);

        panelAnimationPlayback.hidden = !fieldColorMap.value && !fieldNormalMap.value;

        // mesh
        var fieldMesh = editor.call('attributes:addField', {
            parent: panel,
            name: 'Mesh',
            type: 'asset',
            kind: 'model',
            link: entities,
            path: 'components.particlesystem.mesh',
            canOverrideTemplate: true
        });
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:mesh', fieldMesh._label);


        // localVelocityGraph
        var fieldLocalVelocity = editor.call('attributes:addField', {
            parent: panel,
            name: 'Local Velocity',
            type: 'curveset',
            link: entities[0],
            path: 'components.particlesystem.localVelocityGraph',
            canRandomize: true,
            curves: ['X', 'Y', 'Z'],
            canOverrideTemplate: true
        });
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:localVelocityGraph', fieldLocalVelocity.parent.innerElement.firstChild.ui);

        // register override for second curve too
        editor.call('attributes:registerOverridePath', 'components.particlesystem.localVelocityGraph2', fieldLocalVelocity.parent.element);

        // velocityGraph
        var fieldVelocity = editor.call('attributes:addField', {
            parent: panel,
            name: 'Velocity',
            type: 'curveset',
            link: entities[0],
            path: 'components.particlesystem.velocityGraph',
            canRandomize: true,
            curves: ['X', 'Y', 'Z'],
            canOverrideTemplate: true
        });
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:velocityGraph', fieldVelocity.parent.innerElement.firstChild.ui);

        // register override for second curve too
        editor.call('attributes:registerOverridePath', 'components.particlesystem.velocityGraph2', fieldVelocity.parent.element);


        // radialSpeedGraph
        var fieldRadialSpeed = editor.call('attributes:addField', {
            parent: panel,
            name: 'Radial Speed',
            type: 'curveset',
            link: entities[0],
            path: 'components.particlesystem.radialSpeedGraph',
            canRandomize: true,
            curves: ['R'],
            canOverrideTemplate: true
        });
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:radialSpeedGraph', fieldRadialSpeed.parent.innerElement.firstChild.ui);

        // register override for second curve too
        editor.call('attributes:registerOverridePath', 'components.particlesystem.radialSpeedGraph2', fieldRadialSpeed.parent.element);

        // rotationSpeedGraph
        var fieldRotationSpeed = editor.call('attributes:addField', {
            parent: panel,
            name: 'Rotation Speed',
            type: 'curveset',
            link: entities[0],
            path: 'components.particlesystem.rotationSpeedGraph',
            canRandomize: true,
            curves: ['Angle'],
            verticalValue: 180,
            canOverrideTemplate: true
        });
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:rotationSpeedGraph', fieldRotationSpeed.parent.innerElement.firstChild.ui);

        // register override for second curve too
        editor.call('attributes:registerOverridePath', 'components.particlesystem.rotationSpeedGraph2', fieldRotationSpeed.parent.element);

        // scaleGraph
        var fieldScale = editor.call('attributes:addField', {
            parent: panel,
            name: 'Scale',
            type: 'curveset',
            link: entities[0],
            path: 'components.particlesystem.scaleGraph',
            canRandomize: true,
            curves: ['Scale'],
            verticalValue: 1,
            min: 0,
            canOverrideTemplate: true
        });
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:scaleGraph', fieldScale.parent.innerElement.firstChild.ui);

        // register override for second curve too
        editor.call('attributes:registerOverridePath', 'components.particlesystem.scaleGraph2', fieldScale.parent.element);

        // colorGraph
        var fieldColor = editor.call('attributes:addField', {
            parent: panel,
            name: 'Color',
            type: 'gradient',
            link: entities[0],
            path: 'components.particlesystem.colorGraph',
            gradient: true,
            curves: ['R', 'G', 'B'],
            max: 1,
            min: 0,
            canOverrideTemplate: true
        });
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:colorGraph', fieldColor.parent.innerElement.firstChild.ui);


        // alphaGraph
        var fieldAlpha = editor.call('attributes:addField', {
            parent: panel,
            name: 'Opacity',
            type: 'curveset',
            link: entities[0],
            path: 'components.particlesystem.alphaGraph',
            canRandomize: true,
            curves: ['Opacity'],
            min: 0,
            max: 1,
            canOverrideTemplate: true
        });
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:alphaGraph', fieldAlpha.parent.innerElement.firstChild.ui);

        // register override for second curve too
        editor.call('attributes:registerOverridePath', 'components.particlesystem.alphaGraph2', fieldAlpha.parent.element);

        if (entities.length > 1) {
            fieldLocalVelocity.disabled = true;
            fieldVelocity.disabled = true;
            fieldRotationSpeed.disabled = true;
            fieldScale.disabled = true;
            fieldColor.disabled = true;
            fieldAlpha.disabled = true;
            fieldRadialSpeed.disabled = true;
        }
    });
});
