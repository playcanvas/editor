/**
 * Represents an Entity.
 *
 * What follows is a reference for all possible asset paths that can be passed to functions such as {@link Entity#get} and {@link Entity#set}.
 *
 * Common Entity Properties:
 */
export type EntityProps = {
    /**
     * An array that contains the `resource_id`'s of the entity's children.
     * @default []
     */
    children: string[];
    /**
     * Whether the entity is enabled.
     * @default true
     */
    enabled: boolean;
    /**
     * The name of the entity.
     */
    name: string;
    /**
     * The `resource_id` of the parent entity.
     */
    parent: string;
    /**
     * The position of the entity in local space (x, y, z).
     * @default [0,0,0]
     */
    position: number[];
    /**
     * The unique GUID of the entity.
     */
    resource_id: string;
    /**
     * The rotation of the entity in local space (rx, ry, rz euler angles in degrees).
     * @default [0,0,0]
     */
    rotation: number[];
    /**
     * The scale of the entity in local space (sx, sy, sz).
     * @default [1,1,1]
     */
    scale: number[];
    /**
     * The tags of the entity.
     * @default []
     */
    tags: string[];
    /**
     * A dictionary of <`resource_id`, `resource_id`> pairs that maps the entity (and its children) to the respective Entities in the template asset.
     */
    template_ent_ids: Record<string, string>;
    /**
     * The `id` of the Template asset that this entity is linked to.
     */
    template_id: number;
    /**
     * A dictionary that contains the components of the entity and their data.
     */
    components: Components;
};

/**
 * Components of an Entity.
 */
export type Components = {
    'anim'? : AnimComponent;
    'animation'? : AnimationComponent;
    'audiolistener'? : AudioListenerComponent;
    'button'? : ButtonComponent;
    'camera'? : CameraComponent;
    'collision'? : CollisionComponent;
    'element'? : ElementComponent;
    'layoutchild'? : LayoutChildComponent;
    'layoutgroup'? : LayoutGroupComponent;
    'light'? : LightComponent;
    'model'? : ModelComponent;
    'particlesystem'? : ParticleSystemComponent;
    'render'? : RenderComponent;
    'rigidbody'? : RigidBodyComponent;
    'screen'? : ScreenComponent;
    'script'? : ScriptComponent;
    'scrollbar'? : ScrollbarComponent;
    'scrollview'? : ScrollviewComponent;
    'sound'? : SoundComponent;
    'sprite'? : SpriteComponent;
};

/**
 * Anim Component Properties.
 */
type AnimComponent = {
    /**
     * If true, the component will start playing the anim state graph on load.
     * @default true
     */
    activate: boolean;
    /**
     * A dictionary that holds the animation assets used by this component.
     * Each key is a string representing a path to a state.
     * @default {}
     */
    animationAssets: {
        [key: string]: {
            /**
             * The `id` of the animation asset.
             * @default null
             */
            asset: number;
        };
    };
    /**
     * Whether the component is enabled.
     * @default true
     */
    enabled: boolean;
    /**
     * The layer masks associated with this component.
     * @default {}
     */
    masks: {
        [key: string]: {
            /**
             * A set of paths to bones in the current model that should be animated by the layer.
             * @default {}
             */
            mask: {
                [key: string]: {
                    /**
                     * Whether the children of this bone should also be included in the mask.
                     */
                    children: boolean;
                    /**
                     * Whether this bone should also be included in the mask.
                     */
                    value: boolean;
                };
            };
        };
    };
    /**
     * The `resource_id` of the entity that this anim component should use as the root of the animation hierarchy.
     * @default null
     */
    rootBone: string;
    /**
     * A multiplier for animation playback speed. 0 will freeze animation playback, and 1 represents the normal playback speed.
     * @default 1
     */
    speed: number;
};

/**
 * Animation Component Properties.
 */
type AnimationComponent = {
    /**
     * If true, the component will start playing the animation on load.
     * @default true
     */
    activate: boolean;
    /**
     * An array of Animation asset `id`s.
     * @default []
     */
    assets: number[];
    /**
     * Whether the component is enabled.
     * @default true
     */
    enabled: boolean;
    /**
     * If true, the animation will continue to loop back to the start on completion. Otherwise, it will stop on its final frame.
     * @default true
     */
    loop: boolean;
    /**
     * A multiplier for animation playback speed. 0 will freeze animation playback, and 1 is the normal playback speed.
     * @default 1
     */
    speed: number;
};

/**
 * AudioListener Component Properties.
 */
type AudioListenerComponent = {
    /**
     * Whether the component is enabled.
     * @default true
     */
    enabled: boolean;
};

/**
 * Button Component Properties.
 */
