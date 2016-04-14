editor.once('load', function() {
    'use strict';

    if (editor.call('project:settings').get('use_legacy_scripts'))
        return;

    var attributeTypeToUi = {
        boolean: 'checkbox',
        number: 'number',
        string: 'string',
        json: 'string',
        asset: 'asset',
        entity: 'entity',
        rgb: 'rgb',
        rgba: 'rgb',
        vec2: 'vec2',
        vec3: 'vec3',
        vec4: 'vec4',
        curve: 'curveset'
    };

    var attributeSubTitles = {
        boolean: '{Boolean}',
        number: '{Number}',
        string: '{String}',
        json: '{Object}',
        asset: '{pc.Asset}',
        entity: '{pc.Entity}',
        rgb: '{pc.Color}',
        rgba: '{pc.Color}',
        vec2: '{pc.Vec2}',
        vec3: '{pc.Vec3}',
        vec4: '{pc.Vec4}',
        curve: '{pc.Curve}'
    };

    editor.on('attributes:inspect[entity]', function(entities) {
        var panelComponents = editor.call('attributes:entity.panelComponents');
        if (! panelComponents)
            return;

        var panel = editor.call('attributes:entity:addComponentPanel', {
            title: 'Scripts',
            name: 'script',
            entities: entities
        });

        var events = [ ];
        var currentFocus = null;
        var lastValue = '';


        var excludeScripts = { };
        var calculateExcludeScripts = function() {
            excludeScripts = { };
            var excludeScriptsIndex = { };
            for(var i = 0; i < entities.length; i++) {
                var scripts = entities[i].get('components.script.order');
                for(var s = 0; s < scripts.length; s++) {
                    excludeScriptsIndex[scripts[s]] = (excludeScriptsIndex[scripts[s]] || 0) + 1;
                    if (excludeScriptsIndex[scripts[s]] === entities.length)
                        excludeScripts[scripts[s]] = true;
                }
            }
        };

        var focusFirstAutocomplete = function() {
            var first = autoComplete.innerElement.firstChild;
            var found = false;
            while(! found && first) {
                if (first.ui && ! first.ui.hidden) {
                    found = true;
                    break;
                }
                first = first.nextSibling;
            }

            if (found && first && first.ui) {
                currentFocus = first.ui;
                currentFocus.class.add('active');
            } else {
                currentFocus = null;
            }
        };


        var inputAddScript = new ui.TextField();
        inputAddScript.renderChanges = false;
        inputAddScript.keyChange = true;
        inputAddScript.class.add('add-script');
        inputAddScript.on('change', function(value) {
            if (lastValue === value)
                return;

            lastValue = value;

            if (value) {
                inputAddScript.class.add('not-empty');

                var items = [ ];
                for(var key in autoComplete.index) {
                    if (! autoComplete.index.hasOwnProperty(key))
                        continue;

                    items.push([ key, key ]);
                }

                var search = editor.call('search:items', items, value);
                var searchIndex = { };
                for(var i = 0; i < search.length; i++)
                    searchIndex[search[i]] = true;

                for(var key in autoComplete.index) {
                    if (! autoComplete.index.hasOwnProperty(key))
                        continue;

                    autoComplete.index[key].class.remove('active');

                    if (searchIndex[key] && ! excludeScripts[key]) {
                        autoComplete.index[key].hidden = false;
                    } else {
                        autoComplete.index[key].hidden = true;
                    }
                }
            } else {
                inputAddScript.class.remove('not-empty');

                for(var key in autoComplete.index) {
                    if (! autoComplete.index.hasOwnProperty(key))
                        continue;

                    autoComplete.index[key].class.remove('active');
                    autoComplete.index[key].hidden = !! excludeScripts[key];
                }
            }

            focusFirstAutocomplete();
        });
        inputAddScript.on('input:focus', function() {
            calculateExcludeScripts();

            if (autoComplete.empty) {
                currentFocus = null;
                autoComplete.empty = false;

                var scripts = editor.call('assets:scripts:list');

                // sort list
                scripts.sort(function(a, b) {
                    if (a.toLowerCase() > b.toLowerCase()) {
                        return 1;
                    } else if (a.toLowerCase() < b.toLowerCase()) {
                        return -1;
                    } else {
                        return 0;
                    }
                });

                for(var i = 0; i < scripts.length; i++) {
                    var item = addScriptAutocompleteItem(scripts[i]);
                    if (excludeScripts[scripts[i]])
                        item.hidden = true;
                }

                // TODO scritps2
                // resort might be required if new scripts were added before templated
            } else {
                // show all items as search is empty
                for(var key in autoComplete.index) {
                    if (! autoComplete.index.hasOwnProperty(key))
                        continue;

                    autoComplete.index[key].class.remove('active');
                    autoComplete.index[key].hidden = !! excludeScripts[key];
                }
            }

            autoComplete.hidden = false;
            focusFirstAutocomplete();

            if (currentFocus)
                currentFocus.class.add('active');
        });

        var addScriptAutocompleteItem = function(script) {
            var item = new ui.ListItem({ text: script });
            item.element.script = script;
            item.element.addEventListener('mousedown', function() {
                onScriptAdd(this.script);
            }, false);
            autoComplete.index[script] = item;
            autoComplete.append(item);
            return item;
        };

        var removeScriptAutocompleteItem = function(script) {
            var item = autoComplete.index[script];
            if (! item) return;

            if (item === currentFocus) {
                var prev = item.element.previousSibling;
                if (! prev) prev = item.element.nextSibling;

                if (prev && prev.ui) {
                    currentFocus = prev.ui;
                    currentFocus.class.add('active');
                } else {
                    currentFocus = null;
                }
            }

            item.destroy();
            delete autoComplete.index[script];
        };

        var onScriptAdd = function(script) {
            var records = [ ];

            for(var i = 0; i < entities.length; i++) {
                if (entities[i].has('components.script.scripts.' + script))
                    continue;

                var record = {
                    get: entities[i].history._getItemFn,
                    data: {
                        enabled: true,
                        attributes: { }
                    }
                };
                records.push(record);

                entities[i].history.enabled = false;
                entities[i].set('components.script.scripts.' + script, record.data);
                entities[i].insert('components.script.order', script);
                entities[i].history.enabled = true;
            }

            editor.call('history:add', {
                name: 'entities.components.script.scripts',
                undo: function() {
                    for(var i = 0; i < records.length; i++) {
                        var item = records[i].get();
                        if (! item) continue;

                        item.history.enabled = false;
                        item.unset('components.script.scripts.' + script);
                        item.removeValue('components.script.order', script);
                        item.history.enabled = true;
                    }
                },
                redo: function() {
                    for(var i = 0; i < records.length; i++) {
                        var item = records[i].get();
                        if (! item) continue;

                        item.history.enabled = false;
                        item.set('components.script.scripts.' + script, records[i].data);
                        item.insert('components.script.order', script);
                        item.history.enabled = true;
                    }
                }
            });
        };

        var onAddScriptKeyDown = function(evt) {
            var candidate, found;
            var findFirst = false;
            var direction = '';

            if (evt.keyCode === 40 || (evt.keyCode === 9 && ! evt.shiftKey)) {
                // down
                if (currentFocus) {
                    direction = 'nextSibling';
                } else {
                    findFirst = true;
                }

                evt.preventDefault();
            } else if (evt.keyCode === 38 || (evt.keyCode === 9 && evt.shiftKey)) {
                // up
                if (currentFocus) {
                    direction = 'previousSibling';
                } else {
                    findFirst = true;
                }

                evt.preventDefault();
            } else if (evt.keyCode === 13) {
                // enter
                if (currentFocus) {
                    onScriptAdd(currentFocus.element.script);
                    inputAddScript.elementInput.blur();
                } else {
                    findFirst = true;
                }
            }

            if (findFirst) {
                // try finding first available option
                candidate = autoComplete.innerElement.firstChild;
                found = false;

                while(! found && candidate) {
                    if (candidate.ui && ! candidate.ui.hidden) {
                        found = true;
                        break;
                    }
                    candidate = candidate.nextSibling;
                }

                if (found && candidate && candidate.ui) {
                    currentFocus = candidate.ui;
                    currentFocus.class.add('active');
                }

                if (evt.keyCode === 13) {
                    if (currentFocus)
                        onScriptAdd(currentFocus.ui.element.script);

                    inputAddScript.elementInput.blur();
                }
            } else if (direction) {
                // try finding next or previous available option
                candidate = currentFocus.element[direction];
                found = false;

                while(! found && candidate) {
                    if (candidate.ui && ! candidate.ui.hidden) {
                        found = true;
                        break;
                    }
                    candidate = candidate[direction];
                }
                if (candidate && candidate.ui) {
                    currentFocus.class.remove('active');
                    currentFocus = candidate.ui;
                    currentFocus.class.add('active');
                }
            }
        };
        inputAddScript.elementInput.addEventListener('keydown', onAddScriptKeyDown);

        inputAddScript.on('input:blur', function() {
            if (currentFocus) {
                currentFocus.class.remove('active');
                currentFocus = null;
            }
            autoComplete.hidden = true;
            this.value = '';
        });
        panel.append(inputAddScript);

        inputAddScript.once('destroy', function() {
            inputAddScript.elementInput.removeEventListener('keydown', onAddScriptKeyDown);
        });


        // autocomplete
        var autoComplete = new ui.List();
        autoComplete.empty = true;
        autoComplete.index = { };
        autoComplete.class.add('scripts-autocomplete');
        autoComplete.hidden = true;
        panel.append(autoComplete);

        // script added
        events.push(editor.on('assets:scripts:add', function(asset, script) {
            if (autoComplete.empty || autoComplete.index[script])
                return;

            addScriptAutocompleteItem(script);
        }));

        // script removed
        events.push(editor.on('assets:scripts:remove', function(asset, script) {
            if (autoComplete.empty)
                return;

            if (editor.call('assets:scripts:assetByScript', script))
                return;

            removeScriptAutocompleteItem(script);
        }));


        var panelScripts = editor.call('attributes:addPanel', {
            parent: panel
        });
        panelScripts.hidden = true;
        panelScripts.class.add('scripts');


        var scriptPanelsIndex = { };

        var addScript = function(script) {
            var panel = scriptPanelsIndex[script];
            var events = [ ];

            if (panel) {
                // check if script is still present in all entities
                var complete = true;
                for(var i = 0; i < entities.length; i++) {
                    if (! entities[i].has('components.script.scripts.' + script)) {
                        complete = false;
                        break;
                    }
                }
                panel.header = script + (complete ? '' : ' *');
                return;
            }

            panel = scriptPanelsIndex[script] = new ui.Panel();
            panel.header = script;
            panel.attributesIndex = { };
            panelScripts.append(panel);
            // clean events
            panel.once('destroy', function() {
                for(var i = 0; i < events.length; i++)
                    events[i].unbind();
                events = null;
            });

            // check if script is present in all entities
            for(var i = 0; i < entities.length; i++) {
                if (! entities[i].has('components.script.scripts.' + script)) {
                    panel.header += ' *';
                    break;
                }
            }

            // remove
            var btnRemove = new ui.Button();
            btnRemove.class.add('remove');
            panel.headerAppend(btnRemove);
            btnRemove.on('click', function() {
                // TODO scripts2
                // history script order

                var records = [ ];

                for(var i = 0; i < entities.length; i++) {
                    if (! entities[i].has('components.script.scripts.' + script))
                        continue;

                    records.push({
                        get: entities[i].history._getItemFn,
                        data: entities[i].get('components.script.scripts.' + script)
                    });

                    entities[i].history.enabled = false;
                    entities[i].unset('components.script.scripts.' + script);
                    entities[i].removeValue('components.script.order', script);
                    entities[i].history.enabled = true;
                }

                editor.call('history:add', {
                    name: 'entities.components.script.scripts',
                    undo: function() {
                        for(var i = 0; i < records.length; i++) {
                            var item = records[i].get();
                            if (! item) continue;

                            item.history.enabled = false;
                            item.set('components.script.scripts.' + script, records[i].data);
                            item.insert('components.script.order', script);
                            item.history.enabled = true;
                        }
                    },
                    redo: function() {
                        for(var i = 0; i < records.length; i++) {
                            var item = records[i].get();
                            if (! item) continue;

                            item.history.enabled = false;
                            item.unset('components.script.scripts.' + script);
                            item.removeValue('components.script.order', script);
                            item.history.enabled = true;
                        }
                    }
                });

                removeScript(script);
            });

            // enable/disable
            var fieldEnabled = editor.call('attributes:addField', {
                panel: panel,
                type: 'checkbox',
                link: entities,
                path: 'components.script.scripts.' + script + '.enabled'
            });
            fieldEnabled.class.remove('tick');
            fieldEnabled.class.add('component-toggle');
            fieldEnabled.element.parentNode.removeChild(fieldEnabled.element);
            panel.headerAppend(fieldEnabled);

            // toggle-label
            var labelEnabled = new ui.Label();
            labelEnabled.renderChanges = false;
            labelEnabled.class.add('component-toggle-label');
            panel.headerAppend(labelEnabled);
            labelEnabled.text = fieldEnabled.class.contains('null') ? '?' : (fieldEnabled.value ? 'On' : 'Off');
            fieldEnabled.on('change', function(value) {
                labelEnabled.text = fieldEnabled.class.contains('null') ? '?' : (value ? 'On' : 'Off');
            });

            var scriptAsset = editor.call('assets:scripts:assetByScript', script);

            // invalid sign
            var labelInvalid = new ui.Label({ text: '!' });
            labelInvalid.renderChanges = false;
            labelInvalid.class.add('invalid-script');
            panel.headerAppend(labelInvalid);
            labelInvalid.hidden = !! scriptAsset;

            // invalid tooltip
            var tooltipInvalid = editor.call('attributes:reference', {
                title: 'Invalid',
                description: 'test'
            });
            tooltipInvalid.attach({
                target: panel,
                element: labelInvalid.element
            });

            var updateInvalidTooltip = function() {
                var asset = editor.call('assets:scripts:assetByScript', script);
                var description = '';

                if (editor.call('assets:scripts:collide', script)) {
                    // collision
                    description = 'Multiple script assets define \'' + script + '\' Script Object. Please disable preloading for undesirable script assets.';
                } else {
                    // no script
                    description = 'Script Object \'' + script + '\' is not defined in any preloaded script assets. Set preloading to script asset with desirable script object, or create new script asset with definition of \'' + script + '\' script object.';
                }

                tooltipInvalid.html = editor.call('attributes:reference:template', {
                    title: 'Invalid',
                    description: description
                });
            };
            if (! scriptAsset)
                updateInvalidTooltip();

            panelScripts.hidden = false;

            // primary script changed
            events.push(editor.on('assets:scripts[' + script + ']:primary:set', function(asset) {
                scriptAsset = asset;
                labelInvalid.hidden = true;
            }));
            events.push(editor.on('assets:scripts[' + script + ']:primary:unset', function(asset) {
                scriptAsset = null;
                labelInvalid.hidden = false;
                updateInvalidTooltip();
            }));

            // attribute added
            events.push(editor.on('assets:scripts[' + script + ']:attribute:set', function(asset, name) {
                if (asset !== scriptAsset)
                    return;

                var attribute = scriptAsset.get('data.scripts.' + script + '.attributes.' + name);
                addScriptAttribute(script, name, attribute);
            }));
            // attribute removed
            events.push(editor.on('assets:scripts[' + script + ']:attribute:unset', function(asset, name) {
                if (asset !== scriptAsset)
                    return;

                removeScriptAttribute(script, name);
            }));

            if (scriptAsset) {
                var attributesOrder = scriptAsset.get('data.scripts.' + script + '.attributesOrder');
                if (attributesOrder) {
                    for(var i = 0; i < attributesOrder.length; i++) {
                        var attribute = scriptAsset.get('data.scripts.' + script + '.attributes.' + attributesOrder[i]);
                        addScriptAttribute(script, attributesOrder[i], attribute);
                    }
                }
            }
        };
        var removeScript = function(script) {
            if (! scriptPanelsIndex[script])
                return;

            var complete = true;
            for(var i = 0; i < entities.length; i++) {
                if (entities[i].has('components.script.scripts.' + script)) {
                    complete = false;
                    break;
                }
            }

            var panel = scriptPanelsIndex[script];

            if (! complete) {
                if (panel) panel.header = script + ' *';
                return;
            }

            if (panel) {
                delete scriptPanelsIndex[script];
                panel.destroy();
            }

            if (! panelScripts.innerElement.firstChild)
                panelScripts.hidden = true;
        };
        var addScriptAttribute = function(script, name, attribute) {
            var panelScripts = scriptPanelsIndex[script];
            if (! panelScripts || panelScripts.attributesIndex[name])
                return;

            // console.log(attribute);

            var field = null;
            var panel = new ui.Panel();
            panelScripts.attributesIndex[name] = panel;
            panelScripts.append(panel);

            var type = attributeTypeToUi[attribute.type];
            var subTitle = attributeSubTitles[attribute.type];
            if (attribute.type === 'curve' && attribute.curves && attribute.curves.length > 1)
                subTitle = '{pc.CurveSet}';
            if (attribute.array)
                subTitle = '[ ' + subTitle + ' ]';

            var reference = {
                title: name,
                subTitle: subTitle,
                description: attribute.description || ''
            };

            if (attribute.array) {
                if (attribute.type === 'string') {
                    type = 'strings';
                } else {
                    type = null;
                }
            }

            if (attribute.array && attribute.type === 'asset') {
                field = editor.call('attributes:addAssetsList', {
                    panel: panel,
                    title: attribute.title || name,
                    name: attribute.title || name,
                    reference: reference,
                    type: attribute.assetType || '*',
                    link: entities,
                    path: 'components.script.scripts.' + script + '.attributes.' + name
                });
            } else {
                var min = isNaN(attribute.min) ? undefined : attribute.min;
                var max = isNaN(attribute.max) ? undefined : attribute.max;
                var curves = null;
                if (attribute.type === 'curve') {
                    if (attribute.color) {
                        curves = attribute.color.split('');
                        min = 0;
                        max = 1;
                    } else if (attribute.curves) {
                        curves = attribute.curves;
                    } else {
                        curves = [ 'Value' ];
                    }
                }
                field = editor.call('attributes:addField', {
                    parent: panel,
                    name: attribute.title || name,
                    placeholder: attribute.placeholder || null,
                    reference: reference,
                    type: type,
                    kind: attribute.assetType || '*',
                    link: entities,
                    curves: curves,
                    gradient: !! attribute.color,
                    min: min,
                    max: max,
                    hideRandomize: true,
                    path: 'components.script.scripts.' + script + '.attributes.' + name
                });
            }
        };
        var removeScriptAttribute = function(script, name) {
            var panelScripts = scriptPanelsIndex[script];
            if (! panelScripts || ! panelScripts.attributesIndex[name])
                return;

            panelScripts.attributesIndex[name].destroy();
            delete panelScripts.attributesIndex[name];
        };

        var scripts = { };
        for(var i = 0; i < entities.length; i++) {
            // on script add
            events.push(entities[i].on('components.script.order:insert', function(value) {
                addScript(value);
                calculateExcludeScripts();
            }));

            // on script remove
            events.push(entities[i].on('components.script.order:remove', function(value) {
                removeScript(value);
                calculateExcludeScripts();
            }));

            // TODO scripts2
            // on script move

            var items = entities[i].get('components.script.order');
            if (! items || items.length === 0)
                continue;

            for(var s = 0; s < items.length; s++)
                scripts[items[s]] = true;
        }

        for(var key in scripts) {
            if (! scripts.hasOwnProperty(key))
                continue;

            addScript(key);
        }


        panel.once('destroy', function() {
            for(var i = 0; i < events.length; i++)
                events[i].unbind();

            events = null;
        });
    });
});
