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
        aoMapChannel: {
            'default': 'r',
            'type': 'string'
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
        diffuseMapChannel: {
            'default': 'rgb',
            'type': 'string'
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
        specularMapChannel: {
            'default': 'rgb',
            'type': 'string'
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
        metalnessMapChannel: {
            'default': 'r',
            'type': 'string'
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
        glossMapChannel: {
            'default': 'r',
            'type': 'string'
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
        emissiveMapChannel: {
            'default': 'rgb',
            'type': 'string'
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
        heightMapChannel: {
            'default': 'r',
            'type': 'string'
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
        opacityMapChannel: {
            'default': 'r',
            'type': 'string'
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
        lightMapChannel: {
            'default': 'rgb',
            'type': 'string'
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
            'enum': [
                { v: '', t: '...' },
                { v: 0, t: 'None' },
                { v: 1, t: 'Back Faces' },
                { v: 2, t: 'Front Faces' }
            ],
            'type': 'int',
        },
        blendType: {
            'default': 3,
            'enum': [
                { v: '', t: '...' },
                { v: 3, t: 'None' },
                { v: 2, t: 'Alpha' },
                { v: 1, t: 'Additive' },
                { v: 6, t: 'Additive Alpha' },
                { v: 4, t: 'Premultiplied Alpha' },
                { v: 5, t: 'Multiply' }
            ],
            'type': 'int'
        },
        shadowSampleType: {
            'default': 1,
            'enum': [
                { v: '', t: '...' },
                { v: 0, t: 'Hard' },
                { v: 1, t: 'PCF 3x3' }
            ],
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

    var panelsStates = { };
    var panelsStatesDependencies = {
        'offset': [ 'diffuseMapOffset', 'diffuseMapTiling' ],
        'ao': [ 'aoMap' ],
        'diffuse': [ 'diffuseMap' ],
        'specular': [ 'specularMap', 'metalnessMap', 'glossMap' ],
        'emissive': [ 'emissiveMap' ],
        'opacity': [ 'opacityMap' ],
        'normals': [ 'normalMap' ],
        'height': [ 'heightMap' ],
        'environment': [ 'sphereMap', 'cubeMap' ],
        'light': [ 'lightMap' ],
        'states': [ ]
    }

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
        for(var i = 0; i < assets.length; i++) {
            if (assets[i].get('type') !== 'material')
                return;
        }

        if (assets.length > 1)
            editor.call('attributes:header', assets.length + ' Materials');

        var root = editor.call('attributes.rootPanel');

        var ids = [ ];
        for(var i = 0; i < assets.length; i++)
            ids.push(assets[i].get('id'));
        ids = ids.sort(function(a, b) {
            return a - b;
        }).join(',');

        var panelState = panelsStates[ids] = panelsStates[ids];
        var panelStateNew = false;

        if (! panelState) {
            panelStateNew = true;
            panelState = panelsStates[ids] = { };

            for(var key in panelsStatesDependencies) {
                var fields = panelsStatesDependencies[key];
                panelState[key] = true;

                for(var n = 0; n < fields.length; n++) {
                    switch(mapping[fields[n]].type) {
                        case 'vec2':
                            for(var i = 0; i < assets.length; i++) {
                                var value = assets[i].get('data.' + fields[n]);
                                if (value && value[0] !== mapping[fields[n]].default[0] || value && value[1] !== mapping[fields[n]].default[1]) {
                                    panelState[key] = false;
                                    break;
                                }
                            }
                            break;
                        case 'texture':
                            for(var i = 0; i < assets.length; i++) {
                                if (assets[i].get('data.' + fields[n])) {
                                    panelState[key] = false;
                                    break;
                                }
                            }
                            break;
                    }
                }
            }
        }



        // preview
        if (assets.length === 1) {
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');
            canvas.classList.add('asset-preview');

            root.class.add('asset-preview');
            root.element.insertBefore(canvas, root.innerElement);
            var scrolledFully = false;
            var scrollHeightLast = -1;
            var scrollFn = function(evt) {
                var scrollBudget = root.innerElement.scrollHeight - (root.element.clientHeight - 32 - 320);
                var scrollHeight = 128 - Math.max(0, 320 - scrollBudget);

                if (root.innerElement.scrollTop > scrollHeight) {
                    if (! scrolledFully) {
                        scrolledFully = true;
                        scrollHeightLast = -1;

                        root.innerElement.style.marginTop = '50%';
                        canvas.style.width = 'calc(50% - 16px)';
                        canvas.style.paddingLeft = '25%';
                        canvas.style.paddingRight = '25%';

                        if (renderTimeout)
                            clearTimeout(renderTimeout);
                        renderTimeout = setTimeout(renderPreview, 100);
                    }
                } else {
                    scrolledFully = false;

                    var p = 100 - Math.floor((root.innerElement.scrollTop / scrollHeight) * 50);

                    if (p === scrollHeightLast) return;
                    scrollHeightLast = p;

                    root.innerElement.style.marginTop = p + '%';
                    canvas.style.width = 'calc(' + p + '% - 16px)';
                    canvas.style.paddingLeft = ((100 - p) / 2) + '%';
                    canvas.style.paddingRight = ((100 - p) / 2) + '%';

                    if (renderTimeout)
                        clearTimeout(renderTimeout);
                    renderTimeout = setTimeout(renderPreview, 100);
                }
            };
            var scrollEvt = root.on('scroll', scrollFn);
            var scrollInterval = setInterval(scrollFn, 200);

            var renderPreview = function () {
                // resize canvas
                canvas.width = root.element.clientWidth;
                canvas.height = canvas.width;
                editor.call('preview:render:material', assets[0], canvas.width, function (sourceCanvas) {
                    ctx.drawImage(sourceCanvas, 0, 0);
                });
            };
            renderPreview();

            var renderTimeout;

            var evtPanelResize = root.on('resize', function () {
                if (renderTimeout)
                    clearTimeout(renderTimeout);

                renderTimeout = setTimeout(renderPreview, 100);
            });
            var evtMaterialChanged = editor.on('preview:material:changed', function (id) {
                if (id === assets[0].get('id'))
                    renderPreview();
            });

            // properties panel
            var panelParams = editor.call('attributes:addPanel', {
                name: 'Material'
            });
            panelParams.class.add('component');
            // reference
            editor.call('attributes:reference:asset:material:asset:attach', panelParams, panelParams.headerElement);

            panelParams.on('destroy', function() {
                clearInterval(scrollInterval);
                scrollEvt.unbind();
                evtPanelResize.unbind();
                evtMaterialChanged.unbind();
                canvas.parentNode.removeChild(canvas);
                root.class.remove('asset-preview');
                root.innerElement.style.marginTop = '';
            });
        }



        // model
        var fieldModel = editor.call('attributes:addField', {
            parent: panelParams,
            type: 'string',
            enum: {
                '': '...',
                'phong': 'Phong',
                'blinn': 'Physical'
            },
            name: 'Shading',
            link: assets,
            path: 'data.model'
        });
        // reference
        editor.call('attributes:reference:asset:material:shadingModel:attach', fieldModel.parent.innerElement.firstChild.ui);
        // fresnelMode
        var evtFresnelModel = [ ];
        for(var i = 0; i < assets.length; i++) {
            evtFresnelModel.push(assets[i].on('data.model:set', function(value) {
                var state = this.history.enabled;
                this.history.enabled = false;
                this.set('data.fresnelModel', value === 'blinn' ? 2 : 0);
                this.history.enabled = state;
            }));
        }
        fieldModel.once('destroy', function() {
            for(var i = 0; i < evtFresnelModel.length; i++)
                evtFresnelModel[i].unbind();
        });



        // TODO
        // make sure changes by history or to individual
        // offset/tiling fields affects state of global fields

        // tiling & offsets
        var tilingOffsetsChanging = false;
        var offset = assets[0].get('data.' + mappingMaps[0] + 'MapOffset');
        var tiling = assets[0].get('data.' + mappingMaps[0] + 'MapTiling');
        var checkTilingOffsetDifferent = function() {
            var offset = assets[0].get('data.' + mappingMaps[0] + 'MapOffset');
            var tiling = assets[0].get('data.' + mappingMaps[0] + 'MapTiling');

            for(var i = 0; i < assets.length; i++) {
                for(var m = 0; m < mappingMaps.length; m++) {
                    if (i === 0 && m === 0)
                        continue;

                    if (! offset.equals(assets[i].get('data.' + mappingMaps[m] + 'MapOffset')) || ! tiling.equals(assets[i].get('data.' + mappingMaps[m] + 'MapTiling'))) {
                        return true;
                    }
                }
            }

            return false;
        }
        var different = checkTilingOffsetDifferent();

        if (different && panelStateNew)
            panelState['offset'] = true;

        var panelTiling = editor.call('attributes:addPanel', {
            foldable: true,
            folded: panelState['offset'],
            name: 'Offset & Tiling'
        });
        panelTiling.class.add('component');
        panelTiling.on('fold', function() { panelState['offset'] = true; });
        panelTiling.on('unfold', function() { panelState['offset'] = false; });
        // reference
        editor.call('attributes:reference:asset:material:offsetTiling:attach', panelTiling, panelTiling.headerElement);

        var tilingOffsetFields = [ ];

        // all maps
        var fieldTilingOffset = editor.call('attributes:addField', {
            parent: panelTiling,
            type: 'checkbox',
            name: 'Apply to all Maps',
            value: ! different
        });
        fieldTilingOffset.element.previousSibling.style.width = 'auto';
        fieldTilingOffset.on('change', function(value) {
            if (tilingOffsetsChanging)
                return;

            fieldOffset[0].parent.hidden = ! value;
            fieldTiling[0].parent.hidden = ! value;

            for(var i = 0; i < tilingOffsetFields.length; i++)
                tilingOffsetFields[i].element.hidden = tilingOffsetFields[i].filter();

            if (value) {
                var valueOffset = [ fieldOffset[0].value, fieldOffset[1].value ];
                var valueTiling = [ fieldTiling[0].value, fieldTiling[1].value ];
                var items = [ ];
                tilingOffsetsChanging = true;
                for(var i = 0; i < assets.length; i++) {
                    for(var m = 0; m < mappingMaps.length; m++) {
                        items.push({
                            get: assets[i].history._getItemFn,
                            path: 'data.' + mappingMaps[m] + 'Map',
                            valueOffset: assets[i].get('data.' + mappingMaps[m] + 'MapOffset'),
                            valueTiling: assets[i].get('data.' + mappingMaps[m] + 'MapTiling')
                        });
                        assets[i].history.enabled = false;
                        assets[i].set('data.' + mappingMaps[m] + 'MapOffset', valueOffset);
                        assets[i].set('data.' + mappingMaps[m] + 'MapTiling', valueTiling);
                        assets[i].history.enabled = true;
                    }
                }
                tilingOffsetsChanging = false;
                // history
                editor.call('history:add', {
                    name: 'assets.materials.tiling-offset',
                    undo: function() {
                        for(var i = 0; i < items.length; i++) {
                            var item = items[i].get();
                            if (! item)
                                continue;

                            item.history.enabled = false;
                            item.set(items[i].path + 'Offset', items[i].valueOffset);
                            item.set(items[i].path + 'Tiling', items[i].valueTiling);
                            item.history.enabled = true;
                        }
                    },
                    redo: function() {
                        for(var i = 0; i < items.length; i++) {
                            var item = items[i].get();
                            if (! item)
                                continue;

                            item.history.enabled = false;
                            item.set(items[i].path + 'Offset', valueOffset);
                            item.set(items[i].path + 'Tiling', valueTiling);
                            item.history.enabled = true;
                        }
                    }
                });
            }
        });

        // offset
        var fieldOffset = editor.call('attributes:addField', {
            parent: panelTiling,
            type: 'vec2',
            name: 'Offset',
            placeholder: [ 'U', 'V' ]
        });
        fieldOffset[0].parent.hidden = ! fieldTilingOffset.value;
        // reference
        editor.call('attributes:reference:asset:material:offset:attach', fieldOffset[0].parent.innerElement.firstChild.ui);

        // tiling
        var fieldTiling = editor.call('attributes:addField', {
            parent: panelTiling,
            type: 'vec2',
            name: 'Tiling',
            placeholder: [ 'U', 'V' ]
        });
        fieldTiling[0].parent.hidden = ! fieldTilingOffset.value;
        // reference
        editor.call('attributes:reference:asset:material:tiling:attach', fieldTiling[0].parent.innerElement.firstChild.ui);

        if (different) {
            fieldTilingOffset.value = false;

            if (panelStateNew && ! panelState['offset'])
                panelState['offset'] = true;
        }

        fieldOffset[0].value = offset[0];
        fieldOffset[1].value = offset[1];
        fieldTiling[0].value = tiling[0];
        fieldTiling[1].value = tiling[1];

        var updateAllTilingOffsetFields = function(type, field, value, valueOld) {
            if (! fieldTilingOffset.value || tilingOffsetsChanging)
                return;

            var items = [ ];

            tilingOffsetsChanging = true;
            for(var i = 0; i < assets.length; i++) {
                assets[i].history.enabled = false;
                for(var m = 0; m < mappingMaps.length; m++) {
                    items.push({
                        get: assets[i].history._getItemFn,
                        path: 'data.' + mappingMaps[m] + 'Map' + type + '.' + field,
                        value: assets[i].get('data.' + mappingMaps[m] + 'Map' + type + '.' + field)
                    });
                    assets[i].set('data.' + mappingMaps[m] + 'Map' + type + '.' + field, value);
                }
                assets[i].history.enabled = true;
            }
            tilingOffsetsChanging = false;

            // history
            editor.call('history:add', {
                name: 'assets.materials.' + type + '.' + field,
                undo: function() {
                    for(var i = 0; i < items.length; i++) {
                        var item = items[i].get();
                        if (! item)
                            continue;

                        item.history.enabled = false;
                        item.set(items[i].path, items[i].value);
                        item.history.enabled = true;
                    }
                },
                redo: function() {
                    for(var i = 0; i < items.length; i++) {
                        var item = items[i].get();
                        if (! item)
                            continue;

                        item.history.enabled = false;
                        item.set(items[i].path, value);
                        item.history.enabled = true;
                    }
                }
            });
        };

        fieldOffset[0].on('change', function(value, valueOld) {
            updateAllTilingOffsetFields('Offset', 0, value);
        });
        fieldOffset[1].on('change', function(value, valueOld) {
            updateAllTilingOffsetFields('Offset', 1, value);
        });
        fieldTiling[0].on('change', function(value, valueOld) {
            updateAllTilingOffsetFields('Tiling', 0, value);
        });
        fieldTiling[1].on('change', function(value, valueOld) {
            updateAllTilingOffsetFields('Tiling', 1, value);
        });



        // ambient
        var panelAmbient = editor.call('attributes:addPanel', {
            foldable: true,
            folded: panelState['ao'],
            name: 'Ambient'
        });
        panelAmbient.class.add('component');
        panelAmbient.on('fold', function() { panelState['ao'] = true; });
        panelAmbient.on('unfold', function() { panelState['ao'] = false; });
        // reference
        editor.call('attributes:reference:asset:material:ambientOverview:attach', panelAmbient, panelAmbient.headerElement);


        // color
        var fieldAmbientColor = editor.call('attributes:addField', {
            parent: panelAmbient,
            name: 'Color',
            type: 'rgb',
            link: assets,
            path: 'data.ambient'
        });
        // reference
        editor.call('attributes:reference:asset:material:ambient:attach', fieldAmbientColor.parent.innerElement.firstChild.ui);


        // tint
        var fieldAmbientTint = editor.call('attributes:addField', {
            panel: fieldAmbientColor.parent,
            type: 'checkbox',
            link: assets,
            path: 'data.ambientTint'
        });
        // label
        var labelAmbientTint = new ui.Label({ text: 'Tint' });
        labelAmbientTint.style.verticalAlign = 'top';
        labelAmbientTint.style.paddingRight = '12px';
        labelAmbientTint.style.fontSize = '12px';
        labelAmbientTint.style.lineHeight = '24px';
        fieldAmbientColor.parent.append(labelAmbientTint);
        // reference
        editor.call('attributes:reference:asset:material:ambientTint:attach', labelAmbientTint);


        // map
        var fieldAmbientMap = editor.call('attributes:addField', {
            parent: panelAmbient,
            type: 'asset',
            kind: 'texture',
            name: 'Ambient Occlusion',
            link: assets,
            path: 'data.aoMap'
        });
        fieldAmbientMap.parent.class.add('channel');
        fieldAmbientMap.on('change', function(value) {
            fieldAmbientOffset[0].parent.hidden = filterAmbientOffset();
            fieldAmbientTiling[0].parent.hidden = filterAmbientTiling();
            fieldOccludeSpecular.parent.hidden = ! fieldAmbientMap.value && ! fieldAmbientMap.class.contains('null');
        });
        // reference
        editor.call('attributes:reference:asset:material:aoMap:attach', fieldAmbientMap._label);


        // map channel
        var fieldAmbientMapChannel = editor.call('attributes:addField', {
            panel: fieldAmbientMap.parent,
            type: 'string',
            enum: {
                '': '...',
                'r': 'R',
                'g': 'G',
                'b': 'B',
                'a': 'A'
            },
            link: assets,
            path: 'data.aoMapChannel'
        });
        fieldAmbientMapChannel.element.parentNode.removeChild(fieldAmbientMapChannel.element);
        fieldAmbientMap.parent.innerElement.querySelector('.top > .ui-label').parentNode.appendChild(fieldAmbientMapChannel.element);
        // reference
        editor.call('attributes:reference:asset:material:aoMapChannel:attach', fieldAmbientMapChannel);

        // offset
        var fieldAmbientOffset = editor.call('attributes:addField', {
            parent: panelAmbient,
            type: 'vec2',
            name: 'Offset',
            placeholder: [ 'U', 'V' ],
            link: assets,
            path: 'data.aoMapOffset'
        });
        var filterAmbientOffset = function() {
            return (! fieldAmbientMap.value && ! fieldAmbientMap.class.contains('null')) || fieldTilingOffset.value;
        };
        tilingOffsetFields.push({
            element: fieldAmbientOffset[0].parent,
            offset: fieldAmbientOffset,
            filter: filterAmbientOffset
        });
        fieldAmbientOffset[0].parent.hidden = filterAmbientOffset();
        // reference
        editor.call('attributes:reference:asset:material:aoMapOffset:attach', fieldAmbientOffset[0].parent.innerElement.firstChild.ui);

        // tiling
        var fieldAmbientTiling = editor.call('attributes:addField', {
            parent: panelAmbient,
            type: 'vec2',
            name: 'Tiling',
            placeholder: [ 'U', 'V' ],
            link: assets,
            path: 'data.aoMapTiling'
        });
        var filterAmbientTiling = function() {
            return (! fieldAmbientMap.value && ! fieldAmbientMap.class.contains('null')) || fieldTilingOffset.value;
        };
        tilingOffsetFields.push({
            element: fieldAmbientTiling[0].parent,
            tiling: fieldAmbientTiling,
            filter: filterAmbientTiling
        });
        fieldAmbientTiling[0].parent.hidden = filterAmbientTiling();
        // reference
        editor.call('attributes:reference:asset:material:aoMapTiling:attach', fieldAmbientTiling[0].parent.innerElement.firstChild.ui);

        // occludeSpecular
        var fieldOccludeSpecular = editor.call('attributes:addField', {
            parent: panelAmbient,
            type: 'checkbox',
            name: 'Occlude Specular',
            link: assets,
            path: 'data.occludeSpecular'
        });
        fieldOccludeSpecular.parent.hidden = ! fieldAmbientMap.value && ! fieldAmbientMap.class.contains('null');
        // reference
        editor.call('attributes:reference:asset:material:occludeSpecular:attach', fieldOccludeSpecular.parent.innerElement.firstChild.ui);


        // diffuse
        var panelDiffuse = editor.call('attributes:addPanel', {
            foldable: true,
            folded: panelState['diffuse'],
            name: 'Diffuse'
        });
        panelDiffuse.class.add('component');
        panelDiffuse.on('fold', function() { panelState['diffuse'] = true; });
        panelDiffuse.on('unfold', function() { panelState['diffuse'] = false; });
        // reference
        editor.call('attributes:reference:asset:material:diffuseOverview:attach', panelDiffuse, panelDiffuse.headerElement);

        // diffuse map
        var fieldDiffuseMap = editor.call('attributes:addField', {
            parent: panelDiffuse,
            type: 'asset',
            kind: 'texture',
            name: 'Diffuse',
            link: assets,
            path: 'data.diffuseMap'
        });
        fieldDiffuseMap.parent.class.add('channel');
        fieldDiffuseMap.on('change', function(value) {
            fieldDiffuseOffset[0].parent.hidden = filterDiffuseOffset();
            fieldDiffuseTiling[0].parent.hidden = filterDiffuseTiling();
        });
        // reference
        editor.call('attributes:reference:asset:material:diffuseMap:attach', fieldDiffuseMap._label);

        // map channel
        var fieldDiffuseMapChannel = editor.call('attributes:addField', {
            panel: fieldDiffuseMap.parent,
            type: 'string',
            enum: {
                '': '...',
                'r': 'R',
                'g': 'G',
                'b': 'B',
                'a': 'A',
                'rgb': 'RGB'
            },
            link: assets,
            path: 'data.diffuseMapChannel'
        });
        fieldDiffuseMapChannel.element.parentNode.removeChild(fieldDiffuseMapChannel.element);
        fieldDiffuseMap.parent.innerElement.querySelector('.top > .ui-label').parentNode.appendChild(fieldDiffuseMapChannel.element);
        // reference
        editor.call('attributes:reference:asset:material:diffuseMapChannel:attach', fieldDiffuseMapChannel);


        // offset
        var fieldDiffuseOffset = editor.call('attributes:addField', {
            parent: panelDiffuse,
            type: 'vec2',
            name: 'Offset',
            placeholder: [ 'U', 'V' ],
            link: assets,
            path: 'data.diffuseMapOffset'
        });
        var filterDiffuseOffset = function() {
            return (! fieldDiffuseMap.value && ! fieldDiffuseMap.class.contains('null')) || fieldTilingOffset.value;
        };
        tilingOffsetFields.push({
            element: fieldDiffuseOffset[0].parent,
            offset: fieldDiffuseOffset,
            filter: filterDiffuseOffset
        });
        fieldDiffuseOffset[0].parent.hidden = filterDiffuseOffset();
        // reference
        editor.call('attributes:reference:asset:material:diffuseMapOffset:attach', fieldDiffuseOffset[0].parent.innerElement.firstChild.ui);

        // tiling
        var fieldDiffuseTiling = editor.call('attributes:addField', {
            parent: panelDiffuse,
            type: 'vec2',
            name: 'Tiling',
            placeholder: [ 'U', 'V' ],
            link: assets,
            path: 'data.diffuseMapTiling'
        });
        var filterDiffuseTiling = function() {
            return (! fieldDiffuseMap.value && ! fieldDiffuseMap.class.contains('null')) || fieldTilingOffset.value;
        };
        tilingOffsetFields.push({
            element: fieldDiffuseTiling[0].parent,
            tiling: fieldDiffuseTiling,
            filter: filterDiffuseTiling
        });
        fieldDiffuseTiling[0].parent.hidden = filterDiffuseTiling();
        // reference
        editor.call('attributes:reference:asset:material:diffuseMapTiling:attach', fieldDiffuseTiling[0].parent.innerElement.firstChild.ui);


        // color
        var fieldDiffuseColor = editor.call('attributes:addField', {
            parent: panelDiffuse,
            name: 'Color',
            type: 'rgb',
            link: assets,
            path: 'data.diffuse'
        });
        // reference
        editor.call('attributes:reference:asset:material:diffuse:attach', fieldDiffuseColor.parent.innerElement.firstChild.ui);

        // tint
        var fieldDiffuseTint = editor.call('attributes:addField', {
            panel: fieldDiffuseColor.parent,
            type: 'checkbox',
            link: assets,
            path: 'data.diffuseMapTint'
        });
        // label
        var labelDiffuseTint = new ui.Label({ text: 'Tint' });
        labelDiffuseTint.style.verticalAlign = 'top';
        labelDiffuseTint.style.paddingRight = '12px';
        labelDiffuseTint.style.fontSize = '12px';
        labelDiffuseTint.style.lineHeight = '24px';
        fieldDiffuseColor.parent.append(labelDiffuseTint);
        // reference
        editor.call('attributes:reference:asset:material:diffuseMapTint:attach', labelDiffuseTint);



        // specular
        var panelSpecular = editor.call('attributes:addPanel', {
            foldable: true,
            folded: panelState['specular'],
            name: 'Specular'
        });
        panelSpecular.class.add('component');
        panelSpecular.on('fold', function() { panelState['specular'] = true; });
        panelSpecular.on('unfold', function() { panelState['specular'] = false; });
        // reference
        editor.call('attributes:reference:asset:material:specularOverview:attach', panelSpecular, panelSpecular.headerElement);

        // use metalness
        var fieldUseMetalness = editor.call('attributes:addField', {
            parent: panelSpecular,
            type: 'checkbox',
            name: 'Use Metalness',
            link: assets,
            path: 'data.useMetalness'
        });
        fieldUseMetalness.on('change', function(value) {
            panelSpecularWorkflow.hidden = value || fieldUseMetalness.class.contains('null');
            panelMetalness.hidden = ! value || fieldUseMetalness.class.contains('null');
        });
        // reference
        editor.call('attributes:reference:asset:material:useMetalness:attach', fieldUseMetalness.parent.innerElement.firstChild.ui);

        var panelMetalness = editor.call('attributes:addPanel');
        panelMetalness.hidden = ! fieldUseMetalness.value || fieldUseMetalness.class.contains('null');
        panelSpecular.append(panelMetalness);

        // metalness map
        var fieldMetalnessMap = editor.call('attributes:addField', {
            parent: panelMetalness,
            type: 'asset',
            kind: 'texture',
            name: 'Metalness',
            link: assets,
            path: 'data.metalnessMap'
        });
        fieldMetalnessMap.parent.class.add('channel');
        fieldMetalnessMap.on('change', function(value) {
            fieldMetalnessOffset[0].parent.hidden = filterMetalnessOffset();
            fieldMetalnessTiling[0].parent.hidden = filterMetalnessTiling();
        });
        // reference
        editor.call('attributes:reference:asset:material:metalnessMap:attach', fieldMetalnessMap._label);

        // map channel
        var fieldMetalnessMapChannel = editor.call('attributes:addField', {
            panel: fieldMetalnessMap.parent,
            type: 'string',
            enum: {
                '': '...',
                'r': 'R',
                'g': 'G',
                'b': 'B',
                'a': 'A',
            },
            link: assets,
            path: 'data.metalnessMapChannel'
        });
        fieldMetalnessMapChannel.element.parentNode.removeChild(fieldMetalnessMapChannel.element);
        fieldMetalnessMap.parent.innerElement.querySelector('.top > .ui-label').parentNode.appendChild(fieldMetalnessMapChannel.element);
        // reference
        editor.call('attributes:reference:asset:material:metalnessMapChannel:attach', fieldMetalnessMapChannel);


        // offset
        var fieldMetalnessOffset = editor.call('attributes:addField', {
            parent: panelMetalness,
            type: 'vec2',
            name: 'Offset',
            placeholder: [ 'U', 'V' ],
            link: assets,
            path: 'data.metalnessMapOffset'
        });
        var filterMetalnessOffset = function() {
            return (! fieldMetalnessMap.value && ! fieldMetalnessMap.class.contains('null')) || fieldTilingOffset.value;
        };
        tilingOffsetFields.push({
            element: fieldMetalnessOffset[0].parent,
            offset: fieldMetalnessOffset,
            filter: filterMetalnessOffset
        });
        fieldMetalnessOffset[0].parent.hidden = filterMetalnessOffset();
        // reference
        editor.call('attributes:reference:asset:material:metalnessMapOffset:attach', fieldMetalnessOffset[0].parent.innerElement.firstChild.ui);

        // tiling
        var fieldMetalnessTiling = editor.call('attributes:addField', {
            parent: panelMetalness,
            type: 'vec2',
            name: 'Tiling',
            placeholder: [ 'U', 'V' ],
            link: assets,
            path: 'data.metalnessMapTiling'
        });
        var filterMetalnessTiling = function() {
            return (! fieldMetalnessMap.value && ! fieldMetalnessMap.class.contains('null')) || fieldTilingOffset.value;
        };
        tilingOffsetFields.push({
            element: fieldMetalnessTiling[0].parent,
            tiling: fieldMetalnessTiling,
            filter: filterMetalnessTiling
        });
        fieldMetalnessTiling[0].parent.hidden = filterMetalnessTiling();
        // reference
        editor.call('attributes:reference:asset:material:metalnessMapTiling:attach', fieldMetalnessTiling[0].parent.innerElement.firstChild.ui);


        // metalness
        var fieldMetalness = editor.call('attributes:addField', {
            parent: panelMetalness,
            precision: 3,
            step: 0.05,
            min: 0,
            max: 1,
            type: 'number',
            name: 'Metalness',
            link: assets,
            path: 'data.metalness'
        });
        fieldMetalness.style.width = '32px';
        // reference
        editor.call('attributes:reference:asset:material:metalness:attach', fieldMetalness.parent.innerElement.firstChild.ui);

        // metalness slider
        var fieldMetalnessSlider = editor.call('attributes:addField', {
            panel: fieldMetalness.parent,
            precision: 3,
            step: 0.05,
            min: 0,
            max: 1,
            type: 'number',
            slider: true,
            link: assets,
            path: 'data.metalness'
        });
        fieldMetalnessSlider.flexGrow = 4;


        // specular
        var panelSpecularWorkflow = editor.call('attributes:addPanel');
        panelSpecularWorkflow.hidden = fieldUseMetalness.value || fieldUseMetalness.class.contains('null');
        panelSpecular.append(panelSpecularWorkflow);

        // specular map
        var fieldSpecularMap = editor.call('attributes:addField', {
            parent: panelSpecularWorkflow,
            type: 'asset',
            kind: 'texture',
            name: 'Specular',
            link: assets,
            path: 'data.specularMap'
        });
        fieldSpecularMap.parent.class.add('channel');
        fieldSpecularMap.on('change', function(value) {
            fieldSpecularOffset[0].parent.hidden = filterSpecularOffset();
            fieldSpecularTiling[0].parent.hidden = filterSpecularTiling();
        });
        // reference
        editor.call('attributes:reference:asset:material:specularMap:attach', fieldSpecularMap._label);

        // map channel
        var fieldSpecularMapChannel = editor.call('attributes:addField', {
            panel: fieldSpecularMap.parent,
            type: 'string',
            enum: {
                '': '...',
                'r': 'R',
                'g': 'G',
                'b': 'B',
                'a': 'A',
                'rgb': 'RGB'
            },
            link: assets,
            path: 'data.specularMapChannel'
        });
        fieldSpecularMapChannel.element.parentNode.removeChild(fieldSpecularMapChannel.element);
        fieldSpecularMap.parent.innerElement.querySelector('.top > .ui-label').parentNode.appendChild(fieldSpecularMapChannel.element);
        // reference
        editor.call('attributes:reference:asset:material:specularMapChannel:attach', fieldSpecularMapChannel);


        // offset
        var fieldSpecularOffset = editor.call('attributes:addField', {
            parent: panelSpecularWorkflow,
            type: 'vec2',
            name: 'Offset',
            placeholder: [ 'U', 'V' ],
            link: assets,
            path: 'data.specularMapOffset'
        });
        var filterSpecularOffset = function() {
            return (! fieldSpecularMap.value && ! fieldSpecularMap.class.contains('null')) || fieldTilingOffset.value;
        };
        tilingOffsetFields.push({
            element: fieldSpecularOffset[0].parent,
            offset: fieldSpecularOffset,
            filter: filterSpecularOffset
        });
        fieldSpecularOffset[0].parent.hidden = filterSpecularOffset();
        // reference
        editor.call('attributes:reference:asset:material:specularMapOffset:attach', fieldSpecularOffset[0].parent.innerElement.firstChild.ui);

        // tiling
        var fieldSpecularTiling = editor.call('attributes:addField', {
            parent: panelSpecularWorkflow,
            type: 'vec2',
            name: 'Tiling',
            placeholder: [ 'U', 'V' ],
            link: assets,
            path: 'data.specularMapTiling'
        });
        var filterSpecularTiling = function() {
            return (! fieldSpecularMap.value && ! fieldSpecularMap.class.contains('null')) || fieldTilingOffset.value;
        };
        tilingOffsetFields.push({
            element: fieldSpecularTiling[0].parent,
            tiling: fieldSpecularTiling,
            filter: filterSpecularTiling
        });
        fieldSpecularTiling[0].parent.hidden = filterSpecularTiling();
        // reference
        editor.call('attributes:reference:asset:material:specularMapTiling:attach', fieldSpecularTiling[0].parent.innerElement.firstChild.ui);


        // color
        var fieldSpecularColor = editor.call('attributes:addField', {
            parent: panelSpecularWorkflow,
            name: 'Color',
            type: 'rgb',
            link: assets,
            path: 'data.specular'
        });
        // reference
        editor.call('attributes:reference:asset:material:specular:attach', fieldSpecularColor.parent.innerElement.firstChild.ui);

        // tint
        var fieldSpecularTint = editor.call('attributes:addField', {
            panel: fieldSpecularColor.parent,
            type: 'checkbox',
            link: assets,
            path: 'data.specularMapTint'
        });
        // label
        var labelSpecularTint = new ui.Label({ text: 'Tint' });
        labelSpecularTint.style.verticalAlign = 'top';
        labelSpecularTint.style.paddingRight = '12px';
        labelSpecularTint.style.fontSize = '12px';
        labelSpecularTint.style.lineHeight = '24px';
        fieldSpecularColor.parent.append(labelSpecularTint);
        // reference
        editor.call('attributes:reference:asset:material:specularMapTint:attach', labelSpecularTint);


        // map (gloss)
        var fieldGlossMap = editor.call('attributes:addField', {
            parent: panelSpecular,
            type: 'asset',
            kind: 'texture',
            name: 'Glossiness',
            link: assets,
            path: 'data.glossMap'
        });
        fieldGlossMap.parent.class.add('channel');
        fieldGlossMap.on('change', function(value) {
            fieldGlossOffset[0].parent.hidden = filterGlossOffset();
            fieldGlossTiling[0].parent.hidden = filterGlossTiling();
        });
        // reference
        editor.call('attributes:reference:asset:material:glossMap:attach', fieldGlossMap._label);


        // map channel
        var fieldGlossMapChannel = editor.call('attributes:addField', {
            panel: fieldGlossMap.parent,
            type: 'string',
            enum: {
                '': '...',
                'r': 'R',
                'g': 'G',
                'b': 'B',
                'a': 'A'
            },
            link: assets,
            path: 'data.glossMapChannel'
        });
        fieldGlossMapChannel.element.parentNode.removeChild(fieldGlossMapChannel.element);
        fieldGlossMap.parent.innerElement.querySelector('.top > .ui-label').parentNode.appendChild(fieldGlossMapChannel.element);
        // reference
        editor.call('attributes:reference:asset:material:glossMapChannel:attach', fieldGlossMapChannel);


        // offset
        var fieldGlossOffset = editor.call('attributes:addField', {
            parent: panelSpecularWorkflow,
            type: 'vec2',
            name: 'Offset',
            placeholder: [ 'U', 'V' ],
            link: assets,
            path: 'data.glossMapOffset'
        });
        var filterGlossOffset = function() {
            return (! fieldGlossMap.value && ! fieldGlossMap.class.contains('null')) || fieldTilingOffset.value;
        };
        tilingOffsetFields.push({
            element: fieldGlossOffset[0].parent,
            offset: fieldGlossOffset,
            filter: filterGlossOffset
        });
        fieldGlossOffset[0].parent.hidden = filterGlossOffset();
        // reference
        editor.call('attributes:reference:asset:material:glossMapOffset:attach', fieldGlossOffset[0].parent.innerElement.firstChild.ui);

        // tiling
        var fieldGlossTiling = editor.call('attributes:addField', {
            parent: panelSpecularWorkflow,
            type: 'vec2',
            name: 'Tiling',
            placeholder: [ 'U', 'V' ],
            link: assets,
            path: 'data.glossMapTiling'
        });
        var filterGlossTiling = function() {
            return (! fieldGlossMap.value && ! fieldGlossMap.class.contains('null')) || fieldTilingOffset.value;
        };
        tilingOffsetFields.push({
            element: fieldGlossTiling[0].parent,
            tiling: fieldGlossTiling,
            filter: filterGlossTiling
        });
        fieldGlossTiling[0].parent.hidden = filterGlossTiling();
        // reference
        editor.call('attributes:reference:asset:material:glossMapTiling:attach', fieldGlossTiling[0].parent.innerElement.firstChild.ui);


        // shininess
        var fieldShininess = editor.call('attributes:addField', {
            parent: panelSpecular,
            type: 'number',
            precision: 2,
            step: 0.5,
            min: 0,
            max: 100,
            name: 'Glossiness',
            link: assets,
            path: 'data.shininess'
        });
        fieldShininess.style.width = '32px';
        // reference
        editor.call('attributes:reference:asset:material:shininess:attach', fieldShininess.parent.innerElement.firstChild.ui);

        // shininess slider
        var fieldShininessSlider = editor.call('attributes:addField', {
            panel: fieldShininess.parent,
            precision: 2,
            step: 0.5,
            min: 0,
            max: 100,
            type: 'number',
            slider: true,
            link: assets,
            path: 'data.shininess'
        });
        fieldShininessSlider.flexGrow = 4;


        // emissive
        var panelEmissive = editor.call('attributes:addPanel', {
            foldable: true,
            folded: panelState['emissive'],
            name: 'Emissive'
        });
        panelEmissive.class.add('component');
        panelEmissive.on('fold', function() { panelState['emissive'] = true; });
        panelEmissive.on('unfold', function() { panelState['emissive'] = false; });
        // reference
        editor.call('attributes:reference:asset:material:emissiveOverview:attach', panelEmissive, panelEmissive.headerElement);


        // map
        var fieldEmissiveMap = editor.call('attributes:addField', {
            parent: panelEmissive,
            type: 'asset',
            kind: 'texture',
            name: 'Emissive',
            link: assets,
            path: 'data.emissiveMap'
        });
        fieldEmissiveMap.parent.class.add('channel');
        fieldEmissiveMap.on('change', function(value) {
            fieldEmissiveOffset[0].parent.hidden = filterEmissiveOffset();
            fieldEmissiveTiling[0].parent.hidden = filterEmissiveTiling();
        });
        // reference
        editor.call('attributes:reference:asset:material:emissiveMap:attach', fieldEmissiveMap._label);


        // map channel
        var fieldEmissiveMapChannel = editor.call('attributes:addField', {
            panel: fieldEmissiveMap.parent,
            type: 'string',
            enum: {
                '': '...',
                'r': 'R',
                'g': 'G',
                'b': 'B',
                'a': 'A',
                'rgb': 'RGB'
            },
            link: assets,
            path: 'data.emissiveMapChannel'
        });
        fieldEmissiveMapChannel.element.parentNode.removeChild(fieldEmissiveMapChannel.element);
        fieldEmissiveMap.parent.innerElement.querySelector('.top > .ui-label').parentNode.appendChild(fieldEmissiveMapChannel.element);
        // reference
        editor.call('attributes:reference:asset:material:emissiveMapChannel:attach', fieldEmissiveMapChannel);


        // offset
        var fieldEmissiveOffset = editor.call('attributes:addField', {
            parent: panelEmissive,
            type: 'vec2',
            name: 'Offset',
            placeholder: [ 'U', 'V' ],
            link: assets,
            path: 'data.emissiveMapOffset'
        });
        var filterEmissiveOffset = function() {
            return (! fieldEmissiveMap.value && ! fieldEmissiveMap.class.contains('null')) || fieldTilingOffset.value;
        };
        tilingOffsetFields.push({
            element: fieldEmissiveOffset[0].parent,
            offset: fieldEmissiveOffset,
            filter: filterEmissiveOffset
        });
        fieldEmissiveOffset[0].parent.hidden = filterEmissiveOffset();
        // reference
        editor.call('attributes:reference:asset:material:emissiveMapOffset:attach', fieldEmissiveOffset[0].parent.innerElement.firstChild.ui);

        // tiling
        var fieldEmissiveTiling = editor.call('attributes:addField', {
            parent: panelEmissive,
            type: 'vec2',
            name: 'Tiling',
            placeholder: [ 'U', 'V' ],
            link: assets,
            path: 'data.emissiveMapTiling'
        });
        var filterEmissiveTiling = function() {
            return (! fieldEmissiveMap.value && ! fieldEmissiveMap.class.contains('null')) || fieldTilingOffset.value;
        };
        tilingOffsetFields.push({
            element: fieldEmissiveTiling[0].parent,
            tiling: fieldEmissiveTiling,
            filter: filterEmissiveTiling
        });
        fieldEmissiveTiling[0].parent.hidden = filterEmissiveTiling();
        // reference
        editor.call('attributes:reference:asset:material:emissiveMapTiling:attach', fieldEmissiveTiling[0].parent.innerElement.firstChild.ui);


        // color
        var fieldEmissiveColor = editor.call('attributes:addField', {
            parent: panelEmissive,
            name: 'Color',
            type: 'rgb',
            link: assets,
            path: 'data.emissive'
        });
        // reference
        editor.call('attributes:reference:asset:material:emissive:attach', fieldEmissiveColor.parent.innerElement.firstChild.ui);

        // tint
        var fieldEmissiveTint = editor.call('attributes:addField', {
            panel: fieldEmissiveColor.parent,
            type: 'checkbox',
            link: assets,
            path: 'data.emissiveMapTint'
        });
        // label
        var labelEmissiveTint = new ui.Label({ text: 'Tint' });
        labelEmissiveTint.style.verticalAlign = 'top';
        labelEmissiveTint.style.paddingRight = '12px';
        labelEmissiveTint.style.fontSize = '12px';
        labelEmissiveTint.style.lineHeight = '24px';
        fieldEmissiveColor.parent.append(labelEmissiveTint);
        // reference
        editor.call('attributes:reference:asset:material:emissiveMapTint:attach', labelEmissiveTint);



        // emissiveIntensity
        var fieldEmissiveIntensity = editor.call('attributes:addField', {
            parent: panelEmissive,
            name: 'Intensity',
            type: 'number',
            precision: 2,
            step: .1,
            min: 0,
            link: assets,
            path: 'data.emissiveIntensity'
        });
        fieldEmissiveIntensity.style.width = '32px';
        // reference
        editor.call('attributes:reference:asset:material:emissiveIntensity:attach', fieldEmissiveIntensity.parent.innerElement.firstChild.ui);

        // emissiveIntensity slider
        var fieldEmissiveIntensitySlider = editor.call('attributes:addField', {
            panel: fieldEmissiveIntensity.parent,
            precision: 2,
            step: .1,
            min: 0,
            max: 10,
            type: 'number',
            slider: true,
            link: assets,
            path: 'data.emissiveIntensity'
        });
        fieldEmissiveIntensitySlider.flexGrow = 4;


        // opacity
        var panelOpacity = editor.call('attributes:addPanel', {
            foldable: true,
            folded: panelState['opacity'],
            name: 'Opacity'
        });
        panelOpacity.class.add('component');
        panelOpacity.on('fold', function() { panelState['opacity'] = true; });
        panelOpacity.on('unfold', function() { panelState['opacity'] = false; });
        // reference
        editor.call('attributes:reference:asset:material:opacityOverview:attach', panelOpacity, panelOpacity.headerElement);


        // blend type
        var fieldBlendType = editor.call('attributes:addField', {
            parent: panelOpacity,
            type: 'number',
            enum: mapping.blendType.enum,
            name: 'Blend Type',
            link: assets,
            path: 'data.blendType'
        });
        fieldBlendType.on('change', function (value) {
            fieldOpacityMap.parent.hidden = ! value || [ 2, 4, 6 ].indexOf(value) === -1;
            fieldOpacityIntensity.parent.hidden = fieldOpacityMap.parent.hidden;
            fieldOpacityOffset[0].parent.hidden = filterOpacityOffset();
            fieldOpacityTiling[0].parent.hidden = filterOpacityTiling();
        });
        // reference
        editor.call('attributes:reference:asset:material:blendType:attach', fieldBlendType.parent.innerElement.firstChild.ui);

        // map
        var fieldOpacityMap = editor.call('attributes:addField', {
            parent: panelOpacity,
            type: 'asset',
            kind: 'texture',
            name: 'Opacity',
            link: assets,
            path: 'data.opacityMap'
        });
        fieldOpacityMap.parent.class.add('channel');
        fieldOpacityMap.parent.hidden = ! fieldBlendType.value || [ 2, 4, 6 ].indexOf(fieldBlendType.value) === -1;
        fieldOpacityMap.on('change', function(value) {
            fieldOpacityOffset[0].parent.hidden = filterOpacityOffset();
            fieldOpacityTiling[0].parent.hidden = filterOpacityTiling();
        });
        // reference
        editor.call('attributes:reference:asset:material:opacityMap:attach', fieldOpacityMap._label);


        // map channel
        var fieldOpacityMapChannel = editor.call('attributes:addField', {
            panel: fieldOpacityMap.parent,
            type: 'string',
            enum: {
                '': '...',
                'r': 'R',
                'g': 'G',
                'b': 'B',
                'a': 'A',
                'rgb': 'RGB'
            },
            link: assets,
            path: 'data.opacityMapChannel'
        });
        fieldOpacityMapChannel.element.parentNode.removeChild(fieldOpacityMapChannel.element);
        fieldOpacityMap.parent.innerElement.querySelector('.top > .ui-label').parentNode.appendChild(fieldOpacityMapChannel.element);
        // reference
        editor.call('attributes:reference:asset:material:opacityMapChannel:attach', fieldOpacityMapChannel);


        // offset
        var fieldOpacityOffset = editor.call('attributes:addField', {
            parent: panelOpacity,
            type: 'vec2',
            name: 'Offset',
            placeholder: [ 'U', 'V' ],
            link: assets,
            path: 'data.opacityMapOffset'
        });
        var filterOpacityOffset = function() {
            return fieldOpacityMap.parent.hidden || (! fieldOpacityMap.value && ! fieldOpacityMap.class.contains('null')) || fieldTilingOffset.value;
        };
        tilingOffsetFields.push({
            element: fieldOpacityOffset[0].parent,
            offset: fieldOpacityOffset,
            filter: filterOpacityOffset
        });
        fieldOpacityOffset[0].parent.hidden = filterOpacityOffset();
        // reference
        editor.call('attributes:reference:asset:material:opacityMapOffset:attach', fieldOpacityOffset[0].parent.innerElement.firstChild.ui);

        // tiling
        var fieldOpacityTiling = editor.call('attributes:addField', {
            parent: panelOpacity,
            type: 'vec2',
            name: 'Tiling',
            placeholder: [ 'U', 'V' ],
            link: assets,
            path: 'data.opacityMapTiling'
        });
        var filterOpacityTiling = function() {
            return fieldOpacityMap.parent.hidden || (! fieldOpacityMap.value && ! fieldOpacityMap.class.contains('null')) || fieldTilingOffset.value;
        };
        tilingOffsetFields.push({
            element: fieldOpacityTiling[0].parent,
            tiling: fieldOpacityTiling,
            filter: filterOpacityTiling
        });
        fieldOpacityTiling[0].parent.hidden = filterOpacityTiling();
        // reference
        editor.call('attributes:reference:asset:material:opacityMapTiling:attach', fieldOpacityTiling[0].parent.innerElement.firstChild.ui);


        // intensity
        var fieldOpacityIntensity = editor.call('attributes:addField', {
            parent: panelOpacity,
            name: 'Intensity',
            type: 'number',
            precision: 3,
            step: .05,
            min: 0,
            max: 1,
            link: assets,
            path: 'data.opacity'
        });
        fieldOpacityIntensity.parent.hidden = fieldOpacityMap.parent.hidden;
        fieldOpacityIntensity.style.width = '32px';
        fieldOpacityIntensity.flexGrow = 1;
        // reference
        editor.call('attributes:reference:asset:material:opacity:attach', fieldOpacityIntensity.parent.innerElement.firstChild.ui);

        // intensity slider
        var fieldOpacityIntensitySlider = editor.call('attributes:addField', {
            panel: fieldOpacityIntensity.parent,
            precision: 3,
            step: .05,
            min: 0,
            max: 1,
            type: 'number',
            slider: true,
            link: assets,
            path: 'data.opacity'
        });
        fieldOpacityIntensitySlider.flexGrow = 4;


        // normals
        var panelNormal = editor.call('attributes:addPanel', {
            foldable: true,
            folded: panelState['normals'],
            name: 'Normals'
        });
        panelNormal.class.add('component');
        panelNormal.on('fold', function() { panelState['normals'] = true; });
        panelNormal.on('unfold', function() { panelState['normals'] = false; });
        // reference
        editor.call('attributes:reference:asset:material:normalOverview:attach', panelNormal, panelNormal.headerElement);

        // map (normals)
        var fieldNormalMap = editor.call('attributes:addField', {
            parent: panelNormal,
            type: 'asset',
            kind: 'texture',
            name: 'Normals',
            link: assets,
            path: 'data.normalMap'
        });
        fieldNormalMap.on('change', function(value) {
            fieldNormalsOffset[0].parent.hidden = filterNormalOffset();
            fieldNormalsTiling[0].parent.hidden = filterNormalTiling();
            fieldBumpiness.parent.hidden = ! value && ! this.class.contains('null');
        });
        // reference
        editor.call('attributes:reference:asset:material:normalMap:attach', fieldNormalMap._label);


        // offset
        var fieldNormalsOffset = editor.call('attributes:addField', {
            parent: panelNormal,
            type: 'vec2',
            name: 'Offset',
            placeholder: [ 'U', 'V' ],
            link: assets,
            path: 'data.normalMapOffset'
        });
        var filterNormalOffset = function() {
            return (! fieldNormalMap.value && ! fieldNormalMap.class.contains('null')) || fieldTilingOffset.value;
        };
        tilingOffsetFields.push({
            element: fieldNormalsOffset[0].parent,
            offset: fieldNormalsOffset,
            filter: filterNormalOffset
        });
        fieldNormalsOffset[0].parent.hidden = filterNormalOffset();
        // reference
        editor.call('attributes:reference:asset:material:normalMapOffset:attach', fieldNormalsOffset[0].parent.innerElement.firstChild.ui);

        // tiling
        var fieldNormalsTiling = editor.call('attributes:addField', {
            parent: panelNormal,
            type: 'vec2',
            name: 'Tiling',
            placeholder: [ 'U', 'V' ],
            link: assets,
            path: 'data.normalMapTiling'
        });
        var filterNormalTiling = function() {
            return (! fieldNormalMap.value && ! fieldNormalMap.class.contains('null')) || fieldTilingOffset.value;
        };
        tilingOffsetFields.push({
            element: fieldNormalsTiling[0].parent,
            tiling: fieldNormalsTiling,
            filter: filterNormalTiling
        });
        fieldNormalsTiling[0].parent.hidden = filterNormalTiling();
        // reference
        editor.call('attributes:reference:asset:material:normalMapTiling:attach', fieldNormalsTiling[0].parent.innerElement.firstChild.ui);


        // bumpiness
        var fieldBumpiness = editor.call('attributes:addField', {
            parent: panelNormal,
            name: 'Bumpiness',
            type: 'number',
            precision: 3,
            step: .05,
            min: 0,
            max: 2,
            link: assets,
            path: 'data.bumpMapFactor'
        });
        fieldBumpiness.parent.hidden = ! fieldNormalMap.value && ! fieldNormalMap.class.contains('null');
        fieldBumpiness.style.width = '32px';
        fieldBumpiness.flexGrow = 1;
        // reference
        editor.call('attributes:reference:asset:material:bumpiness:attach', fieldBumpiness.parent.innerElement.firstChild.ui);

        // bumpiness slider
        var fieldBumpinessSlider = editor.call('attributes:addField', {
            panel: fieldBumpiness.parent,
            precision: 3,
            step: .05,
            min: 0,
            max: 2,
            type: 'number',
            slider: true,
            link: assets,
            path: 'data.bumpMapFactor'
        });
        fieldBumpinessSlider.flexGrow = 4;


        // parallax
        var panelParallax = editor.call('attributes:addPanel', {
            foldable: true,
            folded: panelState['height'],
            name: 'Parallax'
        });
        panelParallax.class.add('component');
        panelParallax.on('fold', function() { panelState['height'] = true; });
        panelParallax.on('unfold', function() { panelState['height'] = false; });
        // reference
        editor.call('attributes:reference:asset:material:parallaxOverview:attach', panelParallax, panelParallax.headerElement);

        // height map
        var fieldHeightMap = editor.call('attributes:addField', {
            parent: panelParallax,
            type: 'asset',
            kind: 'texture',
            name: 'Heightmap',
            link: assets,
            path: 'data.heightMap'
        });
        fieldHeightMap.parent.class.add('channel');
        fieldHeightMap.on('change', function(value) {
            fieldHeightMapOffset[0].parent.hidden = filterHeightMapOffset();
            fieldHeightMapTiling[0].parent.hidden = filterHeightMapTiling();
            fieldHeightMapFactor.parent.hidden = ! value;
        });
        // reference
        editor.call('attributes:reference:asset:material:heightMap:attach', fieldHeightMap._label);


        // map channel
        var fieldHeightMapChannel = editor.call('attributes:addField', {
            panel: fieldHeightMap.parent,
            type: 'string',
            enum: {
                '': '...',
                'r': 'R',
                'g': 'G',
                'b': 'B',
                'a': 'A'
            },
            link: assets,
            path: 'data.heightMapChannel'
        });
        fieldHeightMapChannel.element.parentNode.removeChild(fieldHeightMapChannel.element);
        fieldHeightMap.parent.innerElement.querySelector('.top > .ui-label').parentNode.appendChild(fieldHeightMapChannel.element);
        // reference
        editor.call('attributes:reference:asset:material:heightMapChannel:attach', fieldHeightMapChannel);


        // offset
        var fieldHeightMapOffset = editor.call('attributes:addField', {
            parent: panelParallax,
            type: 'vec2',
            name: 'Offset',
            placeholder: [ 'U', 'V' ],
            link: assets,
            path: 'data.heightMapOffset'
        });
        var filterHeightMapOffset = function() {
            return fieldHeightMap.parent.hidden || (! fieldHeightMap.value && ! fieldHeightMap.class.contains('null')) || fieldTilingOffset.value;
        };
        tilingOffsetFields.push({
            element: fieldHeightMapOffset[0].parent,
            offset: fieldHeightMapOffset,
            filter: filterHeightMapOffset
        });
        fieldHeightMapOffset[0].parent.hidden = filterHeightMapOffset();
        // reference
        editor.call('attributes:reference:asset:material:heightMapOffset:attach', fieldHeightMapOffset[0].parent.innerElement.firstChild.ui);

        // tiling
        var fieldHeightMapTiling = editor.call('attributes:addField', {
            parent: panelParallax,
            type: 'vec2',
            name: 'Tiling',
            placeholder: [ 'U', 'V' ],
            link: assets,
            path: 'data.heightMapTiling'
        });
        var filterHeightMapTiling = function() {
            return fieldHeightMap.parent.hidden || (! fieldHeightMap.value && ! fieldHeightMap.class.contains('null')) || fieldTilingOffset.value;
        };
        tilingOffsetFields.push({
            element: fieldHeightMapTiling[0].parent,
            tiling: fieldHeightMapTiling,
            filter: filterHeightMapTiling
        });
        fieldHeightMapTiling[0].parent.hidden = filterHeightMapTiling();
        // reference
        editor.call('attributes:reference:asset:material:heightMapTiling:attach', fieldHeightMapTiling[0].parent.innerElement.firstChild.ui);


        // heightMapFactor
        var fieldHeightMapFactor = editor.call('attributes:addField', {
            parent: panelParallax,
            name: 'Strength',
            type: 'number',
            precision: 3,
            step: .05,
            min: 0,
            max: 2,
            link: assets,
            path: 'data.heightMapFactor'
        });
        fieldHeightMapFactor.parent.hidden = fieldHeightMap.parent.hidden;
        fieldHeightMapFactor.style.width = '32px';
        fieldHeightMapFactor.flexGrow = 1;
        // reference
        editor.call('attributes:reference:asset:material:bumpiness:attach', fieldHeightMapFactor.parent.innerElement.firstChild.ui);

        // heightMapFactor slider
        var fieldHeightMapFactorSlider = editor.call('attributes:addField', {
            panel: fieldHeightMapFactor.parent,
            precision: 3,
            step: .05,
            min: 0,
            max: 2,
            type: 'number',
            slider: true,
            link: assets,
            path: 'data.heightMapFactor'
        });
        fieldHeightMapFactorSlider.flexGrow = 4;


        // reflection
        var panelReflection = editor.call('attributes:addPanel', {
            foldable: true,
            folded: panelState['environment'],
            name: 'Environment'
        });
        panelReflection.class.add('component');
        panelReflection.on('fold', function() { panelState['environment'] = true; });
        panelReflection.on('unfold', function() { panelState['environment'] = false; });
        // reference
        editor.call('attributes:reference:asset:material:environmentOverview:attach', panelReflection, panelReflection.headerElement);
        // filter
        var filterReflectionMaps = function() {
            fieldReflectionCubeMap.parent.hidden = ! fieldReflectionCubeMap.value && ! fieldReflectionCubeMap.class.contains('null') && (fieldReflectionSphere.value || fieldReflectionSphere.class.contains('null'));
            fieldReflectionSphere.parent.hidden = ! fieldReflectionSphere.value && ! fieldReflectionSphere.class.contains('null') && (fieldReflectionCubeMap.value || fieldReflectionCubeMap.class.contains('null'));
        };
        // spheremap
        var fieldReflectionSphere = editor.call('attributes:addField', {
            parent: panelReflection,
            type: 'asset',
            kind: 'texture',
            name: 'Sphere Map',
            link: assets,
            path: 'data.sphereMap'
        });
        fieldReflectionSphere.on('change', filterReflectionMaps);
        // reference
        editor.call('attributes:reference:asset:material:sphereMap:attach', fieldReflectionSphere._label);

        // cubemap
        var fieldReflectionCubeMap = editor.call('attributes:addField', {
            parent: panelReflection,
            type: 'asset',
            kind: 'cubemap',
            name: 'Cube Map',
            link: assets,
            path: 'data.cubeMap'
        });
        fieldReflectionCubeMap.on('change', filterReflectionMaps);
        // reference
        editor.call('attributes:reference:asset:material:cubeMap:attach', fieldReflectionCubeMap._label);

        // reflectivity
        var fieldReflectionStrength = editor.call('attributes:addField', {
            parent: panelReflection,
            type: 'number',
            precision: 3,
            step: 0.01,
            min: 0,
            max: 1,
            name: 'Reflectivity',
            link: assets,
            path: 'data.reflectivity'
        });
        fieldReflectionStrength.style.width = '32px';
        // reference
        editor.call('attributes:reference:asset:material:reflectivity:attach', fieldReflectionStrength.parent.innerElement.firstChild.ui);

        // reflectivity slider
        var fieldReflectionStrengthSlider = editor.call('attributes:addField', {
            panel: fieldReflectionStrength.parent,
            precision: 3,
            step: .01,
            min: 0,
            max: 1,
            type: 'number',
            slider: true,
            link: assets,
            path: 'data.reflectivity'
        });
        fieldReflectionStrengthSlider.flexGrow = 4;


        // refraction
        var fieldRefraction = editor.call('attributes:addField', {
            parent: panelReflection,
            type: 'number',
            precision: 3,
            step: 0.01,
            min: 0,
            max: 1,
            name: 'Refraction',
            link: assets,
            path: 'data.refraction'
        });
        fieldRefraction.style.width = '32px';
        // reference
        editor.call('attributes:reference:asset:material:refraction:attach', fieldRefraction.parent.innerElement.firstChild.ui);

        // reflectivity slider
        var fieldRefractionSlider = editor.call('attributes:addField', {
            panel: fieldRefraction.parent,
            precision: 3,
            step: .01,
            min: 0,
            max: 1,
            type: 'number',
            slider: true,
            link: assets,
            path: 'data.refraction'
        });
        fieldRefractionSlider.flexGrow = 4;


        // refractionIndex
        var fieldRefractionIndex = editor.call('attributes:addField', {
            parent: panelReflection,
            type: 'number',
            precision: 3,
            step: 0.01,
            min: 0,
            max: 1,
            name: 'Index of Refraction',
            link: assets,
            path: 'data.refractionIndex'
        });
        fieldRefractionIndex.style.width = '32px';
        // reference
        editor.call('attributes:reference:asset:material:refractionIndex:attach', fieldRefractionIndex.parent.innerElement.firstChild.ui);

        // reflectivity slider
        var fieldRefractionIndexSlider = editor.call('attributes:addField', {
            panel: fieldRefractionIndex.parent,
            precision: 3,
            step: .01,
            min: 0,
            max: 1,
            type: 'number',
            slider: true,
            link: assets,
            path: 'data.refractionIndex'
        });
        fieldRefractionIndexSlider.flexGrow = 4;

        filterReflectionMaps();


        // lightmap
        var panelLightMap = editor.call('attributes:addPanel', {
            foldable: true,
            folded: panelState['light'],
            name: 'LightMap'
        });
        panelLightMap.class.add('component');
        panelLightMap.on('fold', function() { panelState['light'] = true; });
        panelLightMap.on('unfold', function() { panelState['light'] = false; });
        // reference
        editor.call('attributes:reference:asset:material:lightMapOverview:attach', panelLightMap, panelLightMap.headerElement);

        // map
        var fieldLightMap = editor.call('attributes:addField', {
            parent: panelLightMap,
            type: 'asset',
            kind: 'texture',
            name: 'Lightmap',
            link: assets,
            path: 'data.lightMap'
        });
        fieldLightMap.parent.class.add('channel');
        fieldLightMap.on('change', function() {
            fieldLightMapOffset[0].parent.hidden = filterLightMapOffset();
            fieldLightMapTiling[0].parent.hidden = filterLightMapTiling();
        });
        // reference
        editor.call('attributes:reference:asset:material:lightMap:attach', fieldLightMap._label);

        // map channel
        var fieldLightMapChannel = editor.call('attributes:addField', {
            panel: fieldLightMap.parent,
            type: 'string',
            enum: {
                '': '...',
                'r': 'R',
                'g': 'G',
                'b': 'B',
                'a': 'A',
                'rgb': 'RGB'
            },
            link: assets,
            path: 'data.lightMapChannel'
        });
        fieldLightMapChannel.element.parentNode.removeChild(fieldLightMapChannel.element);
        fieldLightMap.parent.innerElement.querySelector('.top > .ui-label').parentNode.appendChild(fieldLightMapChannel.element);
        // reference
        editor.call('attributes:reference:asset:material:lightMapChannel:attach', fieldLightMapChannel);


        // offset
        var fieldLightMapOffset = editor.call('attributes:addField', {
            parent: panelLightMap,
            type: 'vec2',
            name: 'Offset',
            placeholder: [ 'U', 'V' ],
            link: assets,
            path: 'data.lightMapOffset'
        });
        var filterLightMapOffset = function() {
            return fieldHeightMap.parent.hidden || (! fieldHeightMap.value && ! fieldHeightMap.class.contains('null')) || fieldTilingOffset.value;
        };
        tilingOffsetFields.push({
            element: fieldLightMapOffset[0].parent,
            offset: fieldLightMapOffset,
            filter: filterLightMapOffset
        });
        fieldLightMapOffset[0].parent.hidden = filterLightMapOffset();
        // reference
        editor.call('attributes:reference:asset:material:lightMapOffset:attach', fieldLightMapOffset[0].parent.innerElement.firstChild.ui);

        // tiling
        var fieldLightMapTiling = editor.call('attributes:addField', {
            parent: panelLightMap,
            type: 'vec2',
            name: 'Tiling',
            placeholder: [ 'U', 'V' ],
            link: assets,
            path: 'data.lightMapTiling'
        });
        var filterLightMapTiling = function() {
            return fieldHeightMap.parent.hidden || (! fieldHeightMap.value && ! fieldHeightMap.class.contains('null')) || fieldTilingOffset.value;
        };
        tilingOffsetFields.push({
            element: fieldLightMapTiling[0].parent,
            tiling: fieldLightMapTiling,
            filter: filterLightMapTiling
        });
        fieldLightMapTiling[0].parent.hidden = filterLightMapTiling();
        // reference
        editor.call('attributes:reference:asset:material:lightMapTiling:attach', fieldLightMapTiling[0].parent.innerElement.firstChild.ui);



        // render states
        var panelRenderStates = editor.call('attributes:addPanel', {
            foldable: true,
            folded: panelState['states'],
            name: 'Other'
        });
        panelRenderStates.class.add('component');
        panelRenderStates.on('fold', function() { panelState['states'] = true; });
        panelRenderStates.on('unfold', function() { panelState['states'] = false; });
        // reference
        editor.call('attributes:reference:asset:material:other:attach', panelRenderStates, panelRenderStates.headerElement);


        // depth
        var fieldDepthTest = editor.call('attributes:addField', {
            parent: panelRenderStates,
            type: 'checkbox',
            name: 'Depth',
            link: assets,
            path: 'data.depthTest'
        });
        // label
        var label = new ui.Label({ text: 'Test' });
        label.style.verticalAlign = 'top';
        label.style.paddingRight = '12px';
        label.style.fontSize = '12px';
        label.style.lineHeight = '24px';
        fieldDepthTest.parent.append(label);
        // reference
        editor.call('attributes:reference:asset:material:depthTest:attach', label);


        // depthWrite
        var fieldDepthWrite = editor.call('attributes:addField', {
            panel: fieldDepthTest.parent,
            type: 'checkbox',
            link: assets,
            path: 'data.depthWrite'
        })
        // label
        var label = new ui.Label({ text: 'Write' });
        label.style.verticalAlign = 'top';
        label.style.fontSize = '12px';
        label.style.lineHeight = '24px';
        fieldDepthTest.parent.append(label);
        // reference
        editor.call('attributes:reference:asset:material:depthWrite:attach', label);


        // culling
        var fieldCull = editor.call('attributes:addField', {
            parent: panelRenderStates,
            type: 'number',
            enum: mapping.cull.enum,
            name: 'Cull Mode',
            link: assets,
            path: 'data.cull'
        });
        // reference
        editor.call('attributes:reference:asset:material:cull:attach', fieldCull.parent.innerElement.firstChild.ui);

        // shadowSampleType
        var fieldShadowSampleType = editor.call('attributes:addField', {
            parent: panelRenderStates,
            type: 'number',
            enum: mapping.shadowSampleType.enum,
            name: 'Shadow Sample Type',
            link: assets,
            path: 'data.shadowSampleType'
        });
        // reference
        editor.call('attributes:reference:asset:material:shadowSampleType:attach', fieldShadowSampleType.parent.innerElement.firstChild.ui);
    });
});
