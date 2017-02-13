editor.once('load', function() {
    'use strict';

    var fields = [{
        name: 'component',
        title: 'pc.ParticleSystemComponent',
        subTitle: '{pc.Component}',
        description: 'Used to simulate particles and produce renderable particle mesh in scene.',
        url: 'http://developer.playcanvas.com/api/pc.ParticleSystemComponent.html'
    }, {
        title: 'autoPlay',
        subTitle: '{Boolean}',
        description: 'If checked, the particle system will play immediately on creation. If this option is left unchecked, you will need to call the particle system component\'s play function from script.',
        url: 'http://developer.playcanvas.com/api/pc.ParticleSystemComponent.html#autoPlay'
    }, {
        title: 'alignToMotion',
        subTitle: '{Boolean}',
        description: 'Orient particle in their direction of motion.',
        url: 'http://developer.playcanvas.com/api/pc.ParticleSystemComponent.html#alignToMotion'
    }, {
        title: 'alphaGraph',
        subTitle: '{pc.Curve}',
        description: 'A curve defining how each particle\'s opacity changes over time. If two curves are specified in the curve editor, the opacity will be a random lerp between both curves.',
        url: 'http://developer.playcanvas.com/api/pc.ParticleSystemComponent.html#alphaGraph'
    }, {
        title: 'animTilesX',
        subTitle: '{Number}',
        description: 'Number of horizontal tiles in the sprite sheet',
        url: 'http://developer.playcanvas.com/api/pc.ParticleSystemComponent.html#animTilesX'
    }, {
        title: 'animTilesY',
        subTitle: '{Number}',
        description: 'Number of vertical tiles in the sprite sheet',
        url: 'http://developer.playcanvas.com/api/pc.ParticleSystemComponent.html#animTilesY'
    }, {
        title: 'animNumFrames',
        subTitle: '{Number}',
        description: 'Number of sprite sheet frames to play',
        url: 'http://developer.playcanvas.com/api/pc.ParticleSystemComponent.html#animNumFrames'
    }, {
        title: 'animSpeed',
        subTitle: '{Number}',
        description: 'Sprite sheet animation speed. 1 = particle lifetime, 2 = twice during lifetime etc...',
        url: 'http://developer.playcanvas.com/api/pc.ParticleSystemComponent.html#animSpeed'
    }, {
        title: 'animLoop',
        subTitle: '{Boolean}',
        description: 'If true then the sprite sheet animation will repeat indefinitely',
        url: 'http://developer.playcanvas.com/api/pc.ParticleSystemComponent.html#animLoop'
    }, {
        title: 'blend',
        subTitle: '{pc.BLEND_*}',
        description: 'The blending mode determines how particles are composited when they are written to the frame buffer. Let\'s consider that Prgb is the RGB color of a particle\'s pixel, Pa is its alpha value, and Drgb is the RGB color already in the frame buffer.',
        url: 'http://developer.playcanvas.com/api/pc.ParticleSystemComponent.html#blend'
    }, {
        title: 'colorGraph',
        subTitle: '{pc.CurveSet}',
        description: 'A curve defining how each particle\'s color changes over time.',
        url: 'http://developer.playcanvas.com/api/pc.ParticleSystemComponent.html#colorGraph'
    }, {
        title: 'colorMap',
        subTitle: '{pc.Texture}',
        description: 'The color map texture to apply to all particles in the system. If no texture asset is assigned, a default spot texture is used.',
        url: 'http://developer.playcanvas.com/api/pc.ParticleSystemComponent.html#colorMap'
    }, {
        title: 'depthSoftening',
        subTitle: '{Number}',
        description: 'This variable value determines how much particles fade out as they get closer to another surface. This avoids the situation where particles appear to cut into surfaces.',
        url: 'http://developer.playcanvas.com/api/pc.ParticleSystemComponent.html#depthSoftening'
    }, {
        title: 'depthWrite',
        subTitle: '{Boolean}',
        description: 'If checked, the particles will write depth information to the depth buffer. If unchecked, the depth buffer is left unchanged and particles will be guaranteed to overwrite one another in the order in which they are rendered.',
        url: 'http://developer.playcanvas.com/api/pc.ParticleSystemComponent.html#depthWrite'
    }, {
        title: 'emitterExtents',
        subTitle: '{pc.Vec3}',
        description: 'The half extents of a local space bounding box within which particles are spawned at random positions.',
        url: 'http://developer.playcanvas.com/api/pc.ParticleSystemComponent.html#emitterExtents'
    }, {
        title: 'emitterRadius',
        subTitle: '{Number}',
        description: 'The radius within which particles are spawned at random positions.',
        url: 'http://developer.playcanvas.com/api/pc.ParticleSystemComponent.html#emitterRadius'
    }, {
        title: 'emitterShape',
        subTitle: '{pc.EMITTERSHAPE_*}',
        description: 'Shape of the emitter. Can be: pc.EMITTERSHAPE_BOX, pc.EMITTERSHAPE_SPHERE.',
        url: 'http://developer.playcanvas.com/api/pc.ParticleSystemComponent.html#emitterShape'
    }, {
        title: 'halfLambert',
        subTitle: '{Boolean}',
        description: 'Enabling Half Lambert lighting avoids particles looking too flat when lights appear to be shining towards the back sides of the particles. It is a completely non-physical lighting model but can give more pleasing visual results. This option is only available when Lighting is enabled.',
        url: 'http://developer.playcanvas.com/api/pc.ParticleSystemComponent.html#halfLambert'
    }, {
        title: 'intensity',
        subTitle: '{Number}',
        description: 'Scales the color of particles to allow them to have arbitrary brightness.',
        url: 'http://developer.playcanvas.com/api/pc.ParticleSystemComponent.html#intensity'
    }, {
        title: 'lifetime',
        subTitle: '{Number}',
        description: 'The length of time in seconds between a particle\'s birth and its death.',
        url: 'http://developer.playcanvas.com/api/pc.ParticleSystemComponent.html#lifetime'
    }, {
        title: 'lighting',
        subTitle: '{Boolean}',
        description: 'If checked, the particle will be lit by the directional and ambient light in the scene. In some circumstances, it may be advisable to set a normal map on the particle system in order to achieve more realistic lighting.',
        url: 'http://developer.playcanvas.com/api/pc.ParticleSystemComponent.html#lighting'
    }, {
        title: 'localVelocityGraph',
        subTitle: '{pc.CurveSet}',
        description: 'A curve defining how each particle\'s velocity with respect to the particle system\'s local coordinate system changes over time. If two curves are specified in the curve editor, local velocity will be a random lerp between both curves.',
        url: 'http://developer.playcanvas.com/api/pc.ParticleSystemComponent.html#localVelocityGraph'
    }, {
        title: 'loop',
        subTitle: '{Boolean}',
        description: 'If checked, the particle system will emit indefinitely. Otherwise, it will emit the number of particles specified by the \'Particle Count\' property and then stop.',
        url: 'http://developer.playcanvas.com/api/pc.ParticleSystemComponent.html#loop'
    }, {
        title: 'mesh',
        subTitle: '{pc.Mesh}',
        description: 'A model asset. The first mesh found in the model is used to represent all particles rather than a flat billboard.',
        url: 'http://developer.playcanvas.com/api/pc.ParticleSystemComponent.html#mesh'
    }, {
        title: 'normalMap',
        subTitle: '{pc.Texture}',
        description: 'The normal map texture to apply to all particles in the system. Applying a normal map can make billboard particles appear more consistent with the scenes lighting.',
        url: 'http://developer.playcanvas.com/api/pc.ParticleSystemComponent.html#normalMap'
    }, {
        title: 'numParticles',
        subTitle: '{Number}',
        description: 'The maximum number of particles managed by this particle system.',
        url: 'http://developer.playcanvas.com/api/pc.ParticleSystemComponent.html#numParticles'
    }, {
        title: 'paused',
        subTitle: '{Boolean}',
        description: 'Pauses or unpauses the simulation.',
        url: 'http://developer.playcanvas.com/api/pc.ParticleSystemComponent.html#paused'
    }, {
        title: 'preWarm',
        subTitle: '{Boolean}',
        description: 'If enabled, the particle system will be initialized as though it had already completed a full cycle. This option is only available for looping particle systems.',
        url: 'http://developer.playcanvas.com/api/pc.ParticleSystemComponent.html#preWarm'
    }, {
        title: 'rate',
        subTitle: '{Number}',
        description: 'The bounds of the time range defining the interval in seconds between particle births. The time for the next particle emission will be chosen at random between rate and rate2.',
        url: 'http://developer.playcanvas.com/api/pc.ParticleSystemComponent.html#rate'
    }, {
        title: 'rotationSpeedGraph',
        subTitle: '{pc.Curve}',
        description: 'A curve defining how each particle\'s angular velocity changes over time. If two curves are specified in the curve editor, the angular velocity will be a random lerp between both curves.',
        url: 'http://developer.playcanvas.com/api/pc.ParticleSystemComponent.html#rotationSpeedGraph'
    }, {
        title: 'scaleGraph',
        subTitle: '{pc.Curve}',
        description: 'A curve defining how each particle\'s scale changes over time. By default, a particle is 1 unit in width and height. If two curves are specified in the curve editor, the scale will be a random lerp between both curves.',
        url: 'http://developer.playcanvas.com/api/pc.ParticleSystemComponent.html#scaleGraph'
    }, {
        title: 'sort',
        subTitle: '{pc.PARTICLESORT_*}',
        description: 'Sorting mode gives you control over the order in which particles are rendered. The options are: None: Particles are rendered in arbitrary order. When this option is selected, the particle system is simulated on the GPU (if the underlying hardware supports floating point textures) and it is recommended you use this setting to get the best performance. Camera Distance: Particles are sorted on the CPU and rendered in back to front order (in terms of camera z depth). Newer First: Particles are sorted on the CPU and rendered in age order, youngest first. Older First: Particles are sorted on the CPU and rendered in age order, oldest first.',
        url: 'http://developer.playcanvas.com/api/pc.ParticleSystemComponent.html#sort'
    }, {
        title: 'startAngle',
        subTitle: '{Number}',
        description: 'The bounds of the initial particle rotation specified in degrees. For each particle, this angle is chosen at random between startAngle and startAngle2.',
        url: 'http://developer.playcanvas.com/api/pc.ParticleSystemComponent.html#startAngle'
    }, {
        title: 'stretch',
        subTitle: '{Number}',
        description: 'A value in world units that controls the amount by which particles are stretched based on their velocity. Particles are stretched from their center towards their previous position.',
        url: 'http://developer.playcanvas.com/api/pc.ParticleSystemComponent.html#stretch'
    }, {
        title: 'velocityGraph',
        subTitle: '{pc.CurveSet}',
        description: 'A curve defining how each particle\'s velocity with respect to the world coordinate system changes over time. If two curves are specified in the curve editor, velocity will be a random lerp between both curves.',
        url: 'http://developer.playcanvas.com/api/pc.ParticleSystemComponent.html#velocityGraph'
    }, {
        title: 'wrap',
        subTitle: '{Boolean}',
        description: 'Enables wrap bounds.',
        url: 'http://developer.playcanvas.com/api/pc.ParticleSystemComponent.html#wrap'
    }, {
        title: 'wrapBounds',
        subTitle: '{pc.Vec3}',
        description: 'World space AABB volume centered on the owner entity\'s position. If a particle crosses the boundary of one side of the volume, it teleports to the opposite side. You can use this to make environmental effects like rain by moving a wrapped emitter\'s owner entity.',
        url: 'http://developer.playcanvas.com/api/pc.ParticleSystemComponent.html#wrapBounds'
    }];

    for(var i = 0; i < fields.length; i++) {
        fields[i].name = 'particlesystem:' + (fields[i].name || fields[i].title);
        editor.call('attributes:reference:add', fields[i]);
    }
});
