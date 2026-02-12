/**
 * Represents an Asset.
 *
 * What follows is a reference for all possible asset paths that can be passed to functions such as {@link Asset#get} and  {@link Asset#set}.
 */
export type AssetProps = {
    /**
     * The asset data depend on the type of the asset. Asset data are available at runtime.
     */
    data?: AssetData;

    /**
     * Exclude asset from the project. If true, the asset will not be available at runtime and not be included in published builds.
     */
    exclude?: boolean;

    /**
     * Properties related to the file of the asset.
     */
    file?: {
        /**
         * `[read-only]` Properties for the different variants of the asset file.
         */
        variants?: {
            /**
             * `[read-only]` Properties for the BASIS variant of the asset file.
             */
            basis?: object;

            /**
             * `[read-only]` Properties for the DXT variant of the asset file.
             */
            dxt?: object;

            /**
             * `[read-only]` Properties for the ETC1 variant of the asset file.
             */
            etc1?: object;

            /**
             * `[read-only]` Properties for the ETC2 variant of the asset file.
             */
            etc2?: object;

            /**
             * `[read-only]` Properties for the PVR variant of the asset file.
             */
            pvr?: object;
        };
    };

    /**
     * A dictionary that holds localized versions of the asset file. Each key in the dictionary is the locale and each value is the asset `id`.
     */
    i18n?: Record<string, string>;

    /**
     * `[read-only]` The asset id. This id is the same across different branches.
     */
    id?: number;

    /**
     * `[read-only]` Asset properties that depend on the type of the asset. Meta properties are available in the PlayCanvas Editor but not at runtime.
     */
    meta?: object;

    /**
     * `[read-only]` The name of the asset.
     */
    name?: string;

    /**
     * `[read-only]` An array of folder asset `id`s that represent the full path of the asset, if the asset is under one or more folders.
     */
    path?: number[];

    /**
     * If true the asset will be loaded during the preload phase of application set up.
     */
    preload?: boolean;

    /**
     * `[read-only]` Whether this is a source asset. A source asset is not included at runtime (e.g. FBX) but may have target assets that are generated from it (e.g. model assets).
     */
    source?: boolean;

    /**
     * `[read-only]` The `id` of the source asset that generated this asset.
     */
    source_asset_id?: string;

    /**
     * An array of asset tags.
     */
    tags?: string[];

    /**
     * `[read-only]` The type of the asset. Can be: various types listed.
     */
    type?: string;

    /**
     * `[read-only]` The asset's unique id. This id is different across different branches.
     */
    uniqueId?: number;
};

/**
 * Represents the data for an Asset.
 */
export type AssetData = AnimationAssetData
    | AnimstategraphAssetData
    | BundleAssetData
    | CubemapAssetData
    | FontAssetData
    | MaterialAssetData
    | ModelAssetData
    | RenderAssetData
    | ScriptAssetData
    | SpriteAssetData
    | TextureAssetData
    | TextureAtlasAssetData
    | WasmAssetData;

/**
 * Represents the data for an Animation asset.
 */
type AnimationAssetData = {
    /**
     * A set of events tied to the playback of this animation asset.
     */
    events: {
        [key: string]: {
            /**
             * The name of this event.
             */
            name: string;

            /**
             * An optional number value to be passed to the callback of this event's listener.
             */
            number?: number;

            /**
             * An optional string value to be passed to the callback of this event's listener.
             */
            string?: string;

            /**
             * The time during the playback of this animation that the event should trigger. Given in normalized time.
             */
            time: number;
        };
    };
};

/**
 * Represents the data for an AnimStateGraph asset.
 */
