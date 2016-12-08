editor.once('load', function() {
    'use strict';

    editor.on('attributes:inspect[entity]', function(entities) {
        var panelComponents = editor.call('attributes:entity.panelComponents');
        if (! panelComponents)
            return;

        var events = [ ];

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
            enum: presetsEnum
        });

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

        // reference
        editor.call('attributes:reference:attach', 'element:anchor', fieldAnchor[0].parent.innerElement.firstChild.ui);

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

            var prevAnchors = [];
            var prevPivots = [];

            for (var i = 0; i < entities.length; i++) {
                var history = entities[i].history.enabled;
                entities[i].history.enabled = false;
                prevAnchors.push(entities[i].get('components.element.anchor'));
                prevPivots.push(entities[i].get('components.element.pivot'));
                entities[i].set('components.element.anchor', anchor);
                entities[i].set('components.element.pivot', pivot);
                entities[i].history.enabled = history;
            }

            editor.call('history:add', {
                name: 'entities.components.element.preset',
                undo: function() {
                    for(var i = 0; i < entities.length; i++) {
                        var entity = entities[i];
                        var history = entity.history.enabled;
                        entity.history.enabled = false;
                        entity.set('components.element.anchor', prevAnchors[i]);
                        entity.set('components.element.pivot', prevPivots[i]);
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
                        entity.history.enabled = history;
                    }
                }
            });


            changingPreset = false;
        }));

        var fieldText = editor.call('attributes:addField', {
            parent: panel,
            name: 'Text',
            type: 'string',
            link: entities,
            path: 'components.element.text'
        });

        fieldText.parent.hidden = fieldType.value !== 'text';

        // reference
        editor.call('attributes:reference:attach', 'element:text', fieldText.parent.innerElement.firstChild.ui);

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
            channels: 4,
            link: entities,
            path: 'components.element.color'
        });

        fieldColor.parent.hidden = fieldType.value !== 'text' && fieldType.value !== 'image';

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
        fieldOpacity.parent.hidden = fieldType.value !== 'text' && fieldType.value !== 'image';

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

        var fieldWidth = editor.call('attributes:addField', {
            parent: panel,
            name: 'Size',
            type: 'number',
            placeholder: 'Width',
            min: 0,
            link: entities,
            path: 'components.element.width'
        });

        fieldWidth.style.width = '32px';
        fieldWidth.parent.hidden = fieldType.value !== 'image';

        // reference
        editor.call('attributes:reference:attach', 'element:size', fieldWidth.parent.innerElement.firstChild.ui);

        var fieldHeight = editor.call('attributes:addField', {
            panel: fieldWidth.parent,
            type: 'number',
            placeholder: 'Height',
            min: 0,
            link: entities,
            path: 'components.element.height'
        });

        fieldHeight.style.width = '32px';

        var fieldRect = editor.call('attributes:addField', {
            parent: panel,
            name: 'Rect',
            type: 'vec4',
            placeholder: ['u', 'v', 'w', 'h'],
            link: entities,
            path: 'components.element.rect'
        });

        fieldRect[0].parent.hidden = fieldType.value !== 'image';

        // reference
        editor.call('attributes:reference:attach', 'element:rect', fieldRect[0].parent.innerElement.firstChild.ui);

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

        var fieldMaterialAsset = editor.call('attributes:addField', {
            parent: panel,
            name: 'Material',
            type: 'asset',
            kind: 'material',
            link: entities,
            path: 'components.element.materialAsset'
        });

        fieldMaterialAsset.parent.hidden = fieldType.value !== 'image' || fieldTextureAsset.value;
        fieldTextureAsset.parent.hidden = fieldType.value !== 'image' || fieldMaterialAsset.value;

        // reference
        editor.call('attributes:reference:attach', 'element:materialAsset', fieldMaterialAsset.parent.innerElement.firstChild.ui);

        events.push(fieldType.on('change', function (value) {
            fieldText.parent.hidden = value !== 'text';
            fieldFontAsset.parent.hidden = value !== 'text';
            fieldFontSize.parent.hidden = value !== 'text';
            fieldLineHeight.parent.hidden = value !== 'text';
            fieldSpacing.parent.hidden = value !== 'text';
            fieldTextureAsset.parent.hidden = value !== 'image' || fieldMaterialAsset.value;
            fieldMaterialAsset.parent.hidden = value !== 'image' || fieldTextureAsset.value;
            fieldRect[0].parent.hidden = value !== 'image';
            fieldWidth.parent.hidden = value !== 'image';
            fieldColor.parent.hidden = value !== 'text' && value !== 'image';
            fieldOpacity.parent.hidden = value !== 'text' && value !== 'image';
        }));


        events.push(fieldTextureAsset.on('change', function (value) {
            fieldRect[0].parent.hidden = fieldType.value !== 'image';
            fieldWidth.parent.hidden = fieldType.value !== 'image';
            fieldMaterialAsset.parent.hidden = fieldType.value !== 'image' || value;
        }));

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
                    previous[entities[i].get('resource_id')] = {
                        width: entities[i].get('components.element.width'),
                        height: entities[i].get('components.element.height')
                    };
                }

                lastHistoryAction.undo = function () {
                    lastUndo();

                    for (var i = 0, len = entities.length; i < len; i++) {
                        var entity = editor.call('entities:get', entities[i].get('resource_id'));
                        if (! entity) continue;

                        var history = entity.history.enabled;
                        entity.history.enabled = false;
                        if (entity.has('components.element')) {
                            entity.set('components.element.width', previous[entity.get('resource_id')].width);
                            entity.set('components.element.height', previous[entity.get('resource_id')].height);
                        }
                        entity.history.enabled = history;
                    }
                };

                var redo = function () {
                    for (var i = 0, len = entities.length; i < len; i++) {
                        var entity = editor.call('entities:get', entities[i].get('resource_id'));
                        if (! entity) continue;

                        var history = entity.history.enabled;
                        entity.history.enabled = false;
                        if (entity.has('components.element')) {
                            entity.set('components.element.width', width);
                            entity.set('components.element.height', height);
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

        events.push(fieldMaterialAsset.on('change', function (value) {
            fieldTextureAsset.parent.hidden = fieldType.value !== 'image' || value;
        }));

        panel.on('destroy', function () {
            events.forEach(function (e) {
                e.unbind();
            });
            events.length = 0;
        });

    });
});