type ButtonComponent = {
    /**
     * If false, the button will be visible but will not respond to hover or touch interactions.
     * @default true
     */
    active: boolean;
    /**
     * Whether the component is enabled.
     * @default true
     */
    enabled: boolean;
    /**
     * Duration to be used when fading between tints, in milliseconds.
     * @default 0
     */
    fadeDuration: number;
    /**
     * An array of 4 numbers controlling the padding to be used in hit-test calculations.
     * @default [0,0,0,0]
     */
    hitPadding: number[];
    /**
     * The `id` of the sprite asset to be used as the button image when the user hovers over it.
     * @default null
     */
    hoverSpriteAsset: number;
    /**
     * Frame to be used from the hover sprite.
     * @default 0
     */
    hoverSpriteFrame: number;
    /**
     * Array of 4 numbers controlling the color to be used on the button image when the user hovers over it.
     * @default [1,1,1,1]
     */
    hoverTint: number[];
    /**
     * The `resource_id` of the entity to be used as the button background. Must have an element component of type `image`.
     * @default null
     */
    imageEntity: string;
    /**
     * The `id` of the sprite asset to be used as the button image when the button is not interactive.
     * @default null
     */
    inactiveSpriteAsset: number;
    /**
     * Frame to be used from the inactive sprite.
     * @default 0
     */
    inactiveSpriteFrame: number;
    /**
     * Array of 4 numbers controlling the color to be used on the button image when the button is not interactive.
     * @default [1,1,1,1]
     */
    inactiveTint: number[];
    /**
     * The `id` of the sprite asset to be used as the button image when the user presses it.
     * @default null
     */
    pressedSpriteAsset: number;
    /**
     * Frame to be used from the pressed sprite.
     * @default 0
     */
    pressedSpriteFrame: number;
    /**
     * Array of 4 numbers controlling the color to be used on the button image when the user presses it.
     * @default [1,1,1,1]
     */
    pressedTint: number[];
    /**
     * Controls how the button responds when the user hovers over it/presses it.
     * @default 0
     */
    transitionMode: number;
};

/**
 * Camera Component Properties.
 */
type CameraComponent = {
    /**
     * The color used to clear the camera's render target.
     * @default [0.118,0.118,0.118,1]
     */
    clearColor: number[];
    /**
     * If true, the camera will explicitly clear its render target to the chosen clear color before rendering the scene.
     * @default true
     */
    clearColorBuffer: boolean;
    /**
     * If true, the camera will explicitly clear the depth buffer of its render target before rendering the scene.
     * @default true
     */
    clearDepthBuffer: boolean;
    /**
     * Whether the component is enabled.
     * @default true
     */
    enabled: boolean;
    /**
     * The distance in camera space from the camera's eye point to the far plane.
     * @default 1000
     */
    farClip: number;
    /**
     * The angle (in degrees) between top and bottom clip planes of a perspective camera.
     * @default 45
     */
    fov: number;
    /**
     * Controls the culling of mesh instances against the camera frustum. If true, culling is enabled. If false, all mesh instances are rendered.
     * @default true
     */
    frustumCulling: boolean;
    /**
     * An array of layer id's that this camera will render.
     * @default [0,1,2,3,4]
     */
    layers: number[];
    /**
     * The distance in camera space from the camera's eye point to the near plane.
     * @default 0.1
     */
    nearClip: number;
    /**
     * The distance in world units between the top and bottom clip planes of an orthographic camera.
     * @default 4
     */
    orthoHeight: number;
    /**
     * A number that defines the order in which camera views are rendered by the engine. Smaller numbers are rendered first.
     * @default 0
     */
    priority: number;
    /**
     * The projection type of the camera. Can be `pc.PROJECTION_PERSPECTIVE` or `pc.PROJECTION_ORTHOGRAPHIC`.
     * @default 0
     */
    projection: number;
    /**
     * An array that represents the viewport onto the camera's attached render target defined by normalized coordinates.
     * @default [0,0,1,1]
     */
    rect: number[];
};

/**
 * Collision Component Properties.
 */
type CollisionComponent = {
    /**
     * The `id` of the model asset that will be used as a source for the triangle-based collision mesh.
     * @default null
     */
    asset: number;
    /**
     * Aligns the capsule/cylinder with the local-space X, Y or Z axis of the entity.
     * @default 1
     */
    axis: number;
    /**
     * Whether the component is enabled.
     * @default true
     */
    enabled: boolean;
    /**
     * The half-extents of the collision box: local space half-width, half-height, and half-depth.
     * @default [0.5,0.5,0.5]
     */
    halfExtents: number[];
    /**
     * The tip-to-tip height of the capsule/cylinder.
     * @default 2
     */
    height: number;
    /**
     * The radius of the capsule/cylinder body.
     * @default 0.5
     */
    radius: number;
    /**
     * The `id` of the render asset that will be used as a source for the triangle-based collision mesh.
     * @default null
     */
    renderAsset: number;
    /**
     * The type of collision primitive. Can be: box, sphere, capsule, cylinder, mesh.
     * @default "box"
     */
    type: string;
};

/**
 * Element Component Properties.
 */