type AnimstategraphAssetData = {
    /**
     * A set of AnimStateGraph layers.
     */
    layers: {
        [key: string]: {
            /**
             * Defines the way in which this layer should blend with previous layers.
             * Can be: `pc.ANIM_LAYER_OVERWRITE`, `pc.ANIM_LAYER_ADDITIVE`.
             */
            blendType: string;
            /**
             * The name of the AnimStateGraph layer.
             */
            name: string;
            /**
             * The ids of the states that this layer contains.
             */
            states: number[];
            /**
             * The ids of the transitions that this layer contains.
             */
            transitions: number[];
            /**
             * The weight that this layer contributes to the final output of the animation.
             * Given as a normalized value.
             */
            weight: number;
        };
    };
    /**
     * A set of AnimStateGraph parameters.
     */
    parameters: {
        [key: string]: {
            /**
             * The name of the parameter.
             */
            name: string;
            /**
             * The type of this parameter's value.
             * Can be: `pc.ANIM_PARAMETER_INTEGER`, `pc.ANIM_PARAMETER_FLOAT`, `pc.ANIM_PARAMETER_BOOLEAN`, `pc.ANIM_PARAMETER_TRIGGER`.
             */
            type: string;
            /**
             * The value of this parameter.
             */
            value: any;
        };
    };
    /**
     * A set of AnimStateGraph states.
     */
    states: {
        [key: string]: {
            /**
             * If true, the START node will transition directly to this node at the start of playback.
             */
            defaultState: boolean;
            /**
             * The id of this state.
             */
            id: number;
            /**
             * Determines whether playback of this state's animation should continually loop when it reaches the end.
             */
            loop: boolean;
            /**
             * The name of this state.
             */
            name: string;
            /**
             * The type of node this state should be. Either 0 (START), 1 (ANIMATION), 2 (ANY), or 3 (END).
             */
            nodeType: number;
            /**
             * The position of this node in the graph on the x-axis.
             */
            posX: number;
            /**
             * The position of this node in the graph on the y-axis.
             */
            posY: number;
            /**
             * The playback speed for this state.
             */
            speed: number;
        };
    };
    /**
     * A set of AnimStateGraph transitions.
     */
    transitions: {
        [key: string]: {
            conditions: {
                [key: string]: {
                    /**
                     * The name of the parameter this condition is evaluated on.
                     */
                    parameterName: string;
                    /**
                     * The comparator used to determine whether the condition passes.
                     * Can be: `pc.ANIM_GREATER_THAN`, `pc.ANIM_LESS_THAN`, `pc.ANIM_GREATER_THAN_EQUAL_TO`, `pc.ANIM_LESS_THAN_EQUAL_TO`, `pc.ANIM_EQUAL_TO`, `pc.ANIM_NOT_EQUAL_TO`.
                     */
                    predicate: string;
                    /**
                     * The value that the condition should be compared against.
                     */
                    value: any;
                };
            };
            /**
             * This should be true if this transition moves from the START state.
             * Only one transition should contain this per layer.
             */
            defaultTransition: boolean;
            /**
             * Defines the type of states this transition can connect.
             * Should be 0 (Animation) nodes.
             */
            edgeType: number;
            /**
             * Defines the single frame during the from state's playback that this transition is active for.
             * Given in normalized time.
             */
            exitTime: number;
            /**
             * The id of the state this transition moves from.
             */
            from: number;
            /**
             * Determines which states can interrupt this transition with their own transitions.
             * Can be: `pc.ANIM_INTERRUPTION_NONE`, `pc.ANIM_INTERRUPTION_PREV`, `pc.ANIM_INTERRUPTION_NEXT`, `pc.ANIM_INTERRUPTION_PREV_NEXT`, `pc.ANIM_INTERRUPTION_NEXT_PREV`.
             */
            interruptionSource: string;
            /**
             * Used to sort multiple active transitions in priority order.
             * The transition with the lowest value is selected first.
             */
            priority: number;
            /**
             * The duration of the transition's blend between the from and to states.
             */
            time: number;
            /**
             * The id of the state this transition moves to.
             */
            to: number;
            /**
             * Defines the point during this to state's timeline that this transition should begin playback at.
             */
            transitionOffset: number;
        };
    };
};

/**
 * Represents the data for a Bundle asset.
 */
type BundleAssetData = {
    /**
     * An array of asset ids contained in the bundle.
     */
    assets: number[];
};

/**
 * Represents the data for a Cubemap asset.
 */
