/**
 * @type {AttributeReference[]}
 */
export const fields  = [{
    name: 'particlesystem:component',
    title: 'pc.ParticleSystemComponent',
    subTitle: '{pc.Component}',
    description: 'Used to simulate particles and produce renderable particle mesh in scene.',
    url: 'https://api.playcanvas.com/engine/classes/ParticleSystemComponent.html'
}, {
    name: 'particlesystem:autoPlay',
    title: 'autoPlay',
    subTitle: '{Boolean}',
    description: 'If checked, the particle system will play immediately on creation. If this option is left unchecked, you will need to call the particle system component\'s play function from script.',
    url: 'https://api.playcanvas.com/engine/classes/ParticleSystemComponent.html#autoplay'
}, {
    name: 'particlesystem:alignToMotion',
    title: 'alignToMotion',
    subTitle: '{Boolean}',
    description: 'Orient particle in their direction of motion.',
    url: 'https://api.playcanvas.com/engine/classes/ParticleSystemComponent.html#aligntomotion'
}, {
    name: 'particlesystem:alphaGraph',
    title: 'alphaGraph',
    subTitle: '{pc.Curve}',
    description: 'A curve defining how each particle\'s opacity changes over time. If two curves are specified in the curve editor, the opacity will be a random lerp between both curves.',
    url: 'https://api.playcanvas.com/engine/classes/ParticleSystemComponent.html#alphagraph'
}, {
    name: 'particlesystem:animTiles',
    title: 'animTilesX / animTilesY',
    subTitle: '{Number}',
    description: 'Number of horizontal / vertical tiles in the sprite sheet',
    url: 'https://api.playcanvas.com/engine/classes/ParticleSystemComponent.html#animtilesx'

}, {
    name: 'particlesystem:animTilesX',
    title: 'animTilesX',
    subTitle: '{Number}',
    description: 'Number of horizontal tiles in the sprite sheet',
    url: 'https://api.playcanvas.com/engine/classes/ParticleSystemComponent.html#animtilesx'
}, {
    name: 'particlesystem:animTilesY',
    title: 'animTilesY',
    subTitle: '{Number}',
    description: 'Number of vertical tiles in the sprite sheet',
    url: 'https://api.playcanvas.com/engine/classes/ParticleSystemComponent.html#animtilesy'
}, {
    name: 'particlesystem:animStartFrame',
    title: 'animStartFrame',
    subTitle: '{Number}',
    description: 'Sprite sheet frame in animation to begin animating from',
    url: 'https://api.playcanvas.com/engine/classes/ParticleSystemComponent.html#animstartframe'
}, {
    name: 'particlesystem:animNumFrames',
    title: 'animNumFrames',
    subTitle: '{Number}',
    description: 'Number of sprite sheet frames in each animation',
    url: 'https://api.playcanvas.com/engine/classes/ParticleSystemComponent.html#animnumframes'
}, {
    name: 'particlesystem:animNumAnimations',
    title: 'animNumAnimations',
    subTitle: '{Number}',
    description: 'Number of animations contained in the sprite sheet',
    url: 'https://api.playcanvas.com/engine/classes/ParticleSystemComponent.html#animnumanimations'
}, {
    name: 'particlesystem:animIndex',
    title: 'animIndex',
    subTitle: '{Number}',
    description: 'The animation from the sprite sheet to play for each particle in the system',
    url: 'https://api.playcanvas.com/engine/classes/ParticleSystemComponent.html#animindex'
}, {
    name: 'particlesystem:randomizeAnimIndex',
    title: 'randomizeAnimIndex',
    subTitle: '{Number}',
    description: 'If true then each particle will play a randomly selected animation from the sprite sheet, otherwise it always use the animation specified by animIndex',
    url: 'https://api.playcanvas.com/engine/classes/ParticleSystemComponent.html#randomizeanimindex'
}, {
    name: 'particlesystem:animSpeed',
    title: 'animSpeed',
    subTitle: '{Number}',
    description: 'Sprite sheet animation speed. 1 = particle lifetime, 2 = twice during lifetime etc...',
    url: 'https://api.playcanvas.com/engine/classes/ParticleSystemComponent.html#animspeed'
}, {
    name: 'particlesystem:animLoop',
    title: 'animLoop',
    subTitle: '{Boolean}',
    description: 'If true then the sprite sheet animation will repeat indefinitely',
    url: 'https://api.playcanvas.com/engine/classes/ParticleSystemComponent.html#animloop'
}, {
    name: 'particlesystem:blend',
    title: 'blend',
    subTitle: '{pc.BLEND_*}',
    description: 'The blending mode determines how particles are composited when they are written to the frame buffer. Let\'s consider that Prgb is the RGB color of a particle\'s pixel, Pa is its alpha value, and Drgb is the RGB color already in the frame buffer.',
    url: 'https://api.playcanvas.com/engine/classes/ParticleSystemComponent.html#blend'
}, {
    name: 'particlesystem:colorGraph',
    title: 'colorGraph',
    subTitle: '{pc.CurveSet}',
    description: 'A curve defining how each particle\'s color changes over time.',
    url: 'https://api.playcanvas.com/engine/classes/ParticleSystemComponent.html#colorgraph'
}, {
    name: 'particlesystem:colorMap',
    title: 'colorMap',
    subTitle: '{pc.Texture}',
    description: 'The color map texture to apply to all particles in the system. If no texture asset is assigned, a default spot texture is used.',
    url: 'https://api.playcanvas.com/engine/classes/ParticleSystemComponent.html#colormap'
}, {
    name: 'particlesystem:orientation',
    title: 'orientation',
    subTitle: '{pc.PARTICLEORIENTATION_*}',
    description: 'Orientation mode controls particle planes facing. The options are: Screen: Particles are facing camera. World Normal: User defines world space normal to set planes orientation. Emitter Normal: Similar to previous, but the normal is affected by emitter(entity) transformation.',
    url: 'https://api.playcanvas.com/engine/classes/ParticleSystemComponent.html#orientation'
}, {
    name: 'particlesystem:particleNormal',
    title: 'particleNormal',
    subTitle: '{pc.Vec3}',
    description: 'Either world or emitter space vector to define particle plane orientation.',
    url: 'https://api.playcanvas.com/engine/classes/ParticleSystemComponent.html#particlenormal'
}, {
    name: 'particlesystem:depthSoftening',
    title: 'depthSoftening',
    subTitle: '{Number}',
    description: 'This variable value determines how much particles fade out as they get closer to another surface. This avoids the situation where particles appear to cut into surfaces.',
    url: 'https://api.playcanvas.com/engine/classes/ParticleSystemComponent.html#depthsoftening'
}, {
    name: 'particlesystem:depthWrite',
    title: 'depthWrite',
    subTitle: '{Boolean}',
    description: 'If checked, the particles will write depth information to the depth buffer. If unchecked, the depth buffer is left unchanged and particles will be guaranteed to overwrite one another in the order in which they are rendered.',
    url: 'https://api.playcanvas.com/engine/classes/ParticleSystemComponent.html#depthwrite'
}, {
    name: 'particlesystem:emitterExtents',
    title: 'emitterExtents',
    subTitle: '{pc.Vec3}',
    description: 'The half extents of a local space bounding box within which particles are spawned at random positions.',
    url: 'https://api.playcanvas.com/engine/classes/ParticleSystemComponent.html#emitterextents'
}, {
    name: 'particlesystem:emitterExtentsInner',
    title: 'emitterExtentsInner',
    subTitle: '{pc.Vec3}',
    description: 'The exception volume of a local space bounding box within which particles are not spawned.',
    url: 'https://api.playcanvas.com/engine/classes/ParticleSystemComponent.html#emitterextents'
}, {
    name: 'particlesystem:emitterRadius',
    title: 'emitterRadius',
    subTitle: '{Number}',
    description: 'The radius within which particles are spawned at random positions.',
    url: 'https://api.playcanvas.com/engine/classes/ParticleSystemComponent.html#emitterradius'
}, {
    name: 'particlesystem:emitterRadiusInner',
    title: 'emitterRadiusInner',
    subTitle: '{Number}',
    description: 'The inner sphere radius within which particles are not spawned',
    url: 'https://api.playcanvas.com/engine/classes/ParticleSystemComponent.html#emitterradius'
}, {
    name: 'particlesystem:emitterShape',
    title: 'emitterShape',
    subTitle: '{pc.EMITTERSHAPE_*}',
    description: 'Shape of the emitter. Can be: pc.EMITTERSHAPE_BOX, pc.EMITTERSHAPE_SPHERE.',
    url: 'https://api.playcanvas.com/engine/classes/ParticleSystemComponent.html#emittershape'
}, {
    name: 'particlesystem:halfLambert',
    title: 'halfLambert',
    subTitle: '{Boolean}',
    description: 'Enabling Half Lambert lighting avoids particles looking too flat when lights appear to be shining towards the back sides of the particles. It is a completely non-physical lighting model but can give more pleasing visual results. This option is only available when Lighting is enabled.',
    url: 'https://api.playcanvas.com/engine/classes/ParticleSystemComponent.html#halflambert'
}, {
    name: 'particlesystem:intensity',
    title: 'intensity',
    subTitle: '{Number}',
    description: 'Scales the color of particles to allow them to have arbitrary brightness.',
    url: 'https://api.playcanvas.com/engine/classes/ParticleSystemComponent.html#intensity'
}, {
    name: 'particlesystem:lifetime',
    title: 'lifetime',
    subTitle: '{Number}',
    description: 'The length of time in seconds between a particle\'s birth and its death.',
    url: 'https://api.playcanvas.com/engine/classes/ParticleSystemComponent.html#lifetime'
}, {
    name: 'particlesystem:lighting',
    title: 'lighting',
    subTitle: '{Boolean}',
    description: 'If checked, the particle will be lit by the directional and ambient light in the scene. In some circumstances, it may be advisable to set a normal map on the particle system in order to achieve more realistic lighting.',
    url: 'https://api.playcanvas.com/engine/classes/ParticleSystemComponent.html#lighting'
}, {
    name: 'particlesystem:localVelocityGraph',
    title: 'localVelocityGraph',
    subTitle: '{pc.CurveSet}',
    description: 'A curve defining how each particle\'s velocity with respect to the particle system\'s local coordinate system changes over time. If two curves are specified in the curve editor, local velocity will be a random lerp between both curves.',
    url: 'https://api.playcanvas.com/engine/classes/ParticleSystemComponent.html#localvelocitygraph'
}, {
    name: 'particlesystem:loop',
    title: 'loop',
    subTitle: '{Boolean}',
    description: 'If checked, the particle system will emit indefinitely. Otherwise, it will emit the number of particles specified by the \'Particle Count\' property and then stop.',
    url: 'https://api.playcanvas.com/engine/classes/ParticleSystemComponent.html#loop'
}, {
    name: 'particlesystem:mesh',
    title: 'mesh',
    subTitle: '{pc.Asset}',
    description: 'A model asset. The first mesh found in the model is used to represent all particles rather than a flat billboard.',
    url: 'https://api.playcanvas.com/engine/classes/ParticleSystemComponent.html#mesh'
}, {
    name: 'particlesystem:renderAsset',
    title: 'renderAsset',
    subTitle: '{pc.Asset}',
    description: 'A render asset which can be used instead of the model asset to render a mesh-based particle.',
    url: 'https://api.playcanvas.com/engine/classes/ParticleSystemComponent.html#renderasset'
}, {
    name: 'particlesystem:normalMap',
    title: 'normalMap',
    subTitle: '{pc.Texture}',
    description: 'The normal map texture to apply to all particles in the system. Applying a normal map can make billboard particles appear more consistent with the scenes lighting.',
    url: 'https://api.playcanvas.com/engine/classes/ParticleSystemComponent.html#normalmap'
}, {
    name: 'particlesystem:numParticles',
    title: 'numParticles',
    subTitle: '{Number}',
    description: 'The maximum number of particles managed by this particle system.',
    url: 'https://api.playcanvas.com/engine/classes/ParticleSystemComponent.html#numparticles'
}, {
    name: 'particlesystem:paused',
    title: 'paused',
    subTitle: '{Boolean}',
    description: 'Pauses or unpauses the simulation.',
    url: 'https://api.playcanvas.com/engine/classes/ParticleSystemComponent.html#paused'
}, {
    name: 'particlesystem:preWarm',
    title: 'preWarm',
    subTitle: '{Boolean}',
    description: 'If enabled, the particle system will be initialized as though it had already completed a full cycle. This option is only available for looping particle systems.',
    url: 'https://api.playcanvas.com/engine/classes/ParticleSystemComponent.html#prewarm'
}, {
    name: 'particlesystem:rate',
    title: 'rate',
    subTitle: '{Number}',
    description: 'The bounds of the time range defining the interval in seconds between particle births. The time for the next particle emission will be chosen at random between rate and rate2.',
    url: 'https://api.playcanvas.com/engine/classes/ParticleSystemComponent.html#rate'
}, {
    name: 'particlesystem:localSpace',
    title: 'localSpace',
    subTitle: '{Boolean}',
    description: 'Binds particles to emitter node transformation.',
    url: 'https://api.playcanvas.com/engine/classes/ParticleSystemComponent.html#localspace'
}, {
    name: 'particlesystem:screenSpace',
    title: 'screenSpace',
    subTitle: '{Boolean}',
    description: 'Renders particles in 2D screen space. This needs to be set when particle system is part of hierarchy with ScreenComponent at its root, and allows particle system to integrate with the rendering of the ElementComponents.',
    url: 'https://api.playcanvas.com/engine/classes/ParticleSystemComponent.html#screenspace'
}, {
    name: 'particlesystem:rotationSpeedGraph',
    title: 'rotationSpeedGraph',
    subTitle: '{pc.Curve}',
    description: 'A curve defining how each particle\'s angular velocity changes over time. If two curves are specified in the curve editor, the angular velocity will be a random lerp between both curves.',
    url: 'https://api.playcanvas.com/engine/classes/ParticleSystemComponent.html#rotationspeedgraph'
}, {
    name: 'particlesystem:scaleGraph',
    title: 'scaleGraph',
    subTitle: '{pc.Curve}',
    description: 'A curve defining how each particle\'s scale changes over time. By default, a particle is 1 unit in width and height. If two curves are specified in the curve editor, the scale will be a random lerp between both curves.',
    url: 'https://api.playcanvas.com/engine/classes/ParticleSystemComponent.html#scalegraph'
}, {
    name: 'particlesystem:radialSpeedGraph',
    title: 'radialSpeedGraph',
    subTitle: '{pc.Curve}',
    description: 'A curve defining how particle\'s radial speed changes over time. Individual particle radial velocity points from emitter origin to particle current position. If two curves are specified in the curve editor, the value will be a random between both curves.',
    url: 'https://api.playcanvas.com/engine/classes/ParticleSystemComponent.html#radialspeedgraph'
}, {
    name: 'particlesystem:sort',
    title: 'sort',
    subTitle: '{pc.PARTICLESORT_*}',
    description: 'Sorting mode gives you control over the order in which particles are rendered. The options are: None: Particles are rendered in arbitrary order. When this option is selected, the particle system is simulated on the GPU (if the underlying hardware supports floating point textures) and it is recommended you use this setting to get the best performance. Camera Distance: Particles are sorted on the CPU and rendered in back to front order (in terms of camera z depth). Newer First: Particles are sorted on the CPU and rendered in age order, youngest first. Older First: Particles are sorted on the CPU and rendered in age order, oldest first.',
    url: 'https://api.playcanvas.com/engine/classes/ParticleSystemComponent.html#sort'
}, {
    name: 'particlesystem:startAngle',
    title: 'startAngle',
    subTitle: '{Number}',
    description: 'The bounds of the initial particle rotation specified in degrees. For each particle, this angle is chosen at random between startAngle and startAngle2.',
    url: 'https://api.playcanvas.com/engine/classes/ParticleSystemComponent.html#startangle'
}, {
    name: 'particlesystem:stretch',
    title: 'stretch',
    subTitle: '{Number}',
    description: 'A value in world units that controls the amount by which particles are stretched based on their velocity. Particles are stretched from their center towards their previous position.',
    url: 'https://api.playcanvas.com/engine/classes/ParticleSystemComponent.html#stretch'
}, {
    name: 'particlesystem:velocityGraph',
    title: 'velocityGraph',
    subTitle: '{pc.CurveSet}',
    description: 'A curve defining how each particle\'s velocity with respect to the world coordinate system changes over time. If two curves are specified in the curve editor, velocity will be a random lerp between both curves.',
    url: 'https://api.playcanvas.com/engine/classes/ParticleSystemComponent.html#velocitygraph'
}, {
    name: 'particlesystem:wrap',
    title: 'wrap',
    subTitle: '{Boolean}',
    description: 'Enables wrap bounds.',
    url: 'https://api.playcanvas.com/engine/classes/ParticleSystemComponent.html#wrap'
}, {
    name: 'particlesystem:wrapBounds',
    title: 'wrapBounds',
    subTitle: '{pc.Vec3}',
    description: 'World space AABB volume centered on the owner entity\'s position. If a particle crosses the boundary of one side of the volume, it teleports to the opposite side. You can use this to make environmental effects like rain by moving a wrapped emitter\'s owner entity.',
    url: 'https://api.playcanvas.com/engine/classes/ParticleSystemComponent.html#wrapbounds'
}, {
    name: 'particlesystem:layers',
    title: 'layers',
    subTitle: '{Number[]}',
    description: 'The layers that this particle system belongs to. When a particle system belongs to multiple layers it will be rendered multiple times.',
    url: 'https://api.playcanvas.com/engine/classes/ParticleSystemComponent.html#layers'
}];