type ElementComponent = {
    /**
     * An array of 2 numbers controlling the horizontal and vertical alignment of the text relative to its element transform.
     * @default [0.5,0.5]
     */
    alignment: number[];
    /**
     * An array of 4 numbers controlling the left, bottom, right and top anchors of the element.
     * @default [0.5,0.5,0.5,0.5]
     */
    anchor: number[];
    /**
     * If true then the font size of the element will scale automatically so that it fits the element's height.
     * @default false
     */
    autoFitHeight: boolean;
    /**
     * If true then the font size and the line height of the element will scale automatically so that it fits the element's width.
     * @default false
     */
    autoFitWidth: boolean;
    /**
     * Make the height of the element match the height of the text content automatically.
     * @default false
     */
    autoHeight: boolean;
    /**
     * Make the width of the element match the width of the text content automatically.
     * @default false
     */
    autoWidth: boolean;
    /**
     * The batch group id that this element belongs to.
     * @default null
     */
    batchGroupId: number;
    /**
     * An array of 3 numbers controlling the color of the element.
     * @default [1,1,1]
     */
    color: number[];
    /**
     * Flag for enabling markup processing. Only works for text types.
     * @default false
     */
    enableMarkup: boolean;
    /**
     * Whether the component is enabled.
     * @default true
     */
    enabled: boolean;
    /**
     * The `id` of the font asset used by the element.
     * @default null
     */
    fontAsset: number;
    /**
     * The size of the font used by the element.
     * @default 32
     */
    fontSize: number;
    /**
     * The height of the element.
     * @default 32
     */
    height: number;
    /**
     * The localization key of the element.
     * @default null
     */
    key: string;
    /**
     * An array of layer id's that this element belongs to.
     * @default [4]
     */
    layers: number[];
    /**
     * The height of each line of text.
     * @default 32
     */
    lineHeight: number;
    /**
     * An array of 4 numbers controlling the spacing between each edge of the element and the respective anchor.
     * @default [-16,-16,-16,-16]
     */
    margin: number[];
    /**
     * Switch image element into a mask.
     * @default false
     */
    mask: boolean;
    /**
     * The `id` of the material asset used by this element.
     * @default null
     */
    materialAsset: number;
    /**
     * The maximum size of the font that the element can scale to when using `autoFitWidth` or `autoFitHeight`.
     * @default 32
     */
    maxFontSize: number;
    /**
     * The maximum number of lines that this element can display.
     * @default null
     */
    maxLines: number;
    /**
     * The minimum size of the font that the element can scale to when using `autoFitWidth` or `autoFitHeight`.
     * @default 8
     */
    minFontSize: number;
    /**
     * The opacity of the element.
     * @default 1
     */
    opacity: number;
    /**
     * An array of 4 numbers controlling the text outline effect color and opacity.
     * @default [0,0,0,1]
     */
    outlineColor: number[];
    /**
     * The text outline effect width. Ranges from 0 to 1. To disable outline effect set to 0.
     * @default 0
     */
    outlineThickness: number;
    /**
     * An array of 2 numbers controlling the origin of the element.
     * @default [0.5,0.5]
     */
    pivot: number[];
    /**
     * The number of pixels that correspond to one PlayCanvas unit.
     * @default null
     */
    pixelsPerUnit: number;
    /**
     * An array of 4 numbers controlling the u, v, width and height of the rectangle that represents the portion of the texture that this image maps to.
     * @default [0,0,1,1]
     */
    rect: number[];
    /**
     * An array of 4 numbers controlling the text shadow cast effect color and opacity.
     * @default [0,0,0,1]
     */
    shadowColor: number[];
    /**
     * An array of 2 numbers controlling the horizontal and vertical shift of the text shadow cast effect.
     * @default [0,0]
     */
    shadowOffset: number[];
    /**
     * The spacing between each letter of the text.
     * @default 1
     */
    spacing: number;
    /**
     * The `id` of the sprite asset to be used by the element.
     * @default null
     */
    spriteAsset: number;
    /**
     * The frame from the sprite asset to render.
     * @default 0
     */
    spriteFrame: number;
    /**
     * The text content of the element.
     * @default ""
     */
    text: string;
    /**
     * The `id` of the texture asset to be used by the element.
     * @default null
     */
    textureAsset: number;
    /**
     * The type of the element. Can be: `pc.ELEMENTTYPE_GROUP`, `pc.ELEMENTTYPE_IMAGE`, `pc.ELEMENTTYPE_TEXT`.
     * @default "text"
     */
    type: string;
    /**
     * Enable this if you want the element to receive input events.
     * @default false
     */
    useInput: boolean;
    /**
     * The width of the element.
     * @default 32
     */
    width: number;
    /**
     * Whether to automatically wrap lines based on the element width.
     * @default true
     */
    wrapLines: boolean;
};

/**
 * LayoutChild Component Properties.
 */