type CubemapAssetData = {
    /**
     * Integer value specifying the level of anisotropic to apply to the texture ranging from 1 (no anisotropic filtering) to the `pc.GraphicsDevice` property `maxAnisotropy`.
     */
    anisotropy: number;
    /**
     * The magnification filter to be applied to the texture.
     * Can be: `pc.FILTER_NEAREST`, `pc.FILTER_LINEAR`, `pc.FILTER_NEAREST_MIPMAP_NEAREST`, `pc.FILTER_LINEAR_MIPMAP_NEAREST`, `pc.FILTER_NEAREST_MIPMAP_LINEAR`, `pc.FILTER_LINEAR_MIPMAP_LINEAR`.
     */
    magFilter: number;
    /**
     * The minification filter to be applied to the texture.
     * Can be: `pc.FILTER_NEAREST`, `pc.FILTER_LINEAR`, `pc.FILTER_NEAREST_MIPMAP_NEAREST`, `pc.FILTER_LINEAR_MIPMAP_NEAREST`, `pc.FILTER_NEAREST_MIPMAP_LINEAR`, `pc.FILTER_LINEAR_MIPMAP_LINEAR`.
     */
    minFilter: number;
    /**
     * Whether the cubemap is RGBM. The RGBM format is a format to store high dynamic range (HDR) textures by using the alpha channel to store a multiplier for the rgb channels.
     */
    rgbm: boolean;
    /**
     * An array of 6 texture asset ids that represent the faces of the cubemap.
     */
    textures: number[];
};

/**
 * Represents the data for a Font asset.
 */
type FontAssetData = {
    /**
     * Information about the characters in the font.
     */
    chars: {
        [key: string]: {
            /**
             * The height of the character.
             */
            height: number;
            /**
             * The character id.
             */
            id: number;
            /**
             * The actual letter.
             */
            letter: string;
            /**
             * The range of the character.
             */
            range: number;
            /**
             * The scale of the character.
             */
            scale: number;
            /**
             * The width of the character.
             */
            width: number;
            /**
             * The x coordinate of the character.
             */
            x: number;
            /**
             * How much to advance in the x axis.
             */
            xadvance: number;
            /**
             * The offset in the x axis.
             */
            xoffset: number;
            /**
             * The y coordinate of the character.
             */
            y: number;
            /**
             * The offset in the y axis.
             */
            yoffset: number;
        };
    };
    /**
     * Information about the font.
     */
    info: {
        /**
         * The name of the font.
         */
        face: string;
        /**
         * The height of the font.
         */
        height: number;
        /**
         * The width of the font.
         */
        width: number;
    };
    /**
     * The intensity of the font.
     */
    intensity: number;
    /**
     * Information about the kerning.
     */
    kerning: {
        [key: string]: any;
    };
    /**
     * The font version.
     */
    version: number;
};

/**
 * Represents the data for a Material asset.
 */
