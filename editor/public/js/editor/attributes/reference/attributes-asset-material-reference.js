editor.once('load', function () {
    'use strict';

    var fields = [{
        name: 'asset',
        title: 'pc.Material',
        subTitle: '{Class}',
        description: 'Every surface on a 3D model is rendered using a material. The material defines the properties of that surface, such as its color, shininess, bumpiness. In PlayCanvas, a material is an Asset type which collects all these properties together. By default, it represents a Physical material. This exposes the fundamental properties that can be used to create many different types for visual effects, from smooth plastic, to rough wood, or scratched metal.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html'
    }, {
        name: 'ambientOverview',
        description: 'Ambient properties determine how the material appears in ambient light.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html'
    }, {
        title: 'ambient',
        subTitle: '{pc.Color}',
        description: 'The tint color to multiply the scene\'s global ambient color.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#ambient'
    }, {
        title: 'ambientTint',
        subTitle: '{Boolean}',
        description: 'Check this to multiply the scene\'s global ambient color with a material specific color.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#ambientTint'
    }, {
        title: 'aoMap',
        subTitle: '{pc.Texture}',
        description: 'An ambient occlusion map containing pre-baked ambient occlusion.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#aoMap'
    }, {
        title: 'aoMapChannel',
        subTitle: '{String}',
        description: 'An ambient occlusion map color channel to extract color value from texture. Can be: r, g, b, a',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#aoMapChannel'
    }, {
        title: 'aoMapUv',
        subTitle: '{Number}',
        description: 'AO map UV channel',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#aoMapUv'
    }, {
        title: 'aoMapVertexColor',
        subTitle: '{Boolean}',
        description: 'Use vertex colors for AO instead of a map',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#aoMapVertexColor'
    }, {
        title: 'aoMapTiling',
        subTitle: '{pc.Vec2}',
        description: 'Controls the 2D tiling of the AO map.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#aoMapTiling'
    }, {
        title: 'aoMapOffset',
        subTitle: '{pc.Vec2}',
        description: 'Controls the 2D offset of the AO map. Each component is between 0 and 1.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#aoMapOffset'
    }, {
        title: 'aoMapRotation',
        subTitle: '{Number}',
        description: 'Rotate the UV coordinates of the AO map around the center.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#aoMapRotation'
    }, {
        title: 'blendType',
        subTitle: '{pc.BLEND_*}',
        description: `The type of blending for this material. Options are:
        None {pc.BLEND_NONE}: The mesh is opaque. This is the default.
        Normal {pc.BLEND_NORMAL}: The mesh is transparent, like stained glass. Called as Alpha Blend as well.
        Additive {pc.BLEND_ADDITIVE}: The mesh color is added to whatever has already been rendered to the frame buffer.
        Additive Alpha {pc.BLEND_ADDITIVEALPHA}: Same as Additive except source RGB is multiplied by the source alpha.
        Screen {pc.BLEND_SCREEN}: Softer version of Additive.
        Pre-multiply {pc.BLEND_PREMULTIPLIED}: Like 'Normal' blending except it is assumed that the color of the mesh being rendered with this material has already been modulated by its alpha value.
        Multiply {pc.BLEND_MULTIPLICATIVE}: When rendered, the mesh color is multiplied by whatever has already been rendered to the frame buffer.
        Modulate 2x {pc.BLEND_MULTIPLICATIVE2X}: Multiplies colors and doubles the result.
        Min {pc.BLEND_MIN}: [Partial Support, check \`app.graphicsDevice.extBlendMinmax\` for support] Minimum color.
        Max {pc.BLEND_MAX}: [Partial Support, check \`app.graphicsDevice.extBlendMinmax\` for support] Maximum color.`,
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#blendType'
    }, {
        title: 'bumpiness',
        subTitle: '{Number}',
        description: 'The strength of the applied normal map. This is a value between 0 (the normal map has no effect) and 2 (the effect of the normal map is exaggerated). It defaults to 1.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#bumpiness'
    }, {
        title: 'conserveEnergy',
        subTitle: '{Boolean}',
        description: 'Defines how diffuse and specular components are combined when Fresnel is on. It is recommended that you leave this option enabled, although you may want to disable it in case when all reflection comes only from a few light sources, and you don\'t use an environment map, therefore having mostly black reflection.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#conserveEnergy'
    }, {
        title: 'cubeMap',
        subTitle: '{pc.Texture}',
        description: 'A cube map texture asset that approximates environment reflection (with greater accuracy than is possible with a sphere map). If scene has SkyBox set, then it will be used as default cubeMap',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#cubeMap'
    }, {
        title: 'cubeMapProjection',
        subTitle: '{pc.CUBEPROJ_*}',
        description: 'The type of projection applied to the cubeMap property, with available options: pc.CUBEPROJ_NONE and pc.CUBEPROJ_BOX. Set to Box to enable world-space axis-aligned projection of cubemap based on bounding box.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#cubeMapProjection'
    }, {
        name: 'cubeMapProjectionBoxCenter',
        title: 'cubeMapProjectionBox',
        subTitle: '{pc.BoundingBox}',
        description: 'The world space axis-aligned bounding box defining the box-projection used for the cubeMap property. Only used when cubeMapProjection is set to pc.CUBEPROJ_BOX.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#cubeMapProjectionBox'
    }, {
        name: 'cubeMapProjectionBoxHalfExtents',
        title: 'cubeMapProjectionBox',
        subTitle: '{pc.BoundingBox}',
        description: 'The world space axis-aligned bounding box defining the box-projection used for the cubeMap property. Only used when cubeMapProjection is set to pc.CUBEPROJ_BOX.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#cubeMapProjectionBox'
    }, {
        title: 'cull',
        subTitle: '{pc.CULLFACE_*}',
        description: 'Options are: None {pc.CULLFACE_NONE}: Both front faces and back faces are rendered. Front Faces {pc.CULLFACE_FRONT}: front faces are rendered and back faces are not. Back Faces {pc.CULLFACE_BACK}: back faces are rendered and front faces are not. This is the default. PlayCanvas dictates that a counter-clockwise vertex winding specifies a front face triangle. Note that backface culling is often good for performance because backface pixels are often overwritten (for convex meshes) which can result in redundant filling of pixels.'
    }, {
        title: 'depthTest',
        subTitle: '{Boolean}',
        description: 'If checked, when a mesh with the material is rendered, a per pixel check is performed to determine if the pixel passes the engine\'s depth test. By default, the test is that the pixel must have a z depth less than or equal to whatever is already in the depth buffer. In other words, the mesh is only visible if nothing is in front of it. If unchecked, the mesh is rendered regardless of what is already in the depth buffer. Defaults to on.'
    }, {
        title: 'depthWrite',
        subTitle: '{Boolean}',
        description: 'If checked, when a mesh with the material is rendered, its depth information is written to the depth buffer. This ensures that when subsequent meshes are rendered, they can be successfully depth tested against meshes rendered with this material. Defaults to on.'
    }, {
        name: 'diffuseOverview',
        description: 'Diffuse properties define the how a material reflects diffuse light emitted by dynamic light sources in the scene.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html'
    }, {
        title: 'diffuse',
        subTitle: '{pc.Color}',
        description: 'If no diffuse map is set or tint is enabled, this is the diffuse color of the material.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#diffuse'
    }, {
        title: 'diffuseMap',
        subTitle: '{pc.Texture}',
        description: 'The diffuse map that specifies the per-pixel diffuse material color. If no diffuse map is set, the diffuse color is used instead.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#diffuseMap'
    }, {
        title: 'diffuseMapChannel',
        subTitle: '{String}',
        description: 'An diffuse map color channel to extract color value from texture. Can be: r, g, b, a, rgb',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#diffuseMapChannel'
    }, {
        title: 'diffuseMapOffset',
        subTitle: '{pc.Vec2}',
        description: 'Controls the 2D offset of the diffuse map. Each component is between 0 and 1.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#diffuseMapOffset'
    }, {
        title: 'diffuseMapTiling',
        subTitle: '{pc.Vec2}',
        description: 'Controls the 2D tiling of the diffuse map.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#diffuseMapTiling'
    }, {
        title: 'diffuseMapRotation',
        subTitle: '{Number}',
        description: 'Rotate the UV coordinates of the diffuse map around the center.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#diffuseMapRotation'
    }, {
        title: 'diffuseMapTint',
        subTitle: '{Boolean}',
        description: 'Check this to modulate the material\'s diffuse map with a material specific diffuse color.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#diffuseMapTint'
    }, {
        title: 'diffuseMapUv',
        subTitle: '{Number}',
        description: 'Diffuse map UV channel',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#diffuseMapUv'
    }, {
        title: 'diffuseMapVertexColor',
        subTitle: '{Boolean}',
        description: 'Use vertex colors for diffuse instead of a map',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#diffuseMapVertexColor'
    }, {
        name: 'emissiveOverview',
        description: 'Emissive properties control how the material emits light (as opposed to reflecting light).',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html'
    }, {
        title: 'emissive',
        subTitle: '{pc.Color}',
        description: 'If no emissive map is set or tint is enabled, this is the emissive color of the material.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#emissive'
    }, {
        title: 'emissiveIntensity',
        subTitle: '{Number}',
        description: 'A multiplier for emissive color that can achieve overbright effects for exceptionally bright emissive materials.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#emissiveIntensity'
    }, {
        title: 'emissiveMap',
        subTitle: '{pc.Texture}',
        description: 'The emissive map that specifies the per-pixel emissive color. If no emissive map is set, the emissive color is used instead.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#emissiveMap'
    }, {
        title: 'emissiveMapChannel',
        subTitle: '{String}',
        description: 'An emissive map color channel to extract color value from texture. Can be: r, g, b, a, rgb',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#emissiveMapChannel'
    }, {
        title: 'emissiveMapOffset',
        subTitle: '{pc.Vec2}',
        description: 'Controls the 2D offset of the emissive map. Each component is between 0 and 1.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#emissiveMapOffset'
    }, {
        title: 'emissiveMapTiling',
        subTitle: '{pc.Vec2}',
        description: 'Controls the 2D tiling of the emissive map.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#emissiveMapTiling'
    }, {
        title: 'emissiveMapRotation',
        subTitle: '{Number}',
        description: 'Rotate the UV coordinates of the emissive map around the center.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#emissiveMapRotation'
    }, {
        title: 'emissiveMapTint',
        subTitle: '{Boolean}',
        description: 'Check this to modulate the material\'s emissive map with a material specific emissive color.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#emissiveMapTint'
    }, {
        title: 'emissiveMapUv',
        subTitle: '{Number}',
        description: 'Emissive map UV channel',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#emissiveMapUv'
    }, {
        title: 'emissiveMapVertexColor',
        subTitle: '{Boolean}',
        description: 'Use vertex colors for emission instead of a map',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#emissiveMapVertexColor'
    }, {
        name: 'environmentOverview',
        description: 'Environment properties determine how a material reflects and refracts the environment.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html'
    }, {
        title: 'fresnelModel',
        subTitle: '{pc.FRESNEL_*}',
        description: 'A parameter for Fresnel. May mean different things depending on fresnelModel.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#fresnelModel'
    }, {
        title: 'glossMap',
        subTitle: '{pc.Texture}',
        description: 'The gloss map that specifies a per-pixel shininess value. The gloss map is modulated by the shininess property.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#glossMap'
    }, {
        title: 'glossMapChannel',
        subTitle: '{String}',
        description: 'An gloss map color channel to extract color value from texture. Can be: r, g, b, a',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#glossMapChannel'
    }, {
        title: 'glossMapOffset',
        subTitle: '{pc.Vec2}',
        description: 'Controls the 2D offset of the gloss map. Each component is between 0 and 1.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#glossMapOffset'
    }, {
        title: 'glossMapTiling',
        subTitle: '{pc.Vec2}',
        description: 'Controls the 2D tiling of the gloss map.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#glossMapTiling'
    }, {
        title: 'glossMapRotation',
        subTitle: '{Number}',
        description: 'Rotate the UV coordinates of the gloss map around the center.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#glossMapRotation'
    }, {
        title: 'glossMapUv',
        subTitle: '{Number}',
        description: 'Gloss map UV channel',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#glossMapUv'
    }, {
        title: 'glossMapVertexColor',
        subTitle: '{Boolean}',
        description: 'Use vertex colors for glossiness instead of a map',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#glossMapVertexColor'
    }, {
        title: 'heightMap',
        subTitle: '{pc.Texture}',
        description: 'The height map that specifies the per-pixel strength of the parallax effect. White is full height and black is zero height.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#heightMap'
    }, {
        title: 'heightMapChannel',
        subTitle: '{String}',
        description: 'An height map color channel to extract color value from texture. Can be: r, g, b, a',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#heightMapChannel'
    }, {
        title: 'heightMapFactor',
        subTitle: '{Number}',
        description: 'The strength of a parallax effect (a value between 0 and 2, defaulting to 1).',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#heightMapFactor'
    }, {
        title: 'heightMapOffset',
        subTitle: '{pc.Vec2}',
        description: 'Controls the 2D offset of the height map. Each component is between 0 and 1.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#heightMapOffset'
    }, {
        title: 'heightMapTiling',
        subTitle: '{pc.Vec2}',
        description: 'Controls the 2D tiling of the height map.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#heightMapTiling'
    }, {
        title: 'heightMapRotation',
        subTitle: '{Number}',
        description: 'Rotate the UV coordinates of the height map around the center.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#heightMapRotation'
    }, {
        title: 'heightMapUv',
        subTitle: '{Number}',
        description: 'Height map UV channel',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#heightMapUv'
    }, {
        name: 'lightMapOverview',
        description: 'Light maps contain pre-baked diffuse lighting. Using light maps is considered an optimization in that runtime dynamic lighting calculations can be pre-calculated.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html'
    }, {
        title: 'lightMap',
        subTitle: '{pc.Texture}',
        description: 'The lightmap texture that contains pre-baked diffuse lighting. The lightmap usually is applied to the second UV set.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#lightMap'
    }, {
        title: 'lightMapChannel',
        subTitle: '{String}',
        description: 'An light map color channel to extract color value from texture. Can be: r, g, b, a, rgb',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#lightMapChannel'
    }, {
        title: 'lightMapUv',
        subTitle: '{Number}',
        description: 'Lightmap UV channel',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#lightMapUv'
    }, {
        title: 'lightMapVertexColor',
        subTitle: '{Boolean}',
        description: 'Use vertex lightmap instead of a texture-based one',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#lightMapVertexColor'
    }, {
        title: 'lightMapTiling',
        subTitle: '{pc.Vec2}',
        description: 'Controls the 2D tiling of the light map.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#lightMapTiling'
    }, {
        title: 'lightMapOffset',
        subTitle: '{pc.Vec2}',
        description: 'Controls the 2D offset of the light map. Each component is between 0 and 1.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#lightMapOffset'
    }, {
        title: 'lightMapRotation',
        subTitle: '{Number}',
        description: 'Rotate the UV coordinates of the light map around the center.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#lightMapRotation'
    }, {
        title: 'metalness',
        subTitle: '{Number}',
        description: 'Metalness factor multiplier.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#metalness'
    }, {
        title: 'metalnessMap',
        subTitle: '{pc.Texture}',
        description: 'This map specifies per-pixel metalness values. A value of 1 is metal and a value of 0 is non-metal.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#metalnessMap'
    }, {
        title: 'metalnessMapChannel',
        subTitle: '{String}',
        description: 'An metalness map color channel to extract color value from texture. Can be: r, g, b, a',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#metalnessMapChannel'
    }, {
        title: 'metalnessMapUv',
        subTitle: '{Number}',
        description: 'Metnalness map UV channel',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#metalnessMapUv'
    }, {
        title: 'metalnessMapVertexColor',
        subTitle: '{Boolean}',
        description: 'Use vertex colors for metalness instead of a map',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#metalnessMapVertexColor'
    }, {
        title: 'metalnessMapTiling',
        subTitle: '{pc.Vec2}',
        description: 'Controls the 2D tiling of the metalness map.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#metalnessMapTiling'
    }, {
        title: 'metalnessMapOffset',
        subTitle: '{String}',
        description: 'Controls the 2D offset of the metalness map. Each component is between 0 and 1.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#metalnessMapChannel'
    }, {
        title: 'metalnessMapRotation',
        subTitle: '{Number}',
        description: 'Rotate the UV coordinates of the metalness map around the center.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#metalnessMapRotation'
    }, {
        title: 'useMetalnessSpecularColor',
        subTitle: '{boolean}',
        description: 'Use specular color and specularity factor with metalness.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#useMetalnessSpecularColor'
    }, {
        name: 'normalOverview',
        description: 'Use this to specify normal maps in order to simulate \'Bumpiness\' effect.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html'
    }, {
        title: 'normalMap',
        subTitle: '{pc.Texture}',
        description: 'The normal map that specifies the per-pixel surface normals. The normal map is modulated by the \'Bumpiness\' property.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#normalMap'
    }, {
        title: 'normalMapOffset',
        subTitle: '{pc.Vec2}',
        description: 'Controls the 2D offset of the normal map. Each component is between 0 and 1.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#normalMapOffset'
    }, {
        title: 'normalMapTiling',
        subTitle: '{pc.Vec2}',
        description: 'Controls the 2D tiling of the normal map.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#normalMapTiling'
    }, {
        title: 'normalMapRotation',
        subTitle: '{Number}',
        description: 'Rotate the UV coordinates of the normal map around the center.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#normalMapRotation'
    }, {
        title: 'normalMapUv',
        subTitle: '{Number}',
        description: 'Normal map UV channel',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#normalMapUv'
    }, {
        title: 'occludeSpecular',
        subTitle: '{Boolean}',
        description: 'If checked, ambient color will occlude specular factor of a material.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#occludeSpecular'
    }, {
        name: 'other',
        description: 'Other Render States gives additional controls over how a mesh is rendered with the specified material.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html'
    }, {
        name: 'offset',
        description: 'The offset in U and V to apply to the first UV channel referenced by maps in this material.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html'
    }, {
        name: 'tiling',
        description: 'The scale in U and V to apply to the first UV channel referenced by maps in this material.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html'
    }, {
        title: 'rotation',
        subTitle: '{Number}',
        description: 'Rotate the UV coordinates around the center of the maps referenced by this material.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html'
    }, {
        name: 'opacityOverview',
        description: 'Opacity sets the transparency level.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html'
    }, {
        title: 'opacity',
        subTitle: '{Number}',
        description: 'The opacity of the material. This is a value between 0 (completely transparent) and 1 (completely opaque. It defaults to 1.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#opacity'
    }, {
        title: 'opacityMap',
        subTitle: '{pc.Texture}',
        description: 'The opacity map that specifies the per-pixel opacity. The opacity map is modulated by the \'Amount\' property.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#opacityMap'
    }, {
        title: 'opacityMapChannel',
        subTitle: '{String}',
        description: 'An opacity map color channel to extract color value from texture. Can be: r, g, b, a',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#opacityMapChannel'
    }, {
        title: 'opacityMapOffset',
        subTitle: '{pc.Vec2}',
        description: 'Controls the 2D offset of the opacity map. Each component is between 0 and 1.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#opacityMapOffset'
    }, {
        title: 'opacityMapTiling',
        subTitle: '{pc.Vec2}',
        description: 'Controls the 2D tiling of the opacity map.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#opacityMapTiling'
    }, {
        title: 'opacityMapRotation',
        subTitle: '{Number}',
        description: 'Rotate the UV coordinates of the opacity map around the center.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#opacityMapRotation'
    }, {
        title: 'opacityMapUv',
        subTitle: '{Number}',
        description: 'Opacity map UV channel',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#opacityMapUv'
    }, {
        title: 'opacityMapVertexColor',
        subTitle: '{Boolean}',
        description: 'Use vertex colors for opacity instead of a map',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#opacityMapVertexColor'
    }, {
        name: 'parallaxOverview',
        description: 'A height map gives further realism to a normal map by giving the illusion of depth to a surface. Note that parallax options are only enabled if you have set a normal map on the material.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html'
    }, {
        title: 'reflectivity',
        subTitle: '{Number}',
        description: 'A factor to determine what portion of light is reflected from the material. This value defaults to 1 (full reflectivity).',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#reflectivity'
    }, {
        title: 'shadingModel',
        subTitle: '{pc.SPECULAR_*}',
        description: 'Defines the shading model. Phong {pc.SPECULAR_PHONG}: Phong without energy conservation. You should only use it as a backwards compatibility with older projects. Physical {pc.SPECULAR_BLINN}: Energy-conserving Blinn-Phong.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#shadingModel'
    }, {
        title: 'shininess',
        subTitle: '{Number}',
        description: 'A value determining the smoothness of a surface. For smaller shininess values, a surface is rougher and specular highlights will be broader. For larger shininess values, a surface is smoother and will exhibit more concentrated specular highlights (as is the surace is polished and shiny).',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#shininess'
    }, {
        name: 'specularOverview',
        description: 'Specular properties defines the color of the specular highlights. i.e. the shininess',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html'
    }, {
        title: 'specular',
        subTitle: '{pc.Color}',
        description: 'If no specular map is set or tint is checked, this is the specular color of the material.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#specular'
    }, {
        title: 'specularAntialias',
        subTitle: '{Boolean}',
        description: 'Enables Toksvig AA for mipmapped normal maps with specular.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#specularAntialias'
    }, {
        title: 'specularMap',
        subTitle: '{pc.Texture}',
        description: 'The specular map that specifies the per-pixel specular color. If no specular map is set, the specular color is used instead.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#specularMap'
    }, {
        title: 'specularMapChannel',
        subTitle: '{String}',
        description: 'An specular map color channel to extract color value from texture. Can be: r, g, b, a, rgb',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#specularMapChannel'
    }, {
        title: 'specularMapOffset',
        subTitle: '{pc.Vec2}',
        description: 'Controls the 2D offset of the specular map. Each component is between 0 and 1.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#specularMapOffset'
    }, {
        title: 'specularMapTiling',
        subTitle: '{pc.Vec2}',
        description: 'Controls the 2D tiling of the specular map.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#specularMapTiling'
    }, {
        title: 'specularMapRotation',
        subTitle: '{Number}',
        description: 'Rotate the UV coordinates of the specular map around the center.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#specularMapRotation'
    }, {
        title: 'specularMapTint',
        subTitle: '{Boolean}',
        description: 'Check this to modulate the material\'s specular map with a material specific specular color.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#specularMapTint'
    }, {
        title: 'specularMapUv',
        subTitle: '{Number}',
        description: 'Specular map UV channel.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#specularMapUv'
    }, {
        title: 'specularMapVertexColor',
        subTitle: '{Boolean}',
        description: 'Use vertex colors for specular instead of a map.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#specularMapVertexColor'
    }, {
        title: 'specularityFactor',
        subTitle: '{Number}',
        description: 'If no specularity factor map is set or tint is checked, this is the specular factor of the material.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#specularityFactor'
    }, {
        title: 'specularityFactorMap',
        subTitle: '{pc.Texture}',
        description: 'The specularity factor map that specifies the per-pixel specular color. If no specular map is set, the specular color is used instead.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#specularityFactorMap'
    }, {
        title: 'specularityFactorMapUv',
        subTitle: '{Number}',
        description: 'Specular factor map UV channel.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#specularityFactorMapUv'
    }, {
        title: 'specularityFactorMapChannel',
        subTitle: '{String}',
        description: 'An specularity factor map color channel to extract color value from texture. Can be: r, g, b, a, rgb',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#specularityFactorMapChannel'
    }, {
        title: 'specularityFactorMapOffset',
        subTitle: '{pc.Vec2}',
        description: 'Controls the 2D offset of the specularity factor map. Each component is between 0 and 1.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#specularityFactorMapOffset'
    }, {
        title: 'specularityFactorMapTiling',
        subTitle: '{pc.Vec2}',
        description: 'Controls the 2D tiling of the specularity factor map.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#specularityFactorMapTiling'
    }, {
        title: 'specularityFactorMapRotation',
        subTitle: '{Number}',
        description: 'Rotate the UV coordinates of the specularity factor map around the center.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#specularityFactorMapRotation'
    }, {
        title: 'specularityFactorTint',
        subTitle: '{Boolean}',
        description: 'Check this to modulate the material\'s specularity factor map with a material specific specular color.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#specularityFactorMapTint'
    }, {
        title: 'specularityFactorVertexColor',
        subTitle: '{Boolean}',
        description: 'Use vertex colors for specularity factor instead of a map.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#specularityFactorMapVertexColor'
    }, {
        title: 'sphereMap',
        subTitle: '{pc.Texture}',
        description: 'A sphere map texture asset that approximates environment reflection. If a sphere map is set, the Cube Map property will be hidden (since these properties are mutually exclusive).',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#sphereMap'
    }, {
        title: 'useMetalness',
        subTitle: '{Boolean}',
        description: 'Toggle between specular and metalness workflow.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#useMetalness'
    }, {
        title: 'alphaTest',
        subTitle: '{Number}',
        description: 'The alpha test reference value to control which fragments are written to the currently active render target based on alpha value. All fragments with an alpha value of less than the alphaTest reference value will be discarded. alphaTest defaults to 0 (all fragments pass).',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#alphaTest'
    }, {
        title: 'alphaToCoverage',
        subTitle: '{Boolean}',
        webgl2: true,
        description: 'Enables or disables alpha to coverage. When enabled, and if hardware anti-aliasing is on, limited order-independent transparency can be achieved. Quality depends on the number of MSAA samples of the current render target. It can nicely soften edges of otherwise sharp alpha cutouts, but isn\'t recommended for large area semi-transparent surfaces. Note, that you don\'t need to enable blending to make alpha to coverage work. It will work without it, just like alphaTest.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#alphaToCoverage'
    }, {
        title: 'useFog',
        subTitle: '{Boolean}',
        description: 'Apply fogging (as configured in scene settings).',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#useFog'
    }, {
        title: 'useLighting',
        subTitle: '{Boolean}',
        description: 'Apply lighting.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#useLighting'
    }, {
        title: 'useSkybox',
        subTitle: '{Boolean}',
        description: 'Apply scene skybox as prefiltered environment map.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#useSkybox'
    }, {
        title: 'useGammaTonemap',
        subTitle: '{Boolean}',
        description: 'Apply gamma correction and tonemapping (as configured in scene settings).',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#useGammaTonemap'
    }, {
        title: 'enableGGXSpecular',
        subTitle: '{Boolean}',
        description: 'Enables GGX specular response. Also enables anisotropy parameter to set material anisotropy.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#enableGGXSpecular'
    }, {
        title: 'anisotropy',
        subTitle: '{Number}',
        description: 'Defines amount of specular anisotropy when GGX Specular is enabled',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#anisotropy'
    }, {
        title: 'clearCoat',
        subTitle: '{Number}',
        description: 'Defines intensity of clear coat layer from 0 to 1.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#clearCoat'
    }, {
        title: 'clearCoatMap',
        subTitle: '{pc.Texture}',
        description: 'The clear coat map that specifies a per-pixel intensity value. The clear coat map is modulated by the Clear Coat Factor property.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#clearCoatMap'
    }, {
        title: 'clearCoatMapChannel',
        subTitle: '{String}',
        description: 'An clearCoat map color channel to extract color value from texture. Can be: r, g, b, a',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#clearCoatMapChannel'
    }, {
        title: 'clearCoatMapOffset',
        subTitle: '{pc.Vec2}',
        description: 'Controls the 2D offset of the clear coat map. Each component is between 0 and 1.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#clearCoatMapOffset'
    }, {
        title: 'clearCoatMapTiling',
        subTitle: '{pc.Vec2}',
        description: 'Controls the 2D tiling of the clear coat map.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#clearCoatMapTiling'
    }, {
        title: 'clearCoatMapRotation',
        subTitle: '{Number}',
        description: 'Rotate the UV coordinates of the clear coat map around the center.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#clearCoatMapRotation'
    }, {
        title: 'clearCoatMapUv',
        subTitle: '{Number}',
        description: 'clearCoat map UV channel',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#clearCoatMapUv'
    }, {
        title: 'clearCoatVertexColor',
        subTitle: '{Boolean}',
        description: 'Use vertex colors for clearCoat intensity instead of a map',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#clearCoatVertexColor'
    }, {
        title: 'clearCoatVertexColorChannel',
        subTitle: '{String}',
        description: 'A color channel to extract color value from vertex colors. Can be: r, g, b, a',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#clearCoatVertexColorChannel'
    }, {
        title: 'clearCoatGlossiness',
        subTitle: '{Number}',
        description: 'A value determining the smoothness of a surface. For smaller glossiness values, the clear coat surface is rougher and specular highlights will be broader. For larger glossiness values, the clear coat surface is smoother and will exhibit more concentrated specular highlights (as if the clear coat surface is polished and shiny).',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#clearCoatGlossiness'
    }, {
        title: 'clearCoatGlossVertexColor',
        subTitle: '{Boolean}',
        description: 'Use vertex colors for clear coat glossiness instead of a map',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#clearCoatGlossVertexColor'
    }, {
        title: 'clearCoatGlossVertexColorChannel',
        subTitle: '{String}',
        description: 'A color channel to extract color value from vertex colors. Can be: r, g, b, a',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#clearCoatGlossVertexColorChannel'
    }, {
        title: 'clearCoatGlossMap',
        subTitle: '{pc.Texture}',
        description: 'The clear coat gloss map that specifies a per-pixel intensity value. The clear coat gloss map is modulated by the clearCoat property.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#clearCoatGlossMap'
    }, {
        title: 'clearCoatGlossMapChannel',
        subTitle: '{String}',
        description: 'A clear coat gloss map color channel to extract color value from texture. Can be: r, g, b, a',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#clearCoatGlossMapChannel'
    }, {
        title: 'clearCoatGlossMapOffset',
        subTitle: '{pc.Vec2}',
        description: 'Controls the 2D offset of the clear coat gloss map. Each component is between 0 and 1.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#clearCoatGlossMapOffset'
    }, {
        title: 'clearCoatGlossMapRotation',
        subTitle: '{Number}',
        description: 'Rotate the UV coordinates of the clear coat gloss map around the center.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#clearCoatGlossMapRotation'
    }, {
        title: 'clearCoatGlossMapTiling',
        subTitle: '{pc.Vec2}',
        description: 'Controls the 2D tiling of the clear coat gloss map.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#clearCoatGlossMapTiling'
    }, {
        title: 'clearCoatGlossMapUv',
        subTitle: '{Number}',
        description: 'clear coat gloss map UV channel',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#clearCoatGlossMapUv'
    }, {
        title: 'clearCoatBumpiness',
        subTitle: '{Number}',
        description: 'The strength of the applied normal map. This is a value between 0 (the normal map has no effect) and 2 (the effect of the normal map is exaggerated). It defaults to 1.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#clearCoatBumpiness'
    }, {
        title: 'clearCoatNormalMap',
        subTitle: '{pc.Texture}',
        description: 'The normal map that specifies the per-pixel surface normals. The normal map is modulated by the \'Bumpiness\' property.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#clearCoatNormalMap'
    }, {
        title: 'clearCoatNormalMapOffset',
        subTitle: '{pc.Vec2}',
        description: 'Controls the 2D offset of the clear coat normal map. Each component is between 0 and 1.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#clearCoatNormalMapOffset'
    }, {
        title: 'clearCoatNormalMapTiling',
        subTitle: '{pc.Vec2}',
        description: 'Controls the 2D tiling of the clear coat normal map.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#clearCoatNormalMapTiling'
    }, {
        title: 'clearCoatNormalMapRotation',
        subTitle: '{Number}',
        description: 'Rotate the UV coordinates of the normal map around the center.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#clearCoatNormalMapRotation'
    }, {
        title: 'clearCoatNormalMapUv',
        subTitle: '{Number}',
        description: 'Normal map UV channel',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#clearCoatNormalMapUv'
    }, {
        title: 'useSheen',
        subTitle: '{Boolean}',
        description: 'Enable the use of sheen specular effects.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#useSheen'
    }, {
        title: 'sheen',
        subTitle: '{pc.Color}',
        description: 'If no sheen map is set or tint is checked, this is the sheen specular color of the material.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#sheen'
    }, {
        title: 'sheenMap',
        subTitle: '{pc.Texture}',
        description: 'The sheen map that specifies the per-pixel sheen specular color. If no sheen map is set, the sheen color is used instead.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#sheenMap'
    }, {
        title: 'sheenMapChannel',
        subTitle: '{String}',
        description: 'A color channel to extract color value from sheen map. Can be: r, g, b, a, rgb',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#sheenMapChannel'
    }, {
        title: 'sheenMapOffset',
        subTitle: '{pc.Vec2}',
        description: 'Controls the 2D offset of the sheen map. Each component is between 0 and 1.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#sheenMapOffset'
    }, {
        title: 'sheenMapTiling',
        subTitle: '{pc.Vec2}',
        description: 'Controls the 2D tiling of the sheen map.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#sheenMapTiling'
    }, {
        title: 'sheenMapRotation',
        subTitle: '{Number}',
        description: 'Rotate the UV coordinates of the sheen map around the center.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#sheenMapRotation'
    }, {
        title: 'sheenMapTint',
        subTitle: '{Boolean}',
        description: 'Check this to modulate the material\'s sheen map with a material specific sheen specular color.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#sheenMapTint'
    }, {
        title: 'sheenMapUv',
        subTitle: '{Number}',
        description: 'Sheen map UV channel.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#sheenMapUv'
    }, {
        title: 'sheenVertexColor',
        subTitle: '{Boolean}',
        description: 'Use vertex colors for sheen instead of a map.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#sheenVertexColor'
    }, {
        title: 'sheenTint',
        subTitle: '{Boolean}',
        description: 'Use sheen color to tint with sheen map.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#sheenTint'
    }, {
        title: 'sheenGloss',
        subTitle: '{Number}',
        description: 'If no sheen gloss map is set or tint is checked, this is the sheen gloss of the material.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#sheenGloss'
    }, {
        title: 'sheenGlossMap',
        subTitle: '{pc.Texture}',
        description: 'The sheen gloss map that specifies the per-pixel sheen gloss color. If no sheen gloss map is set, the sheen gloss is used instead.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#sheenGlossMap'
    }, {
        title: 'sheenGlossMapChannel',
        subTitle: '{String}',
        description: 'A color channel to extract color value from sheen gloss map. Can be: r, g, b or a',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#sheenGlossMapChannel'
    }, {
        title: 'sheenGlossMapOffset',
        subTitle: '{pc.Vec2}',
        description: 'Controls the 2D offset of the sheen gloss map. Each component is between 0 and 1.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#sheenGlossMapOffset'
    }, {
        title: 'sheenGlossMapTiling',
        subTitle: '{pc.Vec2}',
        description: 'Controls the 2D tiling of the sheen gloss map.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#sheenGlossMapTiling'
    }, {
        title: 'sheenGlossMapRotation',
        subTitle: '{Number}',
        description: 'Rotate the UV coordinates of the sheen gloss map around the center.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#sheenGlossMapRotation'
    }, {
        title: 'sheenGlossMapTint',
        subTitle: '{Boolean}',
        description: 'Check this to modulate the material\'s sheen gloss map with a material specific sheen gloss value.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#sheenGlossMapTint'
    }, {
        title: 'sheenGlossMapUv',
        subTitle: '{Number}',
        description: 'Sheen gloss map UV channel.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#sheenGlossMapUv'
    }, {
        title: 'sheenGlossVertexColor',
        subTitle: '{Boolean}',
        description: 'Use vertex colors for sheen gloss instead of a map.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#sheenGlossVertexColor'
    }, {
        title: 'sheenGlossVertexColorChannel',
        subTitle: '{Boolean}',
        description: 'Use vertex color for sheen gloss instead of a map.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#sheenGlossVertexColor'
    }, {
        title: 'sheenGlossTint',
        subTitle: '{Boolean}',
        description: 'Use sheen gloss to tint with sheen map.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#sheenGlossTint'
    }, {
        title: 'useDynamicRefraction',
        subTitle: '{Boolean}',
        description: 'Enable use of grab pass for refractions.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#useDynamicRefraction'
    }, {
        title: 'refraction',
        subTitle: '{Number}',
        description: 'A factor to determine what portion of light passes through the material.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#refraction'
    }, {
        title: 'refractionIndex',
        subTitle: '{Number}',
        description: 'Determines the amount of distortion of light passing through the material. Represented as 1.0 / Index of Refraction',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#refractionIndex'
    }, {
        title: 'refractionMap',
        subTitle: '{pc.Texture}',
        description: 'The refraction map defines a per-pixel refraction amount.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#refractionMap'
    }, {
        title: 'refractionMapUv',
        subTitle: '{pc.Vec2}',
        description: 'The UV set used to sample the refraction map.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#refractionMapUv'
    }, {
        title: 'refractionMapChannel',
        subTitle: '{String}',
        description: 'A color channel to extract refraction intensity from the texture. Can be r, g, b or a.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#refractionMapChannel'
    }, {
        title: 'refractionMapOffset',
        subTitle: '{pc.Vec2}',
        description: 'The refraction map UV offset',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#refractionMapOffset'
    }, {
        title: 'refractionMapTiling',
        subTitle: '{pc.Vec2}',
        description: 'The refraction map UV tiling factor.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#refractionMapTiling'
    }, {
        title: 'refractionVertexColor',
        subTitle: '{Boolean}',
        description: 'Use vertex color for refraction intensity, or as multiplier with the refraction map.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#useDynamicRefraction'
    }, {
        title: 'refractionMapRotation',
        subTitle: '{Number}',
        description: 'Rotate the UV coordinates of the refraction map around the center.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#refractionMapRotation'
    }, {
        title: 'refractionVertexColorChannel',
        subTitle: '{Boolean}',
        description: 'A color channel to extract refraction intensity from the vertex color. Can be r, g, b or a.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#useDynamicRefraction'
    }, {
        title: 'thickness',
        subTitle: '{Number}',
        description: 'The thickness scale of the material. When used with thickness map, this value scales the thickness of the medium using the map as a weight. The units are in whatever unit the object is in.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#thickness'
    }, {
        title: 'thicknessMap',
        subTitle: '{pc.Texture}',
        description: 'The thickness map defines a per-pixel thickness of the medium.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#thicknessMap'
    }, {
        title: 'thicknessMapUv',
        subTitle: '{pc.Vec2}',
        description: 'The UV set used to sample the thickness map.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#thicknessMapUv'
    }, {
        title: 'thicknessMapChannel',
        subTitle: '{String}',
        description: 'A color channel to extract thickness from the texture. Can be r, g, b or a.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#thicknessMapChannel'
    }, {
        title: 'thicknessMapOffset',
        subTitle: '{pc.Vec2}',
        description: 'The thickness map UV offset',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#thicknessMapOffset'
    }, {
        title: 'thicknessMapTiling',
        subTitle: '{pc.Vec2}',
        description: 'The thickness map UV tiling factor.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#thicknessMapTiling'
    }, {
        title: 'thicknessMapRotation',
        subTitle: '{Number}',
        description: 'Rotate the UV coordinates of the thickness map around the center.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#thicknessMapRotation'
    }, {
        title: 'thicknessVertexColor',
        subTitle: '{Boolean}',
        description: 'Use vertex color for thickness, or as multiplier with the thickness map.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#thicknessVertexColor'
    }, {
        title: 'thicknessVertexColorChannel',
        subTitle: '{Boolean}',
        description: 'A color channel to extract thickness from the vertex color. Can be r, g, b or a.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#thicknessVertexColorChannel'
    }, {
        title: 'attenuation',
        subTitle: '{pc.Color}',
        description: 'The color attenuation of light passing through the medium.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#attenuation'
    }, {
        title: 'attenuationDistance',
        subTitle: '{Number}',
        description: 'The distance at which all light is considered to be fully absorbed.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#attenuationDistance'
    }, {
        title: 'useIridescence',
        subTitle: '{Boolean}',
        description: 'Enable iridescent diffraction effects.' ,
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#useIridescence'
    }, {
        title: 'iridescence',
        subTitle: '{Number}',
        description: 'The iridescence intensity of the material.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#iridescence'
    }, {
        title: 'iridescenceMap',
        subTitle: '{pc.Texture}',
        description: 'The iridescence map defines a per-pixel iridescence of the medium.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#iridescenceMap'
    }, {
        title: 'iridescenceMapUv',
        subTitle: '{pc.Vec2}',
        description: 'The UV set used to sample the iridescence map.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#iridescenceMapUv'
    }, {
        title: 'iridescenceMapChannel',
        subTitle: '{String}',
        description: 'A color channel to extract iridescence from the texture. Can be r, g, b or a.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#iridescenceMapChannel'
    }, {
        title: 'iridescenceMapOffset',
        subTitle: '{pc.Vec2}',
        description: 'The iridescence map UV offset',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#iridescenceMapOffset'
    }, {
        title: 'iridescenceMapTiling',
        subTitle: '{pc.Vec2}',
        description: 'The iridescence map UV tiling factor.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#iridescenceMapTiling'
    }, {
        title: 'iridescenceMapRotation',
        subTitle: '{Number}',
        description: 'Rotate the UV coordinates of the iridescence map around the center.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#iridescenceMapRotation'
    }, {
        title: 'iridescenceThicknessMap',
        subTitle: '{pc.Texture}',
        description: 'The iridescence thickness map defines a per-pixel iridescence thickness of the medium.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#iridescenceThicknessMap'
    }, {
        title: 'iridescenceThicknessMapUv',
        subTitle: '{pc.Vec2}',
        description: 'The UV set used to sample the iridescence thickness map.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#iridescenceThicknessMapUv'
    }, {
        title: 'iridescenceThicknessMapChannel',
        subTitle: '{String}',
        description: 'A color channel to extract iridescence thickness from the texture. Can be r, g, b or a.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#iridescenceThicknessMapChannel'
    }, {
        title: 'iridescenceThicknessMapOffset',
        subTitle: '{pc.Vec2}',
        description: 'The iridescence thickness map UV offset',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#iridescenceThicknessMapOffset'
    }, {
        title: 'iridescenceThicknessMapTiling',
        subTitle: '{pc.Vec2}',
        description: 'The iridescence thickness map UV tiling factor.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#iridescenceThicknessMapTiling'
    }, {
        title: 'iridescenceThicknessMapRotation',
        subTitle: '{Number}',
        description: 'Rotate the UV coordinates of the iridescence thickness map around the center.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#iridescenceThicknessMapRotation'
    }, {
        title: 'iridescenceThicknessMin',
        subTitle: '{Number}',
        description: 'The iridescence min thickness of the thin-film layer. Used with iridescence thickness map to scale the value between min and max. The unit is in nanometers (nm)',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#iridescenceThicknessMin'
    }, {
        title: 'iridescenceThicknessMax',
        subTitle: '{Number}',
        description: 'The iridescence max thickness of the thin-film layer. If no iridescence thickness map is used, this is the thickness of the thin-film layer. The unit is in nanometers (nm)',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#iridescenceThicknessMax'
    }, {
        title: 'iridescenceRefractionIndex',
        subTitle: '{Number}',
        description: 'The index of refraction of the thin-film layer.',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#iridescenceRefractionIndex'
    }, {
        title: 'opacityFadesSpecular',
        subTitle: '{Boolean}',
        description: 'Controls whether Specular is faded out by material Opacity which is sometimes not desired for shiny translucent materials such as glass',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#opacityFadesSpecular'
    }, {
        title: 'alphaFade',
        subTitle: '{Number}',
        description: 'Use alphaFade to fade out materials that do not use opacity to fade specular (opacityFadesSpecular is false).',
        url: 'http://developer.playcanvas.com/api/pc.StandardMaterial.html#alphaFade'
    }];

    for (let i = 0; i < fields.length; i++) {
        fields[i].name = 'asset:material:' + (fields[i].name || fields[i].title);
        editor.call('attributes:reference:add', fields[i]);
    }
});