type LayoutChildComponent = {
    /**
     * Whether the component is enabled.
     * @default true
     */
    enabled: boolean;
    /**
     * When enabled, the child will be excluded from all layout calculations.
     * @default false
     */
    excludeFromLayout: boolean;
    /**
     * The amount of additional vertical space that the element should take up, if necessary to satisfy a Stretch/Shrink fitting calculation.
     * @default 0
     */
    fitHeightProportion: number;
    /**
     * The amount of additional horizontal space that the element should take up, if necessary to satisfy a Stretch/Shrink fitting calculation.
     * @default 0
     */
    fitWidthProportion: number;
    /**
     * The maximum height the element should be rendered at.
     * @default null
     */
    maxHeight: number | null;
    /**
     * The maximum width the element should be rendered at.
     * @default null
     */
    maxWidth: number | null;
    /**
     * The minimum height the element should be rendered at.
     * @default 0
     */
    minHeight: number;
    /**
     * The minimum width the element should be rendered at.
     * @default 0
     */
    minWidth: number;
};

/**
 * LayoutGroup Component Properties.
 */
type LayoutGroupComponent = {
    /**
     * An array of 2 numbers controlling the horizontal and vertical alignment of child elements.
     * @default [0,1]
     */
    alignment: number[];
    /**
     * Whether the component is enabled.
     * @default true
     */
    enabled: boolean;
    /**
     * Fitting logic to be applied when positioning and scaling child elements.
     * @default 0
     */
    heightFitting: number;
    /**
     * Whether the layout should run horizontally or vertically.
     * @default 0
     */
    orientation: number;
    /**
     * An array of 4 numbers controlling the padding to be applied inside the container before positioning any children.
     * @default [0,0,0,0]
     */
    padding: number[];
    /**
     * Reverses the order of elements on the X axis.
     * @default false
     */
    reverseX: boolean;
    /**
     * Reverses the order of elements on the Y axis.
     * @default true
     */
    reverseY: boolean;
    /**
     * An array of 2 numbers controlling the spacing to be applied between each child element.
     * @default [0,0]
     */
    spacing: number[];
    /**
     * Fitting logic to be applied when positioning and scaling child elements.
     * @default 0
     */
    widthFitting: number;
    /**
     * Whether or not to wrap children onto a new row/column when the size of the container is exceeded.
     * @default false
     */
    wrap: boolean;
};

/**
 * Light Component Properties.
 */
type LightComponent = {
    /**
     * If true the light will affect non-lightmapped objects.
     * @default true
     */
    affectDynamic: boolean;
    /**
     * If true the light will affect lightmapped objects.
     * @default false
     */
    affectLightmapped: boolean;
    /**
     * If true the light will be rendered into lightmaps.
     * @default false
     */
    bake: boolean;
    /**
     * If true and `bake` is true, the light's direction will contribute to directional lightmaps.
     * @default true
     */
    bakeDir: boolean;
    /**
     * The distribution of subdivision of the camera frustum for individual shadow cascades.
     * @default 0.5
     */
    cascadeDistribution: number;
    /**
     * If true, the light will cause shadow casting models to cast shadows.
     * @default false
     */
    castShadows: boolean;
    /**
     * An array of 3 numbers that represents the color of the emitted light.
     * @default [1,1,1]
     */
    color: number[];
    /**
     * The id of a projection texture asset. Must be 2D for spot and cubemap for omni (ignored if incorrect type is used).
     */
    cookie: number;
    /**
     * Angle for spotlight cookie rotation.
     * @default 0
     */
    cookieAngle: number;
    /**
     * The id of a texture asset that represents that light cookie.
     * @default null
     */
    cookieAsset: number;
    /**
     * Color channels of the projection texture to use. Can be "r", "g", "b", "a", "rgb" or any swizzled combination.
     * @default "rgb"
     */
    cookieChannel: string;
    /**
     * Toggle normal spotlight falloff when projection texture is used. When set to false, spotlight will work like a pure texture projector (only fading with distance).
     * @default true
     */
    cookieFalloff: boolean;
    /**
     * Projection texture intensity.
     * @default 1
     */
    cookieIntensity: number;
    /**
     * Spotlight cookie position offset.
     * @default [0,0]
     */
    cookieOffset: number[];
    /**
     * Spotlight cookie scale.
     * @default [1,1]
     */
    cookieScale: number[];
    /**
     * Whether the component is enabled.
     * @default true
     */
    enabled: boolean;
    /**
     * Controls the rate at which a light attenuates from its position.
     * @default 0
     */
    falloffMode: number;
    /**
     * The angle at which the spotlight cone starts to fade off. The angle is specified in degrees. Affects spot lights only.
     * @default 40
     */
    innerConeAngle: number;
    /**
     * The intensity of the light, this acts as a scalar value for the light's color. This value can exceed 1.
     * @default 1
     */
    intensity: number;
    /**
     * Mark light as non-movable (optimization).
     * @default false
     */
    isStatic: boolean;
    /**
     * An array of layer id's that this light will affect.
     * @default [0]
     */
    layers: number[];
    /**
     * Normal offset depth bias.
     * @default 0.05
     */
    normalOffsetBias: number;
    /**
     * Number of shadow cascades.
     * @default 1
     */
    numCascades: number;
    /**
     * The angle at which the spotlight cone has faded to nothing. The angle is specified in degrees. Affects spot lights only.
     * @default 45
     */
    outerConeAngle: number;
    /**
     * The distance from the spotlight source at which its contribution falls to zero.
     * @default 10
     */
    range: number;
};

