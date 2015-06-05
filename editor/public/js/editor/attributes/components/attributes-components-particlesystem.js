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


        // autoPlay
        var fieldAutoPlay = editor.call('attributes:addField', {
            parent: panel,
            name: 'Auto Play',
            type: 'checkbox',
            link: entities,
            path: 'components.particlesystem.autoPlay'
        });
        // reference
        editor.call('attributes:reference:particlesystem:autoPlay:attach', fieldAutoPlay.parent.innerElement.firstChild.ui);


        // numParticles
        var fieldNumParticles = editor.call('attributes:addField', {
            parent: panel,
            name: 'Particle Count',
            type: 'number',
            link: entities,
            path: 'components.particlesystem.numParticles'
        });
        // reference
        editor.call('attributes:reference:particlesystem:numParticles:attach', fieldNumParticles.parent.innerElement.firstChild.ui);


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
        editor.call('attributes:reference:particlesystem:lifetime:attach', fieldLifetime.parent.innerElement.firstChild.ui);


        // emission rate
        var panelEmissionRate = editor.call('attributes:addField', {
            parent: panel,
            name: 'Emission Rate'
        });
        var label = panelEmissionRate;
        panelEmissionRate = panelEmissionRate.parent;
        label.destroy();
        // reference
        editor.call('attributes:reference:particlesystem:rate:attach', panelEmissionRate.innerElement.firstChild.ui);

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
        editor.call('attributes:reference:particlesystem:startAngle:attach', panelStartAngle.innerElement.firstChild.ui);

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
        editor.call('attributes:reference:particlesystem:loop:attach', label);


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
        editor.call('attributes:reference:particlesystem:preWarm:attach', labelPreWarm);



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
        editor.call('attributes:reference:particlesystem:lighting:attach', label);


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
        fieldHalfLambert.hidden = labelHalfLambert.hidden = ! fieldHalfLambert.value && ! fieldHalfLambert.class.contains('null');
        fieldLighting.on('change', function(value) {
            fieldHalfLambert.hidden = labelHalfLambert.hidden = ! value && ! this.class.contains('null');
        });
        // reference
        editor.call('attributes:reference:particlesystem:halfLambert:attach', labelHalfLambert);


        // intensity
        var fieldIntensity = editor.call('attributes:addField', {
            parent: panel,
            name: 'Intensity',
            type: 'number',
            link: entities,
            path: 'components.particlesystem.intensity'
        });
        // reference
        editor.call('attributes:reference:particlesystem:intensity:attach', fieldIntensity.parent.innerElement.firstChild.ui);


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
        editor.call('attributes:reference:particlesystem:depthWrite:attach', label);

        // depthSoftening
        var fieldDepthSoftening = editor.call('attributes:addField', {
            panel: panelDepth,
            placeholder: 'Softening',
            type: 'number',
            link: entities,
            path: 'components.particlesystem.depthWrite'
        });
        // reference
        editor.call('attributes:reference:particlesystem:depthSoftening:attach', fieldDepthSoftening);


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
        editor.call('attributes:reference:particlesystem:sort:attach', fieldSort.parent.innerElement.firstChild.ui);


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
        editor.call('attributes:reference:particlesystem:blend:attach', fieldBlendType.parent.innerElement.firstChild.ui);


        // stretch
        var fieldStretch = editor.call('attributes:addField', {
            parent: panel,
            name: 'Stretch',
            type: 'number',
            link: entities,
            path: 'components.particlesystem.stretch'
        });
        // reference
        editor.call('attributes:reference:particlesystem:stretch:attach', fieldStretch.parent.innerElement.firstChild.ui);


        // alignToMotion
        var fieldAlignToMotion = editor.call('attributes:addField', {
            parent: panel,
            name: 'Align To Motion',
            type: 'checkbox',
            link: entities,
            path: 'components.particlesystem.alignToMotion'
        });
        // reference
        editor.call('attributes:reference:particlesystem:alignToMotion:attach', fieldAlignToMotion.parent.innerElement.firstChild.ui);


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
        editor.call('attributes:reference:particlesystem:emitterShape:attach', fieldEmitterShape.parent.innerElement.firstChild.ui);


        // emitterExtents
        var fieldSpawnBounds = editor.call('attributes:addField', {
            parent: panel,
            name: 'Emmiter Extents',
            placeholder: [ 'X', 'Y', 'Z' ],
            type: 'vec3',
            link: entities,
            path: 'components.particlesystem.emitterExtents'
        });
        // reference
        editor.call('attributes:reference:particlesystem:emitterExtents:attach', fieldSpawnBounds[0].parent.innerElement.firstChild.ui);


        // wrap
        var fieldWrap = editor.call('attributes:addField', {
            parent: panel,
            name: 'Wrap',
            type: 'checkbox',
            link: entities,
            path: 'components.particlesystem.wrap'
        });
        // reference
        editor.call('attributes:reference:particlesystem:wrap:attach', fieldWrap.parent.innerElement.firstChild.ui);


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
        editor.call('attributes:reference:particlesystem:wrapBounds:attach', fieldWrapBounds[0].parent.innerElement.firstChild.ui);


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
        editor.call('attributes:reference:particlesystem:colorMap:attach', fieldColorMap._label);


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
        editor.call('attributes:reference:particlesystem:normalMap:attach', fieldNormalMap._label);


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
        editor.call('attributes:reference:particlesystem:mesh:attach', fieldMesh._label);


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
        editor.call('attributes:reference:particlesystem:localVelocityGraph:attach', fieldLocalVelocity.parent.innerElement.firstChild.ui);


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
        editor.call('attributes:reference:particlesystem:velocityGraph:attach', fieldVelocity.parent.innerElement.firstChild.ui);


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
        editor.call('attributes:reference:particlesystem:rotationSpeedGraph:attach', fieldRotationSpeed.parent.innerElement.firstChild.ui);


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
        editor.call('attributes:reference:particlesystem:scaleGraph:attach', fieldScale.parent.innerElement.firstChild.ui);


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
        editor.call('attributes:reference:particlesystem:colorGraph:attach', fieldColor.parent.innerElement.firstChild.ui);


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
        editor.call('attributes:reference:particlesystem:alphaGraph:attach', fieldAlpha.parent.innerElement.firstChild.ui);

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
