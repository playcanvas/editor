editor.once('load', function() {
    'use strict';

    editor.on('attributes:inspect[entity]', function(entities) {
        var panelComponents = editor.call('attributes:entity.panelComponents');
        if (! panelComponents)
            return;

        var events = [ ];

        var projectSettings = editor.call('settings:project');

        var panel = editor.call('attributes:entity:addComponentPanel', {
            title: 'Element',
            name: 'element',
            entities: entities
        });

        var fieldType = editor.call('attributes:addField', {
            parent: panel,
            name: 'Type',
            type: 'string',
            enum: [
                {v: '', t: '...'},
                {v: 'text', t: 'Text'},
                {v: 'image', t: 'Image'},
                {v: 'group', t: 'Group'}
            ],
            link: entities,
            path: 'components.element.type'
        });

        // reference
        editor.call('attributes:reference:attach', 'element:type', fieldType.parent.innerElement.firstChild.ui);

        var presets = {
            '0,1,0,1/0,1': 'Top Left',
            '0.5,1,0.5,1/0.5,1': 'Top',
            '1,1,1,1/1,1': 'Top Right',
            '0,0.5,0,0.5/0,0.5': 'Left',
            '0.5,0.5,0.5,0.5/0.5,0.5': 'Center',
            '1,0.5,1,0.5/1,0.5': 'Right',
            '0,0,0,0/0,0': 'Bottom Left',
            '0.5,0,0.5,0/0.5,0': 'Bottom',
            '1,0,1,0/1,0': 'Bottom Right',
        };

        var presetsEnum = [];
        for (var key in presets) {
            presetsEnum.push({v: key, t: presets[key]});
        }

        presetsEnum.push({v: 'custom', t: 'Custom'});

        var fieldPreset = editor.call('attributes:addField', {
            parent: panel,
            name: 'Preset',
            type: 'string',
            className: 'field-path-components-element-preset',
            enum: presetsEnum
        });

        editor.call('attributes:reference:attach', 'element:preset', fieldPreset.parent.innerElement.firstChild.ui);

        var fieldAnchor = editor.call('attributes:addField', {
            parent: panel,
            placeholder: ['←', '↓', '→', '↑'],
            name: 'Anchor',
            type: 'vec4',
            precision: 2,
            step: 0.1,
            min: 0,
            max: 1,
            link: entities,
            path: 'components.element.anchor'
        });

        var onAnchorChange = function () {
            toggleSize();
            toggleMargin();
        };


        fieldAnchor.forEach(function (field, index) {
            field.on('change', onAnchorChange);

            // var changing = false;

            // var refreshValue = function () {
            //     var value = null;
            //     for (var i = 0, len = entities.length; i < len; i++) {
            //         var anchor = entities[i].get('components.element.anchor.' + index);
            //         if (value === null) {
            //             value = anchor;
            //         } else if (value !== anchor) {
            //             value = null;
            //             break;
            //         }
            //     }

            //     changing = true;
            //     field.value = value;
            //     changing = false;
            //     field.proxy = value !== null ? null : '...';
            // };

            // refreshValue();

            // field.on('change', function (value) {
            //     if (changing) return;

            //     changing = true;

            //     var prev = {};

            //     for (var i = 0, len = entities.length; i < len; i++) {
            //         if (entities[i].has('components.element')) {
            //             var prevData = {
            //                 anchor: entities[i].get('components.element.anchor.' + index)
            //             };

            //             prev[entities[i].get('resource_id')] = prevData;

            //             var history = entities[i].history.enabled;
            //             entities[i].history.enabled = false;
            //             entities[i].set('components.element.anchor.' + index, value);
            //             entities[i].history.enabled = history;
            //         }
            //     }

            //     editor.call('history:add', {
            //         name: 'components.element.anchor.' + index,
            //         undo: function () {
            //             for (var i = 0, len = entities.length; i < len; i++) {
            //                 var prevData = prev[entities[i].get('resource_id')];
            //                 if (! prevData) continue;

            //                 var obj = editor.call('entities:get', entities[i].get('resource_id'));
            //                 if (! obj) return;
            //                 var history = obj.history.enabled;
            //                 obj.history.enabled = false;
            //                 obj.set('components.element.anchor.' + index, prevData.anchor);
            //                 obj.history.enabled = history;
            //             }
            //         },
            //         redo: function () {
            //             for (var i = 0, len = entities.length; i < len; i++) {
            //                 var obj = editor.call('entities:get', entities[i].get('resource_id'));
            //                 if (! obj) return;

            //                 var history = obj.history.enabled;
            //                 obj.history.enabled = false;
            //                 obj.set('components.element.anchor.' + index, value);
            //                 obj.history.enabled = history;
            //             }

            //         }
            //     });

            //     changing = false;

            // });

            // for (var i = 0, len = entities.length; i < len; i++) {
            //     events.push(entities[i].on('components.element.anchor:set', refreshValue));
            //     events.push(entities[i].on('components.element.anchor.0:set', refreshValue));
            //     events.push(entities[i].on('components.element.anchor.1:set', refreshValue));
            //     events.push(entities[i].on('components.element.anchor.2:set', refreshValue));
            //     events.push(entities[i].on('components.element.anchor.3:set', refreshValue));
            // }
        });

        // reference
        editor.call('attributes:reference:attach', 'element:anchor', fieldAnchor[0].parent.innerElement.firstChild.ui);

        var isUnderControlOfLayoutGroup = function () {
            for (var i = 0, len = entities.length; i < len; i++) {
                var entity = entities[i];

                if (editor.call('entities:layout:isUnderControlOfLayoutGroup', entity)) {
                    return true;
                }
            }

            return false;
        };

        var toggleAnchorAndPresets = function () {
            var disabled = isUnderControlOfLayoutGroup();

            for (var i = 0; i < 4; i++) {
                fieldAnchor[i].disabled = disabled;
            }

            fieldPreset.disabled = disabled;
        };

        toggleAnchorAndPresets();

        entities.forEach(function(entity) {
            events.push(entity.on('parent:set', toggleAnchorAndPresets));
        });

        var fieldPivot = editor.call('attributes:addField', {
            parent: panel,
            placeholder: ['↔', '↕'],
            name: 'Pivot',
            type: 'vec2',
            precision: 2,
            step: 0.1,
            min: 0,
            max: 1,
            link: entities,
            path: 'components.element.pivot'
        });

        // reference
        editor.call('attributes:reference:attach', 'element:pivot', fieldPivot[0].parent.innerElement.firstChild.ui);

        // auto size
        var panelAutoSize = editor.call('attributes:addField', {
            parent: panel,
            name: 'Auto-Size'
        });
        var label = panelAutoSize;
        panelAutoSize = panelAutoSize.parent;
        label.destroy();

        panelAutoSize.hidden = fieldType.value !== 'text';

        // autoWidth
        var fieldAutoWidth = editor.call('attributes:addField', {
            panel: panelAutoSize,
            type: 'checkbox',
            link: entities,
            path: 'components.element.autoWidth'
        });
        // label
        label = new ui.Label({ text: 'Width' });
        label.class.add('label-infield');
        label.style.paddingRight = '12px';
        panelAutoSize.append(label);
        // reference
        editor.call('attributes:reference:attach', 'element:autoWidth', label);

        fieldAutoWidth.on('change', function (value) {
            toggleSize();
            toggleMargin();
        });

        // autoHeight
        var fieldAutoHeight = editor.call('attributes:addField', {
            panel: panelAutoSize,
            type: 'checkbox',
            link: entities,
            path: 'components.element.autoHeight'
        });
        // label
        label = new ui.Label({ text: 'Height' });
        label.class.add('label-infield');
        label.style.paddingRight = '12px';
        panelAutoSize.append(label);

        // reference
        editor.call('attributes:reference:attach', 'element:autoHeight', label);

        fieldAutoHeight.on('change', function (value) {
            toggleSize();
            toggleMargin();
        });


        var setPresetValue = function () {
            var val = fieldAnchor.map(function (f) {return f.value}).join(',') + '/' + fieldPivot.map(function (f) {return f.value}).join(',');
            if (! presets[val])
                val = 'custom';

            fieldPreset.value = val;
        };

        setPresetValue();

        var changingPreset = false;

        for (var i = 0; i < 4; i++) {
            events.push(fieldAnchor[i].on('change', function (value) {
                if (changingPreset) return;
                changingPreset = true;
                setPresetValue();
                changingPreset = false;
            }));
        }

        for (var i = 0; i < 2; i++) {
            events.push(fieldPivot[i].on('change', function (value) {
                if (changingPreset) return;
                changingPreset = true;
                setPresetValue();
                changingPreset = false;
            }));
        }

        events.push(fieldPreset.on('change', function (value) {
            if (! value || value === 'custom' || changingPreset) return;

            changingPreset = true;
            var fields = value.split('/');
            var anchor = fields[0].split(',').map(function (v){ return parseFloat(v);} );
            var pivot = fields[1].split(',').map(function (v){ return parseFloat(v);} );

            var prev = {};

            var prevAnchors = [];
            var prevPivots = [];
            var prevPositions = [];

            for (var i = 0; i < entities.length; i++) {
                var history = entities[i].history.enabled;
                entities[i].history.enabled = false;
                var width = entities[i].get('components.element.width');
                var height = entities[i].get('components.element.height');
                prev[entities[i].get('resource_id')] = {
                    anchor: entities[i].get('components.element.anchor'),
                    pivot: entities[i].get('components.element.pivot'),
                    width: width,
                    height: height
                };
                entities[i].set('components.element.anchor', anchor);
                entities[i].set('components.element.pivot', pivot);
                if (entities[i].entity) {
                    entities[i].entity.element.width = width;
                    entities[i].entity.element.height = height;
                }
                entities[i].history.enabled = history;
            }

            editor.call('history:add', {
                name: 'entities.components.element.preset',
                undo: function() {
                    for(var i = 0; i < entities.length; i++) {
                        var entity = entities[i];
                        var history = entity.history.enabled;
                        entity.history.enabled = false;
                        var prevRecord = prev[entity.get('resource_id')];
                        entity.set('components.element.anchor', prevRecord.anchor);
                        entity.set('components.element.pivot', prevRecord.pivot);
                        if (entity.entity) {
                            entity.entity.element.width = prevRecord.width;
                            entity.entity.element.height = prevRecord.height;
                        }
                        entity.history.enabled = history;
                    }
                },
                redo: function() {
                    for(var i = 0; i < entities.length; i++) {
                        var entity = entities[i];
                        var history = entity.history.enabled;
                        entity.history.enabled = false;
                        entity.set('components.element.anchor', anchor);
                        entity.set('components.element.pivot', pivot);

                        var prevRecord = prev[entity.get('resource_id')];

                        if (entity.entity) {
                            entity.entity.element.width = prevRecord.width;
                            entity.entity.element.height = prevRecord.height;
                        }

                        entity.history.enabled = history;
                    }
                }
            });


            changingPreset = false;
        }));

        var hasSplitAnchors = function (horizontal) {
            for (var i = 0, len = entities.length; i < len; i++) {
                var e = entities[i];
                var anchor = e.get('components.element.anchor');
                if (! anchor) continue;
                if (horizontal) {
                    if (Math.abs(anchor[0] - anchor[2]) > 0.001) {
                        return true;
                    }
                } else {
                    if (Math.abs(anchor[1] - anchor[3]) > 0.001) {
                        return true;
                    }
                }
            }

            return false;
        };

        var fieldWidth = editor.call('attributes:addField', {
            parent: panel,
            name: 'Size',
            type: 'number',
            placeholder: 'Width',
            link: entities,
            path: 'components.element.width'
        });

        fieldWidth.style.width = '32px';

        // reference
        editor.call('attributes:reference:attach', 'element:size', fieldWidth.parent.innerElement.firstChild.ui);

        var fieldHeight = editor.call('attributes:addField', {
            panel: fieldWidth.parent,
            type: 'number',
            placeholder: 'Height',
            link: entities,
            path: 'components.element.height'
        });

        fieldHeight.style.width = '32px';

        var toggleSize = function () {
            fieldWidth.disabled = hasSplitAnchors(true) || (fieldAutoWidth.value && fieldType.value === 'text');
            fieldWidth.renderChanges = !fieldWidth.disabled;
            fieldHeight.disabled = hasSplitAnchors(false) || (fieldAutoHeight.value && fieldType.value === 'text');
            fieldHeight.renderChanges = !fieldHeight.disabled;
            fieldAutoWidth.disabled = hasSplitAnchors(true);
            fieldAutoHeight.disabled = hasSplitAnchors(false);
        };

        toggleSize();

        var fieldMargin = editor.call('attributes:addField', {
            parent: panel,
            name: 'Margin',
            type: 'vec4',
            placeholder: ['←', '↓', '→', '↑'],
            link: entities,
            path: 'components.element.margin'
        });

        // reference
        editor.call('attributes:reference:attach', 'element:margin', fieldMargin[0].parent.innerElement.firstChild.ui);

        var toggleMargin = function () {
            var horizontalSplit = hasSplitAnchors(true);
            var verticalSplit = hasSplitAnchors(false);
            fieldMargin[0].disabled = ! horizontalSplit;
            fieldMargin[2].disabled = fieldMargin[0].disabled;

            fieldMargin[1].disabled = ! verticalSplit;
            fieldMargin[3].disabled = fieldMargin[1].disabled;

            for (var i = 0; i < 4; i++)
                fieldMargin[i].renderChanges = !fieldMargin[i].disabled;
        };

        toggleMargin();

        var fieldAlignment = editor.call('attributes:addField', {
            parent: panel,
            name: 'Alignment',
            type: 'vec2',
            placeholder: ['↔', '↕'],
            precision: 2,
            step: 0.1,
            min: 0,
            max: 1,
            link: entities,
            path: 'components.element.alignment'
        });

        // reference
        editor.call('attributes:reference:attach', 'element:alignment', fieldAlignment[0].parent.innerElement.firstChild.ui);

        fieldAlignment[0].parent.hidden = fieldType.value !== 'text';

        var fieldText = editor.call('attributes:addField', {
            parent: panel,
            name: 'Text',
            type: 'text',
            link: entities,
            path: 'components.element.text'
        });

        fieldText.parent.hidden = fieldType.value !== 'text';

        // reference
        editor.call('attributes:reference:attach', 'element:text', fieldText.parent.innerElement.firstChild.ui);

        var fieldFontSize = editor.call('attributes:addField', {
            parent: panel,
            name: 'Font Size',
            type: 'number',
            link: entities,
            path: 'components.element.fontSize'
        });

        fieldFontSize.parent.hidden = fieldType.value !== 'text';

        // reference
        editor.call('attributes:reference:attach', 'element:fontSize', fieldFontSize.parent.innerElement.firstChild.ui);

        var fieldLineHeight = editor.call('attributes:addField', {
            parent: panel,
            name: 'Line Height',
            type: 'number',
            link: entities,
            path: 'components.element.lineHeight'
        });

        fieldLineHeight.parent.hidden = fieldType.value !== 'text';

        // reference
        editor.call('attributes:reference:attach', 'element:lineHeight', fieldLineHeight.parent.innerElement.firstChild.ui);

        var fieldSpacing = editor.call('attributes:addField', {
            parent: panel,
            name: 'Spacing',
            type: 'number',
            link: entities,
            path: 'components.element.spacing'
        });

        fieldSpacing.parent.hidden = fieldType.value !== 'text';

        // reference
        editor.call('attributes:reference:attach', 'element:spacing', fieldSpacing.parent.innerElement.firstChild.ui);

        var fieldColor = editor.call('attributes:addField', {
            parent: panel,
            name: 'Color',
            type: 'rgb',
            channels: 3,
            link: entities,
            path: 'components.element.color'
        });

        // reference
        editor.call('attributes:reference:attach', 'element:color', fieldColor.parent.innerElement.firstChild.ui);

        var fieldOpacity = editor.call('attributes:addField', {
            parent: panel,
            name: 'Opacity',
            type: 'number',
            min: 0,
            max: 1,
            link: entities,
            path: 'components.element.opacity'
        });

        fieldOpacity.style.width = '32px';

        // reference
        editor.call('attributes:reference:attach', 'element:opacity', fieldOpacity.parent.innerElement.firstChild.ui);

        var fieldOpacitySlider = editor.call('attributes:addField', {
            panel: fieldOpacity.parent,
            precision: 3,
            step: 1,
            min: 0,
            max: 1,
            type: 'number',
            slider: true,
            link: entities,
            path: 'components.element.opacity'
        });
        fieldOpacitySlider.flexGrow = 4;

        var fieldWrapLines = editor.call('attributes:addField', {
            parent: panel,
            name: 'Wrap Lines',
            type: 'checkbox',
            link: entities,
            path: 'components.element.wrapLines'
        });

        fieldWrapLines.parent.hidden = fieldType.value !== 'text';

        // reference
        editor.call('attributes:reference:attach', 'element:wrapLines', fieldWrapLines.parent.innerElement.firstChild.ui);

        var fieldRect = editor.call('attributes:addField', {
            parent: panel,
            name: 'Rect',
            type: 'vec4',
            placeholder: ['u', 'v', 'w', 'h'],
            link: entities,
            path: 'components.element.rect'
        });

        // reference
        editor.call('attributes:reference:attach', 'element:rect', fieldRect[0].parent.innerElement.firstChild.ui);

        var fieldMask = editor.call('attributes:addField', {
            parent: panel,
            name: 'Mask',
            type: 'checkbox',
            link: entities,
            path: 'components.element.mask'
        });

        fieldMask.parent.hidden = fieldType.value !== 'image';

        // reference
        editor.call('attributes:reference:attach', 'element:mask', fieldMask.parent.innerElement.firstChild.ui);

        var fieldTextureAsset = editor.call('attributes:addField', {
            parent: panel,
            name: 'Texture',
            type: 'asset',
            kind: 'texture',
            link: entities,
            path: 'components.element.textureAsset'
        });

        // reference
        editor.call('attributes:reference:attach', 'element:textureAsset', fieldTextureAsset.parent.innerElement.firstChild.ui);

        var fieldSpriteAsset = editor.call('attributes:addField', {
            parent: panel,
            name: 'Sprite',
            type: 'asset',
            kind: 'sprite',
            link: entities,
            path: 'components.element.spriteAsset'
        });

        // reference
        editor.call('attributes:reference:attach', 'element:spriteAsset', fieldSpriteAsset.parent.innerElement.firstChild.ui);

        // frame
        var fieldFrame = editor.call('attributes:addField', {
            parent: panel,
            name: 'Frame',
            type: 'number',
            min: 0,
            precision: 0,
            step: 1,
            link: entities,
            path: 'components.element.spriteFrame'
        });

        var fieldPpu = editor.call('attributes:addField', {
            parent: panel,
            name: 'Pixels Per Unit',
            type: 'number',
            link: entities,
            min: 0,
            allowNull: true,
            path: 'components.element.pixelsPerUnit'
        });
        // reference
        editor.call('attributes:reference:attach', 'element:pixelsPerUnit', fieldPpu.parent.innerElement.firstChild.ui, null, panel);


        var fieldFontAsset = editor.call('attributes:addField', {
            parent: panel,
            name: 'Font',
            type: 'asset',
            kind: 'font',
            link: entities,
            path: 'components.element.fontAsset'
        });

        fieldFontAsset.parent.hidden = fieldType.value !== 'text';

        // reference
        editor.call('attributes:reference:attach', 'element:fontAsset', fieldFontAsset.parent.innerElement.firstChild.ui);

        var fieldMaterialAsset = editor.call('attributes:addField', {
            parent: panel,
            name: 'Material',
            type: 'asset',
            kind: 'material',
            link: entities,
            path: 'components.element.materialAsset'
        });

        // reference
        editor.call('attributes:reference:attach', 'element:materialAsset', fieldMaterialAsset.parent.innerElement.firstChild.ui);

        var fieldUseInput = editor.call('attributes:addField', {
            parent: panel,
            name: 'Use Input',
            type: 'checkbox',
            link: entities,
            path: 'components.element.useInput'
        });

        // reference
        editor.call('attributes:reference:attach', 'element:useInput', fieldUseInput.parent.innerElement.firstChild.ui);

        // divider
        var divider = document.createElement('div');
        divider.classList.add('fields-divider');
        panel.append(divider);

        // batch group

        var batchGroups = projectSettings.get('batchGroups');
        var batchEnum = {
            '': '...',
            'NaN': 'None'
        };
        for (var key in batchGroups) {
            batchEnum[key] = batchGroups[key].name;
        }

        var fieldBatchGroup = editor.call('attributes:addField', {
            parent: panel,
            name: 'Batch Group',
            type: 'number',
            enum: batchEnum,
            link: entities,
            path: 'components.element.batchGroupId'
        });


        var btnAddGroup = document.createElement('li');
        btnAddGroup.classList.add('add-batch-group');
        btnAddGroup.innerHTML = 'Add Group';
        fieldBatchGroup.elementOptions.appendChild(btnAddGroup);

        // reference
        editor.call('attributes:reference:attach', 'element:batchGroupId', fieldBatchGroup.parent.innerElement.firstChild.ui);

        // Create new batch group, assign it to the selected entities and focus on it in the settings panel
        btnAddGroup.addEventListener('click', function () {
            var group = editor.call('editorSettings:batchGroups:create');
            batchEnum[group] = projectSettings.get('batchGroups.' + group + '.name');
            fieldBatchGroup._updateOptions(batchEnum);
            fieldBatchGroup.value = group;
            editor.call('selector:set', 'editorSettings', [ editor.call('settings:projectUser') ]);
            setTimeout(function () {
                editor.call('editorSettings:batchGroups:focus', group);
            });
        });

        // layers
        var layers = projectSettings.get('layers');
        var layersEnum = {
            '': ''
        };
        for (var key in layers) {
            layersEnum[key] = layers[key].name;
        }
        delete layersEnum[LAYERID_DEPTH];
        delete layersEnum[LAYERID_SKYBOX];
        delete layersEnum[LAYERID_IMMEDIATE];

        var fieldLayers = editor.call('attributes:addField', {
            parent: panel,
            name: 'Layers',
            type: 'tags',
            tagType: 'number',
            enum: layersEnum,
            placeholder: 'Add Layer',
            link: entities,
            path: 'components.element.layers',
            tagToString: function (tag) {
                return projectSettings.get('layers.' + tag + '.name') || 'Missing';
            },
            onClickTag: function () {
                // focus layer
                var layerId = this.originalValue;
                editor.call('selector:set', 'editorSettings', [ editor.call('settings:projectUser') ]);
                setTimeout(function () {
                    editor.call('editorSettings:layers:focus', layerId);
                });
            }
        });

        // reference
        editor.call('attributes:reference:attach', 'element:layers', fieldLayers.parent.parent.innerElement.firstChild.ui);

        var toggleFields = function () {
            fieldSpriteAsset.parent.hidden = fieldType.value !== 'image' || fieldTextureAsset.value || fieldMaterialAsset.value;
            fieldFrame.parent.hidden = fieldSpriteAsset.parent.hidden || ! fieldSpriteAsset.value;
            fieldPpu.parent.hidden = fieldSpriteAsset.parent.hidden || ! fieldSpriteAsset.value;
            fieldTextureAsset.parent.hidden = fieldType.value !== 'image' || fieldSpriteAsset.value || fieldMaterialAsset.value;
            fieldMaterialAsset.parent.hidden = fieldType.value !== 'image' || fieldTextureAsset.value || fieldSpriteAsset.value;
            fieldColor.parent.hidden = fieldType.value !== 'image' && fieldType.value !== 'text' || fieldMaterialAsset.value;
            fieldOpacity.parent.hidden = fieldType.value !== 'image' && fieldType.value !== 'text' || fieldMaterialAsset.value;
            fieldRect[0].parent.hidden = fieldType.value !== 'image' || fieldSpriteAsset.value;

            // disable batch groups until they're working properly
            fieldBatchGroup.parent.hidden = !editor.call('users:hasFlag', 'has2DBatchGroups');
        };

        toggleFields();

        events.push(fieldType.on('change', function (value) {
            fieldText.parent.hidden = value !== 'text';
            fieldFontAsset.parent.hidden = value !== 'text';
            fieldFontSize.parent.hidden = value !== 'text';
            fieldLineHeight.parent.hidden = value !== 'text';
            fieldWrapLines.parent.hidden = value !== 'text';
            fieldSpacing.parent.hidden = value !== 'text';
            toggleSize();
            toggleMargin();
            toggleFields();
            panelAutoSize.hidden = value !== 'text';
            fieldAlignment[0].parent.hidden = value !== 'text';
        }));


        events.push(fieldMaterialAsset.on('change', toggleFields));

        events.push(fieldTextureAsset.on('change', function (value) {
            toggleSize();
            toggleFields();
        }));

        events.push(fieldFontAsset.on('change', function (value) {
            if (value) {
                editor.call('settings:projectUser').set('editor.lastSelectedFontId', value);
            }
        }));

        events.push(fieldSpriteAsset.on('change', toggleFields));

        // handle local changes to texture field to
        // auto set width and height and combine all of them in the same
        // history action
        events.push(fieldTextureAsset.on('beforechange', function (value) {
            if (! value) return;
            var asset = editor.call('assets:get', value);
            if (! asset) return;

            if (! asset.has('meta.width') || ! asset.has('meta.height')) return;

            var width = asset.get('meta.width');
            var height = asset.get('meta.height');
            if (width === fieldWidth.value && height === fieldHeight.value)
                return;

            fieldTextureAsset.once('change', function (value) {
                var lastHistoryAction = editor.call('history:list')[editor.call('history:current')];
                var lastUndo = lastHistoryAction.undo;
                var lastRedo = lastHistoryAction.redo;

                var previous = {};
                for (var i = 0, len = entities.length; i < len; i++) {
                    var anchor = entities[i].get('components.element.anchor');
                    if (Math.abs(anchor[0] - anchor[2]) > 0.001 || Math.abs(anchor[1] - anchor[3]) > 0.001) {
                        continue;
                    }

                    var prevData = {
                        width: entities[i].get('components.element.width'),
                        height: entities[i].get('components.element.height'),
                        margin: entities[i].get('components.element.margin')
                    };


                    previous[entities[i].get('resource_id')] = prevData;
                }

                lastHistoryAction.undo = function () {
                    lastUndo();

                    for (var i = 0, len = entities.length; i < len; i++) {
                        var prev = previous[entities[i].get('resource_id')];
                        if (! prev) continue;

                        var entity = editor.call('entities:get', entities[i].get('resource_id'));
                        if (! entity) continue;

                        var history = entity.history.enabled;
                        entity.history.enabled = false;
                        if (entity.has('components.element')) {
                            entity.set('components.element.width', prev.width);
                            entity.set('components.element.height', prev.height);
                            entity.set('components.element.margin', prev.margin);
                        }
                        entity.history.enabled = history;
                    }
                };

                var redo = function () {
                    for (var i = 0, len = entities.length; i < len; i++) {
                        var prev = previous[entities[i].get('resource_id')];
                        if (! prev) continue;

                        var entity = editor.call('entities:get', entities[i].get('resource_id'));
                        if (! entity) continue;

                        var history = entity.history.enabled;
                        entity.history.enabled = false;
                        if (entity.has('components.element')) {
                            entity.set('components.element.width', width);
                            entity.set('components.element.height', height);

                            if (entity.entity) {
                                var margin = entity.entity.element.margin.data;
                                entity.set('components.element.margin', [margin[0], margin[1], margin[2], margin[3]]);
                            }
                        }
                        entity.history.enabled = history;
                    }
                };

                lastHistoryAction.redo = function () {
                    lastRedo();
                    redo();
                };

                redo();
            });

        }));


        panel.on('destroy', function () {
            events.forEach(function (e) {
                e.unbind();
            });
            events.length = 0;
        });

    });
});
