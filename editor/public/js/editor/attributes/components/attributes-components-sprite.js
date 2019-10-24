editor.once('load', function() {
    'use strict';

    editor.on('attributes:inspect[entity]', function(entities) {
        var panelComponents = editor.call('attributes:entity.panelComponents');
        if (! panelComponents)
            return;

        var events = [ ];

        var projectSettings = editor.call('settings:project');

        // group clips by name
        var numEntities = entities.length;
        var groupedClips = {};
        for (var i = 0; i < numEntities; i++) {
            var clips = entities[i].get('components.sprite.clips');
            if (! clips) continue;

            for (var key in clips) {
                var clip = clips[key];
                if (! groupedClips[clip.name]) {
                    groupedClips[clip.name] = {};
                }

                groupedClips[clip.name][entities[i].get('resource_id')] = 'components.sprite.clips.' + key;
            }
        }

        var panel = editor.call('attributes:entity:addComponentPanel', {
            title: 'Sprite',
            name: 'sprite',
            entities: entities
        });

        // sprite type
        var fieldType = editor.call('attributes:addField', {
            parent: panel,
            name: 'Type',
            type: 'string',
            enum: [
                {v: '', t: '...'},
                {v: 'simple', t: 'Simple'},
                {v: 'animated', t: 'Animated'}
            ],
            link: entities,
            path: 'components.sprite.type',
            canOverrideTemplate: true
        });

        // reference
        editor.call('attributes:reference:attach', 'sprite:type', fieldType.parent.innerElement.firstChild.ui);

        // sprite asset
        var fieldSpriteAsset = editor.call('attributes:addField', {
            parent: panel,
            name: 'Sprite',
            type: 'asset',
            kind: 'sprite',
            link: entities,
            path: 'components.sprite.spriteAsset',
            canOverrideTemplate: true
        });

        // reference
        editor.call('attributes:reference:attach', 'sprite:spriteAsset', fieldSpriteAsset._label);

        // sprite frame
        var fieldFrame = editor.call('attributes:addField', {
            parent: panel,
            name: 'Frame',
            type: 'number',
            link: entities,
            min: 0,
            path: 'components.sprite.frame',
            canOverrideTemplate: true
        });

        // reference
        editor.call('attributes:reference:attach', 'sprite:frame', fieldFrame.parent.innerElement.firstChild.ui);

        // width
        var fieldWidth = editor.call('attributes:addField', {
            parent: panel,
            name: 'Size',
            type: 'number',
            placeholder: 'Width',
            link: entities,
            path: 'components.sprite.width'
        });

        fieldWidth.style.width = '32px';

        editor.call('attributes:registerOverridePath', 'components.sprite.width', fieldWidth.element);

        // reference
        editor.call('attributes:reference:attach', 'sprite:size', fieldWidth.parent.innerElement.firstChild.ui);

        // height
        var fieldHeight = editor.call('attributes:addField', {
            panel: fieldWidth.parent,
            type: 'number',
            placeholder: 'Height',
            link: entities,
            path: 'components.sprite.height'
        });

        fieldHeight.style.width = '32px';

        editor.call('attributes:registerOverridePath', 'components.sprite.height', fieldHeight.element);

        // sprite color
        var fieldColor = editor.call('attributes:addField', {
            parent: panel,
            name: 'Color',
            type: 'rgb',
            channels: 3,
            link: entities,
            path: 'components.sprite.color',
            canOverrideTemplate: true
        });

        // reference
        editor.call('attributes:reference:attach', 'sprite:color', fieldColor.parent.innerElement.firstChild.ui);

        // sprite opacity
        var fieldOpacity = editor.call('attributes:addField', {
            parent: panel,
            name: 'Opacity',
            type: 'number',
            min: 0,
            max: 1,
            link: entities,
            path: 'components.sprite.opacity',
            canOverrideTemplate: true
        });

        fieldOpacity.style.width = '32px';

        // reference
        editor.call('attributes:reference:attach', 'sprite:opacity', fieldOpacity.parent.innerElement.firstChild.ui);

        var fieldOpacitySlider = editor.call('attributes:addField', {
            panel: fieldOpacity.parent,
            precision: 3,
            step: 1,
            min: 0,
            max: 1,
            type: 'number',
            slider: true,
            link: entities,
            path: 'components.sprite.opacity'
        });
        fieldOpacitySlider.flexGrow = 4;

        // flip x / y
        var panelFlip = editor.call('attributes:addField', {
            parent: panel,
            name: 'Flip'
        });
        var label = panelFlip;
        panelFlip = panelFlip.parent;
        label.destroy();

        var fieldFlipX = editor.call('attributes:addField', {
            panel: panelFlip,
            type: 'checkbox',
            link: entities,
            paths: 'components.sprite.flipX'
        });
        label = new ui.Label({ text: 'X' });
        label.class.add('label-infield');
        label.style.paddingRight = '12px';
        panelFlip.append(label);

        editor.call('attributes:registerOverridePath', 'components.sprite.flipX', fieldFlipX.element);

        // reference
        editor.call('attributes:reference:attach', 'sprite:flipX', label);

        var fieldFlipY = editor.call('attributes:addField', {
            panel: panelFlip,
            type: 'checkbox',
            link: entities,
            paths: 'components.sprite.flipY'
        });
        label = new ui.Label({ text: 'Y' });
        label.class.add('label-infield');
        label.style.paddingRight = '12px';
        panelFlip.append(label);

        editor.call('attributes:registerOverridePath', 'components.sprite.flipY', fieldFlipY.element);

        // reference
        editor.call('attributes:reference:attach', 'sprite:flipX', label);

        // speed
        var fieldSpeed = editor.call('attributes:addField', {
            parent: panel,
            name: 'Speed',
            type: 'number',
            link: entities,
            paths: 'components.sprite.speed',
            canOverrideTemplate: true
        });

        // reference
        editor.call('attributes:reference:attach', 'sprite:speed', fieldSpeed.parent.innerElement.firstChild.ui);

        panel.on('destroy', function () {
            events.forEach(function (e) {
                e.unbind();
            });
            events.length = 0;
        });

        // auto play
        var enumAutoPlay = [{
            v: 'null',
            t: 'None'
        }];

        for (var name in groupedClips) {
            if (Object.keys(groupedClips[name]).length !== numEntities) continue;

            enumAutoPlay.push({
                v: name,
                t: name
            });
        }


        // batch group
        var batchGroups = editor.call('settings:project').get('batchGroups');
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
            path: 'components.sprite.batchGroupId',
            canOverrideTemplate: true
        });

        var btnAddGroup = document.createElement('li');
        btnAddGroup.classList.add('add-batch-group');
        btnAddGroup.innerHTML = 'Add Group';
        fieldBatchGroup.elementOptions.appendChild(btnAddGroup);

        // Create new batch group, assign it to the selected entities and focus on it in the settings panel
        btnAddGroup.addEventListener('click', function () {
            var group = editor.call('editorSettings:batchGroups:create');
            batchEnum[group] = editor.call('settings:project').get('batchGroups.' + group + '.name');
            fieldBatchGroup._updateOptions(batchEnum);
            fieldBatchGroup.value = group;
            editor.call('selector:set', 'editorSettings', [ editor.call('settings:projectUser') ]);
            setTimeout(function () {
                editor.call('editorSettings:batchGroups:focus', group);
            });
        });

        // reference
        editor.call('attributes:reference:attach', 'sprite:batchGroupId', fieldBatchGroup.parent.innerElement.firstChild.ui);

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
            path: 'components.sprite.layers',
            canOverrideTemplate: true,
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
        editor.call('attributes:reference:attach', 'sprite:layers', fieldLayers.parent.parent.innerElement.firstChild.ui);

        // draw order
        var fieldDrawOrder = editor.call('attributes:addField', {
            parent: panel,
            name: 'Draw Order',
            type: 'number',
            link: entities,
            path: 'components.sprite.drawOrder',
            canOverrideTemplate: true
        });

        // reference
        editor.call('attributes:reference:attach', 'sprite:drawOrder', fieldDrawOrder.parent.innerElement.firstChild.ui);


        var fieldAutoPlay = editor.call('attributes:addField', {
            parent: panel,
            name: 'Auto Play',
            type: 'string',
            link: entities,
            path: 'components.sprite.autoPlayClip',
            enum: enumAutoPlay,
            canOverrideTemplate: true
        });

        // reference
        editor.call('attributes:reference:attach', 'sprite:autoPlayClip', fieldAutoPlay.parent.innerElement.firstChild.ui);

        // clips
        var panelClips = new ui.Panel();
        panelClips.class.add('clips');
        panel.append(panelClips);

        var indexPanels = {};

        var createClipPanel = function (clipName) {
            // gather edited paths
            var paths = [];
            for (var i = 0; i < numEntities; i++) {
                paths.push(groupedClips[clipName][entities[i].get('resource_id')]);
            }

            var panelClip = new ui.Panel(clipName);
            panelClip.class.add('clip');
            panelClip.foldable = true;
            panelClip.folded = false;
            panelClips.append(panelClip);

            indexPanels[clipName] = panelClip;

            editor.call('attributes:registerOverridePath', paths[0], panelClip.element);

            // reference
            editor.call('attributes:reference:attach', 'spriteAnimation:clip', panelClip, panelClip.headerElementTitle);

            var clipEvents = [];
            panelClip.on('destroy', function () {
                for (var i = 0; i < clipEvents.length; i++) {
                    clipEvents[i].unbind();
                }
                clipEvents = null;
            });

            // remove clip button
            var btnRemove = new ui.Button();
            btnRemove.class.add('remove');
            panelClip.headerElement.appendChild(btnRemove.element);

            btnRemove.on('click', function () {
                var records = [];
                for (var i = 0; i<numEntities; i++) {
                    records.push({
                        clip: entities[i].get(paths[i]),
                        autoPlayClip: entities[i].get('components.sprite.autoPlayClip')
                    });
                }

                var redo = function () {
                    for (var i = 0; i<numEntities; i++) {
                        var entity = editor.call('entities:get', entities[i].get('resource_id'));
                        if (! entity) continue;

                        var history = entity.history.enabled;
                        entity.history.enabled = false;
                        entity.unset(paths[i]);

                        // if this is the clip to be autoPlayed then unset it
                        if (records[i].clip.name === records[i].autoPlayClip) {
                            entity.set('components.sprite.autoPlayClip', null);
                        }
                        entity.history.enabled = history;
                    }
                };

                var undo = function () {
                    for (var i = 0; i<numEntities; i++) {
                        var entity = editor.call('entities:get', entities[i].get('resource_id'));
                        if (! entity) continue;

                        var history = entity.history.enabled;
                        entity.history.enabled = false;
                        entity.set(paths[i], records[i].clip);
                        entity.set('components.sprite.autoPlayClip', records[i].autoPlayClip);
                        entity.history.enabled = history;
                    }
                };

                editor.call('history:add', {
                    name: 'delete entities.components.sprite.clips',
                    undo: undo,
                    redo: redo
                });

                redo();
            });

            // clip name
            var fieldClipName = editor.call('attributes:addField', {
                parent: panelClip,
                name: 'Name',
                type: 'string'
            });

            fieldClipName.value = clipName;

            editor.call('attributes:registerOverridePath', paths[0] + '.name', fieldClipName.parent.element);

            var suspendName = false;
            fieldClipName.on('change', function (value) {
                if (suspendName) return;

                // check if name is valid
                var valid = true;

                if (! value) {
                    valid = false;
                } else if (groupedClips[value]) {
                    valid = false;
                } else if (value === 'null') {
                    valid = false;
                }

                if (! valid) {
                    fieldClipName.class.add('error');
                    return;
                }

                fieldClipName.class.remove('error');

                var previousName = clipName;
                var newName = value;

                // remember the previous autoPlayClip value
                // for each entity
                var records = [];
                for (var i = 0; i<numEntities; i++) {
                    records.push(entities[i].get('components.sprite.autoPlayClip'));
                }

                var redo = function () {
                    clipName = newName;

                    for (var i = 0; i<numEntities; i++) {
                        var entity = editor.call('entities:get', entities[i].get('resource_id'));
                        if (! entity) continue;
                        var history = entity.history.enabled;
                        entity.history.enabled = false;
                        entity.set(paths[i] + '.name', value);

                        // if autoPlayClip was refering to this clip
                        // then update it
                        if (records[i] === previousName) {
                            entity.set('components.sprite.autoPlayClip', value);
                        }
                        entity.history.enabled = history;
                    }
                };

                var undo = function () {
                    clipName = previousName;

                    for (var i = 0; i<numEntities; i++) {
                        var entity = editor.call('entities:get', entities[i].get('resource_id'));
                        if (! entity) continue;
                        var history = entity.history.enabled;
                        entity.history.enabled = false;
                        entity.set(paths[i] + '.name', previousName);
                        entity.set('components.sprite.autoPlayClip', records[i]);
                        entity.history.enabled = history;
                    }
                };

                editor.call('history:add', {
                    name: 'entities.components.sprite.clips',
                    undo: undo,
                    redo: redo
                });

                redo();
            });

            // listen to name change from entities
            var createNameChangeListener = function (i) {
                clipEvents.push(entities[i].on(paths[i] + '.name:set', function (value, oldValue) {
                    suspendName = true;
                    fieldClipName.value = value;
                    suspendName = false;

                    panelClip.header = value;

                    // update autoPlayClip enum options
                    for (var i = 0; i < enumAutoPlay.length; i++) {
                        if (enumAutoPlay[i].v === oldValue) {
                            enumAutoPlay[i].v = value;
                            enumAutoPlay[i].t = value;
                            break;
                        }
                    }
                    fieldAutoPlay._updateOptions(enumAutoPlay);

                    // update groupedClips
                    if (groupedClips[oldValue]) {
                        groupedClips[value] = groupedClips[oldValue];
                        delete groupedClips[oldValue];
                    }

                    // update indexPanels
                    if (indexPanels[oldValue]) {
                        indexPanels[value] = indexPanels[oldValue];
                        delete indexPanels[oldValue];
                    }
                }));
            };

            for (var i = 0; i<numEntities; i++)
                createNameChangeListener(i);

            // reference
            editor.call('attributes:reference:attach', 'spriteAnimation:name', fieldClipName.parent.innerElement.firstChild.ui);


            // playback
            var panelPlayback = editor.call('attributes:addField', {
                parent: panelClip,
                name: 'Playback'
            });
            var label = panelPlayback;
            panelPlayback = panelPlayback.parent;
            label.destroy();

            // clip loop
            var fieldClipLoop = editor.call('attributes:addField', {
                panel: panelPlayback,
                type: 'checkbox',
                link: entities,
                paths: paths.map(function (p) {return p + '.loop';})
            });
            label = new ui.Label({ text: 'Loop' });
            label.class.add('label-infield');
            label.style.paddingRight = '12px';
            panelPlayback.append(label);

            editor.call('attributes:registerOverridePath', paths[0] + '.loop', fieldClipLoop.element);

            // reference
            editor.call('attributes:reference:attach', 'spriteAnimation:loop', label);

            // clip fps
            var fieldClipFps = editor.call('attributes:addField', {
                panel: panelPlayback,
                type: 'number',
                step: 1,
                link: entities,
                placeholder: 'FPS',
                paths: paths.map(function (p) {return p + '.fps';})
            });

            editor.call('attributes:registerOverridePath', paths[0] + '.fps', fieldClipFps.element);

            // reference
            editor.call('attributes:reference:attach', 'spriteAnimation:fps', fieldClipFps);

            // clip sprite asset
            var fieldClipSpriteAsset = editor.call('attributes:addField', {
                parent: panelClip,
                name: 'Sprite',
                type: 'asset',
                kind: 'sprite',
                link: entities,
                path: paths.map(function (p) {return p + '.spriteAsset';}),
                canOverrideTemplate: true
            });

            editor.call('attributes:reference:attach', 'spriteAnimation:spriteAsset', fieldClipSpriteAsset._label);
        };

        // show all clips that are common between all selected entities
        for (var name in groupedClips) {
            if (Object.keys(groupedClips[name]).length !== numEntities) continue;

            createClipPanel(name);
        }


        // add clip button
        var btnAddClip = new ui.Button({
            text: 'Add Clip'
        });
        btnAddClip.class.add('add-clip');
        panel.append(btnAddClip);

        // reference
        editor.call('attributes:reference:attach', 'sprite:addClip', btnAddClip);

        btnAddClip.on('click', function () {
            // search clips of all entities for the largest key
            var largestKey = 1;
            for (var i = 0; i < numEntities; i++) {
                var clips = entities[i].get('components.sprite.clips');
                if (! clips) continue;

                for (var key in clips) {
                    largestKey = Math.max(largestKey, parseInt(key) + 1);
                }
            }

            var suffix = largestKey;
            var desiredName = 'Clip ' + suffix;
            while (groupedClips[desiredName]) {
                suffix++;
                desiredName = 'Clip ' + suffix;
            }

            var redo = function () {
                for (var i = 0; i < numEntities; i++) {
                    var entity = editor.call('entities:get', entities[i].get('resource_id'));
                    if (! entity) continue;
                    var history = entity.history.enabled;
                    entity.history.enabled = false;
                    var clips = entity.get('components.sprite.clips') || {};
                    var slot = 0;
                    for (var key in clips) {
                        slot = Math.max(slot, parseInt(key, 10) + 1);
                    }

                    entity.set('components.sprite.clips.' + slot, {
                        name: desiredName,
                        fps: 30,
                        loop: true,
                        spriteAsset: null
                    });
                    entity.history.enabled = history;
                }
            };

            var undo = function () {
                for (var i = 0; i < numEntities; i++) {
                    var entity = editor.call('entities:get', entities[i].get('resource_id'));
                    if (! entity) continue;
                    var history = entity.history.enabled;
                    entity.history.enabled = false;
                    // find slot by clip name
                    var clips = entity.get('components.sprite.clips');
                    if (! clips) continue;
                    var slot = null;
                    for (var key in clips) {
                        if (clips[key].name === desiredName) {
                            slot = key;
                            break;
                        }
                    }

                    if (slot === null) continue;

                    entity.unset('components.sprite.clips.' + slot);
                    entity.history.enabled = history;
                }
            };

            editor.call('history:add', {
                name: 'entities..components.sprite.clips',
                undo: undo,
                redo: redo
            });

            redo();
        });

        // add listener to add new panel for newly added clips
        var createSetHandler = function (i) {
            var resourceId = entities[i].get('resource_id');
            events.push(entities[i].on('*:set', function (path, value) {
                if (! /^components\.sprite\.clips\.\d+$/.test(path)) return;

                // add new clip to groupedClips
                if (! groupedClips[value.name]) {
                    groupedClips[value.name] = {};
                }

                groupedClips[value.name][resourceId] = path;

                // update autoPlayClip options if needed
                if (Object.keys(groupedClips[value.name]).length === numEntities) {
                    createClipPanel(value.name);

                    // update auto play options
                    enumAutoPlay.push({
                        v: value.name,
                        t: value.name
                    });
                    fieldAutoPlay._updateOptions(enumAutoPlay);
                }
            }));
        };

        // add listener to remove panels for removed clips
        var createUnsetHandler = function (i) {
            var resourceId = entities[i].get('resource_id');
            events.push(entities[i].on('*:unset', function (path, value) {
                if (! /^components\.sprite\.clips\.\d+$/.test(path)) return;

                var entry = groupedClips[value.name];
                if (entry) {
                    delete entry[resourceId];

                    if (! Object.keys(entry).length)
                        delete groupedClips[value.name];
                }

                // destroy panel
                var panelClip = indexPanels[value.name];
                if (panelClip) {
                    panelClip.destroy();
                    panelClip = null;
                    delete indexPanels[value.name];
                }

                // update autoPlayClip enum options
                for (var j = 0; j < enumAutoPlay.length; j++) {
                    if (enumAutoPlay[j].v === value.name) {
                        enumAutoPlay.splice(j, 1);
                        break;
                    }
                }
                fieldAutoPlay._updateOptions(enumAutoPlay);
            }));
        };

        for (var i = 0; i < numEntities; i++) {
            createSetHandler(i);
            createUnsetHandler(i);
        }

        // show / hide animated sprite fields
        var toggleFields = function () {
            var hideAnimated = false;

            for (var i = 0; i < numEntities; i++) {
                if (entities[i].get('components.sprite.type') !== 'animated') {
                    hideAnimated = true;
                    break;
                }
            }

            panelClips.hidden = hideAnimated;
            btnAddClip.hidden = hideAnimated;
            fieldAutoPlay.parent.hidden = hideAnimated;
            fieldFrame.parent.hidden = !hideAnimated;
            fieldSpriteAsset.parent.hidden = !hideAnimated;
            fieldSpeed.parent.hidden = hideAnimated;
            fieldBatchGroup.parent.hidden = !hideAnimated;

            fieldWidth.parent.hidden = hideSpriteSize();

            // disable batch groups until they're working properly
            fieldBatchGroup.parent.hidden = !editor.call('users:hasFlag', 'has2DBatchGroups');
        };

        var hideSpriteSize = function () {
            if (fieldType.value !== 'simple')
                return true;

            if (! fieldSpriteAsset.value)
                return true;

            var asset = editor.call('assets:get', fieldSpriteAsset.value);
            if (! asset) {
                return true;
            }

            if (! asset.get('data.renderMode')) {
                return true;
            }

            return false;
        };

        fieldType.on('change', toggleFields);

        fieldSpriteAsset.on('change', function () {
            fieldWidth.parent.hidden = hideSpriteSize();
        });

        toggleFields();

        // destroy panel
        panel.on('destroy', function () {
            for (var i = 0; i < events.length; i++) {
                events[i].unbind();
            }
            events.length = 0;
        });

    });
});
