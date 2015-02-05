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
            'default': 1,
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

    editor.method('material:listToMap', function(data) {
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

    editor.method('material:mapToList', function(data) {
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
        var panelParams = editor.call('attributes:addPanel', {
            name: 'Material Properties'
        });


        // model
        var fieldModel = editor.call('attributes:addField', {
            parent: panelParams,
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
        var panelAmbiend = editor.call('attributes:addPanel', {
            parent: panelParams,
            foldable: true,
            folded: ! asset.get('data.aoMap'),
            name: 'Ambient'
        });


        // color
        var fieldAmbientColor = editor.call('attributes:addField', {
            parent: panelAmbiend,
            name: 'Color',
            type: 'rgb',
            link: asset,
            path: 'data.ambient'
        });
        fieldAmbientColor.hidden = ! asset.get('data.ambientTint');


        // tint
        var fieldAmbientTint = new ui.Checkbox();
        fieldAmbientTint.link(asset, 'data.ambientTint');
        fieldAmbientColor.parent.appendBefore(fieldAmbientTint, fieldAmbientColor);
        fieldAmbientTint.on('change', function(value) {
            fieldAmbientColor.hidden = ! value;
        });

        var labelAmbientTint = new ui.Label({ text: 'Tint' });
        labelAmbientTint.style.verticalAlign = 'top';
        labelAmbientTint.style.paddingRight = '12px';
        labelAmbientTint.style.fontSize = '12px';
        labelAmbientTint.style.lineHeight = '26px';
        fieldAmbientColor.parent.appendAfter(labelAmbientTint, fieldAmbientColor);


        // map
        var fieldAmbientMap = editor.call('attributes:addField', {
            parent: panelAmbiend,
            type: 'number',
            name: 'Texture',
            link: asset,
            path: 'data.aoMap'
        });
        fieldAmbientMap.on('change', function(value) {
            fieldAmbientTint.hidden
        });

        // uv set
        var fieldAmbientUVSet = editor.call('attributes:addField', {
            parent: panelAmbiend,
            type: 'number',
            name: 'UV Set',
            link: asset,
            path: 'data.aoUvSet'
        });
        fieldAmbientUVSet.parent.hidden = ! fieldAmbientMap.value;

        // unfold panel
        fieldAmbientTint.on('change', function() { panelAmbiend.folded = false; });
        fieldAmbientColor.on('change', function() { panelAmbiend.folded = false; });
        fieldAmbientMap.on('change', function() { panelAmbiend.folded = false; });
        fieldAmbientUVSet.on('change', function() { panelAmbiend.folded = false; });



        // diffuse
        var panelDiffuse = editor.call('attributes:addPanel', {
            parent: panelParams,
            foldable: true,
            folded: ! asset.get('data.diffuseMap'),
            name: 'Diffuse'
        });

        // map
        var fieldDiffuseMap = editor.call('attributes:addField', {
            parent: panelDiffuse,
            type: 'texture',
            name: 'Texture',
            link: asset,
            path: 'data.diffuseMap'
        });

        // map, hide/show offset and tiling, as well as color
        fieldDiffuseMap.on('change', function(value) {
            // fieldDiffuseOffset[0].parent.hidden = value === 0;
            // fieldDiffuseTiling[0].parent.hidden = value === 0;
            fieldDiffuseTint.hidden = ! value;
            labelDiffuseTint.hidden = ! value;
            fieldDiffuseColor.hidden = value && ! fieldDiffuseTint.value;
        });

        // // offset
        // var fieldDiffuseOffset = editor.call('attributes:addField', {
        //     parent: panelDiffuse,
        //     type: 'vec2',
        //     name: 'Offset',
        //     link: asset,
        //     path: 'data.diffuseMapOffset'
        // });
        // fieldDiffuseOffset[0].parent.hidden = ! fieldDiffuseMap.value;

        // // tiling
        // var fieldDiffuseTiling = editor.call('attributes:addField', {
        //     parent: panelDiffuse,
        //     type: 'vec2',
        //     name: 'Tiling',
        //     link: asset,
        //     path: 'data.diffuseMapTiling'
        // });
        // fieldDiffuseTiling[0].parent.hidden = ! fieldDiffuseMap.value;


        // color
        var fieldDiffuseColor = editor.call('attributes:addField', {
            parent: panelDiffuse,
            name: 'Color',
            type: 'rgb',
            link: asset,
            path: 'data.diffuse'
        });
        fieldDiffuseColor.hidden = ! (asset.get('data.diffuseMapTint') || ! asset.get('data.diffuseMap'));

        // tint
        var fieldDiffuseTint = new ui.Checkbox();
        fieldDiffuseTint.link(asset, 'data.diffuseMapTint');
        fieldDiffuseTint.hidden = ! asset.get('data.diffuseMap');
        fieldDiffuseColor.parent.appendBefore(fieldDiffuseTint, fieldDiffuseColor);
        fieldDiffuseTint.on('change', function(value) {
            fieldDiffuseColor.hidden = ! value;
        });

        var labelDiffuseTint = new ui.Label({ text: 'Tint' });
        labelDiffuseTint.style.verticalAlign = 'top';
        labelDiffuseTint.style.paddingRight = '12px';
        labelDiffuseTint.style.fontSize = '12px';
        labelDiffuseTint.style.lineHeight = '26px';
        labelDiffuseTint.hidden = ! asset.get('data.diffuseMap');
        fieldDiffuseColor.parent.appendAfter(labelDiffuseTint, fieldDiffuseColor);


        // unfold panel
        fieldDiffuseMap.on('change', function() { panelDiffuse.folded = false; });
        fieldDiffuseTint.on('change', function() { panelDiffuse.folded = false; });
        fieldDiffuseColor.on('change', function() { panelDiffuse.folded = false; });



        // specular
        var panelSpecular = editor.call('attributes:addPanel', {
            parent: panelParams,
            foldable: true,
            folded: ! asset.get('data.specularMap') && ! asset.get('data.glossMap'),
            name: 'Specular'
        });

        // map
        var fieldSpecularMap = editor.call('attributes:addField', {
            parent: panelSpecular,
            type: 'texture',
            name: 'Specular',
            link: asset,
            path: 'data.specularMap'
        });

        // map, hide/show offset and tiling, as well as color
        fieldSpecularMap.on('change', function(value) {
            // fieldSpecularOffset[0].parent.hidden = value === 0;
            // fieldSpecularTiling[0].parent.hidden = value === 0;
            fieldSpecularTint.hidden = ! value;
            labelSpecularTint.hidden = ! value;
            fieldSpecularColor.hidden = value && ! fieldSpecularTint;
        });

        // // offset
        // var fieldSpecularOffset = editor.call('attributes:addField', {
        //     parent: panelSpecular,
        //     type: 'vec2',
        //     name: 'Offset',
        //     link: asset,
        //     path: 'data.specularMapOffset'
        // });
        // fieldSpecularOffset[0].parent.hidden = ! fieldSpecularMap.value;

        // // tiling
        // var fieldSpecularTiling = editor.call('attributes:addField', {
        //     parent: panelSpecular,
        //     type: 'vec2',
        //     name: 'Tiling',
        //     link: asset,
        //     path: 'data.specularMapTiling'
        // });
        // fieldSpecularTiling[0].parent.hidden = ! fieldSpecularMap.value;


        // color
        var fieldSpecularColor = editor.call('attributes:addField', {
            parent: panelSpecular,
            name: 'Color',
            type: 'rgb',
            link: asset,
            path: 'data.diffuse'
        });
        fieldSpecularColor.hidden = ! (asset.get('data.specularMapTint') || ! asset.get('data.specularMap'));

        // tint
        var fieldSpecularTint = new ui.Checkbox();
        fieldSpecularTint.link(asset, 'data.specularMapTint');
        fieldSpecularTint.hidden = ! asset.get('data.specularMap');
        fieldSpecularColor.parent.appendBefore(fieldSpecularTint, fieldSpecularColor);
        fieldSpecularTint.on('change', function(value) {
            fieldSpecularColor.hidden = ! value;
        });

        var labelSpecularTint = new ui.Label({ text: 'Tint' });
        labelSpecularTint.style.verticalAlign = 'top';
        labelSpecularTint.style.paddingRight = '12px';
        labelSpecularTint.style.fontSize = '12px';
        labelSpecularTint.style.lineHeight = '26px';
        labelSpecularTint.hidden = ! asset.get('data.specularMap');
        fieldSpecularColor.parent.appendAfter(labelSpecularTint, fieldSpecularColor);


        // shininess
        var fieldShininess = editor.call('attributes:addField', {
            parent: panelSpecular,
            type: 'number',
            name: 'Shininess',
            link: asset,
            path: 'data.shininess'
        });

        // map (gloss)
        var fieldGlossMap = editor.call('attributes:addField', {
            parent: panelSpecular,
            type: 'texture',
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
        //     parent: panelSpecular,
        //     type: 'vec2',
        //     name: 'Offset',
        //     link: asset,
        //     path: 'data.glossMapOffset'
        // });
        // fieldGlossOffset[0].parent.hidden = ! fieldGlossMap.value;

        // // tiling
        // var fieldGlossTiling = editor.call('attributes:addField', {
        //     parent: panelSpecular,
        //     type: 'vec2',
        //     name: 'Tiling',
        //     link: asset,
        //     path: 'data.glossMapTiling'
        // });
        // fieldGlossTiling[0].parent.hidden = ! fieldGlossMap.value;

        // conserve energy
        var fieldConserveEnergy = editor.call('attributes:addField', {
            parent: panelSpecular,
            type: 'checkbox',
            name: 'Conserve Energy',
            link: asset,
            path: 'data.conserveEnergy'
        });
        fieldConserveEnergy.parent.innerElement.childNodes[0].style.width = 'auto';

        // unfold panel
        fieldSpecularMap.on('change', function() { panelSpecular.folded = false; });
        fieldSpecularTint.on('change', function() { panelSpecular.folded = false; });
        fieldSpecularColor.on('change', function() { panelSpecular.folded = false; });
        fieldShininess.on('change', function() { panelSpecular.folded = false; });
        fieldGlossMap.on('change', function() { panelSpecular.folded = false; });
        fieldConserveEnergy.on('change', function() { panelSpecular.folded = false; });



        // emissive
        var panelEmissive = editor.call('attributes:addPanel', {
            parent: panelParams,
            foldable: true,
            folded: ! asset.get('data.emissiveMap'),
            name: 'Emissive'
        });

        // map
        var fieldEmissiveMap = editor.call('attributes:addField', {
            parent: panelEmissive,
            type: 'texture',
            name: 'Texture',
            link: asset,
            path: 'data.emissiveMap'
        });

        // map, hide/show offset and tiling, as well as color
        fieldEmissiveMap.on('change', function(value) {
            // fieldEmissiveOffset[0].parent.hidden = value === 0;
            // fieldEmissiveTiling[0].parent.hidden = value === 0;
            fieldEmissiveTint.hidden = ! value;
            labelEmissiveTint.hidden = ! value;
            fieldEmissiveColor.hidden = value && ! fieldEmissiveTint.value;
        });

        // // offset
        // var fieldEmissiveOffset = editor.call('attributes:addField', {
        //     parent: panelEmissive,
        //     type: 'vec2',
        //     name: 'Offset',
        //     link: asset,
        //     path: 'data.emissiveMapOffset'
        // });
        // fieldEmissiveOffset[0].parent.hidden = ! fieldEmissiveMap.value;

        // // tiling
        // var fieldEmissiveTiling = editor.call('attributes:addField', {
        //     parent: panelEmissive,
        //     type: 'vec2',
        //     name: 'Tiling',
        //     link: asset,
        //     path: 'data.emissiveMapTiling'
        // });
        // fieldEmissiveTiling[0].parent.hidden = ! fieldEmissiveMap.value;


        // color
        var fieldEmissiveColor = editor.call('attributes:addField', {
            parent: panelEmissive,
            name: 'Color',
            type: 'rgb',
            link: asset,
            path: 'data.emissive'
        });
        fieldEmissiveColor.hidden = ! (asset.get('data.emissiveMapTint') || ! asset.get('data.emissiveMap'));

        // tint
        var fieldEmissiveTint = new ui.Checkbox();
        fieldEmissiveTint.link(asset, 'data.emissiveMapTint');
        fieldEmissiveTint.hidden = ! asset.get('data.emissiveMap');
        fieldEmissiveColor.parent.appendBefore(fieldEmissiveTint, fieldEmissiveColor);
        fieldEmissiveTint.on('change', function(value) {
            fieldEmissiveColor.hidden = ! value;
        });

        var labelEmissiveTint = new ui.Label({ text: 'Tint' });
        labelEmissiveTint.style.verticalAlign = 'top';
        labelEmissiveTint.style.paddingRight = '12px';
        labelEmissiveTint.style.fontSize = '12px';
        labelEmissiveTint.style.lineHeight = '26px';
        labelEmissiveTint.hidden = ! asset.get('data.emissiveMap');
        fieldEmissiveColor.parent.appendAfter(labelEmissiveTint, fieldEmissiveColor);


        // intensity
        var fieldEmissiveIntensity = new ui.NumberField();
        fieldEmissiveIntensity.placeholder = 'Intensity';
        fieldEmissiveIntensity.style.width = '32px';
        fieldEmissiveIntensity.flexGrow = 1;
        fieldEmissiveIntensity.link(asset, 'data.emissiveIntensity');
        fieldEmissiveColor.parent.append(fieldEmissiveIntensity);


        // unfold panel
        fieldEmissiveMap.on('change', function() { panelEmissive.folded = false; });
        fieldEmissiveTint.on('change', function() { panelEmissive.folded = false; });
        fieldEmissiveColor.on('change', function() { panelEmissive.folded = false; });
        fieldEmissiveIntensity.on('change', function() { panelEmissive.folded = false; });



        // normals
        var panelNormal = editor.call('attributes:addPanel', {
            parent: panelParams,
            foldable: true,
            folded: ! asset.get('data.normalMap'),
            name: 'Normals'
        });

        // map (normals)
        var fieldNormalMap = editor.call('attributes:addField', {
            parent: panelNormal,
            type: 'texture',
            name: 'Texture',
            link: asset,
            path: 'data.normalMap'
        });

        // bumpiness
        var fieldBumpiness = editor.call('attributes:addField', {
            parent: panelNormal,
            type: 'number',
            name: 'Bumpiness',
            link: asset,
            path: 'data.bumpMapFactor'
        });
        fieldNormalMap.on('change', function(value) {
            // fieldNormalsOffset[0].parent.hidden = ! value;
            // fieldNormalsTiling[0].parent.hidden = ! value;
            fieldBumpiness.parent.hidden = ! value;
        })
        fieldBumpiness.parent.hidden = ! fieldNormalMap.value;

        // // offset
        // var fieldNormalsOffset = editor.call('attributes:addField', {
        //     parent: panelNormal,
        //     type: 'vec2',
        //     name: 'Offset',
        //     link: asset,
        //     path: 'data.normalMapOffset'
        // });
        // fieldNormalsOffset[0].parent.hidden = ! fieldNormalMap.value;

        // // tiling
        // var fieldNormalsTiling = editor.call('attributes:addField', {
        //     parent: panelNormal,
        //     type: 'vec2',
        //     name: 'Tiling',
        //     link: asset,
        //     path: 'data.normalMapTiling'
        // });
        // fieldNormalsTiling[0].parent.hidden = ! fieldNormalMap.value;

        // unfold panel
        fieldNormalMap.on('change', function() { panelNormal.folded = false; });
        fieldBumpiness.on('change', function() { panelNormal.folded = false; });



        // parallax
        var panelParallax = editor.call('attributes:addPanel', {
            parent: panelParams,
            foldable: true,
            folded: ! asset.get('data.heightMap'),
            name: 'Parallax'
        });

        // map
        var fieldHeightMap = editor.call('attributes:addField', {
            parent: panelParallax,
            type: 'texture',
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
        //     parent: panelParallax,
        //     type: 'vec2',
        //     name: 'Offset',
        //     link: asset,
        //     path: 'data.heightMapOffset'
        // });
        // fieldHeightMapOffset[0].parent.hidden = ! fieldHeightMap.value;

        // // tiling
        // var fieldHeightMapTiling = editor.call('attributes:addField', {
        //     parent: panelParallax,
        //     type: 'vec2',
        //     name: 'Tiling',
        //     link: asset,
        //     path: 'data.heightMapTiling'
        // });
        // fieldHeightMapTiling[0].parent.hidden = ! fieldHeightMap.value;

        // strength
        var fieldHeightMapFactor = editor.call('attributes:addField', {
            parent: panelParallax,
            type: 'number',
            name: 'Strength',
            link: asset,
            path: 'data.heightMapFactor'
        });
        fieldHeightMapFactor.parent.hidden = ! fieldHeightMap.value;

        // unfold panel
        fieldHeightMap.on('change', function() { panelParallax.folded = false; });
        fieldHeightMapFactor.on('change', function() { panelParallax.folded = false; });



        // reflection
        var panelReflection = editor.call('attributes:addPanel', {
            parent: panelParams,
            foldable: true,
            folded: ! (asset.get('data.sphereMap') || asset.get('data.cubeMap')),
            name: 'Reflection'
        });

        // spheremap
        var fieldReflectionSphere = editor.call('attributes:addField', {
            parent: panelReflection,
            type: 'texture',
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
            parent: panelReflection,
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
            parent: panelReflection,
            type: 'number',
            name: 'Reflectivity',
            link: asset,
            path: 'data.reflectivity'
        });
        fieldReflectionStrength.parent.hidden = ! fieldReflectionSphere.value && ! fieldReflectionCubeMap.value;

        // unfold panel
        fieldReflectionSphere.on('change', function() { panelReflection.folded = false; });
        fieldReflectionCubeMap.on('change', function() { panelReflection.folded = false; });
        fieldReflectionStrength.on('change', function() { panelReflection.folded = false; });



        // lightmap
        var panelLightMap = editor.call('attributes:addPanel', {
            parent: panelParams,
            foldable: true,
            folded: ! asset.get('data.lightMap'),
            name: 'LightMap'
        });

        // map
        var fieldLightMap = editor.call('attributes:addField', {
            parent: panelLightMap,
            type: 'texture',
            name: 'Texture',
            link: asset,
            path: 'data.lightMap'
        });

        // unfold panel
        fieldLightMap.on('change', function() { panelLightMap.folded = false; });



        // render states
        var panelRenderStates = editor.call('attributes:addPanel', {
            parent: panelParams,
            foldable: true,
            folded: true,
            name: 'Render States'
        });


        // depth
        var fieldDepthTest = editor.call('attributes:addField', {
            parent: panelRenderStates,
            type: 'checkbox',
            name: 'Depth',
            link: asset,
            path: 'data.depthTest'
        });
        // label
        var label = new ui.Label({ text: 'Test' });
        label.style.verticalAlign = 'top';
        label.style.paddingRight = '12px';
        label.style.fontSize = '12px';
        label.style.lineHeight = '26px';
        fieldDepthTest.parent.append(label);


        // depthWrite
        var fieldDepthWrite = new ui.Checkbox();
        fieldDepthWrite.link(asset, 'data.depthWrite');
        fieldDepthTest.parent.append(fieldDepthWrite);
        // label
        var label = new ui.Label({ text: 'Write' });
        label.style.verticalAlign = 'top';
        label.style.fontSize = '12px';
        label.style.lineHeight = '26px';
        fieldDepthTest.parent.append(label);


        // culling
        var fieldCull = editor.call('attributes:addField', {
            parent: panelRenderStates,
            type: 'number',
            enum: mapping.cull.enum,
            name: 'Cull Mode',
            link: asset,
            path: 'data.cull'
        });

        // blend type
        var fieldBlendType = editor.call('attributes:addField', {
            parent: panelRenderStates,
            type: 'number',
            enum: mapping.blendType.enum,
            name: 'Blend Type',
            link: asset,
            path: 'data.blendType'
        });

        // unfold panel
        fieldDepthTest.on('change', function() { panelRenderStates.folded = false; });
        fieldDepthWrite.on('change', function() { panelRenderStates.folded = false; });
        fieldCull.on('change', function() { panelRenderStates.folded = false; });
        fieldBlendType.on('change', function() { panelRenderStates.folded = false; });
    });
});