type MaterialAssetData = {
    /**
     * Used to fade out materials that do not use opacity to fade specular (`opacityFadesSpecular` is false).
     */
    alphaFade: number;
    /**
     * The alpha test reference value to control which fragments are written to the currently active render target based on alpha value.
     * All fragments with an alpha value of less than the `alphaTest` reference value will be discarded.
     */
    alphaTest: number;
    /**
     * Enables or disables alpha to coverage. When enabled, and if hardware anti-aliasing is on, limited order-independent transparency can be achieved.
     * Quality depends on the number of MSAA samples of the current render target.
     */
    alphaToCoverage: boolean;
    /**
     * An array of 3 numbers controlling the tint color to multiply the scene's global ambient color.
     */
    ambient: number[];
    /**
     * Enable this to multiply the scene's global ambient color with a material specific color.
     */
    ambientTint: boolean;
    /**
     * Defines the amount of specular anisotropy when GGX Specular is enabled.
     */
    anisotropy: number;
    /**
     * The id of an ambient occlusion texture asset containing pre-baked ambient occlusion.
     */
    aoMap: number;
    /**
     * An ambient occlusion map color channel to extract color value from texture. Can be: r, g, b, a.
     */
    aoMapChannel: string;
    /**
     * Array of 2 numbers controlling the 2D offset of the AO map. Each component is between 0 and 1.
     */
    aoMapOffset: number[];
    /**
     * Array of 2 numbers controlling the 2D tiling of the AO map.
     */
    aoMapTiling: number[];
    /**
     * AO map UV channel.
     */
    aoMapUv: number;
    /**
     * Use vertex colors for AO instead of a map.
     */
    aoMapVertexColor: boolean;
    /**
     * Controls blending. Can be various types like `pc.BLEND_SUBTRACTIVE`, `pc.BLEND_ADDITIVE`, etc.
     */
    blendType: number;
    /**
     * The strength of the applied normal map. This is a value between 0 (the normal map has no effect) and 2 (the effect of the normal map is exaggerated).
     */
    bumpMapFactor: number;
    /**
     * Defines the intensity of the clear coat layer from 0 to 1.
     */
    clearCoat: number;
    /**
     * The strength of the applied normal map for the clear coat layer, value between 0 and 2.
     */
    clearCoatBumpiness: number;
    /**
     * The asset id of the clear coat gloss map that specifies a per-pixel intensity value. The clear coat gloss map is modulated by the clearCoat property.
     */
    clearCoatGlossMap: number;
    /**
     * A clear coat gloss map color channel to extract color value from texture. Can be: r, g, b, a.
     */
    clearCoatGlossMapChannel: string;
    /**
     * Array of 2 numbers controlling the 2D offset of the clear coat gloss map. Each component is between 0 and 1.
     */
    clearCoatGlossMapOffset: number[];
    /**
     * Array of 2 numbers controlling the 2D tiling of the clear coat gloss map.
     */
    clearCoatGlossMapTiling: number[];
    /**
     * Clear coat gloss map UV channel.
     */
    clearCoatGlossMapUv: number;
    /**
     * Use vertex colors for clear coat glossiness instead of a map.
     */
    clearCoatGlossVertexColor: boolean;
    /**
     * A color channel to extract color value from vertex colors for clear coat glossiness. Can be: r, g, b, a.
     */
    clearCoatGlossVertexColorChannel: string;
    /**
     * A value determining the smoothness of the clear coat surface.
     */
    clearCoatGlossiness: number;
    /**
     * The clear coat map that specifies a per-pixel intensity value. The clear coat map is modulated by the Clear Coat Factor property.
     */
    clearCoatMap: number;
    /**
     * A clearCoat map color channel to extract color value from texture. Can be: r, g, b, a.
     */
    clearCoatMapChannel: string;
    /**
     * Array of 2 numbers controlling the 2D offset of the `clearCoatMap`. Each component is between 0 and 1.
     */
    clearCoatMapOffset: number[];
    /**
     * Array of 2 numbers controlling the 2D tiling of the `clearCoatMap`.
     */
    clearCoatMapTiling: number[];
    /**
     * ClearCoat map UV channel.
     */
    clearCoatMapUv: number;
    /**
     * The asset id of the normal map that specifies the per-pixel surface normals for the clear coat layer. The normal map is modulated by the 'Bumpiness' property.
     */
    clearCoatNormalMap: number;
    /**
     * Array of 2 numbers controlling the 2D offset of the clear coat normal map. Each component is between 0 and 1.
     */
    clearCoatNormalMapOffset: number[];
    /**
     * Array of 2 numbers controlling the 2D tiling of the clear coat normal map.
     */
    clearCoatNormalMapTiling: number[];
    /**
     * Clear coat normal map UV channel.
     */
    clearCoatNormalMapUv: number;
    /**
     * Use vertex colors for clear coat intensity instead of a map.
     */
    clearCoatVertexColor: boolean;
    /**
     * A color channel to extract color value from vertex colors for clear coat intensity. Can be: r, g, b, a.
     */
    clearCoatVertexColorChannel: string;
    /**
     * Defines how diffuse and specular components are combined when Fresnel is on. It is recommended to leave this option enabled.
     */
    conserveEnergy: boolean;
    /**
     * The asset id of a cube map asset that approximates environment reflection. If the scene has a SkyBox set, then it will be used as the default cubeMap.
     */
    cubeMap: number;
    /**
     * The type of projection applied to the `cubeMap` property, with options: `pc.CUBEPROJ_NONE` and `pc.CUBEPROJ_BOX`. Set to Box to enable world-space axis-aligned projection of cubemap based on bounding box.
     */
    cubeMapProjection: number;
    /**
     * The world space axis-aligned bounding box defining the box-projection used for the cubeMap property. Only used when cubeMapProjection is set to pc.CUBEPROJ_BOX.
     */
    cubeMapProjectionBox: {
        /**
         * Array of 3 numbers controlling the center of the box for cubeMap projection.
         */
        center: number[];
        /**
         * Array of 3 numbers controlling the half extents of the box for cubeMap projection.
         */
        halfExtents: number[];
    };
    /**
     * Controls culling. Can be: `pc.CULLFACE_NONE`, `pc.CULLFACE_BACK`, `pc.CULLFACE_FRONT`, `pc.CULLFACE_FRONTANDBACK`.
     */
    cull: number;
    /**
     * If true, a per-pixel check is performed to determine if the pixel passes the engine's depth test when a mesh with the material is rendered.
     */
    depthTest: boolean;
    /**
     * If true, depth information is written to the depth buffer when a mesh with the material is rendered.
     */
    depthWrite: boolean;
    /**
     * An array of 3 numbers representing the diffuse color of the material if no diffuse map is set or tint is enabled.
     */
    diffuse: number[];
    /**
     * The asset id of the diffuse map that specifies the per-pixel diffuse material color. If no diffuse map is set, the diffuse color is used instead.
     */
    diffuseMap: number;
    /**
     * The diffuse map color channel to extract color value from texture. Can be: r, g, b, a, rgb.
     */
    diffuseMapChannel: string;
    /**
     * Array of 2 numbers controlling the 2D offset of the `diffuseMap`. Each component is between 0 and 1.
     */
    diffuseMapOffset: number[];
    /**
     * Array of 2 numbers controlling the 2D tiling of the `diffuseMap`.
     */
    diffuseMapTiling: number[];
    /**
     * Check this to modulate the material's diffuse map with a material specific diffuse color.
     */
    diffuseMapTint: boolean;
    /**
     * Diffuse map UV channel.
     */
    diffuseMapUv: number;
    /**
     * Use vertex colors for diffuse instead of a map.
     */
    diffuseMapVertexColor: boolean;
    /**
     * An array of 3 numbers representing the emissive color of the material if no emissive map is set or tint is enabled.
     */
    emissive: number[];
    /**
     * A multiplier for emissive color that can achieve overbright effects for exceptionally bright emissive materials.
     */
    emissiveIntensity: number;
    /**
     * The asset id of the emissive map that specifies the per-pixel emissive color. If no emissive map is set, the emissive color is used instead.
     */
    emissiveMap: number;
    /**
     * An emissive map color channel to extract color value from texture. Can be: r, g, b, a, rgb.
     */
    emissiveMapChannel: string;
    /**
     * Array of 2 numbers controlling the 2D offset of the `emissiveMap`. Each component is between 0 and 1.
     */
    emissiveMapOffset: number[];
    /**
     * Array of 2 numbers controlling the 2D tiling of the `emissiveMap`.
     */
    emissiveMapTiling: number[];
    /**
     * Check this to modulate the material's emissive map with a material specific emissive color.
     */
    emissiveMapTint: boolean;
    /**
     * Emissive map UV channel.
     */
    emissiveMapUv: number;
    /**
     * Use vertex colors for emission instead of a map.
     */
    emissiveMapVertexColor: boolean;
    /**
     * Enables GGX specular response. Also enables anisotropy parameter to set material anisotropy.
     */
    enableGGXSpecular: boolean;
    /**
     * A parameter for Fresnel. Can be: `pc.FRESNEL_NONE`, `pc.FRESNEL_SCHLICK`.
     */
    fresnelModel: number;
    /**
     * The asset id of the gloss map that specifies a per-pixel shininess value. The gloss map is modulated by the shininess property.
     */
    glossMap: number;
    /**
     * A gloss map color channel to extract color value from texture. Can be: r, g, b, a.
     */
    glossMapChannel: string;
    /**
     * Array of 2 numbers controlling the 2D offset of the `glossMap`. Each component is between 0 and 1.
     */
    glossMapOffset: number[];
    /**
     * Array of 2 numbers controlling the 2D tiling of the `glossMap`.
     */
    glossMapTiling: number[];
    /**
     * Gloss map UV channel.
     */
    glossMapUv: number;
    /**
     * Use vertex colors for glossiness instead of a map.
     */
    glossMapVertexColor: boolean;
    /**
     * The asset id of the height map that specifies the per-pixel strength of the parallax effect. White is full height and black is zero height.
     */
    heightMap: number;
    /**
     * A height map color channel to extract color value from texture. Can be: r, g, b, a.
     */
    heightMapChannel: string;
    /**
     * The strength of a parallax effect (a value between 0 and 2).
     */
    heightMapFactor: number;
    /**
     * Array of 2 numbers controlling the 2D offset of the `heightMap`. Each component is between 0 and 1.
     */
    heightMapOffset: number[];
    /**
     * Array of 2 numbers controlling the 2D tiling of the `heightMap`.
     */
    heightMapTiling: number[];
    /**
     * Height map UV channel.
     */
    heightMapUv: number;
    /**
     * The asset id of the lightmap texture that contains pre-baked diffuse lighting. The lightmap usually is applied to the second UV set.
     */
    lightMap: number;
    /**
     * A light map color channel to extract color value from texture. Can be: r, g, b, a, rgb.
     */
    lightMapChannel: string;
    /**
     * Array of 2 numbers controlling the 2D offset of the lightmap. Each component is between 0 and 1.
     */
    lightMapOffset: number[];
    /**
     * Array of 2 numbers controlling the 2D tiling of the lightmap.
     */
    lightMapTiling: number[];
    /**
     * Lightmap UV channel.
     */
    lightMapUv: number;
    /**
     * Use vertex lightmap instead of a texture-based one.
     */
    lightMapVertexColor: boolean;
    /**
     * Metalness factor multiplier.
     */
    metalness: number;
    /**
     * The asset id of the map that specifies per-pixel metalness values. A value of 1 is metal and a value of 0 is non-metal.
     */
    metalnessMap: number;
    /**
     * A metalness map color channel to extract color value from texture. Can be: r, g, b, a.
     */
    metalnessMapChannel: string;
    /**
     * Array of 2 numbers controlling the 2D offset of the metalness map. Each component is between 0 and 1.
     */
    metalnessMapOffset: number[];
    /**
     * Array of 2 numbers controlling the 2D tiling of the metalness map.
     */
    metalnessMapTiling: number[];
    /**
     * Metalness map UV channel.
     */
    metalnessMapUv: number;
    /**
     * Use vertex colors for metalness instead of a map.
     */
    metalnessMapVertexColor: boolean;
    /**
     * The asset id of the normal map that specifies the per-pixel surface normals. The normal map is modulated by the 'Bumpiness' property.
     */
    normalMap: number;
    /**
     * Array of 2 numbers controlling the 2D offset of the `normalMap`. Each component is between 0 and 1.
     */
    normalMapOffset: number[];
    /**
     * Array of 2 numbers controlling the 2D tiling of the `normalMap`.
     */
    normalMapTiling: number[];
    /**
     * Normal map UV channel.
     */
    normalMapUv: number;
    /**
     * If true, ambient color will occlude specular factor of a material.
     */
    occludeSpecular: number;
    /**
     * The opacity of the material. This is a value between 0 (completely transparent) and 1 (completely opaque).
     */
    opacity: number;
    /**
     * Controls whether Specular is faded out by material Opacity which is sometimes not desired for shiny translucent materials such as glass.
     */
    opacityFadesSpecular: boolean;
    /**
     * The asset id of the opacity map that specifies the per-pixel opacity. The opacity map is modulated by the `opacity` property.
     */
    opacityMap: number;
    /**
     * An opacity map color channel to extract color value from texture. Can be: r, g, b, a.
     */
    opacityMapChannel: string;
    /**
     * Array of 2 numbers controlling the 2D offset of the `opacityMap`. Each component is between 0 and 1.
     */
    opacityMapOffset: number[];
    /**
     * Array of 2 numbers controlling the 2D tiling of the `opacityMap`.
     */
    opacityMapTiling: number[];
    /**
     * Opacity map UV channel.
     */
    opacityMapUv: number;
    /**
     * Use vertex colors for opacity instead of a map.
     */
    opacityMapVertexColor: boolean;
    /**
     * A factor to determine what portion of light is reflected from the material.
     */
    reflectivity: number;
    /**
     * A factor to determine what portion of light passes through the material.
     */
    refraction: number;
    /**
     * Determines the amount of distortion of light passing through the material.
     */
    refractionIndex: number;
    /**
     * A value determining the smoothness of a surface. For smaller shininess values, a surface is rougher and specular highlights will be broader.
     * For larger shininess values, a surface is smoother and will exhibit more concentrated specular highlights.
     */
    shininess: number;
    /**
     * An array of 3 numbers representing the specular color of the material if no specular map is set or tint is checked.
     */
    specular: number[];
    /**
     * Enables Toksvig AA for mipmapped normal maps with specular.
     */
    specularAntialias: boolean;
    /**
     * The asset id of the specular map that specifies the per-pixel specular color. If no specular map is set, the specular color is used instead.
     */
    specularMap: number;
    /**
     * A specular map color channel to extract color value from texture. Can be: r, g, b, a, rgb.
     */
    specularMapChannel: string;
    /**
     * Array of 2 numbers controlling the 2D offset of the `specularMap`. Each component is between 0 and 1.
     */
    specularMapOffset: number[];
    /**
     * Array of 2 numbers controlling the 2D tiling of the `specularMap`.
     */
    specularMapTiling: number[];
    /**
     * Check this to modulate the material's specular map with a material specific specular color.
     */
    specularMapTint: boolean;
    /**
     * Specular map UV channel.
     */
    specularMapUv: number;
    /**
     * Use vertex colors for specular instead of a map.
     */
    specularMapVertexColor: boolean;
    /**
     * The asset id of a sphere map texture asset that approximates environment reflection.
     */
    sphereMap: number;
    /**
     * Apply fogging (as configured in scene settings).
     */
    useFog: boolean;
    /**
     * Apply gamma correction and tonemapping (as configured in scene settings).
     */
    useGammaTonemap: boolean;
    /**
     * Apply lighting.
     */
    useLighting: boolean;
    /**
     * Toggle between specular and metalness workflow.
     */
    useMetalness: boolean;
    /**
     * Apply scene skybox as prefiltered environment map.
     */
    useSkybox: boolean;
}

