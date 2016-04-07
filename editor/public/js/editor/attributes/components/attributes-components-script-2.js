editor.once('load', function() {
    'use strict';

    if (editor.call('project:settings').get('use_legacy_scripts'))
        return;

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

                records.push({
                    get: entities[i].history._getItemFn
                });

                entities[i].history.enabled = false;
                entities[i].set('components.script.scripts.' + script, { });
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
                        item.set('components.script.scripts.' + script, { });
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
            panelScripts.append(panel);

            // check if script is present in all entities
            for(var i = 0; i < entities.length; i++) {
                if (! entities[i].has('components.script.scripts.' + script)) {
                    panel.header += ' *';
                    break;
                }
            }

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
                        get: entities[i].history._getItemFn
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
                            item.set('components.script.scripts.' + script, { });
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

            panelScripts.hidden = false;
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