/**
 * Model Component Properties.
 */
type ModelComponent = {
    /**
     * An array of 3 numbers that represents the center of the AABB to be used.
     */
    aabbCenter: number[];
    /**
     * An array of 3 numbers that represents the half extents of the AABB to be used.
     */
    aabbHalfExtents: number[];
    /**
     * The `id` of the model asset rendered by this model component.
     * @default null
     */
    asset: number;
    /**
     * The batch group id that this model belongs to. The engine will attempt to batch models in the same batch group.
     * @default null
     */
    batchGroupId: number;
    /**
     * If true, the model rendered by this component will cast shadows onto other models in the scene.
     * @default true
     */
    castShadows: boolean;
    /**
     * If true, this model will cast shadows when rendering lightmaps.
     * @default true
     */
    castShadowsLightmap: boolean;
    /**
     * Whether the component is enabled.
     * @default true
     */
    enabled: boolean;
    /**
     * Mark model as non-movable (optimization).
     * @default false
     */
    isStatic: boolean;
    /**
     * An array of layer id's that this model belongs to. When a model belongs to multiple layers it will be rendered multiple times.
     * @default [0]
     */
    layers: number[];
    /**
     * Changing this value will affect resolution of lightmaps for this model.
     * @default 1
     */
    lightmapSizeMultiplier: number;
    /**
     * If true, this model will be lightmapped after using lightmapper.bake().
     * @default false
     */
    lightmapped: boolean;
    /**
     * A dictionary that maps a material asset to each mesh instance. Each key is the mesh instance index and each value is the asset `id`.
     */
    mapping: Record<string, number>;
    /**
     * The `id` of the material asset that will be used to render the model (only applies to primitives).
     * @default null
     */
    materialAsset: number;
    /**
     * If true, the model rendered by this component will receive shadows cast by other models in the scene.
     * @default true
     */
    receiveShadows: boolean;
    /**
     * The type of the model to be rendered. Can be: asset, box, capsule, cone, cylinder, sphere.
     * @default "asset"
     */
    type: string;
};

/**
 * ParticleSystem Component Properties.
 */