/**
 * Represents the data for a Model asset.
 */
type ModelAssetData = {
    /**
     * Defines the material mapping for each mesh instance.
     */
    mapping: Array<{
        /**
         * The material mapping object for a mesh instance.
         */
        [key: string]: any;
    }>;
};

/**
 * Represents the data for a Render asset.
 */
type RenderAssetData = {
    /**
     * The asset `id` of the container asset.
     */
    containerAsset: number;
    /**
     * The index of the render asset inside its container asset.
     */
    renderIndex: number;
};

/**
 * Represents the data for a Script asset.
 */
type ScriptAssetData = {
    /**
     * Whether this is a script that defines a custom loading screen.
     */
    loading: boolean;
    /**
     * This allows you to control when this script will be loaded.
     * The possible values are: 0 (load as a regular Asset), 1 (load before the PlayCanvas engine is loaded), 2 (load right after the PlayCanvas engine has loaded).
     */
    loadingType: number;
    /**
     * Contains all the script data.
     */
    scripts: {
        [key: string]: {
            /**
             * Contains the script attribute definitions.
             */
            attributes: {
                [key: string]: {
                    /**
                     * Whether this attribute is an array.
                     */
                    array: boolean;
                    /**
                     * The asset type. Can be various types like animation, audio, material, etc.
                     */
                    assetType: string;
                    /**
                     * Defines a color curve.
                     */
                    color: string;
                    /**
                     * The names of the curves.
                     */
                    curves: string[];
                    /**
                     * The default value for the attribute.
                     */
                    default: any;
                    /**
                     * The description of the attribute.
                     */
                    description: string;
                    /**
                     * Defines an enumeration of values.
                     */
                    enum: {
                        /**
                         * Options for the enum.
                         */
                        options: {
                            [key: string]: any;
                        };
                        /**
                         * The order of the enumerated values.
                         */
                        order: string[];
                    };
                    /**
                     * The maximum value.
                     */
                    max: number;
                    /**
                     * The minimum value.
                     */
                    min: number;
                    /**
                     * The placeholder string for the attribute.
                     */
                    placeholder: any;
                    /**
                     * The precision of the numeric input.
                     */
                    precision: number;
                    /**
                     * The schema for the json attribute.
                     */
                    schema: {
                        [key: string]: any;
                    }[];
                    /**
                     * The step for the numeric input.
                     */
                    step: number;
                    /**
                     * The title to display for the attribute in the Editor.
                     */
                    title: string;
                    /**
                     * The type of the script attribute. Can be: asset, boolean, curve, entity, json, number, rgb, rgba, string, vec2, vec3, vec4.
                     */
                    type: string;
                };
            };
            /**
             * An array that controls the order of the scripts in the script asset.
             */
            attributesOrder: string[];
        };
    };
};

