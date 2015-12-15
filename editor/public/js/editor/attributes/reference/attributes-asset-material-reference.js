editor.once('load', function() {
    'use strict';

    var create = function(args) {
        var tooltip = editor.call('attributes:reference', args);

        editor.method('attributes:reference:asset:material' + (args.name ? (':' + args.name) : '') + ':attach', function(target, element) {
            tooltip.attach({
                target: target,
                element: element || target.element
            });
        });
    };

    var fields = [
        {
            name: 'asset',
            title: 'pc.Material',
            subTitle: '{Class}',
            description: 'Every surface on a 3D model is rendered using a material. The material defines the properties of that surface, such as its color, shininess, bumpiness.<br /><br />In PlayCanvas, a material is an Asset type which collects all these properties together. By default, it represents a Physical material. This exposes the fundamental properties that can be used to create many different types for visual effects, from smooth plastic, to rough wood, or scratched metal.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html'
        }, {
            name: 'ambientOverview',
            description: 'Ambient properties determine how the material appears in ambient light.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html'
        }, {
            title: 'ambient',
            subTitle: '{pc.Color}',
            description: 'The tint color to multiply the scene\'s global ambient color.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#ambient'
        }, {
            title: 'ambientTint',
            subTitle: '{Boolean}',
            description: 'Check this to multiply the scene\'s global ambient color with a material specific color.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#ambientTint'
        }, {
            title: 'aoMap',
            subTitle: '{pc.Texture}',
            description: 'An ambient occlusion map containing pre-baked ambient occlusion.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#aoMap'
        }, {
            title: 'aoMapChannel',
            subTitle: '{String}',
            description: 'An ambient occlusion map color channel to extract color value from texture. Can be: r, g, b, a',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#aoMapChannel'
        }, {
            title: 'aoMapUvSet',
            subTitle: '{Number}',
            description: 'Defines UV set used for AO map.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#aoMapUvSet'
        }, {
            title: 'blendType',
            subTitle: '{pc.BLEND_*}',
            description: 'The type of blending for this material. Options are:<br />None {pc.BLEND_NONE}: The mesh is opaque. This is the default.<br />Normal {pc.BLEND_NORMAL}: The mesh is transparent, like stained glass.<br />Additive {pc.BLEND_ADDITIVE}: The mesh color is added to whatever has already been rendered to the frame buffer.<br />Pre-multiply {pc.BLEND_PREMULTIPLIED}: Like \'Normal\' blending except it is assumed that the color of the mesh being rendered with this material has already been modulated by its alpha value.<br />Multiply {pc.BLEND_MULTIPLICATIVE}: When rendered, the mesh color is multiplied by whatever has already been rendered to the frame buffer.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#blendType'
        }, {
            title: 'bumpiness',
            subTitle: '{Number}',
            description: 'The strength of the applied normal map. This is a value between 0 (the normal map has no effect) and 2 (the effect of the normal map is exagerrated). It defaults to 1.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#bumpiness'
        }, {
            title: 'conserveEnergy',
            subTitle: '{Boolean}',
            description: 'Defines how diffuse and specular components are combined when Fresnel is on. It is recommended that you leave this option enabled, although you may want to disable it in case when all reflection comes only from a few light sources, and you don\'t use an environment map, therefore having mostly black reflection.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#conserveEnergy'
        }, {
            title: 'cubeMap',
            subTitle: '{pc.Texture}',
            description: 'A cube map texture asset that approximates environment reflection (with greater accuracy than is possible with a sphere map). If scene has SkyBox set, then it will be used as default cubeMap',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#cubeMap'
        }, {
            title: 'cull',
            subTitle: '{pc.CULLFACE_*}',
            description: 'Options are:<br />None {pc.CULLFACE_NONE}: Both front faces and back faces are rendered.<br />Front Faces {pc.CULLFACE_FRONT}: front faces are rendered and back faces are not.<br />Back Faces {pc.CULLFACE_BACK}: back faces are rendered and front faces are not. This is the default.<br />PlayCanvas dictates that a counter-clockwise vertex winding specifies a front face triangle. Note that backface culling is often good for performance because backface pixels are often overwritten (for convex meshes) which can result in redundant filling of pixels.'
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
            url: 'http://developer.playcanvas.com/api/pc.Material.html'
        }, {
            title: 'diffuse',
            subTitle: '{pc.Color}',
            description: 'If no diffuse map is set or tint is enabled, this is the diffuse color of the material.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#diffuse'
        }, {
            title: 'diffuseMap',
            subTitle: '{pc.Texture}',
            description: 'The diffuse map that specifies the per-pixel diffuse material color. If no diffuse map is set, the diffuse color is used instead.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#diffuseMap'
        }, {
            title: 'diffuseMapChannel',
            subTitle: '{String}',
            description: 'An diffuse map color channel to extract color value from texture. Can be: r, g, b, a, rgb',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#diffuseMapChannel'
        }, {
            title: 'diffuseMapOffset',
            subTitle: '{pc.Vec2}',
            description: 'The offset in U and V to apply to the first UV channel referenced by maps in this material.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#diffuseMapOffset'
        }, {
            title: 'diffuseMapTiling',
            subTitle: '{pc.Vec2}',
            description: 'The scale in U and V to apply to the first UV channel referenced by maps in this material.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#diffuseMapTiling'
        }, {
            title: 'diffuseMapTint',
            subTitle: '{Boolean}',
            description: 'Check this to modulate the material\'s diffuse map with a material specific diffuse color.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#diffuseMapTint'
        }, {
            name: 'emissiveOverview',
            description: 'Emissive properties control how the material emits light (as opposed to reflecting light).',
            url: 'http://developer.playcanvas.com/api/pc.Material.html'
        }, {
            title: 'emissive',
            subTitle: '{pc.Color}',
            description: 'If no emissive map is set or tint is enabled, this is the emissive color of the material.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#emissive'
        }, {
            title: 'emissiveIntensity',
            subTitle: '{Number}',
            description: 'A multiplier for emissive color that can achieve overbright effects for exceptionally bright emissive materials.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#emissiveIntensity'
        }, {
            title: 'emissiveMap',
            subTitle: '{pc.Texture}',
            description: 'The emissive map that specifies the per-pixel emissive color. If no emissive map is set, the emissive color is used instead.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#emissiveMap'
        }, {
            title: 'emissiveMapChannel',
            subTitle: '{String}',
            description: 'An emissive map color channel to extract color value from texture. Can be: r, g, b, a, rgb',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#emissiveMapChannel'
        }, {
            title: 'emissiveMapOffset',
            subTitle: '{pc.Vec2}',
            description: 'The offset in U and V to apply to the first UV channel referenced by maps in this material.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#emissiveMapOffset'
        }, {
            title: 'emissiveMapTiling',
            subTitle: '{pc.Vec2}',
            description: 'The scale in U and V to apply to the first UV channel referenced by maps in this material.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#emissiveMapTiling'
        }, {
            title: 'emissiveMapTint',
            subTitle: '{Boolean}',
            description: 'Check this to modulate the material\'s emissive map with a material specific emissive color.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#emissiveMapTint'
        }, {
            name: 'environmentOverview',
            description: 'Environment properties determine how a material reflects and refracts the environment.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html'
        }, {
            title: 'fresnelFactor',
            subTitle: '{Number}',
            description: 'description',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#fresnelFactor'
        }, {
            title: 'fresnelModel',
            subTitle: '{pc.FRESNEL_*}',
            description: 'A parameter for Fresnel. May mean different things depending on fresnelModel.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#fresnelModel'
        }, {
            title: 'glossMap',
            subTitle: '{pc.Texture}',
            description: 'The gloss map that specifies a per-pixel shininess value. The gloss map is modulated by the shininess property.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#glossMap'
        }, {
            title: 'glossMapChannel',
            subTitle: '{String}',
            description: 'An gloss map color channel to extract color value from texture. Can be: r, g, b, a',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#glossMapChannel'
        }, {
            title: 'glossMapOffset',
            subTitle: '{pc.Vec2}',
            description: 'The offset in U and V to apply to the first UV channel referenced by maps in this material.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#glossMapOffset'
        }, {
            title: 'glossMapTiling',
            subTitle: '{pc.Vec2}',
            description: 'The scale in U and V to apply to the first UV channel referenced by maps in this material.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#glossMapTiling'
        }, {
            title: 'heightMap',
            subTitle: '{pc.Texture}',
            description: 'The height map that specifies the per-pixel strength of the parallax effect. White is full height and black is zero height.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#heightMap'
        }, {
            title: 'heightMapChannel',
            subTitle: '{String}',
            description: 'An height map color channel to extract color value from texture. Can be: r, g, b, a',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#heightMapChannel'
        }, {
            title: 'heightMapFactor',
            subTitle: '{Number}',
            description: 'The strength of a parallax effect (a value between 0 and 2, defaulting to 1).',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#heightMapFactor'
        }, {
            title: 'heightMapOffset',
            subTitle: '{pc.Vec2}',
            description: 'The offset in U and V to apply to the first UV channel referenced by maps in this material.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#heightMapOffset'
        }, {
            title: 'heightMapTiling',
            subTitle: '{pc.Vec2}',
            description: 'The scale in U and V to apply to the first UV channel referenced by maps in this material.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#heightMapTiling'
        }, {
            name: 'lightMapOverview',
            description: 'Light maps contain pre-baked diffuse lighting. Using light maps is considered an optimization in that runtime dynamic lighting calculations can be pre-calculated.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html'
        }, {
            title: 'lightMap',
            subTitle: '{pc.Texture}',
            description: 'The lightmap texture that contains pre-baked diffuse lighting. The lightmap usually is applied to the second UV set.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#lightMap'
        }, {
            title: 'lightMapChannel',
            subTitle: '{String}',
            description: 'An light map color channel to extract color value from texture. Can be: r, g, b, a, rgb',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#lightMapChannel'
        }, {
            title: 'metalness',
            subTitle: '{Number}',
            description: 'Metalness factor multiplier.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#metalness'
        }, {
            title: 'metalnessMap',
            subTitle: '{pc.Texture}',
            description: 'This map specifies per-pixel metalness values. A value of 1 is metal and a value of 0 is non-metal.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#metalnessMap'
        }, {
            title: 'metalnessMapChannel',
            subTitle: '{String}',
            description: 'An metalness map color channel to extract color value from texture. Can be: r, g, b, a',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#metalnessMapChannel'
        }, {
            name: 'normalOverview',
            description: 'Use this to specify normal maps in order to simulate \'Bumpiness\' effect.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html'
        }, {
            title: 'normalMap',
            subTitle: '{pc.Texture}',
            description: 'The normal map that specifies the per-pixel surface normals. The normal map is modulated by the \'Bumpiness\' property.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#normalMap'
        }, {
            title: 'normalMapOffset',
            subTitle: '{pc.Vec2}',
            description: 'The offset in U and V to apply to the first UV channel referenced by maps in this material.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#normalMapOffset'
        }, {
            title: 'normalMapTiling',
            subTitle: '{pc.Vec2}',
            description: 'The scale in U and V to apply to the first UV channel referenced by maps in this material.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#normalMapTiling'
        }, {
            title: 'occludeSpecular',
            subTitle: '{Boolean}',
            description: 'If checked, ambient color will occlude specular factor of a material.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#occludeSpecular'
        }, {
            name: 'other',
            description: 'Other Render States gives additional controls over how a mesh is rendered with the specified material.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html'
        }, {
            name: 'offset',
            description: 'The offset in U and V to apply to the first UV channel referenced by maps in this material.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html'
        }, {
            name: 'offsetTiling',
            description: 'The offset and tiling in U and V to apply to the UV channel referenced by all maps in this material.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html'
        }, {
            name: 'opacityOverview',
            description: 'Opacity sets the transparency level.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html'
        }, {
            title: 'opacity',
            subTitle: '{Number}',
            description: 'The opacity of the material. This is a value between 0 (completely transparent) and 1 (complately opaque. It defaults to 1.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#opacity'
        }, {
            title: 'opacityMap',
            subTitle: '{pc.Texture}',
            description: 'The opacity map that specifies the per-pixel opacity. The opacity map is modulated by the \'Amount\' property.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#opacityMap'
        }, {
            title: 'opacityMapChannel',
            subTitle: '{String}',
            description: 'An opacity map color channel to extract color value from texture. Can be: r, g, b, a',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#opacityMapChannel'
        }, {
            title: 'opacityMapOffset',
            subTitle: '{pc.Vec2}',
            description: 'The offset in U and V to apply to the first UV channel referenced by maps in this material.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#opacityMapOffset'
        }, {
            title: 'opacityMapTiling',
            subTitle: '{pc.Vec2}',
            description: 'The scale in U and V to apply to the first UV channel referenced by maps in this material.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#opacityMapTiling'
        }, {
            name: 'parallaxOverview',
            description: 'A height map gives further realism to a normal map by giving the illusion of depth to a surface. Note that parallax options are only enabled if you have set a normal map on the material.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html'
        }, {
            title: 'reflectivity',
            subTitle: '{Number}',
            description: 'A factor to determin what portion of light is reflected from the material. This value defaults to 1 (full reflectivity).',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#reflectivity'
        }, {
            title: 'refraction',
            subTitle: '{Number}',
            description: 'A factor to determine what portion of light passes through the material.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#refraction'
        }, {
            title: 'refractionIndex',
            subTitle: '{Number}',
            description: 'Determines the amount of distortion of light passing through the material.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#refractionIndex'
        }, {
            title: 'shadingModel',
            subTitle: '{pc.SPECULAR_*}',
            description: 'Defines the shading model.<br />Phong {pc.SPECULAR_PHONG}: Phong without energy conservation. You should only use it as a backwards compatibility with older projects.<br />Physical {pc.SPECULAR_BLINN}: Energy-conserving Blinn-Phong.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#shadingModel'
        }, {
            title: 'shadowSampleType',
            subTitle: '{Number}',
            description: 'Options are:<br />Hard<br />PCF 3x3',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#shadowSampleType'
        }, {
            title: 'shininess',
            subTitle: '{Number}',
            description: 'A value determining the smoothness of a surface. For smaller shininess values, a surface is rougher and specular highlights will be broader. For larger shininess values, a surface is smoother and will exhibit more concentrated specular highlights (as is the surace is polished and shiny).',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#shininess'
        }, {
            name: 'specularOverview',
            description: 'Specular properties defines the color of the specular highlights. i.e. the shininess',
            url: 'http://developer.playcanvas.com/api/pc.Material.html'
        }, {
            title: 'specular',
            subTitle: '{pc.Color}',
            description: 'If no specular map is set or tint is checked, this is the specular color of the material.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#specular'
        }, {
            title: 'specularAntialias',
            subTitle: '{Boolean}',
            description: 'Enables Toksvig AA for mipmapped normal maps with specular.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#specularAntialias'
        }, {
            title: 'specularMap',
            subTitle: '{pc.Texture}',
            description: 'The specular map that specifies the per-pixel specular color. If no specular map is set, the specular color is used instead.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#specularMap'
        }, {
            title: 'specularMapChannel',
            subTitle: '{String}',
            description: 'An specular map color channel to extract color value from texture. Can be: r, g, b, a, rgb',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#specularMapChannel'
        }, {
            title: 'specularMapOffset',
            subTitle: '{pc.Vec2}',
            description: 'The offset in U and V to apply to the first UV channel referenced by maps in this material.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#specularMapOffset'
        }, {
            title: 'specularMapTiling',
            subTitle: '{pc.Vec2}',
            description: 'The scale in U and V to apply to the first UV channel referenced by maps in this material.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#specularMapTiling'
        }, {
            title: 'specularMapTint',
            subTitle: '{Boolean}',
            description: 'Check this to modulate the material\'s specular map with a material specific specular color.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#specularMapTint'
        }, {
            title: 'sphereMap',
            subTitle: '{pc.Texture}',
            description: 'A sphere map texture asset that approximates environment reflection. If a sphere map is set, the Cube Map property will be hidden (since these properties are mutually exclusive).',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#sphereMap'
        }, {
            name: 'tiling',
            description: 'The scale in U and V to apply to the first UV channel referenced by maps in this material.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html'
        }, {
            title: 'useMetalness',
            subTitle: '{Boolean}',
            description: 'Toggle between specular and metalness workflow.',
            url: 'http://developer.playcanvas.com/api/pc.Material.html#useMetalness'
        }
    ];

    // fields reference
    for(var i = 0; i < fields.length; i++) {
        fields[i].name = fields[i].name || fields[i].title;
        create(fields[i]);
    }
});