type ParticleSystemComponent = {
    /**
     * If true orient particles in their direction of motion.
     * @default false
     */
    alignToMotion: boolean;
    /**
     * A curve defining how each particle's opacity changes over time. If `alphaGraph2` is specified, the opacity will be a random lerp between both curves.
     * @default {"type":1,"keys":[0,1],"betweenCurves":false}
     */
    alphaGraph: object;
    /**
     * A curve defining how each particle's opacity changes over time. If specified, the opacity will be a random lerp between both curves.
     * @default {"type":1,"keys":[0,1]}
     */
    alphaGraph2: object;
    /**
     * The animation from the sprite sheet to play for each particle in the system.
     * @default 0
     */
    animIndex: number;
    /**
     * If true then the sprite sheet animation will repeat indefinitely.
     * @default true
     */
    animLoop: boolean;
    /**
     * Number of animations contained in the sprite sheet.
     * @default 1
     */
    animNumAnimations: number;
    /**
     * Number of sprite sheet frames in each animation.
     * @default 1
     */
    animNumFrames: number;
    /**
     * Sprite sheet animation speed. 1 = particle lifetime, 2 = twice during lifetime etc...
     * @default 1
     */
    animSpeed: number;
    /**
     * Sprite sheet frame in animation to begin animating from.
     * @default 0
     */
    animStartFrame: number;
    /**
     * Number of horizontal tiles in the sprite sheet.
     * @default 1
     */
    animTilesX: number;
    /**
     * Number of vertical tiles in the sprite sheet.
     * @default 1
     */
    animTilesY: number;
    /**
     * If true, the particle system will play immediately on creation. If false, you will need to call the particle system component's play function from script.
     * @default true
     */
    autoPlay: boolean;
    /**
     * The blending mode determines how particles are composited when they are written to the frame buffer.
     * @default 2
     */
    blendType: number;
    /**
     * A curve defining how each particle's color changes over time.
     * @default {"type":4,"keys":[[0,1],[0,1],[0,1]],"betweenCurves":false}
     */
    colorGraph: object;
    /**
     * The `id` of the color map texture asset to apply to all particles in the system. If no texture asset is assigned, a default spot texture is used.
     * @default null
     */
    colorMapAsset: number;
    /**
     * This variable value determines how much particles fade out as they get closer to another surface.
     * @default 0
     */
    depthSoftening: number;
    /**
     * If true, the particles will write depth information to the depth buffer.
     * @default false
     */
    depthWrite: boolean;
    /**
     * An array of 3 numbers that represents the half extents of a local space bounding box within which particles are spawned at random positions.
     * @default [0,0,0]
     */
    emitterExtents: number[];
    /**
     * The radius within which particles are spawned at random positions.
     * @default 0
     */
    emitterRadius: number;
    /**
     * Shape of the emitter. Can be: `pc.EMITTERSHAPE_BOX`, `pc.EMITTERSHAPE_SPHERE`.
     * @default 0
     */
    emitterShape: number;
    /**
     * Whether the component is enabled.
     * @default true
     */
    enabled: boolean;
    /**
     * If true avoid particles looking too flat when lights appear to be shining towards the back sides of the particles.
     * @default false
     */
    halfLambert: boolean;
    /**
     * Scales the color of particles to allow them to have arbitrary brightness.
     * @default 1
     */
    intensity: number;
    /**
     * An array of layer id's that this particle system belongs to. When a particle system belongs to multiple layers it will be rendered multiple times.
     * @default [0]
     */
    layers: number[];
    /**
     * If true, the particle will be lit by the directional and ambient light in the scene.
     * @default false
     */
    lighting: boolean;
    /**
     * If true, the particle system will emit indefinitely. Otherwise, it will emit the number of particles specified by the `numParticles` property and then stop.
     * @default true
     */
    loop: boolean;
    /**
     * The `id` of a model asset. The first mesh found in the model is used to represent all particles rather than a flat billboard.
     * @default null
     */
    mesh: number;
    /**
     * The `id` of the normal map texture asset to apply to all particles in the system.
     * @default null
     */
    normalMapAsset: number;
    /**
     * The maximum number of particles managed by this particle system.
     * @default 30
     */
    numParticles: number;
    /**
     * Orientation mode controls particle planes facing.
     * @default 0
     */
    orientation: number;
    /**
     * An array of 3 numbers that represents either world or emitter space vector to define particle plane orientation.
     * @default [0,1,0]
     */
    particleNormal: number[];
    /**
     * If true, the particle system will be initialized as though it had already completed a full cycle.
     * @default false
     */
    preWarm: boolean;
    /**
     * A curve defining how particle's radial speed changes over time. Individual particle radial velocity points from emitter origin to particle current position.
     * @default {"type":1,"keys":[0,0],"betweenCurves":false}
     */
    radialSpeedGraph: object;
    /**
     * A curve defining how each particle's angular velocity changes over time.
     * @default {"type":1,"keys":[0,0],"betweenCurves":false}
     */
    rotationSpeedGraph: object;
    /**
     * A curve defining how each particle's scale changes over time. By default, a particle is 1 unit in width and height.
     * @default {"type":1,"keys":[0,0.1],"betweenCurves":false}
     */
    scaleGraph: object;
    /**
     * Renders particles in 2D screen space.
     * @default false
     */
    screenSpace: boolean;
    /**
     * Sorting mode gives you control over the order in which particles are rendered.
     * @default 0
     */
    sort: number;
    /**
     * The bounds of the initial particle rotation specified in degrees.
     * @default 0
     */
    startAngle: number;
    /**
     * A curve defining how each particle's velocity with respect to the world coordinate system changes over time.
     * @default {"type":1,"keys":[[0,-1],[0,-1],[0,-1]],"betweenCurves":true}
     */
    velocityGraph: object;
    /**
     * Enables wrap bounds.
     * @default false
     */
    wrap: boolean;
    /**
     * An array of 3 numbers that represents the world space AABB volume centered on the owner entity's position.
     * @default [0,0,0]
     */
    wrapBounds: number[];
};

/**
 * Render Component Properties.
 */
type RenderComponent = {
    /**
     * An array of 3 numbers controlling the center of the AABB to be used.
     */
    aabbCenter: number[];
    /**
     * An array of 3 numbers controlling the half extents of the AABB to be used.
     */
    aabbHalfExtents: number[];
    /**
     * The `id` of the render asset for the render component (only applies to type "asset").
     * @default null
     */
    asset: number;
    /**
     * The batch group id that the meshes should belong to.
     * @default null
     */
    batchGroupId: number;
    /**
     * If true, attached meshes will cast shadows for lights that have shadow casting enabled.
     * @default true
     */
    castShadows: boolean;
    /**
     * If true, the meshes will cast shadows when rendering lightmaps.
     * @default true
     */
    castShadowsLightmap: boolean;
    /**
     * Whether the component is enabled.
     * @default true
     */
    enabled: boolean;
    /**
     * Mark meshes as non-movable (optimization).
     * @default false
     */
    isStatic: boolean;
    /**
     * An array of layer id's to which the meshes should belong.
     * @default [0]
     */
    layers: number[];
    /**
     * Lightmap resolution multiplier.
     * @default 1
     */
    lightmapSizeMultiplier: number;
    /**
     * If true, the meshes will be lightmapped after using lightmapper.bake().
     * @default false
     */
    lightmapped: boolean;
    /**
     * An array of material asset `id`'s that will be used to render the meshes. Each material corresponds to the respective mesh instance.
     * @default []
     */
    materialAssets: number[];
    /**
     * If true, shadows will be cast on attached meshes.
     * @default true
     */
    receiveShadows: boolean;
    /**
     * The `resource_id` of the entity to be used as the root bone for any skinned meshes that are rendered by this component.
     * @default null
     */
    rootBone: string;
    /**
     * The type of the render component. Can be: asset, box, capsule, cone, cylinder, plane, sphere.
     * @default "asset"
     */
    type: string;
};

