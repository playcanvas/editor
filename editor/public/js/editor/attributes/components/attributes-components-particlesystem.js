editor.once('load', function() {
    'use strict';

    editor.on('attributes:inspect[entity]', function(entities) {
        var panelComponents = editor.call('attributes:entity.panelComponents');
        if (! panelComponents)
            return;


        // particlesystem
        var panel = editor.call('attributes:entity:addComponentPanel', {
            title: 'Particles',
            name: 'particlesystem',
            entities: entities
        });


        // controls
        var fieldControls = editor.call('attributes:addField', {
            parent: panel,
            name: 'Controls',
        });
        var label = fieldControls;
        fieldControls = fieldControls.parent;
        label.destroy();
        fieldControls.class.add('controls');

        var btnPlay = new ui.Button({
            text: '&#57649;'
        });
        btnPlay.on('click', function() {
            for(var i = 0; i < entities.length; i++) {
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

        var checkPlayingState = function() {
            var playing = -1;
            var looping = -1;

            for(var i = 0; i < entities.length; i++) {
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
        btnPlay.once('destroy', function() {
            clearInterval(evtCheckPlayingState);
        });


        var btnStop = new ui.Button({
            text: '	&#57653;'
        });
        btnStop.on('click', function() {
            for(var i = 0; i < entities.length; i++) {
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
        btnReset.on('click', function() {
            for(var i = 0; i < entities.length; i++) {
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


        // autoPlay
        var fieldAutoPlay = editor.call('attributes:addField', {
            parent: panel,
            name: 'Auto Play',
            type: 'checkbox',
            link: entities,
            path: 'components.particlesystem.autoPlay'
        });
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:autoPlay', fieldAutoPlay.parent.innerElement.firstChild.ui);


        // numParticles
        var fieldNumParticles = editor.call('attributes:addField', {
            parent: panel,
            name: 'Particle Count',
            type: 'number',
            link: entities,
            path: 'components.particlesystem.numParticles'
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
            path: 'components.particlesystem.lifetime'
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

        // emission rate to
        var fieldEmissionRateTo = editor.call('attributes:addField', {
            panel: panelEmissionRate,
            placeholder: 'To',
            type: 'number',
            link: entities,
            path: 'components.particlesystem.rate2'
        });
        fieldEmissionRateTo.style.width = '32px';


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

        // start angle to
        var fieldStartAngleTo = editor.call('attributes:addField', {
            panel: panelStartAngle,
            placeholder: 'To',
            type: 'number',
            link: entities,
            path: 'components.particlesystem.startAngle2'
        });
        fieldStartAngleTo.style.width = '32px';


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
            path: 'components.particlesystem.preWarm'
        });
        // label
        var labelPreWarm = new ui.Label({ text: 'Pre Warm' });
        labelPreWarm.class.add('label-infield');
        labelPreWarm.style.paddingRight = '12px';
        panelPlayback.append(labelPreWarm);
        // states
        fieldPreWarm.hidden = labelPreWarm.hidden = ! fieldLoop.value && ! fieldLoop.class.contains('null');
        fieldLoop.on('change', function(value) {
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
            path: 'components.particlesystem.lighting'
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
            path: 'components.particlesystem.halfLambert'
        });
        // label
        var labelHalfLambert = new ui.Label({ text: 'Half Lambert' });
        labelHalfLambert.class.add('label-infield');
        labelHalfLambert.style.paddingRight = '12px';
        panelLighting.append(labelHalfLambert);
        // state
        fieldHalfLambert.hidden = labelHalfLambert.hidden = ! fieldLighting.value && ! fieldLighting.class.contains('null');
        fieldLighting.on('change', function(value) {
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
            path: 'components.particlesystem.intensity'
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
            path: 'components.particlesystem.sort'
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
            path: 'components.particlesystem.blendType'
        });
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:blend', fieldBlendType.parent.innerElement.firstChild.ui);


        // stretch
        var fieldStretch = editor.call('attributes:addField', {
            parent: panel,
            name: 'Stretch',
            type: 'number',
            link: entities,
            path: 'components.particlesystem.stretch'
        });
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:stretch', fieldStretch.parent.innerElement.firstChild.ui);


        // alignToMotion
        var fieldAlignToMotion = editor.call('attributes:addField', {
            parent: panel,
            name: 'Align To Motion',
            type: 'checkbox',
            link: entities,
            path: 'components.particlesystem.alignToMotion'
        });
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:alignToMotion', fieldAlignToMotion.parent.innerElement.firstChild.ui);


        // emitterShape
        var fieldEmitterShape = editor.call('attributes:addField', {
            parent: panel,
            name: 'Emmiter Shape',
            type: 'number',
            enum: [
                { v: '', t: '...' },
                { v: 0, t: 'Box' },
                { v: 1, t: 'Sphere' }
            ],
            link: entities,
            path: 'components.particlesystem.emitterShape'
        });
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:emitterShape', fieldEmitterShape.parent.innerElement.firstChild.ui);


        // emitterExtents
        var fieldSpawnBounds = editor.call('attributes:addField', {
            parent: panel,
            name: 'Emmiter Extents',
            placeholder: [ 'X', 'Y', 'Z' ],
            type: 'vec3',
            link: entities,
            path: 'components.particlesystem.emitterExtents'
        });
        fieldSpawnBounds[0].parent.hidden = fieldEmitterShape.value !== 0 || fieldEmitterShape.class.contains('null');
        fieldEmitterShape.on('change', function(value) {
            fieldSpawnBounds[0].parent.hidden = value !== 0 || this.class.contains('null');
        });
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:emitterExtents', fieldSpawnBounds[0].parent.innerElement.firstChild.ui);


        // emitterRadius
        var fieldSpawnRadius = editor.call('attributes:addField', {
            parent: panel,
            name: 'Emmiter Radius',
            type: 'number',
            link: entities,
            path: 'components.particlesystem.emitterRadius'
        });
        fieldSpawnRadius.parent.hidden = fieldEmitterShape.value !== 1 || fieldEmitterShape.class.contains('null');
        fieldEmitterShape.on('change', function(value) {
            fieldSpawnRadius.parent.hidden = value !== 1 || this.class.contains('null');
        });
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:emitterRadius', fieldSpawnRadius.parent.innerElement.firstChild.ui);


        // wrap
        var fieldWrap = editor.call('attributes:addField', {
            parent: panel,
            name: 'Wrap',
            type: 'checkbox',
            link: entities,
            path: 'components.particlesystem.wrap'
        });
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:wrap', fieldWrap.parent.innerElement.firstChild.ui);


        // wrapBounds
        var fieldWrapBounds = editor.call('attributes:addField', {
            parent: panel,
            name: 'Wrap Bounds',
            placeholder: [ 'X', 'Y', 'Z' ],
            type: 'vec3',
            link: entities,
            path: 'components.particlesystem.wrapBounds'
        });
        fieldWrapBounds[0].parent.hidden = ! fieldWrap.value && ! fieldWrap.class.contains('null');
        fieldWrap.on('change', function(value) {
            fieldWrapBounds[0].parent.hidden = ! value && ! this.class.contains('null');
        });
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:wrapBounds', fieldWrapBounds[0].parent.innerElement.firstChild.ui);


        // colorMapAsset
        var fieldColorMap = editor.call('attributes:addField', {
            parent: panel,
            name: 'Color Map',
            type: 'asset',
            kind: 'texture',
            link: entities,
            path: 'components.particlesystem.colorMapAsset'
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
            path: 'components.particlesystem.normalMapAsset'
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
            path: 'components.particlesystem.animTilesX'
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
            path: 'components.particlesystem.animTilesY'
        });
        fieldAnimatedTextureTilesY.style.width = '50%';
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:animTilesY', fieldAnimatedTextureTilesY.parent.innerElement.firstChild.ui);

        panelFrames.hidden = !fieldColorMap.value && !fieldNormalMap.value;

        // frames to play
        var fieldAnimatedTextureNumFrames = editor.call('attributes:addField', {
            parent: panel,
            type: 'number',
            name: 'Frame Count',
            min: 1,
            link: entities,
            path: 'components.particlesystem.animNumFrames'
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
            path: 'components.particlesystem.animSpeed'
        });
        fieldAnimatedTextureSpeed.style.width = '50%';
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:animSpeed', fieldAnimatedTextureSpeed.parent.innerElement.firstChild.ui);


        // animation loop
        var fieldAnimatedTextureLoop = editor.call('attributes:addField', {
            parent: panelAnimationPlayback,
            type: 'checkbox',
            link: entities,
            path: 'components.particlesystem.animLoop'
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
            path: 'components.particlesystem.mesh'
        });
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:mesh', fieldMesh._label);


        // localVelocityGraph
        var fieldLocalVelocity = editor.call('attributes:addField', {
            parent: panel,
            name: 'Local Velocity',
            type: 'curveset',
            link: entities[0],
            paths: [ 'components.particlesystem.localVelocityGraph', 'components.particlesystem.localVelocityGraph2' ],
            curves: [ 'X', 'Y', 'Z' ]
        });
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:localVelocityGraph', fieldLocalVelocity.parent.innerElement.firstChild.ui);


        // velocityGraph
        var fieldVelocity = editor.call('attributes:addField', {
            parent: panel,
            name: 'Velocity',
            type: 'curveset',
            link: entities[0],
            paths: [ 'components.particlesystem.velocityGraph', 'components.particlesystem.velocityGraph2' ],
            curves: [ 'X', 'Y', 'Z' ]
        });
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:velocityGraph', fieldVelocity.parent.innerElement.firstChild.ui);


        // rotationSpeedGraph
        var fieldRotationSpeed = editor.call('attributes:addField', {
            parent: panel,
            name: 'Rotation Speed',
            type: 'curveset',
            link: entities[0],
            paths: [ 'components.particlesystem.rotationSpeedGraph', 'components.particlesystem.rotationSpeedGraph2' ],
            curves: [ 'Angle' ],
            verticalValue: 180
        });
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:rotationSpeedGraph', fieldRotationSpeed.parent.innerElement.firstChild.ui);


        // scaleGraph
        var fieldScale = editor.call('attributes:addField', {
            parent: panel,
            name: 'Scale',
            type: 'curveset',
            link: entities[0],
            paths: [ 'components.particlesystem.scaleGraph', 'components.particlesystem.scaleGraph2' ],
            curves: [ 'Scale' ],
            verticalValue: 1,
            min: 0
        });
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:scaleGraph', fieldScale.parent.innerElement.firstChild.ui);


        // colorGraph
        var fieldColor = editor.call('attributes:addField', {
            parent: panel,
            name: 'Color',
            type: 'curveset',
            link: entities[0],
            path: 'components.particlesystem.colorGraph',
            gradient: true,
            curves: [ 'R', 'G', 'B' ],
            max: 1,
            min: 0
        });
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:colorGraph', fieldColor.parent.innerElement.firstChild.ui);


        // alphaGraph
        var fieldAlpha = editor.call('attributes:addField', {
            parent: panel,
            name: 'Opacity',
            type: 'curveset',
            link: entities[0],
            paths: [ 'components.particlesystem.alphaGraph', 'components.particlesystem.alphaGraph2' ],
            curves: ['Opacity' ],
            min: 0,
            max: 1
        });
        // reference
        editor.call('attributes:reference:attach', 'particlesystem:alphaGraph', fieldAlpha.parent.innerElement.firstChild.ui);

        if (entities.length > 1) {
            fieldLocalVelocity.disabled = true;
            fieldVelocity.disabled = true;
            fieldRotationSpeed.disabled = true;
            fieldScale.disabled = true;
            fieldColor.disabled = true;
            fieldAlpha.disabled = true;
        }
    });
});
