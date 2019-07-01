editor.once('load', function() {
    'use strict';

    if (editor.call('settings:project').get('useLegacyScripts'))
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

    editor.method('assets:scripts:typeToSubTitle', function(attribute) {
        var subTitle = attributeSubTitles[attribute.type];

        if (attribute.type === 'curve') {
            if (attribute.color) {
                if (attribute.color.length > 1)
                    subTitle = '{pc.CurveSet}';
            } else if (attribute.curves && attribute.curves.length > 1) {
                subTitle = '{pc.CurveSet}';
            }
        } else if (attribute.array) {
            subTitle = '[ ' + subTitle + ' ]';
        }

        return subTitle;
    });


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
                if (! scripts)
                    continue;

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


        var createNewScript = function() {
            var filename = editor.call('picker:script-create:validate', inputAddScript.value);

            var onFilename = function(filename) {
                editor.call('assets:create:script', {
                    filename: filename,
                    boilerplate: true,
                    noSelect: true,
                    callback: function(err, asset, result) {
                        if (result && result.scripts) {
                            var keys = Object.keys(result.scripts);
                            if (keys.length === 1)
                                onScriptAdd(keys[0]);
                        }
                    }
                });
            };

            if (filename) {
                onFilename(filename);
            } else {
                editor.call('picker:script-create', onFilename, inputAddScript.value);
            }
        };


        var inputAddScript = new ui.TextField();
        inputAddScript.blurOnEnter = false;
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

                itemAutoCompleteNew.hidden = !! excludeScripts[value] || !! searchIndex[value];
                itemAutoCompleteNew.class.remove('active');

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
                itemAutoCompleteNew.hidden = false;
                itemAutoCompleteNew.class.remove('active');

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

                itemAutoCompleteNew = new ui.ListItem({ text: 'New Script' });
                itemAutoCompleteNew.class.add('new');
                itemAutoCompleteNew.element.addEventListener('mousedown', createNewScript, false);
                autoComplete.append(itemAutoCompleteNew);

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
            autoComplete.appendBefore(item, itemAutoCompleteNew);
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
                    if (currentFocus === itemAutoCompleteNew) {
                        createNewScript();
                    } else {
                        onScriptAdd(currentFocus.element.script);
                    }

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
                    if (currentFocus) {
                        if (currentFocus === itemAutoCompleteNew) {
                            createNewScript();
                        } else {
                            onScriptAdd(currentFocus.ui.element.script);
                        }
                    }

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

        var itemAutoCompleteNew;

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

        // drag is only allowed for single selected entities
        if (entities.length === 1) {
            var dragScript = null;
            var dragScriptInd = null;
            var dragPlaceholder = null;
            var dragInd = null;
            var dragOut = true;
            var dragScripts = [ ];

            // drop area
            var target = editor.call('drop:target', {
                ref: panelScripts.innerElement,
                type: 'component-script-order',
                hole: true,
                passThrough: true
            });
            target.element.style.outline = '1px dotted #f60';
            panelScripts.once('drestroy', function() {
                target.unregister();
            });

            var dragCalculateSizes = function() {
                dragScripts = [ ];
                var children = panelScripts.innerElement.children;

                for(var i = 0; i < children.length; i++) {
                    var script = children[i].ui ? children[i].ui.script : children[i].script;

                    dragScripts.push({
                        script: script,
                        ind: entities[0].get('components.script.order').indexOf(script),
                        y: children[i].offsetTop,
                        height: children[i].clientHeight
                    });
                }
            };
            var onScriptDragStart = function(evt) {
                // dragend
                window.addEventListener('blur', onScriptDragEnd, false);
                window.addEventListener('mouseup', onScriptDragEnd, false);
                window.addEventListener('mouseleave', onScriptDragEnd, false);
                document.body.addEventListener('mouseleave', onScriptDragEnd, false);
                // dragmove
                window.addEventListener('mousemove', onScriptDragMove, false);

                scriptPanelsIndex[dragScript].class.add('dragged');

                dragCalculateSizes();
                for(var i = 0; i < dragScripts.length; i++) {
                    if (dragScripts[i].script === dragScript)
                        dragScriptInd = i;
                }

                var panel = scriptPanelsIndex[dragScript];
                var parent = panel.element.parentNode;
                dragPlaceholder = document.createElement('div');
                dragPlaceholder.script = dragScript;
                dragPlaceholder.classList.add('dragPlaceholder');
                dragPlaceholder.style.height = (dragScripts[dragScriptInd].height - 8) + 'px';
                parent.insertBefore(dragPlaceholder, panel.element);
                parent.removeChild(panel.element);

                onScriptDragMove(evt);

                editor.call('drop:set', 'component-script-order', { script: dragScript });
                editor.call('drop:activate', true);
            };
            var onScriptDragMove = function(evt) {
                if (! dragScript) return;

                var rect = panelScripts.innerElement.getBoundingClientRect();

                dragOut = (evt.clientX < rect.left || evt.clientX > rect.right || evt.clientY < rect.top || evt.clientY > rect.bottom);

                if (! dragOut) {
                    var y = evt.clientY - rect.top;
                    var ind = null;
                    var height = dragPlaceholder.clientHeight;

                    var c = 0;
                    for(var i = 0; i < dragScripts.length; i++) {
                        if (dragScripts[i].script === dragScript) {
                            c = i;
                            break;
                        }
                    }

                    // hovered script
                    for(var i = 0; i < dragScripts.length; i++) {
                        var off = Math.max(0, dragScripts[i].height - height);
                        if (c < i) {
                            if (y >= (dragScripts[i].y + off) && y <= (dragScripts[i].y + dragScripts[i].height)) {
                                ind = i;
                                if (ind > dragScriptInd) ind++;
                                break;
                            }
                        } else {
                            if (y >= dragScripts[i].y && y <= (dragScripts[i].y + dragScripts[i].height - off)) {
                                ind = i;
                                if (ind > dragScriptInd) ind++;
                                break;
                            }
                        }
                    }

                    if (ind !== null && dragInd !== ind) {
                        dragInd = ind;

                        var parent = dragPlaceholder.parentNode;
                        parent.removeChild(dragPlaceholder);

                        var ind = dragInd;
                        if (ind > dragScriptInd) ind--;
                        var next = parent.children[ind];

                        if (next) {
                            parent.insertBefore(dragPlaceholder, next);
                        } else {
                            parent.appendChild(dragPlaceholder);
                        }

                        dragCalculateSizes();
                    }
                } else {
                    dragInd = dragScriptInd;
                    var parent = dragPlaceholder.parentNode;
                    parent.removeChild(dragPlaceholder);
                    var next = parent.children[dragScriptInd];
                    if (next) {
                        parent.insertBefore(dragPlaceholder, next);
                    } else {
                        parent.appendChild(dragPlaceholder);
                    }
                    dragCalculateSizes();
                }
            };
            var onScriptDragEnd = function() {
                // dragend
                window.removeEventListener('blur', onScriptDragEnd);
                window.removeEventListener('mouseup', onScriptDragEnd);
                window.removeEventListener('mouseleave', onScriptDragEnd);
                document.body.removeEventListener('mouseleave', onScriptDragEnd);
                // dragmove
                window.removeEventListener('mousemove', onScriptDragMove);

                if (dragScript) {
                    scriptPanelsIndex[dragScript].class.remove('dragged');

                    var panel = scriptPanelsIndex[dragScript];
                    panelScripts.innerElement.removeChild(dragPlaceholder);
                    var next = panelScripts.innerElement.children[dragScriptInd];
                    if (next) {
                        panelScripts.innerElement.insertBefore(panel.element, next);
                    } else {
                        panelScripts.innerElement.appendChild(panel.element);
                    }

                    if (! dragOut && dragInd !== null && dragInd !== dragScriptInd && dragInd !== (dragScriptInd + 1)) {
                        var ind = dragInd;
                        if (ind > dragScriptInd) ind--;
                        entities[0].move('components.script.order', dragScriptInd, ind);
                    }
                }

                dragScript = null;
                dragScripts = [ ];
                dragInd = null;

                editor.call('drop:activate', false);
                editor.call('drop:set');
            };
        }

        var addScript = function(script, ind) {
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
            panel.foldable = true;
            panel.script = script;
            panel.header = script;
            panel.attributesIndex = { };

            var next = null;
            if (typeof(ind) === 'number')
                next = panelScripts.innerElement.children[ind];

            if (next) {
                panelScripts.appendBefore(panel, next);
            } else {
                panelScripts.append(panel);
            }

            // clean events
            panel.once('destroy', function() {
                for(var i = 0; i < events.length; i++)
                    events[i].unbind();
                events = null;
            });

            // drag handle
            if (entities.length === 1) {
                panel.handle = document.createElement('div');
                panel.handle.classList.add('handle');
                panel.handle.addEventListener('mousedown', function(evt) {
                    evt.stopPropagation();
                    evt.preventDefault();

                    dragScript = script;
                    onScriptDragStart(evt);
                    tooltipHandle.hidden = true;
                }, false);
                panel.headerAppend(panel.handle);

                // tooltip
                var tooltipHandle = Tooltip.attach({
                    target: panel.handle,
                    text: 'Drag',
                    align: 'right',
                    root: editor.call('layout.root')
                });
                panel.once('destroy', function() {
                    tooltipHandle.destroy();
                });
            }

            // check if script is present in all entities
            for(var i = 0; i < entities.length; i++) {
                if (! entities[i].has('components.script.scripts.' + script)) {
                    panel.header += ' *';
                    break;
                }
            }

            panel.headerElementTitle.addEventListener('click', function() {
                if (! panel.headerElementTitle.classList.contains('link'))
                    return;

                editor.call('selector:set', 'asset', [ scriptAsset ]);
            });

            // edit
            var btnEdit = new ui.Button({
                text: '&#57648;'
            });
            btnEdit.class.add('edit');
            panel.headerAppend(btnEdit);
            btnEdit.on('click', function() {
                editor.call('assets:edit', scriptAsset);
            });
            btnEdit.hidden = editor.call('assets:scripts:collide', script) || ! editor.call('assets:scripts:assetByScript', script);
            // tooltip
            var tooltipEdit = Tooltip.attach({
                target: btnEdit.element,
                text: 'Edit',
                align: 'bottom',
                root: editor.call('layout.root')
            });
            btnEdit.once('destroy', function() {
                tooltipEdit.destroy();
            });

            // edit
            var btnParse = new ui.Button({
                text: '&#57640;'
            });
            btnParse.class.add('parse');
            panel.headerAppend(btnParse);
            btnParse.on('click', function() {
                btnParse.disabled = true;
                editor.call('scripts:parse', scriptAsset, function(err, result) {
                    btnParse.disabled = false;
                    if (err) {
                        btnParse.class.add('error');
                    } else {
                        btnParse.class.remove('error');
                    }
                });
            });
            btnParse.hidden = editor.call('assets:scripts:collide', script) || ! editor.call('assets:scripts:assetByScript', script);
            // tooltip
            var tooltipParse = Tooltip.attach({
                target: btnParse.element,
                text: 'Parse',
                align: 'bottom',
                root: editor.call('layout.root')
            });
            btnParse.once('destroy', function() {
                tooltipParse.destroy();
            });

            // remove
            var btnRemove = new ui.Button();
            btnRemove.class.add('remove');
            panel.headerAppend(btnRemove);
            btnRemove.on('click', function() {
                var records = [ ];

                for(var i = 0; i < entities.length; i++) {
                    if (! entities[i].has('components.script.scripts.' + script))
                        continue;

                    records.push({
                        get: entities[i].history._getItemFn,
                        ind: entities[i].get('components.script.order').indexOf(script),
                        data: entities[i].get('components.script.scripts.' + script)
                    });
                }

                for(var i = 0; i < records.length; i++) {
                    var entity = records[i].get();
                    entity.history.enabled = false;
                    entity.unset('components.script.scripts.' + script);
                    entity.removeValue('components.script.order', script);
                    entity.history.enabled = true;
                }

                editor.call('history:add', {
                    name: 'entities.components.script.scripts',
                    undo: function() {
                        for(var i = 0; i < records.length; i++) {
                            var item = records[i].get();
                            if (! item) continue;

                            item.history.enabled = false;
                            item.set('components.script.scripts.' + script, records[i].data);
                            item.insert('components.script.order', script, records[i].ind);
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
            // tooltip
            var tooltipRemove = Tooltip.attach({
                target: btnRemove.element,
                text: 'Remove',
                align: 'bottom',
                root: editor.call('layout.root')
            });
            btnRemove.once('destroy', function() {
                tooltipRemove.destroy();
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

            if (scriptAsset)
                panel.headerElementTitle.classList.add('link');

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
                    description = '\'' + script + '\' Script Object is defined in multiple preloaded assets. Please uncheck preloading for undesirable script assets.';
                } else {
                    // no script
                    description = '\'' + script + '\' Script Object is not defined in any of preloaded script assets.';
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
                btnEdit.hidden = btnParse.hidden = false;
                panel.headerElementTitle.classList.add('link');
            }));
            events.push(editor.on('assets:scripts[' + script + ']:primary:unset', function(asset) {
                scriptAsset = null;
                labelInvalid.hidden = false;
                btnEdit.hidden = btnParse.hidden = true;
                panel.headerElementTitle.classList.remove('link');
                updateInvalidTooltip();
            }));

            // attribute added
            events.push(editor.on('assets:scripts[' + script + ']:attribute:set', function(asset, name, ind) {
                if (asset !== scriptAsset)
                    return;

                var attribute = scriptAsset.get('data.scripts.' + script + '.attributes.' + name);
                addScriptAttribute(script, name, attribute, ind);
            }));
            // attribute change
            events.push(editor.on('assets:scripts[' + script + ']:attribute:change', function(asset, name, attribute, old) {
                if (asset !== scriptAsset)
                    return;

                updateScriptAttribute(script, name, attribute, old);
            }));
            // attribute move
            events.push(editor.on('assets:scripts[' + script + ']:attribute:move', function(asset, name, ind, indOld) {
                if (asset !== scriptAsset)
                    return;

                moveScriptAttribute(script, name, ind, indOld);
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
        var addScriptAttribute = function(script, name, attribute, ind) {
            var panelScripts = scriptPanelsIndex[script];
            if (! panelScripts || panelScripts.attributesIndex[name])
                return;

            var panel = new ui.Panel();
            panel.field = null;
            panel.args = null;
            panelScripts.attributesIndex[name] = panel;

            var next = null;
            if (typeof(ind) === 'number')
                next = panelScripts.innerElement.children[ind];

            if (next) {
                panelScripts.appendBefore(panel, next);
            } else {
                panelScripts.append(panel);
            }

            var type = attributeTypeToUi[attribute.type];

            var reference = {
                title: name,
                subTitle: editor.call('assets:scripts:typeToSubTitle', attribute),
                description: attribute.description || ''
            };

            var min = typeof(attribute.min) === 'number' ? attribute.min : undefined;
            var max = typeof(attribute.max) === 'number' ? attribute.max : undefined;
            var curves = null;
            var choices = null;
            if (attribute.type === 'curve') {
                if (attribute.color) {
                    if ((attribute.color === 'rgb') || (attribute.color === 'rgba')) {
                        type = 'gradient';
                    }
                    curves = attribute.color.split('');
                    min = 0;
                    max = 1;
                } else if (attribute.curves) {
                    curves = attribute.curves;
                } else {
                    curves = [ 'Value' ];
                }
            }

            if (attribute.enum) {
                choices = [ { v: '', t: '...' } ];
                for(var i = 0; i < attribute.enum.order.length; i++) {
                    var key = attribute.enum.order[i];
                    choices.push({
                        v: attribute.enum.options[key],
                        t: key
                    });
                }
            }

            if (attribute.array) {
                panel.field = editor.call('attributes:addArrayField', {
                    panel: panel,
                    name: attribute.title || name,
                    placeholder: attribute.placeholder || null,
                    reference: reference,
                    type: type,
                    default: attribute.default,
                    kind: attribute.assetType || '*',
                    link: entities,
                    enum: choices,
                    curves: curves,
                    gradient: !! attribute.color,
                    precision: attribute.precision,
                    step: attribute.step,
                    min: min,
                    max: max,
                    hideRandomize: true,
                    path: 'components.script.scripts.' + script + '.attributes.' + name
                });
            } else {
                panel.args = {
                    parent: panel,
                    name: attribute.title || name,
                    placeholder: attribute.placeholder || null,
                    reference: reference,
                    type: type,
                    kind: attribute.assetType || '*',
                    link: entities,
                    enum: choices,
                    curves: curves,
                    gradient: !! attribute.color,
                    min: min,
                    max: max,
                    precision: attribute.precision,
                    step: attribute.step,
                    hideRandomize: true,
                    path: 'components.script.scripts.' + script + '.attributes.' + name
                };
                panel.field = editor.call('attributes:addField', panel.args);

                if (type === 'number') {
                    panel.slider = editor.call('attributes:addField', {
                        panel: panel.field.parent,
                        type: 'number',
                        slider: true,
                        link: entities,
                        min: min,
                        max: max,
                        precision: attribute.precision,
                        step: attribute.step,
                        path: 'components.script.scripts.' + script + '.attributes.' + name
                    });
                    panel.field.flexGrow = 1;
                    panel.field.style.width = '32px';
                    panel.slider.style.width = '32px';
                    panel.slider.flexGrow = 4;

                    panel.slider.update = function() {
                        panel.slider.hidden = (typeof(panel.args.max) !== 'number' || typeof(panel.args.min) !== 'number');
                        if (! panel.slider.hidden) {
                            panel.slider.max = panel.args.max;
                            panel.slider.min = panel.args.min;
                        }
                    };
                    panel.slider.update();
                }
            }

            return panel;
        };
        var removeScriptAttribute = function(script, name) {
            var panelScripts = scriptPanelsIndex[script];
            if (! panelScripts || ! panelScripts.attributesIndex[name])
                return;

            panelScripts.attributesIndex[name].destroy();
            delete panelScripts.attributesIndex[name];
        };
        var updateScriptAttribute = function(script, name, value, old) {
            var panelScripts = scriptPanelsIndex[script];
            if (! panelScripts) return;

            var panel = panelScripts.attributesIndex[name];
            if (! panel) return;

            var changed = false;
            if (value.type !== old.type)
                changed = true;

            if (! changed && !! value.array !== !! old.array)
                changed = true;

            if (! changed && typeof(value.enum) !== typeof(old.enum))
                changed = true;

            if (! changed && typeof(value.enum) === 'object' && ! value.enum.order.equals(old.enum.order))
                changed = true;

            if (! changed && typeof(value.enum) === 'object') {
                for(var i = 0; i < value.enum.order.length; i++) {
                    if (value.enum.options[value.enum.order[i]] !== old.enum.options[value.enum.order[i]]) {
                        changed = true;
                        break;
                    }
                }
            }

            if (! changed && value.type === 'curve' && typeof(value.color) !== typeof(old.color))
                changed = true;

            if (! changed && value.type === 'curve' && typeof(value.color) !== 'string' && typeof(value.curves) !== typeof(old.curves))
                changed = true;

            if (! changed) {
                var changeTooltip = false;

                var label = null;
                if (panel.field instanceof Array) {
                    label = panel.field[0].parent._label;
                } else {
                    label = panel.field.parent._label;
                }

                if (value.title !== old.title) {
                    changeTooltip = true;
                    label.text = value.title || name;
                }
                if (value.description !== old.description) {
                    changeTooltip = true;
                }
                if (value.placeholder !== old.placeholder) {
                    if (panel.field instanceof Array) {
                        if (value.placeholder instanceof Array && value.placeholder.length === panel.field.length) {
                            for(var i = 0; i < panel.field.length; i++) {
                                panel.field[i].placeholder = value.placeholder[i];
                            }
                        } else {
                            for(var i = 0; i < panel.field.length; i++) {
                                panel.field[i].placeholder = null;
                            }
                        }
                    } else {
                        panel.field.placeholder = value.placeholder;
                    }
                }
                if (value.min !== old.min) {
                    panel.args.min = value.min;
                    if (value.type === 'number') {
                        panel.field.min = value.min;
                        panel.slider.update();
                    }
                }
                if (value.max !== old.max) {
                    panel.args.max = value.max;
                    if (value.type === 'number') {
                        panel.field.max = value.max;
                        panel.slider.update();
                    }
                }
                if (value.assetType !== old.assetType)
                    panel.args.kind = value.assetType;

                if (changeTooltip) {
                    label._tooltip.html = editor.call('attributes:reference:template', {
                        title: name,
                        subTitle: editor.call('assets:scripts:typeToSubTitle', value),
                        description: value.description
                    });
                }
            }

            if (changed) {
                var next = panel.element.nextSibling;
                removeScriptAttribute(script, name);
                var panel = addScriptAttribute(script, name, value);

                // insert at same location
                if (next) {
                    var parent = panel.element.parentNode;
                    parent.removeChild(panel.element);
                    parent.insertBefore(panel.element, next);
                }
            }
        };

        var moveScriptAttribute = function(script, name, ind, indOld) {
            var panelScripts = scriptPanelsIndex[script];
            if (! panelScripts) return;

            var panel = panelScripts.attributesIndex[name];
            if (! panel) return;

            var parent = panel.element.parentNode;
            parent.removeChild(panel.element);

            var next = parent.children[ind];
            if (next) {
                parent.insertBefore(panel.element, next);
            } else {
                parent.appendChild(panel.element);
            }
        };

        var scripts = { };
        for(var i = 0; i < entities.length; i++) {
            // on script add
            events.push(entities[i].on('components.script.order:insert', function(value, ind) {
                addScript(value, ind);
                calculateExcludeScripts();
            }));

            // on script remove
            events.push(entities[i].on('components.script.order:remove', function(value) {
                removeScript(value);
                calculateExcludeScripts();
            }));

            // on script component set
            events.push(entities[i].on('components.script:set', function(value) {
                if (! value || ! value.order || ! value.order.length)
                    return;

                for(var i = 0; i < value.order.length; i++) {
                    addScript(value.order[i], i);
                    calculateExcludeScripts();
                }
            }));

            // on script component unset
            events.push(entities[i].on('components.script:unset', function(value) {
                if (! value || ! value.order || ! value.order.length)
                    return;

                for(var i = 0; i < value.order.length; i++) {
                    removeScript(value.order[i]);
                    calculateExcludeScripts();
                }
            }));

            // on script move
            if (entities.length === 1) {
                events.push(entities[i].on('components.script.order:move', function(value, ind, indOld) {
                    var panel = scriptPanelsIndex[value];
                    if (! panel) return;

                    var parent = panel.element.parentNode;
                    parent.removeChild(panel.element);

                    var next = parent.children[ind];
                    if (next) {
                        parent.insertBefore(panel.element, next);
                    } else {
                        parent.appendChild(panel.element);
                    }
                }));
            }

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