/**
 * RigidBody Component Properties.
 */
type RigidBodyComponent = {
    /**
     * Controls the rate at which a body loses angular velocity over time.
     * @default 0
     */
    angularDamping: number;
    /**
     * An array of 3 numbers that represents the scaling factor for angular movement of the body in each axis.
     * @default [1,1,1]
     */
    angularFactor: number[];
    /**
     * Whether the component is enabled.
     * @default true
     */
    enabled: boolean;
    /**
     * The friction value used when contacts occur between two bodies.
     * @default 0.5
     */
    friction: number;
    /**
     * Controls the rate at which a body loses linear velocity over time.
     * @default 0
     */
    linearDamping: number;
    /**
     * An array of 3 numbers that represents the scaling factor for linear movement of the body in each axis.
     * @default [1,1,1]
     */
    linearFactor: number[];
    /**
     * The mass of the body.
     * @default 1
     */
    mass: number;
    /**
     * The amount of energy lost when two objects collide, this determines the bounciness of the object.
     * @default 0.5
     */
    restitution: number;
    /**
     * The type of RigidBody determines how it is simulated. Can be one of: static, dynamic, kinematic.
     * @default "static"
     */
    type: string;
};

/**
 * Screen Component Properties.
 */
type ScreenComponent = {
    /**
     * Whether the component is enabled.
     * @default true
     */
    enabled: boolean;
    /**
     * An array of 2 numbers that represents the reference resolution of the screen. The screen adjusts its size based on `scaleMode`.
     * @default [1280,720]
     */
    referenceResolution: number[];
    /**
     * An array of 2 numbers that represents the resolution of the screen.
     * @default [1280,720]
     */
    resolution: number[];
    /**
     * Adjusts screen size changes relative to window size changes. 0 adjusts width only, 1 adjusts height only, values in between adjust both.
     * @default 0.5
     */
    scaleBlend: number;
    /**
     * Controls screen resizing with window size changes. Can be `pc.SCALEMODE_BLEND` for adjusting to window resolution or `pc.SCALEMODE_NONE`.
     * @default "blend"
     */
    scaleMode: string;
    /**
     * If true, displays child Elements in 2D. Set false for a 3D screen.
     * @default true
     */
    screenSpace: boolean;
};

/**
 * Script Component Properties.
 */
type ScriptComponent = {
    /**
     * Whether the component is enabled.
     * @default true
     */
    enabled: boolean;
    /**
     * An array of script names in the order they should be executed at runtime.
     * @default []
     */
    order: string[];
    /**
     * A dictionary containing all scripts attached to this component, indexed by script name.
     */
    scripts: {
        [key: string]: {
            /**
             * A dictionary holding the values for each attribute, indexed by attribute name.
             */
            attributes: {
                [key: string]: any;
            };
            /**
             * Whether the individual script instance is enabled.
             */
            enabled: boolean;
        };
    };
};

/**
 * Scrollbar Component Properties.
 */
type ScrollbarComponent = {
    /**
     * Whether the component is enabled.
     * @default true
     */
    enabled: boolean;
    /**
     * The `resource_id` of the entity used as the scrollbar handle. Must have a scrollbar component.
     * @default null
     */
    handleEntity: string;
    /**
     * The size of the handle relative to the track size, in the range 0...1.
     * @default 0.5
     */
    handleSize: number;
    /**
     * The scrollbar orientation: horizontal or vertical.
     * @default 0
     */
    orientation: number;
    /**
     * The current position value of the scrollbar, in the range 0...1.
     * @default 0
     */
    value: number;
};

/**
 * Scrollview Component Properties.
 */
type ScrollviewComponent = {
    /**
     * Controls how far the content should move before bouncing back.
     * @default 0.1
     */
    bounceAmount: number;
    /**
     * The `resource_id` of the entity containing the scrolling content. Must have an element component.
     * @default null
     */
    contentEntity: string;
    /**
     * Whether the component is enabled.
     * @default true
     */
    enabled: boolean;
    /**
     * Controls how freely content moves if thrown, with 1 stopping immediately and 0 allowing perpetual movement.
     * @default 0.05
     */
    friction: number;
    /**
     * Whether to enable horizontal scrolling.
     * @default true
     */
    horizontal: boolean;
    /**
     * The `resource_id` of the entity used as the horizontal scrollbar. Must have a scrollbar component.
     * @default null
     */
    horizontalScrollbarEntity: string;
    /**
     * Controls visibility of the horizontal scrollbar.
     * @default 1
     */
    horizontalScrollbarVisibility: number;
    /**
     * Controls mouse wheel sensitivity for scrolling, with 0 disabling it.
     * @default [1,1]
     */
    mouseWheelSensitivity: number[];
    /**
     * How the scroll view behaves when scrolling past content end.
     * @default 1
     */
    scrollMode: number;
    /**
     * Whether to use the mouse wheel for scrolling within bounds.
     * @default true
     */
    useMouseWheel: boolean;
    /**
     * Whether to enable vertical scrolling.
     * @default true
     */
    vertical: boolean;
    /**
     * The `resource_id` of the entity used as the vertical scrollbar. Must have a scrollbar component.
     * @default null
     */
    verticalScrollbarEntity: string;
    /**
     * Controls visibility of the vertical scrollbar.
     * @default 1
     */
    verticalScrollbarVisibility: number;
    /**
     * The `resource_id` of the entity used as the viewport area, within which content scrolls. Must have an element component of type `group`.
     * @default null
     */
    viewportEntity: string;
};

