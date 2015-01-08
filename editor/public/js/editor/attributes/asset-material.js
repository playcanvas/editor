var A;
(function() {
    'use strict';

    var mappingTypes = {
        'float': 'float',
        'int': 'float',
        'boolean': 'boolean',
        'texture': 'texture',
        'vec2': 'vec2',
        'vec3': 'vec3',
        'vec4': 'vec4',
        'rgb': 'vec3'
    };

    var mapping = {
        ambient: {
            'default': [ 0, 0, 0 ],
            'type': 'rgb',
        },
        ambientTint: {
            'default': false,
            'type': 'boolean',
        },
        diffuse: {
            'default': [ 1, 1, 1 ],
            'type': 'rgb',
        },
        diffuseMap: {
            'default': 0,
            'type': 'texture',
        },
        diffuseMapTiling: {
            'default': [ 1, 1 ],
            'type': 'vec2',
        },
        diffuseMapOffset: {
            'default': [ 0, 0 ],
            'type': 'vec2',
        },
        diffuseMapTint: {
            'default': false,
            'type': 'boolean',
        },
        specular: {
            'default': [ 1, 1, 1 ],
            'type': 'rgb',
        },
        specularMap: {
            'default': 0,
            'type': 'texture',
        },
        specularMapTiling: {
            'default': [ 1, 1 ],
            'type': 'vec2',
        },
        specularMapOffset: {
            'default': [ 0, 0 ],
            'type': 'vec2',
        },
        specularMapTint: {
            'default': false,
            'type': 'boolean',
        },
        specularAntialias: {
            'default': true,
            'type': 'boolean',
        },
        conserveEnergy: {
            'default': true,
            'type': 'boolean',
        },
        shininess: {
            'default': 32,
            'min': 0,
            'max': 100,
            'type': 'float',
        },
        glossMap: {
            'default': 0,
            'type': 'texture',
        },
        glossMapTiling: {
            'default': [ 1, 1 ],
            'type': 'vec2',
        },
        glossMapOffset: {
            'default': [ 0, 0 ],
            'type': 'vec2',
        },
        fresnelModel: {
            'default': 0,
            'type': 'float',
        },
        fresnelFactor: {
            'default': 0,
            'type': 'float',
        },
        emissive: {
            'default': [ 0, 0, 0 ],
            'type': 'rgb',
        },
        emissiveMap: {
            'default': 0,
            'type': 'texture',
        },
        emissiveMapTiling: {
            'default': [ 1, 1 ],
            'type': 'vec2',
        },
        emissiveMapOffset: {
            'default': [ 0, 0 ],
            'type': 'vec2',
        },
        emissiveMapTint: {
            'default': false,
            'type': 'boolean',
        },
        emissiveIntensity: {
            'defailt': 1,
            'min': 0,
            'max': 10,
            'type': 'float'
        },
        normalMap: {
            'default': 0,
            'type': 'texture',
        },
        normalMapTiling: {
            'default': [ 1, 1 ],
            'type': 'vec2',
        },
        normalMapOffset: {
            'default': [ 0, 0 ],
            'type': 'vec2',
        },
        bumpMapFactor: {
            'default': 1,
            'type': 'float',
        },
        heightMap: {
            'default': 0,
            'type': 'texture',
        },
        heightMapTiling: {
            'default': [ 1, 1 ],
            'type': 'vec2',
        },
        heightMapOffset: {
            'default': [ 0, 0 ],
            'type': 'vec2',
        },
        heightMapFactor: {
            'default': 1,
            'min': 0,
            'max': 2,
            'type': 'float'
        },
        opacity: {
            'default': 1,
            'min': 0,
            'max': 1,
            'type': 'float',
        },
        opacityMap: {
            'default': 0,
            'type': 'texture',
        },
        opacityMapTiling: {
            'default': [ 1, 1 ],
            'type': 'vec2',
        },
        opacityMapOffset: {
            'default': [ 0, 0 ],
            'type': 'vec2',
        },
        reflectivity: {
            'default': 1,
            'min': 0,
            'max': 1,
            'type': 'float',
        },
        sphereMap: {
            'default': 0,
            'type': 'texture',
        },
        cubeMap: {
            'default': 0,
            'type': 'cubemap',
        },
        lightMap: {
            'default': 0,
            'type': 'texture',
        },
        aoMap: {
            'default': 0,
            'type': 'texture',
        },
        aoUvSet: {
            'default': 0,
            'type': 'float',
        },
        depthTest: {
            'default': true,
            'type': 'boolean',
        },
        depthWrite: {
            'default': true,
            'type': 'boolean',
        },
        cull: {
            'default': 1,
            'enum': {
                0: 'None',
                1: 'Back Faces',
                2: 'Front Faces'
            },
            'type': 'int',
        },
        blendType: {
            'default': 1,
            'enum': {
                3: 'None',
                2: 'Normal',
                1: 'Additive',
                4: 'Pre-Multiply',
                5: 'Multiply'
            },
            'type': 'int'
        },
    };

    msg.hook('material:listToMap', function(data) {
        var obj = {
            model: data.shader
        };

        var indexed = { };

        for(var i = 0; i < data.parameters.length; i++) {
            indexed[data.parameters[i].name] = data.parameters[i].data;
        };

        for(var key in mapping) {
            obj[key] = indexed[key] === undefined ? mapping[key].default : indexed[key];
        }

        return obj;
    });

    msg.hook('material:mapToList', function(data) {
        var obj = {
            name: data.name,
            shader: data.data.model,
            parameters: [ ]
        };

        for(var key in mapping) {
            obj.parameters.push({
                name: key,
                type: mappingTypes[mapping[key].type],
                data: data.data[key] === undefined ? mapping[key].default : data.data[key]
            });
        }

        return obj;
    });

    msg.on('attributes:inspect[asset]', function(assets) {
        if (assets.length !== 1 || assets[0].type !== 'material')
            return;

        var asset = assets[0];
        A = asset;

        // properties panel
        var paramsPanel = msg.call('attributes:addPanel', {
            name: 'Material Properties'
        });


        // model
        var fieldModel = msg.call('attributes:addField', {
            parent: paramsPanel,
            type: 'string',
            enum: {
                'phong': 'Phong',
                'blinn': 'Physical'
            },
            name: 'Shading',
            link: asset,
            path: 'data.model'
        });



        // ambient
        var ambientPanel = msg.call('attributes:addPanel', {
            parent: paramsPanel,
            name: 'Ambient'
        });

        // tint
        var fieldAmbientTint = msg.call('attributes:addField', {
            parent: ambientPanel,
            type: 'checkbox',
            name: 'Tint',
            link: asset,
            path: 'data.ambientTint'
        });

        fieldAmbientTint.on('change', function(value) {
            fieldAmbientColor.parent.hidden = ! value;
        });

        // color
        var fieldAmbientColor = msg.call('attributes:addField', {
            parent: ambientPanel,
            type: 'rgb',
            name: 'Color',
            link: asset,
            path: 'data.ambient'
        });
        fieldAmbientColor.parent.hidden = ! fieldAmbientTint.value;

        // map
        var fieldAmbientMap = msg.call('attributes:addField', {
            parent: ambientPanel,
            type: 'number',
            name: 'Texture',
            link: asset,
            path: 'data.aoMap'
        });

        // color
        var fieldAmbientUVSet = msg.call('attributes:addField', {
            parent: ambientPanel,
            type: 'number',
            name: 'UV Set',
            link: asset,
            path: 'data.aoUvSet'
        });
        fieldAmbientUVSet.parent.hidden = ! fieldAmbientMap.value;



        // diffuse
        var diffusePanel = msg.call('attributes:addPanel', {
            parent: paramsPanel,
            name: 'Diffuse'
        });

        // map
        var fieldDiffuseMap = msg.call('attributes:addField', {
            parent: diffusePanel,
            type: 'number',
            name: 'Texture',
            link: asset,
            path: 'data.diffuseMap'
        });

        // map, hide/show offset and tiling, as well as color
        fieldDiffuseMap.on('change', function(value) {
            fieldDiffuseOffset[0].parent.hidden = value === 0;
            fieldDiffuseTiling[0].parent.hidden = value === 0;
            fieldDiffuseTint.parent.hidden = ! value;
            fieldDiffuseColor.parent.hidden = ! (fieldDiffuseTint.value || value === 0);
        });

        // offset
        var fieldDiffuseOffset = msg.call('attributes:addField', {
            parent: diffusePanel,
            type: 'vec2',
            name: 'Offset',
            link: asset,
            path: 'data.diffuseMapOffset'
        });
        fieldDiffuseOffset[0].parent.hidden = ! fieldDiffuseMap.value;

        // tiling
        var fieldDiffuseTiling = msg.call('attributes:addField', {
            parent: diffusePanel,
            type: 'vec2',
            name: 'Tiling',
            link: asset,
            path: 'data.diffuseMapTiling'
        });
        fieldDiffuseTiling[0].parent.hidden = ! fieldDiffuseMap.value;

        // tint
        var fieldDiffuseTint = msg.call('attributes:addField', {
            parent: diffusePanel,
            type: 'checkbox',
            name: 'Tint',
            link: asset,
            path: 'data.diffuseMapTint'
        });
        fieldDiffuseTint.parent.hidden = ! fieldDiffuseMap.value;

        // tint, hide/show color
        fieldDiffuseTint.on('change', function(value) {
            fieldDiffuseColor.parent.hidden = ! (value || ! fieldDiffuseMap.value);
        });

        // color
        var fieldDiffuseColor = msg.call('attributes:addField', {
            parent: diffusePanel,
            type: 'rgb',
            name: 'Color',
            link: asset,
            path: 'data.diffuse'
        });

        fieldDiffuseColor.parent.hidden = ! (fieldDiffuseTint.value || ! fieldDiffuseMap.value);



        // specular
        var specularPanel = msg.call('attributes:addPanel', {
            parent: paramsPanel,
            name: 'Specular'
        });

        // map
        var fieldSpecularMap = msg.call('attributes:addField', {
            parent: specularPanel,
            type: 'number',
            name: 'Specular',
            link: asset,
            path: 'data.specularMap'
        });

        // map, hide/show offset and tiling, as well as color
        fieldSpecularMap.on('change', function(value) {
            fieldSpecularOffset[0].parent.hidden = value === 0;
            fieldSpecularTiling[0].parent.hidden = value === 0;
            fieldSpecularTint.parent.hidden = ! value;
            fieldSpecularColor.parent.hidden = ! (fieldSpecularTint.value || value === 0);
        });

        // offset
        var fieldSpecularOffset = msg.call('attributes:addField', {
            parent: specularPanel,
            type: 'vec2',
            name: 'Offset',
            link: asset,
            path: 'data.specularMapOffset'
        });
        fieldSpecularOffset[0].parent.hidden = ! fieldSpecularMap.value;

        // tiling
        var fieldSpecularTiling = msg.call('attributes:addField', {
            parent: specularPanel,
            type: 'vec2',
            name: 'Tiling',
            link: asset,
            path: 'data.specularMapTiling'
        });
        fieldSpecularTiling[0].parent.hidden = ! fieldSpecularMap.value;

        // tint
        var fieldSpecularTint = msg.call('attributes:addField', {
            parent: specularPanel,
            type: 'checkbox',
            name: 'Tint',
            link: asset,
            path: 'data.specularMapTint'
        });
        fieldSpecularTint.parent.hidden = ! fieldSpecularMap.value;

        // tint, hide/show color
        fieldSpecularTint.on('change', function(value) {
            fieldSpecularColor.parent.hidden = ! (value || ! fieldSpecularMap.value);
        });

        // color
        var fieldSpecularColor = msg.call('attributes:addField', {
            parent: specularPanel,
            type: 'rgb',
            name: 'Color',
            link: asset,
            path: 'data.specular'
        });

        fieldSpecularColor.parent.hidden = ! (fieldSpecularTint.value || ! fieldSpecularMap.value);

        // shininess
        var fieldShininess = msg.call('attributes:addField', {
            parent: specularPanel,
            type: 'number',
            name: 'Shininess',
            link: asset,
            path: 'data.shininess'
        });

        // map (gloss)
        var fieldGlossMap = msg.call('attributes:addField', {
            parent: specularPanel,
            type: 'number',
            name: 'Glossiness',
            link: asset,
            path: 'data.glossMap'
        });

        // map, hide/show offset and tiling, as well as color
        fieldGlossMap.on('change', function(value) {
            fieldGlossOffset[0].parent.hidden = value === 0;
            fieldGlossTiling[0].parent.hidden = value === 0;
        });

        // offset
        var fieldGlossOffset = msg.call('attributes:addField', {
            parent: specularPanel,
            type: 'vec2',
            name: 'Offset',
            link: asset,
            path: 'data.glossMapOffset'
        });
        fieldGlossOffset[0].parent.hidden = ! fieldGlossMap.value;

        // tiling
        var fieldGlossTiling = msg.call('attributes:addField', {
            parent: specularPanel,
            type: 'vec2',
            name: 'Tiling',
            link: asset,
            path: 'data.glossMapTiling'
        });
        fieldGlossTiling[0].parent.hidden = ! fieldGlossMap.value;

        // conserve energy
        var fieldConserveEnergy = msg.call('attributes:addField', {
            parent: specularPanel,
            type: 'checkbox',
            name: 'Conserve Energy',
            link: asset,
            path: 'data.conserveEnergy'
        });



        // emissive
        var emissivePanel = msg.call('attributes:addPanel', {
            parent: paramsPanel,
            name: 'Emissive'
        });

        // map
        var fieldEmissiveMap = msg.call('attributes:addField', {
            parent: emissivePanel,
            type: 'number',
            name: 'Texture',
            link: asset,
            path: 'data.emissiveMap'
        });

        // map, hide/show offset and tiling, as well as color
        fieldEmissiveMap.on('change', function(value) {
            fieldEmissiveOffset[0].parent.hidden = value === 0;
            fieldEmissiveTiling[0].parent.hidden = value === 0;
            fieldEmissiveTint.parent.hidden = ! value;
            fieldEmissiveColor.parent.hidden = ! (fieldEmissiveTint.value || value === 0);
        });

        // offset
        var fieldEmissiveOffset = msg.call('attributes:addField', {
            parent: emissivePanel,
            type: 'vec2',
            name: 'Offset',
            link: asset,
            path: 'data.emissiveMapOffset'
        });
        fieldEmissiveOffset[0].parent.hidden = ! fieldEmissiveMap.value;

        // tiling
        var fieldEmissiveTiling = msg.call('attributes:addField', {
            parent: emissivePanel,
            type: 'vec2',
            name: 'Tiling',
            link: asset,
            path: 'data.emissiveMapTiling'
        });
        fieldEmissiveTiling[0].parent.hidden = ! fieldEmissiveMap.value;

        // tint
        var fieldEmissiveTint = msg.call('attributes:addField', {
            parent: emissivePanel,
            type: 'checkbox',
            name: 'Tint',
            link: asset,
            path: 'data.emissiveMapTint'
        });
        fieldEmissiveTint.parent.hidden = ! fieldEmissiveMap.value;

        // tint, hide/show color
        fieldEmissiveTint.on('change', function(value) {
            fieldEmissiveColor.parent.hidden = ! (value || ! fieldEmissiveMap.value);
        });

        // color
        var fieldEmissiveColor = msg.call('attributes:addField', {
            parent: emissivePanel,
            type: 'rgb',
            name: 'Color',
            link: asset,
            path: 'data.emissive'
        });

        fieldEmissiveColor.parent.hidden = ! (fieldEmissiveTint.value || ! fieldEmissiveMap.value);

        // intensity
        var fieldEmissiveIntensity = msg.call('attributes:addField', {
            parent: emissivePanel,
            type: 'number',
            name: 'Intensity',
            link: asset,
            path: 'data.emissiveIntensity'
        });



        // normals
        var normalPanel = msg.call('attributes:addPanel', {
            parent: paramsPanel,
            name: 'Normals'
        });

        // bumpiness
        var fieldBumpiness = msg.call('attributes:addField', {
            parent: normalPanel,
            type: 'number',
            name: 'Bumpiness',
            link: asset,
            path: 'data.bumpMapFactor'
        });

        // map (normals)
        var fieldNormalMap = msg.call('attributes:addField', {
            parent: normalPanel,
            type: 'number',
            name: 'Texture',
            link: asset,
            path: 'data.normalMap'
        });
        fieldNormalMap.on('change', function(value) {
            fieldNormalsOffset[0].parent.hidden = ! value;
            fieldNormalsTiling[0].parent.hidden = ! value;
            fieldBumpiness.parent.hidden = ! value;
        })
        fieldBumpiness.parent.hidden = ! fieldNormalMap.value;

        // offset
        var fieldNormalsOffset = msg.call('attributes:addField', {
            parent: normalPanel,
            type: 'vec2',
            name: 'Offset',
            link: asset,
            path: 'data.normalMapOffset'
        });
        fieldNormalsOffset[0].parent.hidden = ! fieldNormalMap.value;

        // tiling
        var fieldNormalsTiling = msg.call('attributes:addField', {
            parent: normalPanel,
            type: 'vec2',
            name: 'Tiling',
            link: asset,
            path: 'data.normalMapTiling'
        });
        fieldNormalsTiling[0].parent.hidden = ! fieldNormalMap.value;



        // parallax
        var parallaxPanel = msg.call('attributes:addPanel', {
            parent: paramsPanel,
            name: 'Parallax'
        });

        // map
        var fieldHeightMap = msg.call('attributes:addField', {
            parent: parallaxPanel,
            type: 'number',
            name: 'Texture',
            link: asset,
            path: 'data.heightMap'
        });

        // map, hide/show offset and tiling, as well as color
        fieldHeightMap.on('change', function(value) {
            fieldHeightMapOffset[0].parent.hidden = value === 0;
            fieldHeightMapTiling[0].parent.hidden = value === 0;
            fieldHeightMapFactor.parent.hidden = value === 0;
        });

        // offset
        var fieldHeightMapOffset = msg.call('attributes:addField', {
            parent: parallaxPanel,
            type: 'vec2',
            name: 'Offset',
            link: asset,
            path: 'data.heightMapOffset'
        });
        fieldHeightMapOffset[0].parent.hidden = ! fieldHeightMap.value;

        // tiling
        var fieldHeightMapTiling = msg.call('attributes:addField', {
            parent: parallaxPanel,
            type: 'vec2',
            name: 'Tiling',
            link: asset,
            path: 'data.heightMapTiling'
        });
        fieldHeightMapTiling[0].parent.hidden = ! fieldHeightMap.value;

        // strength
        var fieldHeightMapFactor = msg.call('attributes:addField', {
            parent: parallaxPanel,
            type: 'number',
            name: 'Strength',
            link: asset,
            path: 'data.heightMapFactor'
        });
        fieldHeightMapFactor.parent.hidden = ! fieldHeightMap.value;



        // reflection
        var reflectionPanel = msg.call('attributes:addPanel', {
            parent: paramsPanel,
            name: 'Reflection'
        });

        // spheremap
        var fieldReflectionSphere = msg.call('attributes:addField', {
            parent: reflectionPanel,
            type: 'number',
            name: 'Sphere Map',
            link: asset,
            path: 'data.sphereMap'
        });
        fieldReflectionSphere.on('change', function(value) {
            fieldReflectionStrength.parent.hidden = ! fieldReflectionSphere.value && ! fieldReflectionCubeMap.value;
            fieldReflectionCubeMap.parent.hidden = !! value;
        });

        // cubemap
        var fieldReflectionCubeMap = msg.call('attributes:addField', {
            parent: reflectionPanel,
            type: 'number',
            name: 'Cube Map',
            link: asset,
            path: 'data.cubeMap'
        });
        fieldReflectionCubeMap.on('change', function(value) {
            fieldReflectionStrength.parent.hidden = ! fieldReflectionSphere.value && ! fieldReflectionCubeMap.value;
            fieldReflectionSphere.parent.hidden = !! value;
        });

        // reflectivity
        var fieldReflectionStrength = msg.call('attributes:addField', {
            parent: reflectionPanel,
            type: 'number',
            name: 'Reflectivity',
            link: asset,
            path: 'data.reflectivity'
        });
        fieldReflectionStrength.parent.hidden = ! fieldReflectionSphere.value && ! fieldReflectionCubeMap.value;



        // lightmap
        var lightmapPanel = msg.call('attributes:addPanel', {
            parent: paramsPanel,
            name: 'LightMap'
        });

        // map
        var fieldLightMap = msg.call('attributes:addField', {
            parent: lightmapPanel,
            type: 'number',
            name: 'Texture',
            link: asset,
            path: 'data.lightMap'
        });



        // render states
        var renderStatesPanel = msg.call('attributes:addPanel', {
            parent: paramsPanel,
            name: 'Render States'
        });

        // depthTest
        var fieldDepthTest = msg.call('attributes:addField', {
            parent: renderStatesPanel,
            type: 'checkbox',
            name: 'Depth Test',
            link: asset,
            path: 'data.depthTest'
        });

        // depthWrite
        var fieldDepthWrite = msg.call('attributes:addField', {
            parent: renderStatesPanel,
            type: 'checkbox',
            name: 'Depth Write',
            link: asset,
            path: 'data.depthWrite'
        });

        // culling
        var fieldCull = msg.call('attributes:addField', {
            parent: renderStatesPanel,
            type: 'number',
            enum: mapping.cull.enum,
            name: 'Cull Mode',
            link: asset,
            path: 'data.cull'
        });

        // blend type
        var fieldBlendType = msg.call('attributes:addField', {
            parent: renderStatesPanel,
            type: 'number',
            enum: mapping.blendType.enum,
            name: 'Blend Type',
            link: asset,
            path: 'data.blendType'
        });
    });
})();