/**
 * Represents the data for a Sprite asset.
 */
type SpriteAssetData = {
    /**
     * The number of pixels that represent one PlayCanvas unit. You can use this value to change the rendered size of your sprites.
     */
    pixelsPerUnit: number;
    /**
     * The render mode of the asset. Can be: `pc.SPRITE_RENDERMODE_SIMPLE`, `pc.SPRITE_RENDERMODE_SLICED`, `pc.SPRITE_RENDERMODE_TILED`.
     */
    renderMode: number;
    /**
     * The asset `id` of the texture atlas asset that contains all the frames that this asset is referencing.
     */
    textureAtlasAsset: number;
};

/**
 * Represents the data for a Texture asset.
 */
type TextureAssetData = {
    /**
     * The addressing mode to be applied to the texture in the U direction.
     * Can be: repeat, clamp, mirror.
     */
    addressu: string;
    /**
     * The addressing mode to be applied to the texture in the V direction.
     * Can be: repeat, clamp, mirror.
     */
    addressv: string;
    /**
     * Integer value specifying the level of anisotropic to apply to the texture ranging from 1 (no anisotropic filtering) to the `pc.GraphicsDevice` property `maxAnisotropy`.
     */
    anisotropy: number;
    /**
     * The magnification filter to be applied to the texture.
     * Can be: nearest, linear, nearest_mip_nearest, linear_mip_nearest, nearest_mip_linear, linear_mip_linear.
     */
    magfilter: string;
    /**
     * The minification filter to be applied to the texture.
     * Can be: nearest, linear, nearest_mip_nearest, linear_mip_nearest, nearest_mip_linear, linear_mip_linear.
     */
    minfilter: string;
    /**
     * Whether the texture has mipmaps.
     */
    mipmaps: boolean;
    /**
     * Whether the texture is RGBM. The RGBM format is a format to store high dynamic range (HDR) textures by using the alpha channel to store a multiplier for the rgb channels.
     */
    rgbm: boolean;
};