/**
 * Sound Component Properties.
 */
type SoundComponent = {
    /**
     * Algorithm to use for audio volume falloff. Can be: "inverse", "linear", "exponential".
     * @default "linear"
     */
    distanceModel: string;
    /**
     * Whether the component is enabled.
     * @default true
     */
    enabled: boolean;
    /**
     * Maximum distance at which audio falloff stops.
     * @default 10000
     */
    maxDistance: number;
    /**
     * The pitch for audio playback. Multiplied with slot pitch values.
     * @default 1
     */
    pitch: number;
    /**
     * If true, audio is played as 3D sound.
     * @default true
     */
    positional: boolean;
    /**
     * Reference distance for reducing audio volume.
     * @default 1
     */
    refDistance: number;
    /**
     * Rate at which the audio volume falls off.
     * @default 1
     */
    rollOffFactor: number;
    /**
     * Dictionary of sound slots, each controlling playback of an audio asset.
     */
    slots: {
        [key: string]: {
            /**
             * The `id` of the audio asset in this sound slot.
             */
            asset: number;
            /**
             * If true, this sound slot plays on load.
             */
            autoPlay: boolean;
            /**
             * Duration of the sound to play from this slot.
             */
            duration: number;
            /**
             * If true, sound slot loops playback.
             */
            loop: boolean;
            /**
             * Name of the sound slot.
             */
            name: string;
            /**
             * If true, sounds from this slot overlap each other.
             */
            overlap: boolean;
            /**
             * Pitch for playback of this sound slot.
             */
            pitch: number;
            /**
             * Start time for playing the sound.
             */
            startTime: number;
            /**
             * Volume modifier for this sound slot.
             */
            volume: number;
        };
    };
    /**
     * Overall volume modifier for the component.
     * @default 1
     */
    volume: number;
};

/**
 * Sprite Component Properties.
 */
type SpriteComponent = {
    /**
     * The `name` of the sprite animation clip to play automatically when the component is enabled.
     * @default null
     */
    autoPlayClip: string;
    /**
     * The batch group id that this sprite belongs to.
     * @default null
     */
    batchGroupId: number;
    /**
     * A dictionary containing data for all sprite animation clips. Each key is the index of the clip.
     */
    clips: {
        [key: string]: {
            /**
             * If true, automatically start playing this animation clip when loaded.
             */
            autoPlay: boolean;
            /**
             * The frames per second for this animation clip.
             */
            fps: number;
            /**
             * If true, the animation clip will loop.
             */
            loop: boolean;
            /**
             * The unique name of the animation clip for this sprite component.
             */
            name: string;
            /**
             * The `id` of the sprite asset containing all frames for this animation clip.
             */
            spriteAsset: number;
        };
    };
    /**
     * The color tint of the sprite, represented as an array of 3 numbers.
     * @default [1,1,1]
     */
    color: number[];
    /**
     * The draw order of the sprite; higher values are rendered on top of others.
     * @default 0
     */
    drawOrder: number;
    /**
     * Whether the component is enabled.
     * @default true
     */
    enabled: boolean;
    /**
     * If true, flips the sprite on the X axis.
     * @default false
     */
    flipX: boolean;
    /**
     * If true, flips the sprite on the Y axis.
     * @default false
     */
    flipY: boolean;
    /**
     * The frame of the sprite asset to render.
     * @default 0
     */
    frame: number;
    /**
     * The height of the sprite for 9-slicing rendering.
     * @default 1
     */
    height: number;
    /**
     * The layers this sprite belongs to.
     * @default [0]
     */
    layers: number[];
    /**
     * The opacity of the sprite.
     * @default 1
     */
    opacity: number;
    /**
     * Global speed modifier for sprite animation clips.
     * @default 1
     */
    speed: number;
    /**
     * The `id` of the sprite asset used by the component.
     * @default null
     */
    spriteAsset: number;
    /**
     * The type of sprite component. Can be `pc.SPRITETYPE_SIMPLE` or `pc.SPRITETYPE_ANIMATED`.
     * @default "simple"
     */
    type: string;
    /**
     * The width of the sprite for 9-slicing rendering.
     * @default 1
     */
    width: number;
};
