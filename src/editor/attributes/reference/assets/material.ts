import type { AttributeReference } from '../reference.type';

export const fields: AttributeReference[]  = [{
    name: 'asset:material:asset',
    title: 'pc.Material',
    subTitle: '{Class}',
    description: 'Every surface on a 3D model is rendered using a material. The material defines the properties of that surface, such as its color, shininess, bumpiness. In PlayCanvas, a material is an Asset type which collects all these properties together. By default, it represents a Physical material. This exposes the fundamental properties that can be used to create many different types for visual effects, from smooth plastic, to rough wood, or scratched metal.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html'
}, {
    name: 'asset:material:ambientOverview',
    description: 'Ambient properties determine how the material appears in ambient light.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html'
}, {
    name: 'asset:material:ambient',
    title: 'ambient',
    subTitle: '{pc.Color}',
    description: 'The tint color to multiply the scene\'s global ambient color.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#ambient'
}, {
    name: 'asset:material:aoMap',
    title: 'aoMap',
    subTitle: '{pc.Texture}',
    description: 'An ambient occlusion map containing pre-baked ambient occlusion.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#aomap'
}, {
    name: 'asset:material:aoMapChannel',
    title: 'aoMapChannel',
    subTitle: '{String}',
    description: 'An ambient occlusion map color channel to extract color value from texture. Can be: r, g, b, a',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#aomapchannel'
}, {
    name: 'asset:material:aoMapUv',
    title: 'aoMapUv',
    subTitle: '{Number}',
    description: 'AO map UV channel',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#aomapuv'
}, {
    name: 'asset:material:aoVertexColor',
    title: 'aoVertexColor',
    subTitle: '{Boolean}',
    description: 'Use vertex colors for AO instead of a map',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#aovertexcolor'
}, {
    name: 'asset:material:aoMapTiling',
    title: 'aoMapTiling',
    subTitle: '{pc.Vec2}',
    description: 'Controls the 2D tiling of the AO map.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#aomaptiling'
}, {
    name: 'asset:material:aoMapOffset',
    title: 'aoMapOffset',
    subTitle: '{pc.Vec2}',
    description: 'Controls the 2D offset of the AO map. Each component is between 0 and 1.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#aomapoffset'
}, {
    name: 'asset:material:aoMapRotation',
    title: 'aoMapRotation',
    subTitle: '{Number}',
    description: 'Rotate the UV coordinates of the AO map around the center.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#aomaprotation'
}, {
    name: 'asset:material:aoIntensity',
    title: 'aoIntensity',
    subTitle: '{Number}',
    description: 'The intensity of the AO map. This is a value between 0 and 1.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#aointensity'
}, {
    name: 'asset:material:blendType',
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
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#blendtype'
}, {
    name: 'asset:material:bumpiness',
    title: 'bumpiness',
    subTitle: '{Number}',
    description: 'The strength of the applied normal map. This is a value between 0 (the normal map has no effect) and 2 (the effect of the normal map is exaggerated). It defaults to 1.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#bumpiness'
}, {
    name: 'asset:material:conserveEnergy',
    title: 'conserveEnergy',
    subTitle: '{Boolean}',
    description: 'Defines how diffuse and specular components are combined when Fresnel is on. It is recommended that you leave this option enabled, although you may want to disable it in case when all reflection comes only from a few light sources, and you don\'t use an environment map, therefore having mostly black reflection.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#conserveenergy'
}, {
    name: 'asset:material:cubeMap',
    title: 'cubeMap',
    subTitle: '{pc.Texture}',
    description: 'A cube map texture asset that approximates environment reflection (with greater accuracy than is possible with a sphere map). If scene has SkyBox set, then it will be used as default cubeMap',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#cubemap'
}, {
    name: 'asset:material:cubeMapProjection',
    title: 'cubeMapProjection',
    subTitle: '{pc.CUBEPROJ_*}',
    description: 'The type of projection applied to the cubeMap property, with available options: pc.CUBEPROJ_NONE and pc.CUBEPROJ_BOX. Set to Box to enable world-space axis-aligned projection of cubemap based on bounding box.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#cubemapprojection'
}, {
    name: 'asset:material:cubeMapProjectionBoxCenter',
    title: 'cubeMapProjectionBox',
    subTitle: '{pc.BoundingBox}',
    description: 'The world space axis-aligned bounding box defining the box-projection used for the cubeMap property. Only used when cubeMapProjection is set to pc.CUBEPROJ_BOX.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#cubemapprojectionbox'
}, {
    name: 'asset:material:cubeMapProjectionBoxHalfExtents',
    title: 'cubeMapProjectionBox',
    subTitle: '{pc.BoundingBox}',
    description: 'The world space axis-aligned bounding box defining the box-projection used for the cubeMap property. Only used when cubeMapProjection is set to pc.CUBEPROJ_BOX.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#cubemapprojectionbox'
}, {
    name: 'asset:material:cull',
    title: 'cull',
    subTitle: '{pc.CULLFACE_*}',
    description: 'Options are: None {pc.CULLFACE_NONE}: Both front faces and back faces are rendered. Front Faces {pc.CULLFACE_FRONT}: front faces are rendered and back faces are not. Back Faces {pc.CULLFACE_BACK}: back faces are rendered and front faces are not. This is the default. PlayCanvas dictates that a counter-clockwise vertex winding specifies a front face triangle. Note that backface culling is often good for performance because backface pixels are often overwritten (for convex meshes) which can result in redundant filling of pixels.'
}, {
    name: 'asset:material:depthTest',
    title: 'depthTest',
    subTitle: '{Boolean}',
    description: 'If checked, when a mesh with the material is rendered, a per pixel check is performed to determine if the pixel passes the engine\'s depth test. By default, the test is that the pixel must have a z depth less than or equal to whatever is already in the depth buffer. In other words, the mesh is only visible if nothing is in front of it. If unchecked, the mesh is rendered regardless of what is already in the depth buffer. Defaults to on.'
}, {
    name: 'asset:material:depthWrite',
    title: 'depthWrite',
    subTitle: '{Boolean}',
    description: 'If checked, when a mesh with the material is rendered, its depth information is written to the depth buffer. This ensures that when subsequent meshes are rendered, they can be successfully depth tested against meshes rendered with this material. Defaults to on.'
}, {
    name: 'asset:material:diffuseOverview',
    description: 'Diffuse properties define the how a material reflects diffuse light emitted by dynamic light sources in the scene.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html'
}, {
    name: 'asset:material:diffuse',
    title: 'diffuse',
    subTitle: '{pc.Color}',
    description: 'If no diffuse map is set or tint is enabled, this is the diffuse color of the material.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#diffuse'
}, {
    name: 'asset:material:diffuseMap',
    title: 'diffuseMap',
    subTitle: '{pc.Texture}',
    description: 'The diffuse map that specifies the per-pixel diffuse material color. If no diffuse map is set, the diffuse color is used instead.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#diffusemap'
}, {
    name: 'asset:material:diffuseMapChannel',
    title: 'diffuseMapChannel',
    subTitle: '{String}',
    description: 'An diffuse map color channel to extract color value from texture. Can be: r, g, b, a, rgb',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#diffusemapchannel'
}, {
    name: 'asset:material:diffuseMapOffset',
    title: 'diffuseMapOffset',
    subTitle: '{pc.Vec2}',
    description: 'Controls the 2D offset of the diffuse map. Each component is between 0 and 1.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#diffusemapoffset'
}, {
    name: 'asset:material:diffuseMapTiling',
    title: 'diffuseMapTiling',
    subTitle: '{pc.Vec2}',
    description: 'Controls the 2D tiling of the diffuse map.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#diffusemaptiling'
}, {
    name: 'asset:material:diffuseMapRotation',
    title: 'diffuseMapRotation',
    subTitle: '{Number}',
    description: 'Rotate the UV coordinates of the diffuse map around the center.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#diffusemaprotation'
}, {
    name: 'asset:material:diffuseMapUv',
    title: 'diffuseMapUv',
    subTitle: '{Number}',
    description: 'Diffuse map UV channel',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#diffusemapuv'
}, {
    name: 'asset:material:diffuseVertexColor',
    title: 'diffuseVertexColor',
    subTitle: '{Boolean}',
    description: 'Use vertex colors for diffuse instead of a map',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#diffusevertexcolor'
}, {
    name: 'asset:material:emissiveOverview',
    description: 'Emissive properties control how the material emits light (as opposed to reflecting light).',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html'
}, {
    name: 'asset:material:emissive',
    title: 'emissive',
    subTitle: '{pc.Color}',
    description: 'If no emissive map is set or tint is enabled, this is the emissive color of the material.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#emissive'
}, {
    name: 'asset:material:emissiveIntensity',
    title: 'emissiveIntensity',
    subTitle: '{Number}',
    description: 'A multiplier for emissive color that can achieve overbright effects for exceptionally bright emissive materials.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#emissiveintensity'
}, {
    name: 'asset:material:emissiveMap',
    title: 'emissiveMap',
    subTitle: '{pc.Texture}',
    description: 'The emissive map that specifies the per-pixel emissive color. If no emissive map is set, the emissive color is used instead.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#emissivemap'
}, {
    name: 'asset:material:emissiveMapChannel',
    title: 'emissiveMapChannel',
    subTitle: '{String}',
    description: 'An emissive map color channel to extract color value from texture. Can be: r, g, b, a, rgb',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#emissivemapchannel'
}, {
    name: 'asset:material:emissiveMapOffset',
    title: 'emissiveMapOffset',
    subTitle: '{pc.Vec2}',
    description: 'Controls the 2D offset of the emissive map. Each component is between 0 and 1.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#emissivemapoffset'
}, {
    name: 'asset:material:emissiveMapTiling',
    title: 'emissiveMapTiling',
    subTitle: '{pc.Vec2}',
    description: 'Controls the 2D tiling of the emissive map.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#emissivemaptiling'
}, {
    name: 'asset:material:emissiveMapRotation',
    title: 'emissiveMapRotation',
    subTitle: '{Number}',
    description: 'Rotate the UV coordinates of the emissive map around the center.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#emissivemaprotation'
}, {
    name: 'asset:material:emissiveMapUv',
    title: 'emissiveMapUv',
    subTitle: '{Number}',
    description: 'Emissive map UV channel',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#emissivemapuv'
}, {
    name: 'asset:material:emissiveVertexColor',
    title: 'emissiveVertexColor',
    subTitle: '{Boolean}',
    description: 'Use vertex colors for emission instead of a map',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#emissivevertexcolor'
}, {
    name: 'asset:material:environmentOverview',
    description: 'Environment properties determine how a material reflects and refracts the environment.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html'
}, {
    name: 'asset:material:glossMap',
    title: 'glossMap',
    subTitle: '{pc.Texture}',
    description: 'The gloss map that specifies a per-pixel shininess value. The gloss map is modulated by the shininess property.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#glossmap'
}, {
    name: 'asset:material:glossMapChannel',
    title: 'glossMapChannel',
    subTitle: '{String}',
    description: 'An gloss map color channel to extract color value from texture. Can be: r, g, b, a',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#glossmapchannel'
}, {
    name: 'asset:material:glossMapOffset',
    title: 'glossMapOffset',
    subTitle: '{pc.Vec2}',
    description: 'Controls the 2D offset of the gloss map. Each component is between 0 and 1.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#glossmapoffset'
}, {
    name: 'asset:material:glossMapTiling',
    title: 'glossMapTiling',
    subTitle: '{pc.Vec2}',
    description: 'Controls the 2D tiling of the gloss map.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#glossmaptiling'
}, {
    name: 'asset:material:glossMapRotation',
    title: 'glossMapRotation',
    subTitle: '{Number}',
    description: 'Rotate the UV coordinates of the gloss map around the center.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#glossmaprotation'
}, {
    name: 'asset:material:glossMapUv',
    title: 'glossMapUv',
    subTitle: '{Number}',
    description: 'Gloss map UV channel',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#glossmapuv'
}, {
    name: 'asset:material:glossVertexColor',
    title: 'glossVertexColor',
    subTitle: '{Boolean}',
    description: 'Use vertex colors for glossiness instead of a map',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#glossvertexcolor'
}, {
    name: 'asset:material:glossInvert',
    title: 'glossInvert',
    subTitle: '{Boolean}',
    description: 'Invert material gloss, effectively treating it as roughness.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#glossinvert'
}, {
    name: 'asset:material:heightMap',
    title: 'heightMap',
    subTitle: '{pc.Texture}',
    description: 'The height map that specifies the per-pixel strength of the parallax effect. White is full height and black is zero height.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#heightmap'
}, {
    name: 'asset:material:heightMapChannel',
    title: 'heightMapChannel',
    subTitle: '{String}',
    description: 'An height map color channel to extract color value from texture. Can be: r, g, b, a',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#heightmapchannel'
}, {
    name: 'asset:material:heightMapFactor',
    title: 'heightMapFactor',
    subTitle: '{Number}',
    description: 'The strength of a parallax effect (a value between 0 and 2, defaulting to 1).',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#heightmapfactor'
}, {
    name: 'asset:material:heightMapOffset',
    title: 'heightMapOffset',
    subTitle: '{pc.Vec2}',
    description: 'Controls the 2D offset of the height map. Each component is between 0 and 1.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#heightmapoffset'
}, {
    name: 'asset:material:heightMapTiling',
    title: 'heightMapTiling',
    subTitle: '{pc.Vec2}',
    description: 'Controls the 2D tiling of the height map.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#heightmaptiling'
}, {
    name: 'asset:material:heightMapRotation',
    title: 'heightMapRotation',
    subTitle: '{Number}',
    description: 'Rotate the UV coordinates of the height map around the center.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#heightmaprotation'
}, {
    name: 'asset:material:heightMapUv',
    title: 'heightMapUv',
    subTitle: '{Number}',
    description: 'Height map UV channel',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#heightmapuv'
}, {
    name: 'asset:material:lightMapOverview',
    description: 'Light maps contain pre-baked diffuse lighting. Using light maps is considered an optimization in that runtime dynamic lighting calculations can be pre-calculated.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html'
}, {
    name: 'asset:material:lightMap',
    title: 'lightMap',
    subTitle: '{pc.Texture}',
    description: 'The lightmap texture that contains pre-baked diffuse lighting. The lightmap usually is applied to the second UV set.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#lightmap'
}, {
    name: 'asset:material:lightMapChannel',
    title: 'lightMapChannel',
    subTitle: '{String}',
    description: 'An light map color channel to extract color value from texture. Can be: r, g, b, a, rgb',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#lightmapchannel'
}, {
    name: 'asset:material:lightMapUv',
    title: 'lightMapUv',
    subTitle: '{Number}',
    description: 'Lightmap UV channel',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#lightmapuv'
}, {
    name: 'asset:material:lightVertexColor',
    title: 'lightVertexColor',
    subTitle: '{Boolean}',
    description: 'Use vertex lightmap instead of a texture-based one',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#lightvertexcolor'
}, {
    name: 'asset:material:lightMapTiling',
    title: 'lightMapTiling',
    subTitle: '{pc.Vec2}',
    description: 'Controls the 2D tiling of the light map.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#lightmaptiling'
}, {
    name: 'asset:material:lightMapOffset',
    title: 'lightMapOffset',
    subTitle: '{pc.Vec2}',
    description: 'Controls the 2D offset of the light map. Each component is between 0 and 1.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#lightmapoffset'
}, {
    name: 'asset:material:lightMapRotation',
    title: 'lightMapRotation',
    subTitle: '{Number}',
    description: 'Rotate the UV coordinates of the light map around the center.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#lightmaprotation'
}, {
    name: 'asset:material:metalness',
    title: 'metalness',
    subTitle: '{Number}',
    description: 'Metalness factor multiplier.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#metalness'
}, {
    name: 'asset:material:metalnessMap',
    title: 'metalnessMap',
    subTitle: '{pc.Texture}',
    description: 'This map specifies per-pixel metalness values. A value of 1 is metal and a value of 0 is non-metal.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#metalnessmap'
}, {
    name: 'asset:material:metalnessMapChannel',
    title: 'metalnessMapChannel',
    subTitle: '{String}',
    description: 'An metalness map color channel to extract color value from texture. Can be: r, g, b, a',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#metalnessmapchannel'
}, {
    name: 'asset:material:metalnessMapUv',
    title: 'metalnessMapUv',
    subTitle: '{Number}',
    description: 'Metnalness map UV channel',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#metalnessmapuv'
}, {
    name: 'asset:material:metalnessVertexColor',
    title: 'metalnessVertexColor',
    subTitle: '{Boolean}',
    description: 'Use vertex colors for metalness instead of a map',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#metalnessvertexcolor'
}, {
    name: 'asset:material:metalnessMapTiling',
    title: 'metalnessMapTiling',
    subTitle: '{pc.Vec2}',
    description: 'Controls the 2D tiling of the metalness map.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#metalnessmaptiling'
}, {
    name: 'asset:material:metalnessMapOffset',
    title: 'metalnessMapOffset',
    subTitle: '{String}',
    description: 'Controls the 2D offset of the metalness map. Each component is between 0 and 1.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#metalnessmapchannel'
}, {
    name: 'asset:material:metalnessMapRotation',
    title: 'metalnessMapRotation',
    subTitle: '{Number}',
    description: 'Rotate the UV coordinates of the metalness map around the center.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#metalnessmaprotation'
}, {
    name: 'asset:material:useMetalnessSpecularColor',
    title: 'useMetalnessSpecularColor',
    subTitle: '{boolean}',
    description: 'Use specular color and specularity factor with metalness.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#usemetalnessspecularcolor'
}, {
    name: 'asset:material:normalOverview',
    description: 'Use this to specify normal maps in order to simulate \'Bumpiness\' effect.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html'
}, {
    name: 'asset:material:normalMap',
    title: 'normalMap',
    subTitle: '{pc.Texture}',
    description: 'The normal map that specifies the per-pixel surface normals. The normal map is modulated by the \'Bumpiness\' property.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#normalmap'
}, {
    name: 'asset:material:normalMapOffset',
    title: 'normalMapOffset',
    subTitle: '{pc.Vec2}',
    description: 'Controls the 2D offset of the normal map. Each component is between 0 and 1.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#normalmapoffset'
}, {
    name: 'asset:material:normalMapTiling',
    title: 'normalMapTiling',
    subTitle: '{pc.Vec2}',
    description: 'Controls the 2D tiling of the normal map.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#normalmaptiling'
}, {
    name: 'asset:material:normalMapRotation',
    title: 'normalMapRotation',
    subTitle: '{Number}',
    description: 'Rotate the UV coordinates of the normal map around the center.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#normalmaprotation'
}, {
    name: 'asset:material:normalMapUv',
    title: 'normalMapUv',
    subTitle: '{Number}',
    description: 'Normal map UV channel',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#normalmapuv'
}, {
    name: 'asset:material:occludeSpecular',
    title: 'occludeSpecular',
    subTitle: '{Boolean}',
    description: 'If checked, ambient color will occlude specular factor of a material.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#occludespecular'
}, {
    name: 'asset:material:other',
    description: 'Other Render States gives additional controls over how a mesh is rendered with the specified material.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html'
}, {
    name: 'asset:material:offset',
    description: 'The offset in U and V to apply to the first UV channel referenced by maps in this material.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html'
}, {
    name: 'asset:material:tiling',
    description: 'The scale in U and V to apply to the first UV channel referenced by maps in this material.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html'
}, {
    name: 'asset:material:rotation',
    title: 'rotation',
    subTitle: '{Number}',
    description: 'Rotate the UV coordinates around the center of the maps referenced by this material.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html'
}, {
    name: 'asset:material:opacityOverview',
    description: 'Opacity sets the transparency level.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html'
}, {
    name: 'asset:material:opacity',
    title: 'opacity',
    subTitle: '{Number}',
    description: 'The opacity of the material. This is a value between 0 (completely transparent) and 1 (completely opaque. It defaults to 1.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#opacity'
}, {
    name: 'asset:material:opacityMap',
    title: 'opacityMap',
    subTitle: '{pc.Texture}',
    description: 'The opacity map that specifies the per-pixel opacity. The opacity map is modulated by the \'Amount\' property.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#opacitymap'
}, {
    name: 'asset:material:opacityMapChannel',
    title: 'opacityMapChannel',
    subTitle: '{String}',
    description: 'An opacity map color channel to extract color value from texture. Can be: r, g, b, a',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#opacitymapchannel'
}, {
    name: 'asset:material:opacityMapOffset',
    title: 'opacityMapOffset',
    subTitle: '{pc.Vec2}',
    description: 'Controls the 2D offset of the opacity map. Each component is between 0 and 1.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#opacitymapoffset'
}, {
    name: 'asset:material:opacityMapTiling',
    title: 'opacityMapTiling',
    subTitle: '{pc.Vec2}',
    description: 'Controls the 2D tiling of the opacity map.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#opacitymaptiling'
}, {
    name: 'asset:material:opacityMapRotation',
    title: 'opacityMapRotation',
    subTitle: '{Number}',
    description: 'Rotate the UV coordinates of the opacity map around the center.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#opacitymaprotation'
}, {
    name: 'asset:material:opacityMapUv',
    title: 'opacityMapUv',
    subTitle: '{Number}',
    description: 'Opacity map UV channel',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#opacitymapuv'
}, {
    name: 'asset:material:opacityVertexColor',
    title: 'opacityVertexColor',
    subTitle: '{Boolean}',
    description: 'Use vertex colors for opacity instead of a map',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#opacityvertexcolor'
}, {
    name: 'asset:material:parallaxOverview',
    description: 'A height map gives further realism to a normal map by giving the illusion of depth to a surface. Note that parallax options are only enabled if you have set a normal map on the material.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html'
}, {
    name: 'asset:material:reflectivity',
    title: 'reflectivity',
    subTitle: '{Number}',
    description: 'A factor to determine what portion of light is reflected from the material. This value defaults to 1 (full reflectivity).',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#reflectivity'
}, {
    name: 'asset:material:shininess',
    title: 'shininess',
    subTitle: '{Number}',
    description: 'A value determining the smoothness of a surface. For smaller shininess values, a surface is rougher and specular highlights will be broader. For larger shininess values, a surface is smoother and will exhibit more concentrated specular highlights (as is the surace is polished and shiny).',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#shininess'
}, {
    name: 'asset:material:specularOverview',
    description: 'Specular properties defines the color of the specular highlights. i.e. the shininess',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html'
}, {
    name: 'asset:material:specular',
    title: 'specular',
    subTitle: '{pc.Color}',
    description: 'If no specular map is set or tint is checked, this is the specular color of the material.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#specular'
}, {
    name: 'asset:material:specularAntialias',
    title: 'specularAntialias',
    subTitle: '{Boolean}',
    description: 'Enables Toksvig AA for mipmapped normal maps with specular.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#specularantialias'
}, {
    name: 'asset:material:specularMap',
    title: 'specularMap',
    subTitle: '{pc.Texture}',
    description: 'The specular map that specifies the per-pixel specular color. If no specular map is set, the specular color is used instead.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#specularmap'
}, {
    name: 'asset:material:specularMapChannel',
    title: 'specularMapChannel',
    subTitle: '{String}',
    description: 'An specular map color channel to extract color value from texture. Can be: r, g, b, a, rgb',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#specularmapchannel'
}, {
    name: 'asset:material:specularMapOffset',
    title: 'specularMapOffset',
    subTitle: '{pc.Vec2}',
    description: 'Controls the 2D offset of the specular map. Each component is between 0 and 1.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#specularmapoffset'
}, {
    name: 'asset:material:specularMapTiling',
    title: 'specularMapTiling',
    subTitle: '{pc.Vec2}',
    description: 'Controls the 2D tiling of the specular map.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#specularmaptiling'
}, {
    name: 'asset:material:specularMapRotation',
    title: 'specularMapRotation',
    subTitle: '{Number}',
    description: 'Rotate the UV coordinates of the specular map around the center.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#specularmaprotation'
}, {
    name: 'asset:material:specularTint',
    title: 'specularTint',
    subTitle: '{Boolean}',
    description: 'Check this to modulate the material\'s specular map with a material specific specular color.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#speculartint'
}, {
    name: 'asset:material:specularMapUv',
    title: 'specularMapUv',
    subTitle: '{Number}',
    description: 'Specular map UV channel.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#specularmapuv'
}, {
    name: 'asset:material:specularVertexColor',
    title: 'specularVertexColor',
    subTitle: '{Boolean}',
    description: 'Use vertex colors for specular instead of a map.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#specularvertexcolor'
}, {
    name: 'asset:material:specularityFactor',
    title: 'specularityFactor',
    subTitle: '{Number}',
    description: 'If no specularity factor map is set or tint is checked, this is the specular factor of the material.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#specularityfactor'
}, {
    name: 'asset:material:specularityFactorMap',
    title: 'specularityFactorMap',
    subTitle: '{pc.Texture}',
    description: 'The specularity factor map that specifies the per-pixel specular color. If no specular map is set, the specular color is used instead.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#specularityfactormap'
}, {
    name: 'asset:material:specularityFactorMapUv',
    title: 'specularityFactorMapUv',
    subTitle: '{Number}',
    description: 'Specular factor map UV channel.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#specularityfactormapuv'
}, {
    name: 'asset:material:specularityFactorMapChannel',
    title: 'specularityFactorMapChannel',
    subTitle: '{String}',
    description: 'An specularity factor map color channel to extract color value from texture. Can be: r, g, b, a, rgb',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#specularityfactormapchannel'
}, {
    name: 'asset:material:specularityFactorMapOffset',
    title: 'specularityFactorMapOffset',
    subTitle: '{pc.Vec2}',
    description: 'Controls the 2D offset of the specularity factor map. Each component is between 0 and 1.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#specularityfactormapoffset'
}, {
    name: 'asset:material:specularityFactorMapTiling',
    title: 'specularityFactorMapTiling',
    subTitle: '{pc.Vec2}',
    description: 'Controls the 2D tiling of the specularity factor map.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#specularityfactormaptiling'
}, {
    name: 'asset:material:specularityFactorMapRotation',
    title: 'specularityFactorMapRotation',
    subTitle: '{Number}',
    description: 'Rotate the UV coordinates of the specularity factor map around the center.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#specularityfactormaprotation'
}, {
    name: 'asset:material:specularityFactorTint',
    title: 'specularityFactorTint',
    subTitle: '{Boolean}',
    description: 'Check this to modulate the material\'s specularity factor map with a material specific specular color.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#specularityfactortint'
}, {
    name: 'asset:material:specularityFactorVertexColor',
    title: 'specularityFactorVertexColor',
    subTitle: '{Boolean}',
    description: 'Use vertex colors for specularity factor instead of a map.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#specularityfactorvertexcolor'
}, {
    name: 'asset:material:sphereMap',
    title: 'sphereMap',
    subTitle: '{pc.Texture}',
    description: 'A sphere map texture asset that approximates environment reflection. If a sphere map is set, the Cube Map property will be hidden (since these properties are mutually exclusive).',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#spheremap'
}, {
    name: 'asset:material:useMetalness',
    title: 'useMetalness',
    subTitle: '{Boolean}',
    description: 'Toggle between specular and metalness workflow.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#usemetalness'
}, {
    name: 'asset:material:alphaTest',
    title: 'alphaTest',
    subTitle: '{Number}',
    description: 'The alpha test reference value to control which fragments are written to the currently active render target based on alpha value. All fragments with an alpha value of less than the alphaTest reference value will be discarded. alphaTest defaults to 0 (all fragments pass).',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#alphatest'
}, {
    name: 'asset:material:alphaToCoverage',
    title: 'alphaToCoverage',
    subTitle: '{Boolean}',
    webgl2: true,
    description: 'Enables or disables alpha to coverage. When enabled, and if hardware anti-aliasing is on, limited order-independent transparency can be achieved. Quality depends on the number of MSAA samples of the current render target. It can nicely soften edges of otherwise sharp alpha cutouts, but isn\'t recommended for large area semi-transparent surfaces. Note, that you don\'t need to enable blending to make alpha to coverage work. It will work without it, just like alphaTest.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#alphatocoverage'
}, {
    name: 'asset:material:useFog',
    title: 'useFog',
    subTitle: '{Boolean}',
    description: 'Apply fogging (as configured in scene settings).',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#usefog'
}, {
    name: 'asset:material:useLighting',
    title: 'useLighting',
    subTitle: '{Boolean}',
    description: 'Apply lighting.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#uselighting'
}, {
    name: 'asset:material:useSkybox',
    title: 'useSkybox',
    subTitle: '{Boolean}',
    description: 'Apply scene skybox as prefiltered environment map.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#useskybox'
}, {
    name: 'asset:material:useTonemap',
    title: 'useTonemap',
    subTitle: '{Boolean}',
    description: 'Apply tonemapping (as configured in scene settings).',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#usetonemap'
}, {
    name: 'asset:material:enableGGXSpecular',
    title: 'enableGGXSpecular',
    subTitle: '{Boolean}',
    description: 'Enables GGX specular response. Also enables anisotropy parameter to set material anisotropy.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#enableggxspecular'
}, {
    name: 'asset:material:anisotropyMap',
    title: 'anisotropyMap',
    subTitle: '{pc.Texture}',
    description: 'The anisotropy map of the material.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#anisotropyMap'
}, {
    name: 'asset:material:anisotropyMapUv',
    title: 'anisotropyMapUv',
    subTitle: '{pc.Texture}',
    description: 'The anisotropy UV channel.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#anisotropyMapUv'
}, {
    name: 'asset:material:anisotropyMapOffset',
    title: 'anisotropyMapOffset',
    subTitle: '{pc.Vec2}',
    description: 'Controls the 2D offset of the anisotropy map. Each component is between 0 and 1.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#anisotropyMapOffset'
}, {
    name: 'asset:material:anisotropyMapTiling',
    title: 'anisotropyMapTiling',
    subTitle: '{pc.Vec2}',
    description: 'Controls the 2D tiling of the anisotropy map.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#anisotropyMapTiling'
}, {
    name: 'asset:material:anisotropyMapRotation',
    title: 'anisotropyMapRotation',
    subTitle: '{Number}',
    description: 'Defines the rotation (in degrees) of the anisotropy map.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#anisotropyMapRotation'
}, {
    name: 'asset:material:anisotropyIntensity',
    title: 'anisotropyIntensity',
    subTitle: '{Number}',
    description: 'Defines amount of anisotropy when GGX Specular is enabled',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#anisotropyIntensity'
}, {
    name: 'asset:material:anisotropyRotation',
    title: 'anisotropyRotation',
    subTitle: '{Number}',
    description: 'Defines the rotation (in degrees) of anisotropy',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#anisotropyRotation'
}, {
    name: 'asset:material:clearCoat',
    title: 'clearCoat',
    subTitle: '{Number}',
    description: 'Defines intensity of clear coat layer from 0 to 1.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#clearcoat'
}, {
    name: 'asset:material:clearCoatMap',
    title: 'clearCoatMap',
    subTitle: '{pc.Texture}',
    description: 'The clear coat map that specifies a per-pixel intensity value. The clear coat map is modulated by the Clear Coat Factor property.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#clearcoatmap'
}, {
    name: 'asset:material:clearCoatMapChannel',
    title: 'clearCoatMapChannel',
    subTitle: '{String}',
    description: 'An clearCoat map color channel to extract color value from texture. Can be: r, g, b, a',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#clearcoatmapchannel'
}, {
    name: 'asset:material:clearCoatMapOffset',
    title: 'clearCoatMapOffset',
    subTitle: '{pc.Vec2}',
    description: 'Controls the 2D offset of the clear coat map. Each component is between 0 and 1.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#clearcoatmapoffset'
}, {
    name: 'asset:material:clearCoatMapTiling',
    title: 'clearCoatMapTiling',
    subTitle: '{pc.Vec2}',
    description: 'Controls the 2D tiling of the clear coat map.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#clearcoatmaptiling'
}, {
    name: 'asset:material:clearCoatMapRotation',
    title: 'clearCoatMapRotation',
    subTitle: '{Number}',
    description: 'Rotate the UV coordinates of the clear coat map around the center.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#clearcoatmaprotation'
}, {
    name: 'asset:material:clearCoatMapUv',
    title: 'clearCoatMapUv',
    subTitle: '{Number}',
    description: 'clearCoat map UV channel',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#clearcoatmapuv'
}, {
    name: 'asset:material:clearCoatVertexColor',
    title: 'clearCoatVertexColor',
    subTitle: '{Boolean}',
    description: 'Use vertex colors for clearCoat intensity instead of a map',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#clearcoatvertexcolor'
}, {
    name: 'asset:material:clearCoatVertexColorChannel',
    title: 'clearCoatVertexColorChannel',
    subTitle: '{String}',
    description: 'A color channel to extract color value from vertex colors. Can be: r, g, b, a',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#clearcoatvertexcolorchannel'
}, {
    name: 'asset:material:clearCoatGloss',
    title: 'clearCoatGloss',
    subTitle: '{Number}',
    description: 'A value determining the smoothness of a surface. For smaller glossiness values, the clear coat surface is rougher and specular highlights will be broader. For larger glossiness values, the clear coat surface is smoother and will exhibit more concentrated specular highlights (as if the clear coat surface is polished and shiny).',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#clearcoatgloss'
}, {
    name: 'asset:material:clearCoatGlossVertexColor',
    title: 'clearCoatGlossVertexColor',
    subTitle: '{Boolean}',
    description: 'Use vertex colors for clear coat glossiness instead of a map',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#clearcoatglossvertexcolor'
}, {
    name: 'asset:material:clearCoatGlossVertexColorChannel',
    title: 'clearCoatGlossVertexColorChannel',
    subTitle: '{String}',
    description: 'A color channel to extract color value from vertex colors. Can be: r, g, b, a',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#clearcoatglossvertexcolorchannel'
}, {
    name: 'asset:material:clearCoatGlossMap',
    title: 'clearCoatGlossMap',
    subTitle: '{pc.Texture}',
    description: 'The clear coat gloss map that specifies a per-pixel intensity value. The clear coat gloss map is modulated by the clearCoat property.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#clearcoatglossmap'
}, {
    name: 'asset:material:clearCoatGlossMapChannel',
    title: 'clearCoatGlossMapChannel',
    subTitle: '{String}',
    description: 'A clear coat gloss map color channel to extract color value from texture. Can be: r, g, b, a',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#clearcoatglossmapchannel'
}, {
    name: 'asset:material:clearCoatGlossMapOffset',
    title: 'clearCoatGlossMapOffset',
    subTitle: '{pc.Vec2}',
    description: 'Controls the 2D offset of the clear coat gloss map. Each component is between 0 and 1.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#clearcoatglossmapoffset'
}, {
    name: 'asset:material:clearCoatGlossMapRotation',
    title: 'clearCoatGlossMapRotation',
    subTitle: '{Number}',
    description: 'Rotate the UV coordinates of the clear coat gloss map around the center.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#clearcoatglossmaprotation'
}, {
    name: 'asset:material:clearCoatGlossMapTiling',
    title: 'clearCoatGlossMapTiling',
    subTitle: '{pc.Vec2}',
    description: 'Controls the 2D tiling of the clear coat gloss map.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#clearcoatglossmaptiling'
}, {
    name: 'asset:material:clearCoatGlossMapUv',
    title: 'clearCoatGlossMapUv',
    subTitle: '{Number}',
    description: 'clear coat gloss map UV channel',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#clearcoatglossmapuv'
}, {
    name: 'asset:material:clearCoatGlossInvert',
    title: 'clearCoatGlossInvert',
    subTitle: '{Boolean}',
    description: 'Invert material clear coat gloss, effectively treating it as roughness',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#clearcoatglossinvert'
}, {
    name: 'asset:material:clearCoatBumpiness',
    title: 'clearCoatBumpiness',
    subTitle: '{Number}',
    description: 'The strength of the applied normal map. This is a value between 0 (the normal map has no effect) and 2 (the effect of the normal map is exaggerated). It defaults to 1.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#clearcoatbumpiness'
}, {
    name: 'asset:material:clearCoatNormalMap',
    title: 'clearCoatNormalMap',
    subTitle: '{pc.Texture}',
    description: 'The normal map that specifies the per-pixel surface normals. The normal map is modulated by the \'Bumpiness\' property.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#clearcoatnormalmap'
}, {
    name: 'asset:material:clearCoatNormalMapOffset',
    title: 'clearCoatNormalMapOffset',
    subTitle: '{pc.Vec2}',
    description: 'Controls the 2D offset of the clear coat normal map. Each component is between 0 and 1.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#clearcoatnormalmapoffset'
}, {
    name: 'asset:material:clearCoatNormalMapTiling',
    title: 'clearCoatNormalMapTiling',
    subTitle: '{pc.Vec2}',
    description: 'Controls the 2D tiling of the clear coat normal map.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#clearcoatnormalmaptiling'
}, {
    name: 'asset:material:clearCoatNormalMapRotation',
    title: 'clearCoatNormalMapRotation',
    subTitle: '{Number}',
    description: 'Rotate the UV coordinates of the normal map around the center.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#clearcoatnormalmaprotation'
}, {
    name: 'asset:material:clearCoatNormalMapUv',
    title: 'clearCoatNormalMapUv',
    subTitle: '{Number}',
    description: 'Normal map UV channel',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#clearcoatnormalmapuv'
}, {
    name: 'asset:material:useSheen',
    title: 'useSheen',
    subTitle: '{Boolean}',
    description: 'Enable the use of sheen specular effects.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#usesheen'
}, {
    name: 'asset:material:sheen',
    title: 'sheen',
    subTitle: '{pc.Color}',
    description: 'If no sheen map is set or tint is checked, this is the sheen specular color of the material.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#sheen'
}, {
    name: 'asset:material:sheenMap',
    title: 'sheenMap',
    subTitle: '{pc.Texture}',
    description: 'The sheen map that specifies the per-pixel sheen specular color. If no sheen map is set, the sheen color is used instead.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#sheenmap'
}, {
    name: 'asset:material:sheenMapChannel',
    title: 'sheenMapChannel',
    subTitle: '{String}',
    description: 'A color channel to extract color value from sheen map. Can be: r, g, b, a, rgb',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#sheenmapchannel'
}, {
    name: 'asset:material:sheenMapOffset',
    title: 'sheenMapOffset',
    subTitle: '{pc.Vec2}',
    description: 'Controls the 2D offset of the sheen map. Each component is between 0 and 1.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#sheenmapoffset'
}, {
    name: 'asset:material:sheenMapTiling',
    title: 'sheenMapTiling',
    subTitle: '{pc.Vec2}',
    description: 'Controls the 2D tiling of the sheen map.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#sheenmaptiling'
}, {
    name: 'asset:material:sheenMapRotation',
    title: 'sheenMapRotation',
    subTitle: '{Number}',
    description: 'Rotate the UV coordinates of the sheen map around the center.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#sheenmaprotation'
}, {
    name: 'asset:material:sheenMapUv',
    title: 'sheenMapUv',
    subTitle: '{Number}',
    description: 'Sheen map UV channel.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#sheenmapuv'
}, {
    name: 'asset:material:sheenVertexColor',
    title: 'sheenVertexColor',
    subTitle: '{Boolean}',
    description: 'Use vertex colors for sheen instead of a map.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#sheenvertexcolor'
}, {
    name: 'asset:material:sheenGloss',
    title: 'sheenGloss',
    subTitle: '{Number}',
    description: 'If no sheen gloss map is set or tint is checked, this is the sheen glossiness of the material.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#sheengloss'
}, {
    name: 'asset:material:sheenGlossMap',
    title: 'sheenGlossMap',
    subTitle: '{pc.Texture}',
    description: 'The sheen gloss map that specifies the per-pixel sheen gloss color. If no sheen gloss map is set, the sheen gloss is used instead.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#sheenglossmap'
}, {
    name: 'asset:material:sheenGlossMapChannel',
    title: 'sheenGlossMapChannel',
    subTitle: '{String}',
    description: 'A color channel to extract color value from sheen gloss map. Can be: r, g, b or a',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#sheenglossmapchannel'
}, {
    name: 'asset:material:sheenGlossMapOffset',
    title: 'sheenGlossMapOffset',
    subTitle: '{pc.Vec2}',
    description: 'Controls the 2D offset of the sheen gloss map. Each component is between 0 and 1.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#sheenglossmapoffset'
}, {
    name: 'asset:material:sheenGlossMapTiling',
    title: 'sheenGlossMapTiling',
    subTitle: '{pc.Vec2}',
    description: 'Controls the 2D tiling of the sheen gloss map.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#sheenglossmaptiling'
}, {
    name: 'asset:material:sheenGlossMapRotation',
    title: 'sheenGlossMapRotation',
    subTitle: '{Number}',
    description: 'Rotate the UV coordinates of the sheen gloss map around the center.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#sheenglossmaprotation'
}, {
    name: 'asset:material:sheenGlossMapUv',
    title: 'sheenGlossMapUv',
    subTitle: '{Number}',
    description: 'Sheen gloss map UV channel.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#sheenglossmapuv'
}, {
    name: 'asset:material:sheenGlossVertexColor',
    title: 'sheenGlossVertexColor',
    subTitle: '{Boolean}',
    description: 'Use vertex colors for sheen gloss instead of a map.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#sheenglossvertexcolor'
}, {
    name: 'asset:material:sheenGlossVertexColorChannel',
    title: 'sheenGlossVertexColorChannel',
    subTitle: '{Boolean}',
    description: 'Use vertex color for sheen gloss instead of a map.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#sheenglossvertexcolor'
}, {
    name: 'asset:material:sheenGlossInvert',
    title: 'sheenGlossInvert',
    subTitle: '{Boolean}',
    description: 'Invert material sheen gloss, effectively treating it as roughness',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#sheenglossinvert'
}, {
    name: 'asset:material:useDynamicRefraction',
    title: 'useDynamicRefraction',
    subTitle: '{Boolean}',
    description: 'Enable use of grab pass for refractions.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#usedynamicrefraction'
}, {
    name: 'asset:material:refraction',
    title: 'refraction',
    subTitle: '{Number}',
    description: 'A factor to determine what portion of light passes through the material.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#refraction'
}, {
    name: 'asset:material:refractionIndex',
    title: 'refractionIndex',
    subTitle: '{Number}',
    description: 'Determines the amount of distortion of light passing through the material. Represented as 1.0 / Index of Refraction',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#refractionindex'
}, {
    name: 'asset:material:refractionMap',
    title: 'refractionMap',
    subTitle: '{pc.Texture}',
    description: 'The refraction map defines a per-pixel refraction amount.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#refractionmap'
}, {
    name: 'asset:material:refractionMapUv',
    title: 'refractionMapUv',
    subTitle: '{pc.Vec2}',
    description: 'The UV set used to sample the refraction map.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#refractionmapuv'
}, {
    name: 'asset:material:refractionMapChannel',
    title: 'refractionMapChannel',
    subTitle: '{String}',
    description: 'A color channel to extract refraction intensity from the texture. Can be r, g, b or a.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#refractionmapchannel'
}, {
    name: 'asset:material:refractionMapOffset',
    title: 'refractionMapOffset',
    subTitle: '{pc.Vec2}',
    description: 'The refraction map UV offset',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#refractionmapoffset'
}, {
    name: 'asset:material:refractionMapTiling',
    title: 'refractionMapTiling',
    subTitle: '{pc.Vec2}',
    description: 'The refraction map UV tiling factor.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#refractionmaptiling'
}, {
    name: 'asset:material:refractionVertexColor',
    title: 'refractionVertexColor',
    subTitle: '{Boolean}',
    description: 'Use vertex color for refraction intensity, or as multiplier with the refraction map.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#usedynamicrefraction'
}, {
    name: 'asset:material:refractionMapRotation',
    title: 'refractionMapRotation',
    subTitle: '{Number}',
    description: 'Rotate the UV coordinates of the refraction map around the center.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#refractionmaprotation'
}, {
    name: 'asset:material:refractionVertexColorChannel',
    title: 'refractionVertexColorChannel',
    subTitle: '{Boolean}',
    description: 'A color channel to extract refraction intensity from the vertex color. Can be r, g, b or a.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#usedynamicrefraction'
}, {
    name: 'asset:material:dispersion',
    title: 'dispersion',
    subTitle: '{Number}',
    description: 'The strength of the angular separation of colors (chromatic aberration) transmitting through a volume. Defaults to 0, which is equivalent to no dispersion.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#dispersion'
}, {
    name: 'asset:material:thickness',
    title: 'thickness',
    subTitle: '{Number}',
    description: 'The thickness scale of the material. When used with thickness map, this value scales the thickness of the medium using the map as a weight. The units are in whatever unit the object is in.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#thickness'
}, {
    name: 'asset:material:thicknessMap',
    title: 'thicknessMap',
    subTitle: '{pc.Texture}',
    description: 'The thickness map defines a per-pixel thickness of the medium.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#thicknessmap'
}, {
    name: 'asset:material:thicknessMapUv',
    title: 'thicknessMapUv',
    subTitle: '{pc.Vec2}',
    description: 'The UV set used to sample the thickness map.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#thicknessmapuv'
}, {
    name: 'asset:material:thicknessMapChannel',
    title: 'thicknessMapChannel',
    subTitle: '{String}',
    description: 'A color channel to extract thickness from the texture. Can be r, g, b or a.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#thicknessmapchannel'
}, {
    name: 'asset:material:thicknessMapOffset',
    title: 'thicknessMapOffset',
    subTitle: '{pc.Vec2}',
    description: 'The thickness map UV offset',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#thicknessmapoffset'
}, {
    name: 'asset:material:thicknessMapTiling',
    title: 'thicknessMapTiling',
    subTitle: '{pc.Vec2}',
    description: 'The thickness map UV tiling factor.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#thicknessmaptiling'
}, {
    name: 'asset:material:thicknessMapRotation',
    title: 'thicknessMapRotation',
    subTitle: '{Number}',
    description: 'Rotate the UV coordinates of the thickness map around the center.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#thicknessmaprotation'
}, {
    name: 'asset:material:thicknessVertexColor',
    title: 'thicknessVertexColor',
    subTitle: '{Boolean}',
    description: 'Use vertex color for thickness, or as multiplier with the thickness map.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#thicknessvertexcolor'
}, {
    name: 'asset:material:thicknessVertexColorChannel',
    title: 'thicknessVertexColorChannel',
    subTitle: '{String}',
    description: 'A color channel to extract thickness from the vertex color. Can be r, g, b or a.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#thicknessvertexcolorchannel'
}, {
    name: 'asset:material:attenuation',
    title: 'attenuation',
    subTitle: '{pc.Color}',
    description: 'The color attenuation of light passing through the medium.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#attenuation'
}, {
    name: 'asset:material:attenuationDistance',
    title: 'attenuationDistance',
    subTitle: '{Number}',
    description: 'The distance at which all light is considered to be fully absorbed.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#attenuationdistance'
}, {
    name: 'asset:material:useIridescence',
    title: 'useIridescence',
    subTitle: '{Boolean}',
    description: 'Enable iridescent diffraction effects.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#useiridescence'
}, {
    name: 'asset:material:iridescence',
    title: 'iridescence',
    subTitle: '{Number}',
    description: 'The iridescence intensity of the material.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#iridescence'
}, {
    name: 'asset:material:iridescenceMap',
    title: 'iridescenceMap',
    subTitle: '{pc.Texture}',
    description: 'The iridescence map defines a per-pixel iridescence of the medium.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#iridescencemap'
}, {
    name: 'asset:material:iridescenceMapUv',
    title: 'iridescenceMapUv',
    subTitle: '{pc.Vec2}',
    description: 'The UV set used to sample the iridescence map.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#iridescencemapuv'
}, {
    name: 'asset:material:iridescenceMapChannel',
    title: 'iridescenceMapChannel',
    subTitle: '{String}',
    description: 'A color channel to extract iridescence from the texture. Can be r, g, b or a.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#iridescencemapchannel'
}, {
    name: 'asset:material:iridescenceMapOffset',
    title: 'iridescenceMapOffset',
    subTitle: '{pc.Vec2}',
    description: 'The iridescence map UV offset',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#iridescencemapoffset'
}, {
    name: 'asset:material:iridescenceMapTiling',
    title: 'iridescenceMapTiling',
    subTitle: '{pc.Vec2}',
    description: 'The iridescence map UV tiling factor.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#iridescencemaptiling'
}, {
    name: 'asset:material:iridescenceMapRotation',
    title: 'iridescenceMapRotation',
    subTitle: '{Number}',
    description: 'Rotate the UV coordinates of the iridescence map around the center.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#iridescencemaprotation'
}, {
    name: 'asset:material:iridescenceThicknessMap',
    title: 'iridescenceThicknessMap',
    subTitle: '{pc.Texture}',
    description: 'The iridescence thickness map defines a per-pixel iridescence thickness of the medium.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#iridescencethicknessmap'
}, {
    name: 'asset:material:iridescenceThicknessMapUv',
    title: 'iridescenceThicknessMapUv',
    subTitle: '{pc.Vec2}',
    description: 'The UV set used to sample the iridescence thickness map.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#iridescencethicknessmapuv'
}, {
    name: 'asset:material:iridescenceThicknessMapChannel',
    title: 'iridescenceThicknessMapChannel',
    subTitle: '{String}',
    description: 'A color channel to extract iridescence thickness from the texture. Can be r, g, b or a.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#iridescencethicknessmapchannel'
}, {
    name: 'asset:material:iridescenceThicknessMapOffset',
    title: 'iridescenceThicknessMapOffset',
    subTitle: '{pc.Vec2}',
    description: 'The iridescence thickness map UV offset',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#iridescencethicknessmapoffset'
}, {
    name: 'asset:material:iridescenceThicknessMapTiling',
    title: 'iridescenceThicknessMapTiling',
    subTitle: '{pc.Vec2}',
    description: 'The iridescence thickness map UV tiling factor.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#iridescencethicknessmaptiling'
}, {
    name: 'asset:material:iridescenceThicknessMapRotation',
    title: 'iridescenceThicknessMapRotation',
    subTitle: '{Number}',
    description: 'Rotate the UV coordinates of the iridescence thickness map around the center.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#iridescencethicknessmaprotation'
}, {
    name: 'asset:material:iridescenceThicknessMin',
    title: 'iridescenceThicknessMin',
    subTitle: '{Number}',
    description: 'The iridescence min thickness of the thin-film layer. Used with iridescence thickness map to scale the value between min and max. The unit is in nanometers (nm)',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#iridescencethicknessmin'
}, {
    name: 'asset:material:iridescenceThicknessMax',
    title: 'iridescenceThicknessMax',
    subTitle: '{Number}',
    description: 'The iridescence max thickness of the thin-film layer. If no iridescence thickness map is used, this is the thickness of the thin-film layer. The unit is in nanometers (nm)',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#iridescencethicknessmax'
}, {
    name: 'asset:material:iridescenceRefractionIndex',
    title: 'iridescenceRefractionIndex',
    subTitle: '{Number}',
    description: 'The index of refraction of the thin-film layer.',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#iridescencerefractionindex'
}, {
    name: 'asset:material:opacityFadesSpecular',
    title: 'opacityFadesSpecular',
    subTitle: '{Boolean}',
    description: 'Controls whether Specular is faded out by material Opacity which is sometimes not desired for shiny translucent materials such as glass',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#opacityfadesspecular'
}, {
    name: 'asset:material:opacityDither',
    title: 'opacityDither',
    subTitle: '{String}',
    description: 'Used to specify whether opacity is dithered, which allows transparency without alpha blending',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#opacitydither'
}, {
    name: 'asset:material:opacityShadowDither',
    title: 'opacityShadowDither',
    subTitle: '{String}',
    description: 'Used to specify whether shadow opacity is dithered, which allows shadow transparency without alpha blending',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#opacityshadowdither'
}, {
    name: 'asset:material:alphaFade',
    title: 'alphaFade',
    subTitle: '{Number}',
    description: 'Use alphaFade to fade out materials that do not use opacity to fade specular (opacityFadesSpecular is false).',
    url: 'https://api.playcanvas.com/engine/classes/StandardMaterial.html#alphafade'
}];
