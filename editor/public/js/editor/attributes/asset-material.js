editor.once('load', function() {
    'use strict';

    var mappingTypes = {
        'int': 'float',
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

    editor.hook('material:listToMap', function(data) {
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

    editor.hook('material:mapToList', function(data) {
        var obj = {
            name: data.name,
            shader: data.data.model,
            parameters: [ ]
        };

        for(var key in mapping) {
            obj.parameters.push({
                name: key,
                type: mappingTypes[mapping[key].type] || mapping[key].type,
                data: data.data[key] === undefined ? mapping[key].default : data.data[key]
            });
        }

        return obj;
    });

    editor.on('attributes:inspect[asset]', function(assets) {
        if (assets.length !== 1 || assets[0].type !== 'material')
            return;

        var asset = assets[0];

        // properties panel
        var paramsPanel = editor.call('attributes:addPanel', {
            name: 'Material Properties'
        });


        // model
        var fieldModel = editor.call('attributes:addField', {
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
        var ambientPanel = editor.call('attributes:addPanel', {
            parent: paramsPanel,
            foldable: true,
            folded: ! asset.get('data.aoMap'),
            name: 'Ambient'
        });

        // tint
        var fieldAmbientTint = editor.call('attributes:addField', {
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
        var fieldAmbientColor = editor.call('attributes:addField', {
            parent: ambientPanel,
            type: 'rgb',
            name: 'Color',
            link: asset,
            path: 'data.ambient'
        });
        fieldAmbientColor.parent.hidden = ! fieldAmbientTint.value;

        // map
        var fieldAmbientMap = editor.call('attributes:addField', {
            parent: ambientPanel,
            type: 'number',
            name: 'Texture',
            link: asset,
            path: 'data.aoMap'
        });

        // color
        var fieldAmbientUVSet = editor.call('attributes:addField', {
            parent: ambientPanel,
            type: 'number',
            name: 'UV Set',
            link: asset,
            path: 'data.aoUvSet'
        });
        fieldAmbientUVSet.parent.hidden = ! fieldAmbientMap.value;

        // unfold panel
        fieldAmbientTint.on('change', function() { ambientPanel.folded = false; });
        fieldAmbientColor.on('change', function() { ambientPanel.folded = false; });
        fieldAmbientMap.on('change', function() { ambientPanel.folded = false; });
        fieldAmbientUVSet.on('change', function() { ambientPanel.folded = false; });



        // diffuse
        var diffusePanel = editor.call('attributes:addPanel', {
            parent: paramsPanel,
            foldable: true,
            folded: ! asset.get('data.diffuseMap'),
            name: 'Diffuse'
        });

        // map
        var fieldDiffuseMap = editor.call('attributes:addField', {
            parent: diffusePanel,
            type: 'number',
            name: 'Texture',
            link: asset,
            path: 'data.diffuseMap'
        });

        // map, hide/show offset and tiling, as well as color
        fieldDiffuseMap.on('change', function(value) {
            // fieldDiffuseOffset[0].parent.hidden = value === 0;
            // fieldDiffuseTiling[0].parent.hidden = value === 0;
            fieldDiffuseTint.parent.hidden = ! value;
            fieldDiffuseColor.parent.hidden = ! (fieldDiffuseTint.value || value === 0);
        });

        // // offset
        // var fieldDiffuseOffset = editor.call('attributes:addField', {
        //     parent: diffusePanel,
        //     type: 'vec2',
        //     name: 'Offset',
        //     link: asset,
        //     path: 'data.diffuseMapOffset'
        // });
        // fieldDiffuseOffset[0].parent.hidden = ! fieldDiffuseMap.value;

        // // tiling
        // var fieldDiffuseTiling = editor.call('attributes:addField', {
        //     parent: diffusePanel,
        //     type: 'vec2',
        //     name: 'Tiling',
        //     link: asset,
        //     path: 'data.diffuseMapTiling'
        // });
        // fieldDiffuseTiling[0].parent.hidden = ! fieldDiffuseMap.value;

        // tint
        var fieldDiffuseTint = editor.call('attributes:addField', {
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
        var fieldDiffuseColor = editor.call('attributes:addField', {
            parent: diffusePanel,
            type: 'rgb',
            name: 'Color',
            link: asset,
            path: 'data.diffuse'
        });

        fieldDiffuseColor.parent.hidden = ! (fieldDiffuseTint.value || ! fieldDiffuseMap.value);

        // unfold panel
        fieldDiffuseMap.on('change', function() { diffusePanel.folded = false; });
        fieldDiffuseTint.on('change', function() { diffusePanel.folded = false; });
        fieldDiffuseColor.on('change', function() { diffusePanel.folded = false; });



        // specular
        var specularPanel = editor.call('attributes:addPanel', {
            parent: paramsPanel,
            foldable: true,
            folded: ! asset.get('data.specularMap') || ! asset.get('data.glossMap'),
            name: 'Specular'
        });

        // map
        var fieldSpecularMap = editor.call('attributes:addField', {
            parent: specularPanel,
            type: 'number',
            name: 'Specular',
            link: asset,
            path: 'data.specularMap'
        });

        // map, hide/show offset and tiling, as well as color
        fieldSpecularMap.on('change', function(value) {
            // fieldSpecularOffset[0].parent.hidden = value === 0;
            // fieldSpecularTiling[0].parent.hidden = value === 0;
            fieldSpecularTint.parent.hidden = ! value;
            fieldSpecularColor.parent.hidden = ! (fieldSpecularTint.value || value === 0);
        });

        // // offset
        // var fieldSpecularOffset = editor.call('attributes:addField', {
        //     parent: specularPanel,
        //     type: 'vec2',
        //     name: 'Offset',
        //     link: asset,
        //     path: 'data.specularMapOffset'
        // });
        // fieldSpecularOffset[0].parent.hidden = ! fieldSpecularMap.value;

        // // tiling
        // var fieldSpecularTiling = editor.call('attributes:addField', {
        //     parent: specularPanel,
        //     type: 'vec2',
        //     name: 'Tiling',
        //     link: asset,
        //     path: 'data.specularMapTiling'
        // });
        // fieldSpecularTiling[0].parent.hidden = ! fieldSpecularMap.value;

        // tint
        var fieldSpecularTint = editor.call('attributes:addField', {
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
        var fieldSpecularColor = editor.call('attributes:addField', {
            parent: specularPanel,
            type: 'rgb',
            name: 'Color',
            link: asset,
            path: 'data.specular'
        });

        fieldSpecularColor.parent.hidden = ! (fieldSpecularTint.value || ! fieldSpecularMap.value);

        // shininess
        var fieldShininess = editor.call('attributes:addField', {
            parent: specularPanel,
            type: 'number',
            name: 'Shininess',
            link: asset,
            path: 'data.shininess'
        });

        // map (gloss)
        var fieldGlossMap = editor.call('attributes:addField', {
            parent: specularPanel,
            type: 'number',
            name: 'Glossiness',
            link: asset,
            path: 'data.glossMap'
        });

        // // map, hide/show offset and tiling, as well as color
        // fieldGlossMap.on('change', function(value) {
        //     fieldGlossOffset[0].parent.hidden = value === 0;
        //     fieldGlossTiling[0].parent.hidden = value === 0;
        // });

        // // offset
        // var fieldGlossOffset = editor.call('attributes:addField', {
        //     parent: specularPanel,
        //     type: 'vec2',
        //     name: 'Offset',
        //     link: asset,
        //     path: 'data.glossMapOffset'
        // });
        // fieldGlossOffset[0].parent.hidden = ! fieldGlossMap.value;

        // // tiling
        // var fieldGlossTiling = editor.call('attributes:addField', {
        //     parent: specularPanel,
        //     type: 'vec2',
        //     name: 'Tiling',
        //     link: asset,
        //     path: 'data.glossMapTiling'
        // });
        // fieldGlossTiling[0].parent.hidden = ! fieldGlossMap.value;

        // conserve energy
        var fieldConserveEnergy = editor.call('attributes:addField', {
            parent: specularPanel,
            type: 'checkbox',
            name: 'Conserve Energy',
            link: asset,
            path: 'data.conserveEnergy'
        });

        // unfold panel
        fieldSpecularMap.on('change', function() { specularPanel.folded = false; });
        fieldSpecularTint.on('change', function() { specularPanel.folded = false; });
        fieldSpecularColor.on('change', function() { specularPanel.folded = false; });
        fieldShininess.on('change', function() { specularPanel.folded = false; });
        fieldGlossMap.on('change', function() { specularPanel.folded = false; });
        fieldConserveEnergy.on('change', function() { specularPanel.folded = false; });



        // emissive
        var emissivePanel = editor.call('attributes:addPanel', {
            parent: paramsPanel,
            foldable: true,
            folded: ! asset.get('data.emissiveMap'),
            name: 'Emissive'
        });

        // map
        var fieldEmissiveMap = editor.call('attributes:addField', {
            parent: emissivePanel,
            type: 'number',
            name: 'Texture',
            link: asset,
            path: 'data.emissiveMap'
        });

        // map, hide/show offset and tiling, as well as color
        fieldEmissiveMap.on('change', function(value) {
            // fieldEmissiveOffset[0].parent.hidden = value === 0;
            // fieldEmissiveTiling[0].parent.hidden = value === 0;
            fieldEmissiveTint.parent.hidden = ! value;
            fieldEmissiveColor.parent.hidden = ! (fieldEmissiveTint.value || value === 0);
        });

        // // offset
        // var fieldEmissiveOffset = editor.call('attributes:addField', {
        //     parent: emissivePanel,
        //     type: 'vec2',
        //     name: 'Offset',
        //     link: asset,
        //     path: 'data.emissiveMapOffset'
        // });
        // fieldEmissiveOffset[0].parent.hidden = ! fieldEmissiveMap.value;

        // // tiling
        // var fieldEmissiveTiling = editor.call('attributes:addField', {
        //     parent: emissivePanel,
        //     type: 'vec2',
        //     name: 'Tiling',
        //     link: asset,
        //     path: 'data.emissiveMapTiling'
        // });
        // fieldEmissiveTiling[0].parent.hidden = ! fieldEmissiveMap.value;

        // tint
        var fieldEmissiveTint = editor.call('attributes:addField', {
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
        var fieldEmissiveColor = editor.call('attributes:addField', {
            parent: emissivePanel,
            type: 'rgb',
            name: 'Color',
            link: asset,
            path: 'data.emissive'
        });

        fieldEmissiveColor.parent.hidden = ! (fieldEmissiveTint.value || ! fieldEmissiveMap.value);

        // intensity
        var fieldEmissiveIntensity = editor.call('attributes:addField', {
            parent: emissivePanel,
            type: 'number',
            name: 'Intensity',
            link: asset,
            path: 'data.emissiveIntensity'
        });

        // unfold panel
        fieldEmissiveMap.on('change', function() { emissivePanel.folded = false; });
        fieldEmissiveTint.on('change', function() { emissivePanel.folded = false; });
        fieldEmissiveColor.on('change', function() { emissivePanel.folded = false; });
        fieldEmissiveIntensity.on('change', function() { emissivePanel.folded = false; });



        // normals
        var normalPanel = editor.call('attributes:addPanel', {
            parent: paramsPanel,
            foldable: true,
            folded: ! asset.get('data.normalMap'),
            name: 'Normals'
        });

        // bumpiness
        var fieldBumpiness = editor.call('attributes:addField', {
            parent: normalPanel,
            type: 'number',
            name: 'Bumpiness',
            link: asset,
            path: 'data.bumpMapFactor'
        });

        // map (normals)
        var fieldNormalMap = editor.call('attributes:addField', {
            parent: normalPanel,
            type: 'number',
            name: 'Texture',
            link: asset,
            path: 'data.normalMap'
        });
        fieldNormalMap.on('change', function(value) {
            // fieldNormalsOffset[0].parent.hidden = ! value;
            // fieldNormalsTiling[0].parent.hidden = ! value;
            fieldBumpiness.parent.hidden = ! value;
        })
        fieldBumpiness.parent.hidden = ! fieldNormalMap.value;

        // // offset
        // var fieldNormalsOffset = editor.call('attributes:addField', {
        //     parent: normalPanel,
        //     type: 'vec2',
        //     name: 'Offset',
        //     link: asset,
        //     path: 'data.normalMapOffset'
        // });
        // fieldNormalsOffset[0].parent.hidden = ! fieldNormalMap.value;

        // // tiling
        // var fieldNormalsTiling = editor.call('attributes:addField', {
        //     parent: normalPanel,
        //     type: 'vec2',
        //     name: 'Tiling',
        //     link: asset,
        //     path: 'data.normalMapTiling'
        // });
        // fieldNormalsTiling[0].parent.hidden = ! fieldNormalMap.value;

        // unfold panel
        fieldNormalMap.on('change', function() { normalPanel.folded = false; });
        fieldBumpiness.on('change', function() { normalPanel.folded = false; });



        // parallax
        var parallaxPanel = editor.call('attributes:addPanel', {
            parent: paramsPanel,
            foldable: true,
            folded: ! asset.get('data.heightMap'),
            name: 'Parallax'
        });

        // map
        var fieldHeightMap = editor.call('attributes:addField', {
            parent: parallaxPanel,
            type: 'number',
            name: 'Texture',
            link: asset,
            path: 'data.heightMap'
        });

        // map, hide/show offset and tiling, as well as color
        fieldHeightMap.on('change', function(value) {
            // fieldHeightMapOffset[0].parent.hidden = value === 0;
            // fieldHeightMapTiling[0].parent.hidden = value === 0;
            fieldHeightMapFactor.parent.hidden = value === 0;
        });

        // // offset
        // var fieldHeightMapOffset = editor.call('attributes:addField', {
        //     parent: parallaxPanel,
        //     type: 'vec2',
        //     name: 'Offset',
        //     link: asset,
        //     path: 'data.heightMapOffset'
        // });
        // fieldHeightMapOffset[0].parent.hidden = ! fieldHeightMap.value;

        // // tiling
        // var fieldHeightMapTiling = editor.call('attributes:addField', {
        //     parent: parallaxPanel,
        //     type: 'vec2',
        //     name: 'Tiling',
        //     link: asset,
        //     path: 'data.heightMapTiling'
        // });
        // fieldHeightMapTiling[0].parent.hidden = ! fieldHeightMap.value;

        // strength
        var fieldHeightMapFactor = editor.call('attributes:addField', {
            parent: parallaxPanel,
            type: 'number',
            name: 'Strength',
            link: asset,
            path: 'data.heightMapFactor'
        });
        fieldHeightMapFactor.parent.hidden = ! fieldHeightMap.value;

        // unfold panel
        fieldHeightMap.on('change', function() { parallaxPanel.folded = false; });
        fieldHeightMapFactor.on('change', function() { parallaxPanel.folded = false; });



        // reflection
        var reflectionPanel = editor.call('attributes:addPanel', {
            parent: paramsPanel,
            foldable: true,
            folded: ! (asset.get('data.sphereMap') || asset.get('data.cubeMap')),
            name: 'Reflection'
        });

        // spheremap
        var fieldReflectionSphere = editor.call('attributes:addField', {
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
        fieldReflectionSphere.parent.hidden = !! asset.get('data.cubeMap');

        // cubemap
        var fieldReflectionCubeMap = editor.call('attributes:addField', {
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
        fieldReflectionCubeMap.parent.hidden = !! asset.get('data.sphereMap');

        // reflectivity
        var fieldReflectionStrength = editor.call('attributes:addField', {
            parent: reflectionPanel,
            type: 'number',
            name: 'Reflectivity',
            link: asset,
            path: 'data.reflectivity'
        });
        fieldReflectionStrength.parent.hidden = ! fieldReflectionSphere.value && ! fieldReflectionCubeMap.value;

        // unfold panel
        fieldReflectionSphere.on('change', function() { reflectionPanel.folded = false; });
        fieldReflectionCubeMap.on('change', function() { reflectionPanel.folded = false; });
        fieldReflectionStrength.on('change', function() { reflectionPanel.folded = false; });



        // lightmap
        var lightmapPanel = editor.call('attributes:addPanel', {
            parent: paramsPanel,
            foldable: true,
            folded: ! asset.get('data.lightMap'),
            name: 'LightMap'
        });

        // map
        var fieldLightMap = editor.call('attributes:addField', {
            parent: lightmapPanel,
            type: 'number',
            name: 'Texture',
            link: asset,
            path: 'data.lightMap'
        });

        // unfold panel
        fieldLightMap.on('change', function() { lightmapPanel.folded = false; });



        // render states
        var renderStatesPanel = editor.call('attributes:addPanel', {
            parent: paramsPanel,
            foldable: true,
            folded: true,
            name: 'Render States'
        });


        // depth
        var panelDepth = new ui.Panel();
        editor.call('attributes:addField', {
            parent: renderStatesPanel,
            name: 'Depth',
            type: 'element',
            element: panelDepth
        });

        // depthTest
        var fieldDepthTest = new ui.Checkbox();
        fieldDepthTest.link(asset, 'data.depthTest');
        panelDepth.append(fieldDepthTest);
        // label
        var label = new ui.Label('Test');
        label.style.verticalAlign = 'top';
        label.style.paddingRight = '12px';
        label.style.fontSize = '12px';
        label.style.lineHeight = '26px';
        panelDepth.append(label);

        // depthWrite
        var fieldDepthWrite = new ui.Checkbox();
        fieldDepthWrite.link(asset, 'data.depthWrite');
        panelDepth.append(fieldDepthWrite);
        // label
        var label = new ui.Label('Write');
        label.style.verticalAlign = 'top';
        label.style.fontSize = '12px';
        label.style.lineHeight = '26px';
        panelDepth.append(label);


        // culling
        var fieldCull = editor.call('attributes:addField', {
            parent: renderStatesPanel,
            type: 'number',
            enum: mapping.cull.enum,
            name: 'Cull Mode',
            link: asset,
            path: 'data.cull'
        });

        // blend type
        var fieldBlendType = editor.call('attributes:addField', {
            parent: renderStatesPanel,
            type: 'number',
            enum: mapping.blendType.enum,
            name: 'Blend Type',
            link: asset,
            path: 'data.blendType'
        });

        // unfold panel
        fieldDepthTest.on('change', function() { renderStatesPanel.folded = false; });
        fieldDepthWrite.on('change', function() { renderStatesPanel.folded = false; });
        fieldCull.on('change', function() { renderStatesPanel.folded = false; });
        fieldBlendType.on('change', function() { renderStatesPanel.folded = false; });
    });
});