/**
 * Represents the data for a TextureAtlas asset.
 */
type TextureAtlasAssetData = {
    /**
     * The addressing mode to be applied to the texture in the U direction.
     * Can be: repeat, clamp, mirror.
     */
    addressu: string;
    /**
     * The addressing mode to be applied to the texture in the V direction.
     * Can be: repeat, clamp, mirror.
     */
    addressv: string;
    /**
     * Integer value specifying the level of anisotropic to apply to the texture ranging from 1 (no anisotropic filtering) to the `pc.GraphicsDevice` property `maxAnisotropy`.
     */
    anisotropy: number;
    /**
     * The definitions of the frames that can be referenced by sprite assets.
     */
    frames: {
        [key: string]: {
            /**
             * Array of 4 numbers controlling the frame border.
             */
            border: number[];
            /**
             * The frame name.
             */
            name: string;
            /**
             * Array of 2 numbers controlling the frame pivot.
             */
            pivot: number[];
            /**
             * Array of 4 numbers controlling the frame dimensions.
             */
            rect: number[];
        };
    };
    /**
     * The magnification filter to be applied to the texture.
     * Can be: nearest, linear, nearest_mip_nearest, linear_mip_nearest, nearest_mip_linear, linear_mip_linear.
     */
    magfilter: string;
    /**
     * The minification filter to be applied to the texture.
     * Can be: nearest, linear, nearest_mip_nearest, linear_mip_nearest, nearest_mip_linear, linear_mip_linear.
     */
    minfilter: string;
    /**
     * Whether the texture has mipmaps.
     */
    mipmaps: boolean;
    /**
     * Whether the texture is RGBM. The RGBM format is a format to store high dynamic range (HDR) textures by using the alpha channel to store a multiplier for the rgb channels.
     */
    rgbm: boolean;
};

/**
 * Represents the data for a Wasm asset.
 */
type WasmAssetData = {
    /**
     * The asset `id` of the fallback script asset to be used if wasm modules are not supported.
     */
    fallbackScriptId?: number;
    /**
     * The asset `id` of the script asset with the JavaScript glue code that implements the JavaScript interface to the wasm functions.
     */
    glueScriptId?: number;
    /**
     * The name of the module library defined in the wasm module.
     */
    moduleName: string;
};
