editor.once('load', function() {
    'use strict';

    editor.on('attributes:inspect[entity]', function(entities) {
        if (entities.length !== 1)
            return;

        var entity = entities[0];

        var panelComponents = editor.call('attributes:entity.panelComponents');
        if (! panelComponents)
            return;


        // particlesystem
        var panel = editor.call('attributes:addPanel', {
            parent: panelComponents,
            name: 'Particles'
        });
        panel.class.add('component');

        if (! entity.get('components.particlesystem')) {
            panel.disabled = true;
            panel.hidden = true;
        }
        var evtComponentSet = entity.on('components.particlesystem:set', function(value) {
            panel.disabled = ! value;
            panel.hidden = ! value;
        });
        var evtComponentUnset = entity.on('components.particlesystem:unset', function() {
            panel.disabled = true;
            panel.hidden = true;
        });
        panel.on('destroy', function() {
            evtComponentSet.unbind();
            evtComponentUnset.unbind();
        });


        // enabled
        var fieldEnabled = new ui.Checkbox();
        fieldEnabled.class.add('component-toggle');
        fieldEnabled.link(entity, 'components.particlesystem.enabled');
        panel.headerAppend(fieldEnabled);

        // remove
        var fieldRemove = new ui.Button();
        fieldRemove.class.add('component-remove');
        fieldRemove.on('click', function(value) {
            entity.unset('components.particlesystem');
        });
        panel.headerAppend(fieldRemove);


        // autoPlay
        editor.call('attributes:addField', {
            parent: panel,
            name: 'Auto Play',
            type: 'checkbox',
            link: entity,
            path: 'components.particlesystem.autoPlay'
        });


        // numParticles
        editor.call('attributes:addField', {
            parent: panel,
            name: 'Particle Count',
            type: 'number',
            link: entity,
            path: 'components.particlesystem.numParticles'
        });


        // lifetime
        editor.call('attributes:addField', {
            parent: panel,
            name: 'Lifetime',
            placeholder: 'Seconds',
            type: 'number',
            link: entity,
            path: 'components.particlesystem.lifetime'
        });


        // emission rate
        var panelEmissionRate = editor.call('attributes:addField', {
            parent: panel,
            name: 'Emission Rate'
        });

        var label = panelEmissionRate;
        panelEmissionRate = panelEmissionRate.parent;
        label.destroy();

        // emission rate from
        var fieldEmissionRateFrom = new ui.NumberField();
        fieldEmissionRateFrom.placeholder = 'From';
        fieldEmissionRateFrom.style.width = '32px';
        fieldEmissionRateFrom.flexGrow = 1;
        fieldEmissionRateFrom.link(entity, 'components.particlesystem.rate');
        panelEmissionRate.append(fieldEmissionRateFrom);

        // emission rate to
        var fieldEmissionRateTo = new ui.NumberField();
        fieldEmissionRateTo.placeholder = 'To';
        fieldEmissionRateTo.style.width = '32px';
        fieldEmissionRateTo.flexGrow = 1;
        fieldEmissionRateTo.link(entity, 'components.particlesystem.rate2');
        panelEmissionRate.append(fieldEmissionRateTo);


        // start angle
        var panelStartAngle = editor.call('attributes:addField', {
            parent: panel,
            name: 'Start Angle'
        });

        var label = panelStartAngle;
        panelStartAngle = panelStartAngle.parent;
        label.destroy();

        // emission rate from
        var fieldStartAngleFrom = new ui.NumberField();
        fieldStartAngleFrom.placeholder = 'From';
        fieldStartAngleFrom.style.width = '32px';
        fieldStartAngleFrom.flexGrow = 1;
        fieldStartAngleFrom.link(entity, 'components.particlesystem.startAngle');
        panelStartAngle.append(fieldStartAngleFrom);

        // emission rate to
        var fieldStartAngleTo = new ui.NumberField();
        fieldStartAngleTo.placeholder = 'To';
        fieldStartAngleTo.style.width = '32px';
        fieldStartAngleTo.flexGrow = 1;
        fieldStartAngleTo.link(entity, 'components.particlesystem.startAngle2');
        panelStartAngle.append(fieldStartAngleTo);


        // playback
        var panelPlayback = editor.call('attributes:addField', {
            parent: panel,
            name: 'Playback'
        });

        var label = panelPlayback;
        panelPlayback = panelPlayback.parent;
        label.destroy();

        // loop
        var fieldLoop = new ui.Checkbox();
        fieldLoop.link(entity, 'components.particlesystem.loop');
        panelPlayback.append(fieldLoop);
        // label
        var label = new ui.Label({ text: 'Loop' });
        label.class.add('label-infield');
        label.style.paddingRight = '12px';
        panelPlayback.append(label);


        // preWarm
        var fieldPreWarm = new ui.Checkbox();
        fieldPreWarm.link(entity, 'components.particlesystem.preWarm');
        panelPlayback.append(fieldPreWarm);
        // label
        var labelPreWarm = new ui.Label({ text: 'Pre Warm' });
        labelPreWarm.class.add('label-infield');
        labelPreWarm.style.paddingRight = '12px';
        panelPlayback.append(labelPreWarm);

        fieldPreWarm.hidden = ! entity.get('components.particlesystem.loop');
        labelPreWarm.hidden = fieldPreWarm.hidden;
        fieldLoop.on('change', function(value) {
            fieldPreWarm.hidden = ! value;
            labelPreWarm.hidden = fieldPreWarm.hidden;
        });



        // lighting
        var panelLighting = editor.call('attributes:addField', {
            parent: panel,
            name: 'Lighting'
        });

        var label = panelLighting;
        panelLighting = panelLighting.parent;
        label.destroy();

        // lighting
        var fieldLighting = new ui.Checkbox();
        fieldLighting.link(entity, 'components.particlesystem.lighting');
        panelLighting.append(fieldLighting);
        // label
        var label = new ui.Label({ text: 'Enabled' });
        label.class.add('label-infield');
        label.style.paddingRight = '12px';
        label.class.add('label-infield');
        panelLighting.append(label);


        // halfLambert
        var fieldHalfLambert = new ui.Checkbox();
        fieldHalfLambert.link(entity, 'components.particlesystem.halfLambert');
        panelLighting.append(fieldHalfLambert);
        // label
        var labelHalfLambert = new ui.Label({ text: 'Half Lambert' });
        labelHalfLambert.class.add('label-infield');
        labelHalfLambert.style.paddingRight = '12px';
        panelLighting.append(labelHalfLambert);

        fieldHalfLambert.hidden = ! entity.get('components.particlesystem.halfLambert');
        labelHalfLambert.hidden = fieldHalfLambert.hidden;
        fieldLighting.on('change', function(value) {
            fieldHalfLambert.hidden = ! value;
            labelHalfLambert.hidden = fieldHalfLambert.hidden;
        });


        // intensity
        editor.call('attributes:addField', {
            parent: panel,
            name: 'Intensity',
            type: 'number',
            link: entity,
            path: 'components.particlesystem.intensity'
        });


        // depth
        var panelDepth = editor.call('attributes:addField', {
            parent: panel,
            name: 'Depth'
        });

        var label = panelDepth;
        panelDepth = panelDepth.parent;
        label.destroy();

        // depthWrite
        var fieldDepthWrite = new ui.Checkbox();
        fieldDepthWrite.link(entity, 'components.particlesystem.depthWrite');
        panelDepth.append(fieldDepthWrite);
        // label
        var label = new ui.Label({ text: 'Write' });
        label.class.add('label-infield');
        label.style.paddingRight = '12px';
        panelDepth.append(label);

        // depthSoftening
        var fieldDepthSoftening = new ui.NumberField();
        fieldDepthSoftening.flexGrow = 1;
        fieldDepthSoftening.placeholder = 'Softening';
        fieldDepthSoftening.link(entity, 'components.particlesystem.depthSoftening');
        panelDepth.append(fieldDepthSoftening);


        // sort
        editor.call('attributes:addField', {
            parent: panel,
            name: 'Sort',
            type: 'number',
            enum: {
                0: 'None',
                1: 'Camera Distance',
                2: 'Newest First',
                3: 'Oldest First'
            },
            link: entity,
            path: 'components.particlesystem.sort'
        });


        // blendType
        editor.call('attributes:addField', {
            parent: panel,
            name: 'Blend Type',
            type: 'number',
            enum: {
                2: 'Alpha',
                1: 'Additive',
                5: 'Multiply'
            },
            link: entity,
            path: 'components.particlesystem.blendType'
        });


        // stretch
        editor.call('attributes:addField', {
            parent: panel,
            name: 'Stretch',
            type: 'number',
            link: entity,
            path: 'components.particlesystem.stretch'
        });


        // alignToMotion
        editor.call('attributes:addField', {
            parent: panel,
            name: 'Align To Motion',
            type: 'checkbox',
            link: entity,
            path: 'components.particlesystem.alignToMotion'
        });


        // emitterShape
        var fieldEmitterShape = editor.call('attributes:addField', {
            parent: panel,
            name: 'Emmiter Shape',
            type: 'number',
            enum: {
                0: 'Box',
                1: 'Sphere'
            },
            link: entity,
            path: 'components.particlesystem.emitterShape'
        });


        // emitterExtents
        var fieldSpawnBounds = editor.call('attributes:addField', {
            parent: panel,
            name: 'Emmiter Extents',
            placeholder: [ 'X', 'Y', 'Z' ],
            type: 'vec3',
            link: entity,
            path: 'components.particlesystem.emitterExtents'
        });


        // wrap
        var fieldWrap = editor.call('attributes:addField', {
            parent: panel,
            name: 'Wrap',
            type: 'checkbox',
            link: entity,
            path: 'components.particlesystem.wrap'
        });


        // wrapBounds
        var fieldWrapBounds = editor.call('attributes:addField', {
            parent: panel,
            name: 'Wrap Bounds',
            placeholder: [ 'X', 'Y', 'Z' ],
            type: 'vec3',
            link: entity,
            path: 'components.particlesystem.wrapBounds'
        });
        fieldWrapBounds[0].parent.hidden = ! entity.get('components.particlesystem.wrap');
        fieldWrap.on('change', function(value) {
            fieldWrapBounds[0].parent.hidden = ! value;
        });


        // colorMapAsset
        editor.call('attributes:addField', {
            parent: panel,
            name: 'Color Map',
            type: 'asset',
            kind: 'texture',
            link: entity,
            path: 'components.particlesystem.colorMapAsset'
        });


        // normalMapAsset
        editor.call('attributes:addField', {
            parent: panel,
            name: 'Normal Map',
            type: 'asset',
            kind: 'texture',
            link: entity,
            path: 'components.particlesystem.normalMapAsset'
        });


        // mesh
        editor.call('attributes:addField', {
            parent: panel,
            name: 'Mesh',
            type: 'asset',
            kind: 'model',
            link: entity,
            path: 'components.particlesystem.mesh'
        });


        // localVelocityGraph
        editor.call('attributes:addField', {
            parent: panel,
            name: 'Local Velocity',
            type: 'curveset',
            link: entity,
            paths: ['components.particlesystem.localVelocityGraph', 'components.particlesystem.localVelocityGraph2'],
            curves: ['X', 'Y', 'Z']
        });

        // velocityGraph
        editor.call('attributes:addField', {
            parent: panel,
            name: 'Velocity',
            type: 'curveset',
            link: entity,
            paths: ['components.particlesystem.velocityGraph', 'components.particlesystem.velocityGraph2'],
            curves: ['X', 'Y', 'Z']
        });

        // rotationSpeedGraph
        editor.call('attributes:addField', {
            parent: panel,
            name: 'Rotation Speed',
            type: 'curveset',
            link: entity,
            paths: ['components.particlesystem.rotationSpeedGraph', 'components.particlesystem.rotationSpeedGraph2'],
            curves: ['Angle'],
            verticalValue: 180
        });

        // scaleGraph
        editor.call('attributes:addField', {
            parent: panel,
            name: 'Scale',
            type: 'curveset',
            link: entity,
            paths: ['components.particlesystem.scaleGraph', 'components.particlesystem.scaleGraph2'],
            curves: ['Scale'],
            verticalValue: 1,
            min: 0
        });

        // colorGraph
        editor.call('attributes:addField', {
            parent: panel,
            name: 'Color',
            type: 'curveset',
            link: entity,
            path: 'components.particlesystem.colorGraph',
            gradient: true,
            curves: ['R', 'G', 'B'],
            max: 1,
            min: 0
        });

        // alphaGraph
        editor.call('attributes:addField', {
            parent: panel,
            name: 'Opacity',
            type: 'curveset',
            link: entity,
            paths: ['components.particlesystem.alphaGraph', 'components.particlesystem.alphaGraph2'],
            curves: ['Opacity'],
            min: 0,
            max: 1
        });

    });
});
