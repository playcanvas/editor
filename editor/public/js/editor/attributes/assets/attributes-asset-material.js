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
        aoMap: {
            'default': 0,
            'type': 'texture',
        },
        aoMapTiling: {
            'default': [ 1, 1 ],
            'type': 'vec2',
        },
        aoMapOffset: {
            'default': [ 0, 0 ],
            'type': 'vec2',
        },
        aoUvSet: {
            'default': 0,
            'type': 'float',
        },
        occludeSpecular: {
            'default': true,
            'type': 'boolean'
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
            'default': [ .23, .23, .23 ],
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
        useMetalness: {
            'default': false,
            'type': 'boolean',
        },
        metalnessMap: {
            'default': 0,
            'type': 'texture',
        },
        metalnessMapTiling: {
            'default': [ 1, 1 ],
            'type': 'vec2',
        },
        metalnessMapOffset: {
            'default': [ 0, 0 ],
            'type': 'vec2',
        },
        metalnessMapTint: {
            'default': false,
            'type': 'boolean',
        },
        metalness: {
            'default': 1,
            'min': 0,
            'max': 1,
            'type': 'float',
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
        refraction: {
            'default': 0,
            'min': 0,
            'max': 1,
            'type': 'float'
        },
        refractionIndex: {
            'default': 1.0 / 1.5,
            'min': 0,
            'max': 1,
            'type': 'float'
        },
        sphereMap: {
            'default': 0,
            'type': 'texture',
        },
        cubeMap: {
            'default': 0,
            'type': 'cubemap',
        },
        cubeMapProjection: {
            'default': 0,
            'type': 'boolean'
        },
        lightMap: {
            'default': 0,
            'type': 'texture',
        },
        lightMapTiling: {
            'default': [ 1, 1 ],
            'type': 'vec2',
        },
        lightMapOffset: {
            'default': [ 0, 0 ],
            'type': 'vec2',
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
            'default': 3,
            'enum': {
                3: 'None',
                2: 'Alpha',
                1: 'Additive',
                4: 'Premultiplied Alpha',
                5: 'Multiply'
            },
            'type': 'int'
        },
        shadowSampleType: {
            'default': 1,
            'enum': {
                0: 'Hard',
                1: 'PCF 3x3'
            },
            'type': 'int'
        }
    };

    var mappingMaps = [
        'diffuse',
        'specular',
        'emissive',
        'normal',
        'metalness',
        'gloss',
        'opacity',
        'height',
        'ao',
        'light'
    ];

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
        if (assets.length !== 1 || assets[0].get('type') !== 'material')
            return;

        var asset = assets[0];

        var root = editor.call('attributes.rootPanel');

        // preview
        var image = new Image();
        image.classList.add('asset-preview');
        root.innerElement.insertBefore(image, root.innerElement.firstChild);

        var renderPreview = function () {
            editor.call('preview:material', asset, image.clientWidth, function (url) {
                image.src = url;
            });
        }
        renderPreview();

        var renderTimeout;

        var evtPanelResize = root.on('resize', function () {
            if (renderTimeout)
                clearTimeout(renderTimeout);

            renderTimeout = setTimeout(renderPreview, 100);
        });
        var evtMaterialChanged = editor.on('preview:material:changed', renderPreview);

        // properties panel
        var panelParams = editor.call('attributes:addPanel', {
            name: 'Properties'
        });
        panelParams.class.add('component');

        panelParams.on('destroy', function() {
            evtPanelResize.unbind();
            evtMaterialChanged.unbind();
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
        fieldModel.on('change', function(value) {
            asset.history.enabled = false;
            asset.set('data.fresnelModel', value === 'blinn' ? 2 : 0);
            asset.history.enabled = true;
        });


        // tiling & offset
        var panelTiling = editor.call('attributes:addPanel', {
            foldable: true,
            // folded: true,
            name: 'Offset & Tiling'
        });
        panelTiling.class.add('component');

        var tilingOffsetFields = [ ];

        // all maps
        var fieldTilingOffset = editor.call('attributes:addField', {
            parent: panelTiling,
            type: 'checkbox',
            name: 'Apply to all Maps',
            value: true
        });
        fieldTilingOffset.element.previousSibling.style.width = 'auto';
        fieldTilingOffset.on('change', function(value) {
            fieldOffset[0].parent.hidden = ! value;
            fieldTiling[0].parent.hidden = ! value;

            for(var i = 0; i < tilingOffsetFields.length; i++) {
                tilingOffsetFields[i].element.hidden = tilingOffsetFields[i].filter();
            }

            if (value) {
                updateAllTilingOffsetFields('offset', 0, fieldOffset[0].value);
                updateAllTilingOffsetFields('offset', 1, fieldOffset[1].value);
                updateAllTilingOffsetFields('tiling', 0, fieldTiling[0].value);
                updateAllTilingOffsetFields('tiling', 1, fieldTiling[1].value);
            }
        });

        // offset
        var fieldOffset = editor.call('attributes:addField', {
            parent: panelTiling,
            type: 'vec2',
            name: 'Offset',
            placeholder: [ 'U', 'V' ]
        });


        // tiling
        var fieldTiling = editor.call('attributes:addField', {
            parent: panelTiling,
            type: 'vec2',
            name: 'Tiling',
            placeholder: [ 'U', 'V' ]
        });


        var offset = asset.get('data.' + mappingMaps[0] + 'MapOffset');
        var tiling = asset.get('data.' + mappingMaps[0] + 'MapTiling');
        var different = false;
        for(var i = 1; i < mappingMaps.length; i++) {
            if (! offset.equals(asset.get('data.' + mappingMaps[i] + 'MapOffset')) || ! tiling.equals(asset.get('data.' + mappingMaps[i] + 'MapTiling'))) {
                different = true;
                break;
            }
        }

        if (different)
            fieldTilingOffset.value = false;

        fieldOffset[0].value = offset[0];
        fieldOffset[1].value = offset[1];
        fieldTiling[0].value = tiling[0];
        fieldTiling[1].value = tiling[1];

        var updateAllTilingOffsetFields = function(type, field, value, valueOld) {
            if (! fieldTilingOffset.value)
                return;

            asset.history.enabled = false;
            for(var i = 0; i < tilingOffsetFields.length; i++) {
                if (tilingOffsetFields[i][type]) {
                    tilingOffsetFields[i][type][field].value = value;
                }
            }
            asset.history.enabled = true;
        };

        fieldOffset[0].on('change', function(value, valueOld) {
            updateAllTilingOffsetFields('offset', 0, value);
        });
        fieldOffset[1].on('change', function(value, valueOld) {
            updateAllTilingOffsetFields('offset', 1, value);
        });
        fieldTiling[0].on('change', function(value, valueOld) {
            updateAllTilingOffsetFields('tiling', 0, value);
        });
        fieldTiling[1].on('change', function(value, valueOld) {
            updateAllTilingOffsetFields('tiling', 1, value);
        });

        // ambient
        var panelAmbient = editor.call('attributes:addPanel', {
            foldable: true,
            folded: ! asset.get('data.aoMap'),
            name: 'Ambient'
        });
        panelAmbient.class.add('component');


        // color
        var fieldAmbientColor = editor.call('attributes:addField', {
            parent: panelAmbient,
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
        labelAmbientTint.style.lineHeight = '24px';
        fieldAmbientColor.parent.appendAfter(labelAmbientTint, fieldAmbientColor);


        // map
        var fieldAmbientMap = editor.call('attributes:addField', {
            parent: panelAmbient,
            type: 'asset',
            kind: 'texture',
            name: 'Ambient Occlusion',
            link: asset,
            path: 'data.aoMap'
        });
        fieldAmbientMap.on('change', function(value) {
            fieldAmbientOffset[0].parent.hidden = ! value || fieldTilingOffset.value;
            fieldAmbientTiling[0].parent.hidden = ! value || fieldTilingOffset.value;
            fieldOccludeSpecular.parent.hidden = ! value;
        });

        // offset
        var fieldAmbientOffset = editor.call('attributes:addField', {
            parent: panelAmbient,
            type: 'vec2',
            name: 'Offset',
            placeholder: [ 'U', 'V' ],
            link: asset,
            path: 'data.aoMapOffset'
        });
        tilingOffsetFields.push({
            element: fieldAmbientOffset[0].parent,
            offset: fieldAmbientOffset,
            filter: function() {
                return ! fieldAmbientMap.value || fieldTilingOffset.value;
            }
        });
        fieldAmbientOffset[0].parent.hidden = ! fieldAmbientMap.value || fieldTilingOffset.value;

        // tiling
        var fieldAmbientTiling = editor.call('attributes:addField', {
            parent: panelAmbient,
            type: 'vec2',
            name: 'Tiling',
            placeholder: [ 'U', 'V' ],
            link: asset,
            path: 'data.aoMapTiling'
        });
        tilingOffsetFields.push({
            element: fieldAmbientTiling[0].parent,
            tiling: fieldAmbientTiling,
            filter: function() {
                return ! fieldAmbientMap.value || fieldTilingOffset.value;
            }
        });
        fieldAmbientTiling[0].parent.hidden = ! fieldAmbientMap.value || fieldTilingOffset.value;

        // occludeSpecular
        var fieldOccludeSpecular = editor.call('attributes:addField', {
            parent: panelAmbient,
            type: 'checkbox',
            name: 'Occlude Specular',
            link: asset,
            path: 'data.occludeSpecular'
        });
        fieldOccludeSpecular.parent.hidden = ! fieldAmbientMap.value;

        // uv set
        var fieldAmbientUVSet = editor.call('attributes:addField', {
            parent: panelAmbient,
            type: 'number',
            name: 'UV Set',
            link: asset,
            path: 'data.aoUvSet'
        });
        fieldAmbientUVSet.parent.hidden = ! fieldAmbientMap.value;

        // unfold panel
        fieldAmbientTint.on('change', function() { panelAmbient.folded = false; });
        fieldAmbientColor.on('change', function() { panelAmbient.folded = false; });
        fieldAmbientMap.on('change', function() { panelAmbient.folded = false; });
        fieldAmbientUVSet.on('change', function() { panelAmbient.folded = false; });


        // diffuse
        var panelDiffuse = editor.call('attributes:addPanel', {
            foldable: true,
            folded: ! asset.get('data.diffuseMap'),
            name: 'Diffuse'
        });
        panelDiffuse.class.add('component');

        // map
        var fieldDiffuseMap = editor.call('attributes:addField', {
            parent: panelDiffuse,
            type: 'asset',
            kind: 'texture',
            name: 'Diffuse',
            link: asset,
            path: 'data.diffuseMap'
        });

        // map, hide/show offset and tiling, as well as color
        fieldDiffuseMap.on('change', function(value) {
            fieldDiffuseOffset[0].parent.hidden = ! value || fieldTilingOffset.value;
            fieldDiffuseTiling[0].parent.hidden = ! value || fieldTilingOffset.value;
            fieldDiffuseTint.hidden = ! value;
            labelDiffuseTint.hidden = ! value;
            fieldDiffuseColor.hidden = value && ! fieldDiffuseTint.value;
        });

        // offset
        var fieldDiffuseOffset = editor.call('attributes:addField', {
            parent: panelDiffuse,
            type: 'vec2',
            name: 'Offset',
            placeholder: [ 'U', 'V' ],
            link: asset,
            path: 'data.diffuseMapOffset'
        });
        tilingOffsetFields.push({
            element: fieldDiffuseOffset[0].parent,
            offset: fieldDiffuseOffset,
            filter: function() {
                return ! fieldDiffuseMap.value || fieldTilingOffset.value;
            }
        });
        fieldDiffuseOffset[0].parent.hidden = ! fieldDiffuseMap.value || fieldTilingOffset.value;

        // tiling
        var fieldDiffuseTiling = editor.call('attributes:addField', {
            parent: panelDiffuse,
            type: 'vec2',
            name: 'Tiling',
            placeholder: [ 'U', 'V' ],
            link: asset,
            path: 'data.diffuseMapTiling'
        });
        tilingOffsetFields.push({
            element: fieldDiffuseTiling[0].parent,
            tiling: fieldDiffuseTiling,
            filter: function() {
                return ! fieldDiffuseMap.value || fieldTilingOffset.value;
            }
        });
        fieldDiffuseTiling[0].parent.hidden = ! fieldDiffuseMap.value || fieldTilingOffset.value;


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
        labelDiffuseTint.style.lineHeight = '24px';
        labelDiffuseTint.hidden = ! asset.get('data.diffuseMap');
        fieldDiffuseColor.parent.appendAfter(labelDiffuseTint, fieldDiffuseColor);


        // unfold panel
        fieldDiffuseMap.on('change', function() { panelDiffuse.folded = false; });
        fieldDiffuseTint.on('change', function() { panelDiffuse.folded = false; });
        fieldDiffuseColor.on('change', function() { panelDiffuse.folded = false; });



        // specular
        var panelSpecular = editor.call('attributes:addPanel', {
            foldable: true,
            folded: ! asset.get('data.specularMap') && ! asset.get('data.metalnessMap') && ! asset.get('data.glossMap'),
            name: 'Specular'
        });
        panelSpecular.class.add('component');

        // use metalness
        var fieldUseMetalness = editor.call('attributes:addField', {
            parent: panelSpecular,
            type: 'checkbox',
            name: 'Use Metalness',
            link: asset,
            path: 'data.useMetalness'
        });
        fieldUseMetalness.on('change', function(value) {
            panelSpecularWorkflow.hidden = value;
            panelMetalness.hidden = ! value;
        });

        var panelMetalness = editor.call('attributes:addPanel');
        panelMetalness.hidden = ! asset.get('data.useMetalness');
        panelSpecular.append(panelMetalness);

        // metalness map
        var fieldMetalnessMap = editor.call('attributes:addField', {
            parent: panelMetalness,
            type: 'asset',
            kind: 'texture',
            name: 'Metalness',
            link: asset,
            path: 'data.metalnessMap'
        });
        fieldMetalnessMap.on('change', function(value) {
            fieldMetalnessOffset[0].parent.hidden = ! fieldMetalnessMap.value || fieldTilingOffset.value;
            fieldMetalnessTiling[0].parent.hidden = ! fieldMetalnessMap.value || fieldTilingOffset.value;
        });

        // offset
        var fieldMetalnessOffset = editor.call('attributes:addField', {
            parent: panelMetalness,
            type: 'vec2',
            name: 'Offset',
            placeholder: [ 'U', 'V' ],
            link: asset,
            path: 'data.metalnessMapOffset'
        });
        tilingOffsetFields.push({
            element: fieldMetalnessOffset[0].parent,
            offset: fieldMetalnessOffset,
            filter: function() {
                return ! fieldMetalnessMap.value || fieldTilingOffset.value;
            }
        });
        fieldMetalnessOffset[0].parent.hidden = ! fieldMetalnessMap.value || fieldTilingOffset.value;

        // tiling
        var fieldMetalnessTiling = editor.call('attributes:addField', {
            parent: panelMetalness,
            type: 'vec2',
            name: 'Tiling',
            placeholder: [ 'U', 'V' ],
            link: asset,
            path: 'data.metalnessMapTiling'
        });
        tilingOffsetFields.push({
            element: fieldMetalnessTiling[0].parent,
            tiling: fieldMetalnessTiling,
            filter: function() {
                return ! fieldMetalnessMap.value || fieldTilingOffset.value;
            }
        });
        fieldMetalnessTiling[0].parent.hidden = ! fieldMetalnessMap.value || fieldTilingOffset.value;

        // metalness
        var fieldMetalness = editor.call('attributes:addField', {
            parent: panelMetalness,
            precision: 3,
            step: 0.05,
            min: 0,
            max: 1,
            type: 'number',
            name: 'Metalness',
            link: asset,
            path: 'data.metalness'
        });
        fieldMetalness.style.width = '32px';

        // metalness slider
        var fieldMetalnessSlider = new ui.Slider({
            min: 0,
            max: 1,
            precision: 3
        });
        fieldMetalnessSlider.flexGrow = 4;
        fieldMetalnessSlider.link(asset, 'data.metalness');
        fieldMetalness.parent.append(fieldMetalnessSlider);

        var panelSpecularWorkflow = editor.call('attributes:addPanel');
        panelSpecularWorkflow.hidden = asset.get('data.useMetalness');
        panelSpecular.append(panelSpecularWorkflow);

        // specular map
        var fieldSpecularMap = editor.call('attributes:addField', {
            parent: panelSpecularWorkflow,
            type: 'asset',
            kind: 'texture',
            name: 'Specular',
            link: asset,
            path: 'data.specularMap'
        });

        // map, hide/show offset and tiling, as well as color
        fieldSpecularMap.on('change', function(value) {
            fieldSpecularOffset[0].parent.hidden = ! fieldSpecularMap.value || fieldTilingOffset.value;
            fieldSpecularTiling[0].parent.hidden = ! fieldSpecularMap.value || fieldTilingOffset.value;
            fieldSpecularTint.hidden = ! value;
            labelSpecularTint.hidden = ! value;
            fieldSpecularColor.hidden = value && ! fieldSpecularTint;
        });


        // offset
        var fieldSpecularOffset = editor.call('attributes:addField', {
            parent: panelSpecularWorkflow,
            type: 'vec2',
            name: 'Offset',
            placeholder: [ 'U', 'V' ],
            link: asset,
            path: 'data.specularMapOffset'
        });
        tilingOffsetFields.push({
            element: fieldSpecularOffset[0].parent,
            offset: fieldSpecularOffset,
            filter: function() {
                return ! fieldSpecularMap.value || fieldTilingOffset.value;
            }
        });
        fieldSpecularOffset[0].parent.hidden = ! fieldSpecularMap.value || fieldTilingOffset.value;

        // tiling
        var fieldSpecularTiling = editor.call('attributes:addField', {
            parent: panelSpecularWorkflow,
            type: 'vec2',
            name: 'Tiling',
            placeholder: [ 'U', 'V' ],
            link: asset,
            path: 'data.specularMapTiling'
        });
        tilingOffsetFields.push({
            element: fieldSpecularTiling[0].parent,
            tiling: fieldSpecularTiling,
            filter: function() {
                return ! fieldSpecularMap.value || fieldTilingOffset.value;
            }
        });
        fieldSpecularTiling[0].parent.hidden = ! fieldSpecularMap.value || fieldTilingOffset.value;


        // color
        var fieldSpecularColor = editor.call('attributes:addField', {
            parent: panelSpecularWorkflow,
            name: 'Color',
            type: 'rgb',
            link: asset,
            path: 'data.specular'
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
        labelSpecularTint.style.lineHeight = '24px';
        labelSpecularTint.hidden = ! asset.get('data.specularMap');
        fieldSpecularColor.parent.appendAfter(labelSpecularTint, fieldSpecularColor);


        // map (gloss)
        var fieldGlossMap = editor.call('attributes:addField', {
            parent: panelSpecular,
            type: 'asset',
            kind: 'texture',
            name: 'Glossiness',
            link: asset,
            path: 'data.glossMap'
        });

        // map, hide/show offset and tiling, as well as color
        fieldGlossMap.on('change', function(value) {
            fieldGlossOffset[0].parent.hidden = ! value || fieldTilingOffset.value;
            fieldGlossTiling[0].parent.hidden = ! value || fieldTilingOffset.value;
        });

        // offset
        var fieldGlossOffset = editor.call('attributes:addField', {
            parent: panelSpecular,
            type: 'vec2',
            name: 'Offset',
            placeholder: [ 'U', 'V' ],
            link: asset,
            path: 'data.glossMapOffset'
        });
        tilingOffsetFields.push({
            element: fieldGlossOffset[0].parent,
            offset: fieldGlossOffset,
            filter: function() {
                return ! fieldGlossMap.value || fieldTilingOffset.value;
            }
        });
        fieldGlossOffset[0].parent.hidden = ! fieldGlossMap.value || fieldTilingOffset.value;

        // tiling
        var fieldGlossTiling = editor.call('attributes:addField', {
            parent: panelSpecular,
            type: 'vec2',
            name: 'Tiling',
            placeholder: [ 'U', 'V' ],
            link: asset,
            path: 'data.glossMapTiling'
        });
        tilingOffsetFields.push({
            element: fieldGlossTiling[0].parent,
            tiling: fieldGlossTiling,
            filter: function() {
                return ! fieldGlossMap.value || fieldTilingOffset.value;
            }
        });
        fieldGlossTiling[0].parent.hidden = ! fieldGlossMap.value || fieldTilingOffset.value;


        // shininess
        var fieldShininess = editor.call('attributes:addField', {
            parent: panelSpecular,
            type: 'number',
            precision: 2,
            step: 0.5,
            min: 0,
            max: 100,
            name: 'Glossiness',
            link: asset,
            path: 'data.shininess'
        });
        fieldShininess.style.width = '32px';

        // shininess slider
        var fieldShininessSlider = new ui.Slider({
            min: 0,
            max: 100,
            precision: 2
        });
        fieldShininessSlider.flexGrow = 4;
        fieldShininessSlider.link(asset, 'data.shininess');
        fieldShininess.parent.append(fieldShininessSlider);


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
            foldable: true,
            folded: ! asset.get('data.emissiveMap'),
            name: 'Emissive'
        });
        panelEmissive.class.add('component');

        // map
        var fieldEmissiveMap = editor.call('attributes:addField', {
            parent: panelEmissive,
            type: 'asset',
            kind: 'texture',
            name: 'Emissive',
            link: asset,
            path: 'data.emissiveMap'
        });

        // map, hide/show offset and tiling, as well as color
        fieldEmissiveMap.on('change', function(value) {
            fieldEmissiveOffset[0].parent.hidden = ! value || fieldTilingOffset.value;
            fieldEmissiveTiling[0].parent.hidden = ! value || fieldTilingOffset.value;
            fieldEmissiveTint.hidden = ! value;
            labelEmissiveTint.hidden = ! value;
            fieldEmissiveColor.hidden = value && ! fieldEmissiveTint.value;
        });

        // offset
        var fieldEmissiveOffset = editor.call('attributes:addField', {
            parent: panelEmissive,
            type: 'vec2',
            name: 'Offset',
            placeholder: [ 'U', 'V' ],
            link: asset,
            path: 'data.emissiveMapOffset'
        });
        tilingOffsetFields.push({
            element: fieldEmissiveOffset[0].parent,
            offset: fieldEmissiveOffset,
            filter: function() {
                return ! fieldEmissiveMap.value || fieldTilingOffset.value;
            }
        });
        fieldEmissiveOffset[0].parent.hidden = ! fieldEmissiveMap.value || fieldTilingOffset.value;

        // tiling
        var fieldEmissiveTiling = editor.call('attributes:addField', {
            parent: panelEmissive,
            type: 'vec2',
            name: 'Tiling',
            placeholder: [ 'U', 'V' ],
            link: asset,
            path: 'data.emissiveMapTiling'
        });
        tilingOffsetFields.push({
            element: fieldEmissiveTiling[0].parent,
            tiling: fieldEmissiveTiling,
            filter: function() {
                return ! fieldEmissiveMap.value || fieldTilingOffset.value;
            }
        });
        fieldEmissiveTiling[0].parent.hidden = ! fieldEmissiveMap.value || fieldTilingOffset.value;


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
        labelEmissiveTint.style.lineHeight = '24px';
        labelEmissiveTint.hidden = ! asset.get('data.emissiveMap');
        fieldEmissiveColor.parent.appendAfter(labelEmissiveTint, fieldEmissiveColor);


        // intensity
        var fieldEmissiveIntensity = editor.call('attributes:addField', {
            parent: panelEmissive,
            name: 'Intensity',
            type: 'number',
            precision: 2,
            step: .1,
            min: 0,
            link: asset,
            path: 'data.emissiveIntensity'
        });
        fieldEmissiveIntensity.style.width = '32px';
        fieldEmissiveIntensity.flexGrow = 1;

        // intensity slider
        var fieldEmissiveIntensitySlider = new ui.Slider({
            min: 0,
            max: 10,
            precision: 2
        });
        fieldEmissiveIntensitySlider.flexGrow = 4;
        fieldEmissiveIntensitySlider.link(asset, 'data.emissiveIntensity');
        fieldEmissiveIntensity.parent.append(fieldEmissiveIntensitySlider);

        // unfold panel
        fieldEmissiveMap.on('change', function() { panelEmissive.folded = false; });
        fieldEmissiveTint.on('change', function() { panelEmissive.folded = false; });
        fieldEmissiveColor.on('change', function() { panelEmissive.folded = false; });
        fieldEmissiveIntensity.on('change', function() { panelEmissive.folded = false; });


        // opacity
        var panelOpacity = editor.call('attributes:addPanel', {
            foldable: true,
            folded: ! asset.get('data.opacityMap'),
            name: 'Opacity'
        });
        panelOpacity.class.add('component');

        // map
        var fieldOpacityMap = editor.call('attributes:addField', {
            parent: panelOpacity,
            type: 'asset',
            kind: 'texture',
            name: 'Opacity',
            link: asset,
            path: 'data.opacityMap'
        });

        // map, hide/show offset and tiling
        fieldOpacityMap.on('change', function(value) {
            fieldOpacityOffset[0].parent.hidden = ! value || fieldTilingOffset.value;
            fieldOpacityTiling[0].parent.hidden = ! value || fieldTilingOffset.value;
        });

        // offset
        var fieldOpacityOffset = editor.call('attributes:addField', {
            parent: panelOpacity,
            type: 'vec2',
            name: 'Offset',
            placeholder: [ 'U', 'V' ],
            link: asset,
            path: 'data.opacityMapOffset'
        });
        tilingOffsetFields.push({
            element: fieldOpacityOffset[0].parent,
            offset: fieldOpacityOffset,
            filter: function() {
                return ! fieldOpacityMap.value || fieldTilingOffset.value;
            }
        });
        fieldOpacityOffset[0].parent.hidden = ! fieldOpacityMap.value || fieldTilingOffset.value;

        // tiling
        var fieldOpacityTiling = editor.call('attributes:addField', {
            parent: panelOpacity,
            type: 'vec2',
            name: 'Tiling',
            placeholder: [ 'U', 'V' ],
            link: asset,
            path: 'data.opacityMapTiling'
        });
        tilingOffsetFields.push({
            element: fieldOpacityTiling[0].parent,
            tiling: fieldOpacityTiling,
            filter: function() {
                return ! fieldOpacityMap.value || fieldTilingOffset.value;
            }
        });
        fieldOpacityTiling[0].parent.hidden = ! fieldOpacityMap.value || fieldTilingOffset.value;


        // intensity
        var fieldOpacityIntensity = editor.call('attributes:addField', {
            parent: panelOpacity,
            name: 'Intensity',
            type: 'number',
            precision: 3,
            step: .05,
            min: 0,
            max: 1,
            link: asset,
            path: 'data.opacity'
        });
        fieldOpacityIntensity.style.width = '32px';
        fieldOpacityIntensity.flexGrow = 1;

        // intensity slider
        var fieldOpacityIntensitySlider = new ui.Slider({
            min: 0,
            max: 1,
            precision: 3
        });
        fieldOpacityIntensitySlider.flexGrow = 4;
        fieldOpacityIntensitySlider.link(asset, 'data.opacity');
        fieldOpacityIntensity.parent.append(fieldOpacityIntensitySlider);

        // unfold panel
        fieldOpacityMap.on('change', function() { panelOpacity.folded = false; });
        fieldOpacityIntensity.on('change', function() { panelOpacity.folded = false; });


        // normals
        var panelNormal = editor.call('attributes:addPanel', {
            foldable: true,
            folded: ! asset.get('data.normalMap'),
            name: 'Normals'
        });
        panelNormal.class.add('component');

        // map (normals)
        var fieldNormalMap = editor.call('attributes:addField', {
            parent: panelNormal,
            type: 'asset',
            kind: 'texture',
            name: 'Normals',
            link: asset,
            path: 'data.normalMap'
        });

        // bumpiness
        var fieldBumpiness = editor.call('attributes:addField', {
            parent: panelNormal,
            type: 'number',
            name: 'Bumpiness',
            precision: 3,
            step: 0.05,
            min: 0,
            max: 2,
            link: asset,
            path: 'data.bumpMapFactor'
        });
        fieldBumpiness.style.width = '32px';

        // bumpiness slider
        var fieldBumpinessSlider = new ui.Slider({
            min: 0,
            max: 2,
            precision: 3
        });
        fieldBumpinessSlider.flexGrow = 4;
        fieldBumpinessSlider.link(asset, 'data.bumpMapFactor');
        fieldBumpiness.parent.append(fieldBumpinessSlider);

        fieldNormalMap.on('change', function(value) {
            fieldNormalsOffset[0].parent.hidden = ! value || fieldTilingOffset.value;
            fieldNormalsTiling[0].parent.hidden = ! value || fieldTilingOffset.value;
            fieldBumpiness.parent.hidden = ! value;
        })
        fieldBumpiness.parent.hidden = ! fieldNormalMap.value;

        // offset
        var fieldNormalsOffset = editor.call('attributes:addField', {
            parent: panelNormal,
            type: 'vec2',
            name: 'Offset',
            placeholder: [ 'U', 'V' ],
            link: asset,
            path: 'data.normalMapOffset'
        });
        tilingOffsetFields.push({
            element: fieldNormalsOffset[0].parent,
            offset: fieldNormalsOffset,
            filter: function() {
                return ! fieldNormalMap.value || fieldTilingOffset.value;
            }
        });
        fieldNormalsOffset[0].parent.hidden = ! fieldNormalMap.value || fieldTilingOffset.value;

        // tiling
        var fieldNormalsTiling = editor.call('attributes:addField', {
            parent: panelNormal,
            type: 'vec2',
            name: 'Tiling',
            placeholder: [ 'U', 'V' ],
            link: asset,
            path: 'data.normalMapTiling'
        });
        tilingOffsetFields.push({
            element: fieldNormalsTiling[0].parent,
            tiling: fieldNormalsTiling,
            filter: function() {
                return ! fieldNormalMap.value || fieldTilingOffset.value;
            }
        });
        fieldNormalsTiling[0].parent.hidden = ! fieldNormalMap.value || fieldTilingOffset.value;

        // unfold panel
        fieldNormalMap.on('change', function() { panelNormal.folded = false; });
        fieldBumpiness.on('change', function() { panelNormal.folded = false; });



        // parallax
        var panelParallax = editor.call('attributes:addPanel', {
            foldable: true,
            folded: ! asset.get('data.heightMap'),
            name: 'Parallax'
        });
        panelParallax.class.add('component');

        // map
        var fieldHeightMap = editor.call('attributes:addField', {
            parent: panelParallax,
            type: 'asset',
            kind: 'texture',
            name: 'Heightmap',
            link: asset,
            path: 'data.heightMap'
        });

        // map, hide/show offset and tiling, as well as color
        fieldHeightMap.on('change', function(value) {
            fieldHeightMapOffset[0].parent.hidden = ! value || fieldTilingOffset.value;
            fieldHeightMapTiling[0].parent.hidden = ! value || fieldTilingOffset.value;
            fieldHeightMapFactor.parent.hidden = ! value;
        });


        // offset
        var fieldHeightMapOffset = editor.call('attributes:addField', {
            parent: panelParallax,
            type: 'vec2',
            name: 'Offset',
            placeholder: [ 'U', 'V' ],
            link: asset,
            path: 'data.heightMapOffset'
        });
        tilingOffsetFields.push({
            element: fieldHeightMapOffset[0].parent,
            offset: fieldHeightMapOffset,
            filter: function() {
                return ! fieldHeightMap.value || fieldTilingOffset.value;
            }
        });
        fieldHeightMapOffset[0].parent.hidden = ! fieldHeightMap.value || fieldTilingOffset.value;

        // tiling
        var fieldHeightMapTiling = editor.call('attributes:addField', {
            parent: panelParallax,
            type: 'vec2',
            name: 'Tiling',
            placeholder: [ 'U', 'V' ],
            link: asset,
            path: 'data.heightMapTiling'
        });
        tilingOffsetFields.push({
            element: fieldHeightMapTiling[0].parent,
            tiling: fieldHeightMapTiling,
            filter: function() {
                return ! fieldHeightMap.value || fieldTilingOffset.value;
            }
        });
        fieldHeightMapTiling[0].parent.hidden = ! fieldHeightMap.value || fieldTilingOffset.value;


        // strength
        var fieldHeightMapFactor = editor.call('attributes:addField', {
            parent: panelParallax,
            type: 'number',
            min: 0,
            precision: 3,
            step: 0.01,
            name: 'Strength',
            link: asset,
            path: 'data.heightMapFactor'
        });
        fieldHeightMapFactor.style.width = '32px';
        fieldHeightMapFactor.parent.hidden = ! fieldHeightMap.value;

        // strength slider
        var fieldHeightMapFactorSlider = new ui.Slider({
            min: 0,
            max: 2,
            precision: 3
        });
        fieldHeightMapFactorSlider.flexGrow = 4;
        fieldHeightMapFactorSlider.link(asset, 'data.heightMapFactor');
        fieldHeightMapFactor.parent.append(fieldHeightMapFactorSlider);

        // unfold panel
        fieldHeightMap.on('change', function() { panelParallax.folded = false; });
        fieldHeightMapFactor.on('change', function() { panelParallax.folded = false; });



        // reflection
        var panelReflection = editor.call('attributes:addPanel', {
            foldable: true,
            folded: ! (asset.get('data.sphereMap') || asset.get('data.cubeMap')),
            name: 'Reflection'
        });
        panelReflection.class.add('component');

        // spheremap
        var fieldReflectionSphere = editor.call('attributes:addField', {
            parent: panelReflection,
            type: 'asset',
            kind: 'texture',
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
            type: 'asset',
            kind: 'cubemap',
            name: 'Cube Map',
            link: asset,
            path: 'data.cubeMap'
        });
        fieldReflectionCubeMap.on('change', function(value) {
            fieldReflectionStrength.parent.hidden = ! fieldReflectionSphere.value && ! fieldReflectionCubeMap.value;
            fieldReflectionSphere.parent.hidden = !! value;
            fieldRefraction.parent.hidden = ! value;
            fieldRefractionIndex.parent.hidden = ! value;
        });
        fieldReflectionCubeMap.parent.hidden = !! asset.get('data.sphereMap');

        // reflectivity
        var fieldReflectionStrength = editor.call('attributes:addField', {
            parent: panelReflection,
            type: 'number',
            precision: 3,
            step: 0.01,
            min: 0,
            max: 1,
            name: 'Reflectivity',
            link: asset,
            path: 'data.reflectivity'
        });
        fieldReflectionStrength.style.width = '32px';
        fieldReflectionStrength.parent.hidden = ! fieldReflectionSphere.value && ! fieldReflectionCubeMap.value;

        // reflectivity slider
        var fieldReflectionStrengthSlider = new ui.Slider({
            precision: 3
        });
        fieldReflectionStrengthSlider.flexGrow = 4;
        fieldReflectionStrengthSlider.link(asset, 'data.reflectivity');
        fieldReflectionStrength.parent.append(fieldReflectionStrengthSlider);

        // refraction
        var fieldRefraction = editor.call('attributes:addField', {
            parent: panelReflection,
            type: 'number',
            precision: 3,
            step: 0.01,
            min: 0,
            max: 1,
            name: 'Refraction',
            link: asset,
            path: 'data.refraction'
        });
        fieldRefraction.style.width = '32px';
        fieldRefraction.parent.hidden = ! fieldReflectionCubeMap.value;

        // refraction slider
        var fieldRefractionSlider = new ui.Slider({
            precision: 3
        });
        fieldRefractionSlider.flexGrow = 4;
        fieldRefractionSlider.link(asset, 'data.refraction');
        fieldRefraction.parent.append(fieldRefractionSlider);


        // refractionIndex
        var fieldRefractionIndex = editor.call('attributes:addField', {
            parent: panelReflection,
            type: 'number',
            precision: 3,
            step: 0.01,
            min: 0,
            max: 1,
            name: 'Index of Refraction',
            link: asset,
            path: 'data.refractionIndex'
        });
        fieldRefractionIndex.style.width = '32px';
        fieldRefractionIndex.parent.hidden = ! fieldReflectionCubeMap.value;

        // refraction slider
        var fieldRefractionIndexSlider = new ui.Slider({
            precision: 3
        });
        fieldRefractionIndexSlider.flexGrow = 4;
        fieldRefractionIndexSlider.link(asset, 'data.refractionIndex');
        fieldRefractionIndex.parent.append(fieldRefractionIndexSlider);


        // unfold panel
        fieldReflectionSphere.on('change', function() { panelReflection.folded = false; });
        fieldReflectionCubeMap.on('change', function() { panelReflection.folded = false; });
        fieldReflectionStrength.on('change', function() { panelReflection.folded = false; });



        // lightmap
        var panelLightMap = editor.call('attributes:addPanel', {
            foldable: true,
            folded: ! asset.get('data.lightMap'),
            name: 'LightMap'
        });
        panelLightMap.class.add('component');

        // map
        var fieldLightMap = editor.call('attributes:addField', {
            parent: panelLightMap,
            type: 'asset',
            kind: 'texture',
            name: 'Lightmap',
            link: asset,
            path: 'data.lightMap'
        });
        // unfold panel
        fieldLightMap.on('change', function() {
            fieldLightMapOffset[0].parent.hidden = ! fieldLightMap.value || fieldTilingOffset.value;
            fieldLightMapTiling[0].parent.hidden = ! fieldLightMap.value || fieldTilingOffset.value;
            panelLightMap.folded = false;
        });


        // offset
        var fieldLightMapOffset = editor.call('attributes:addField', {
            parent: panelLightMap,
            type: 'vec2',
            name: 'Offset',
            placeholder: [ 'U', 'V' ],
            link: asset,
            path: 'data.lightMapOffset'
        });
        tilingOffsetFields.push({
            element: fieldLightMapOffset[0].parent,
            offset: fieldLightMapOffset,
            filter: function() {
                return ! fieldLightMap.value || fieldTilingOffset.value;
            }
        });
        fieldLightMapOffset[0].parent.hidden = ! fieldLightMap.value || fieldTilingOffset.value;

        // tiling
        var fieldLightMapTiling = editor.call('attributes:addField', {
            parent: panelLightMap,
            type: 'vec2',
            name: 'Tiling',
            placeholder: [ 'U', 'V' ],
            link: asset,
            path: 'data.lightMapTiling'
        });
        tilingOffsetFields.push({
            element: fieldLightMapTiling[0].parent,
            tiling: fieldLightMapTiling,
            filter: function() {
                return ! fieldLightMap.value || fieldTilingOffset.value;
            }
        });
        fieldLightMapTiling[0].parent.hidden = ! fieldLightMap.value || fieldTilingOffset.value;



        // render states
        var panelRenderStates = editor.call('attributes:addPanel', {
            foldable: true,
            // folded: true,
            name: 'Other'
        });
        panelRenderStates.class.add('component');


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
        label.style.lineHeight = '24px';
        fieldDepthTest.parent.append(label);


        // depthWrite
        var fieldDepthWrite = new ui.Checkbox();
        fieldDepthWrite.link(asset, 'data.depthWrite');
        fieldDepthTest.parent.append(fieldDepthWrite);
        // label
        var label = new ui.Label({ text: 'Write' });
        label.style.verticalAlign = 'top';
        label.style.fontSize = '12px';
        label.style.lineHeight = '24px';
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

        // shadowSampleType
        var fieldShadowSampleType = editor.call('attributes:addField', {
            parent: panelRenderStates,
            type: 'number',
            enum: mapping.shadowSampleType.enum,
            name: 'Shadow Sample Type',
            link: asset,
            path: 'data.shadowSampleType'
        });


        // unfold panel
        // fieldDepthTest.on('change', function() { panelRenderStates.folded = false; });
        // fieldDepthWrite.on('change', function() { panelRenderStates.folded = false; });
        // fieldCull.on('change', function() { panelRenderStates.folded = false; });
        // fieldBlendType.on('change', function() { panelRenderStates.folded = false; });
    });
});
