editor.once('load', function() {
    'use strict';

    var scriptAttributeTypes = {
        'number': 'number',
        'string': 'string',
        'boolean': 'checkbox',
        'asset': 'assets', // TEMP
        'rgb': 'rgb',
        'rgba': 'rgb', // TEMP
        'vector': 'vec3',
        'enumeration': 'number',
        'entity': 'entity',
        'curve': 'curveset',
        'colorcurve': 'curveset'
    };

    // index entities with script components
    // so we can easily find them when we need
    // to refresh script attributes
    var entitiesWithScripts = { };

    editor.on('entities:add', function (entity) {
        if (entity.get('components.script'))
            entitiesWithScripts[entity.get('resource_id')] = entity;

        entity.on('components.script:set', function (value) {
            if (! value)
                return;

            entitiesWithScripts[entity.get('resource_id')] = entity;
        });

        entity.on('components.script:unset', function () {
            delete entitiesWithScripts[entity.get('resource_id')];
        });
    });

    editor.on('entities:remove', function (entity) {
        delete entitiesWithScripts[entity.get('resource_id')];
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

        // holds each script panel
        var events = [ ];
        var scriptsIndex = { };


        var urlRegex = /^http(s)?:/;
        var jsRegex = /\.js$/;
        var scriptNameRegex = /^(?:[\w\d\.-]+\/)*[\w\d\.-]+(?:\.[j|J][s|S](?:[o|O][n|N])?)?$/;

        // scripts.add
        var fieldScriptsAdd = editor.call('attributes:addField', {
            parent: panel,
            name: 'Add',
            type: 'string',
            placeholder: 'Script URL'
        });
        fieldScriptsAdd.renderChanges = false;
        fieldScriptsAdd.parent.style.marginBottom = '8px';
        // reference
        editor.call('attributes:reference:script:scripts:attach', fieldScriptsAdd.parent.innerElement.firstChild.ui);

        // autocomplete
        var sourcefiles = editor.call('sourcefiles:get');

        var autocomplete = new ui.AutoCompleteElement();
        autocomplete.items = sourcefiles.map(function (sourcefile) {
            return sourcefile.get('filename');
        });
        autocomplete.attach(fieldScriptsAdd);

        fieldScriptsAdd.element.addEventListener('keydown', function (e) {
            if (autocomplete.isFocused || e.keyCode !== 13 || ! fieldScriptsAdd.value)
                return;

            if (addScript(fieldScriptsAdd.value)) {
                fieldScriptsAdd.value = '';
            } else {
                fieldScriptsAdd.elementInput.select();
            }
        });

        var panelScripts = new ui.Panel();
        panelScripts.class.add('components-scripts');
        panel.append(panelScripts);

        var addScript = function(url) {
            var scriptAdded = false;
            var records = [ ];
            var requestScript = false;

            if (! urlRegex.test(url)) {
                if (! jsRegex.test(url))
                    url += '.js';

                if (! scriptNameRegex.test(url) || url.indexOf('..') >= 0)
                    return false;

                requestScript = true;
            }

            for(var i = 0; i < entities.length; i++) {
                var addScript = true;
                var scripts = entities[i].getRaw('components.script.scripts');
                for(var s = 0; s < scripts.length; s++) {
                    if (scripts[s].get('url') === url) {
                        addScript = false;
                        break;
                    }
                }

                if (addScript) {
                    var script = new Observer({
                        url: url
                    });

                    records.push({
                        get: entities[i].history._getItemFn
                    });

                    entities[i].history.enabled = false;
                    entities[i].insert('components.script.scripts', script);
                    entities[i].history.enabled = true;

                    scriptAdded = true;
                }
            }

            if (requestScript) {
                var fullUrl = editor.call('sourcefiles:url', url);

                // try to get the script and if it doesn't exist create it
                new AjaxRequest({
                    url: fullUrl,
                    notJson: true
                })
                .on('load', function(status, data) {
                    refreshScriptAttributes(url);
                })
                .on('error', function (status) {
                    // script does not exist so create it
                    if (status === 404) {
                        editor.call('sourcefiles:create', url);
                    } else if (status === 0) {
                        // invalid json which is fine because the response is text.
                        // TODO: fix this it's not really an error
                        refreshScriptAttributes(url);
                    }
                });
            } else {
                refreshScriptAttributes(url);
            }

            editor.call('history:add', {
                name: 'entities.components.script.scripts',
                undo: function() {
                    for(var i = 0; i < records.length; i++) {
                        var item = records[i].get();
                        if (! item)
                            continue;

                        var scripts = item.getRaw('components.script.scripts');
                        if (! scripts)
                            continue;

                        for(var s = 0; s < scripts.length; s++) {
                            if (scripts[s].get('url') !== url)
                                continue;

                            item.history.enabled = false;
                            item.removeValue('components.script.scripts', scripts[s]);
                            item.history.enabled = true;
                            break;
                        }
                    }
                },
                redo: function() {
                    for(var i = 0; i < records.length; i++) {
                        var item = records[i].get();
                        if (! item)
                            continue;

                        var addScript = true;
                        var scripts = item.getRaw('components.script.scripts');
                        for(var s = 0; s < scripts.length; s++) {
                            if (scripts[s].get('url') !== url)
                                continue;
                            addScript = false;
                            break;
                        }

                        if (! addScript)
                            continue;

                        var script = new Observer({
                            url: url
                        });

                        item.history.enabled = false;
                        item.insert('components.script.scripts', script);
                        item.history.enabled = true;
                    }

                    refreshScriptAttributes(url);
                }
            });

            return scriptAdded;
        };

        var refreshScriptAttributes = function(url) {
            if (! editor.call('permissions:write'))
                return;

            var fullUrl = urlRegex.test(url) ? url : editor.call('sourcefiles:url', url);

            editor.call('sourcefiles:scan', fullUrl, function (data) {
                data.url = url;

                // merge old attributes with new attributes for all script components with this script
                for (var key in entitiesWithScripts) {
                    var entity = entitiesWithScripts[key];
                    var scripts = entity.getRaw('components.script.scripts');
                    if (! scripts)
                        continue;

                    for (var i = 0; i < scripts.length; i++) {
                        var scriptInstance = scripts[i];
                        if (scriptInstance.get('url') !== url)
                            continue;

                        var oldAttributes = scriptInstance.get('attributes') || { };
                        for (var attributeName in data.attributes) {
                            if (! data.attributes.hasOwnProperty(attributeName))
                                continue;

                            var value = data.attributes[attributeName].defaultValue;
                            if (attributeName in oldAttributes && oldAttributes[attributeName].type === data.attributes[attributeName].type) {
                                value = oldAttributes[attributeName].value !== oldAttributes[attributeName].defaultValue ? oldAttributes[attributeName].value : value;
                            }
                            data.attributes[attributeName].value = value;
                        }

                        // this is not undoable
                        var history = entity.history.enabled;
                        entity.history.enabled = false;
                        entity.getRaw('components.script.scripts.' + i).patch(data);
                        entity.history.enabled = history;
                    }
                }
            });
        };

        var updateAttributeFields = function(script, parent) {
            var attributes = script.get('attributesOrder');
            var children = parent.innerElement.childNodes;
            var list = [ ];
            var index = { };
            var toDestroy = [ ];
            var toCreate = [ ];

            for(var i = 0; i < children.length; i++) {
                var attribute = children[i].ui.attribute;
                var attributeType = children[i].ui.attributeType;
                var attributeUiType = children[i].ui.attributeUiType;

                if (attributes.indexOf(attribute) === -1 || attributeUiType !== script.get('attributes.' + attribute + '.type')) {
                    toDestroy.push(children[i].ui);
                } else {
                    list.push(attribute);
                    index[attribute] = children[i].ui;
                }
            }

            var i = toDestroy.length;
            while(i--) {
                toDestroy[i].destroy();
            }

            if (attributes) {
                for(var i = 0; i < attributes.length; i++) {
                    var ind = list.indexOf(attributes[i]);
                    var panelAttribute = null;

                    if (ind === -1) {
                        // new attibute
                        panelAttribute = createAttributeField(script, attributes[i], parent);
                        list.splice(i, 0, attributes[i]);
                        index[attributes[i]] = panelAttribute;
                    } else if (ind !== i) {
                        // moved attribute
                        panelAttribute = index[attributes[i]];
                        list.splice(ind, 1);
                        list.splice(i, 0, attributes[i]);
                    }

                    if (! panelAttribute)
                        continue;

                    parent.innerElement.removeChild(panelAttribute.element);

                    var ref = null;
                    if (i === 0) {
                        ref = parent.innerElement.firstChild;
                    } else {
                        ref = index[list[i - 1]].element.nextSibling;
                    }

                    if (ref) {
                        parent.innerElement.insertBefore(panelAttribute.element, ref);
                    } else {
                        parent.innerElement.appendChild(panelAttribute.element);
                    }
                }
            }
        };

        var createAttributeField = function(script, attribute, parent) {
            var choices = null;
            attribute = script.get('attributes.' + attribute);

            if (attribute.type === 'enumeration') {
                choices = [ { v: '', t: '...' } ];

                try {
                    for(var e = 0; e < attribute.options.enumerations.length; e++) {
                        choices.push({
                            v: attribute.options.enumerations[e].value,
                            t: attribute.options.enumerations[e].name
                        });
                    }
                } catch(ex) {
                    console.log(ex)
                    console.log('could not recreate enumeration for script attribute, ' + script.get('url'));
                }
            }

            var url = script.get('url');
            var scripts = [ ];
            for(var i = 0; i < entities.length; i++) {
                var items = entities[i].getRaw('components.script.scripts');
                if (! items)
                    continue;

                for(var s = 0; s < items.length; s++) {
                    if (items[s].get('url') === url) {
                        scripts.push(items[s]);
                        break;
                    }
                }
            }

            var field;

            if (scriptAttributeTypes[attribute.type] !== 'assets') {
                var args = {
                    parent: parent,
                    name: attribute.displayName || attribute.name,
                    type: scriptAttributeTypes[attribute.type],
                    enum: choices,
                    link: scripts,
                    path: 'attributes.' + attribute.name + '.value'
                };

                if (attribute.type === 'curve' || attribute.type === 'colorcurve') {
                    // find entity of first script
                    var firstEntity = scripts[0]._parent;
                    while (firstEntity._parent) {
                        firstEntity = firstEntity._parent;
                    }

                    var scriptIndex = firstEntity.getRaw('components.script.scripts').indexOf(scripts[0]);

                    var setCurvePickerArgs = function (options) {
                        if (attribute.type === 'curve') {
                            args.curves = options.curves;
                            args.min = options.min;
                            args.max = options.max;
                            args.gradient = false;
                        } else {
                            args.curves = options.type.split('');
                            args.min = 0;
                            args.max = 1;
                            args.gradient = true;
                        }
                    };

                    setCurvePickerArgs(attribute.options);

                    // use entity as the link for the curve so that history will work as expected
                    args.link = firstEntity;
                    args.path = 'components.script.scripts.' + scriptIndex + '.attributes.' + attribute.name + '.value';
                    args.hideRandomize = true;

                    var curveType = attribute.type;

                    // when argument options change make sure we refresh the curve pickers
                    var evtOptionsChanged = scripts[0].on('attributes.' + attribute.name + '.options:set', function (value, oldValue) {
                        // do this in a timeout to make sure it's done after all of the
                        // attribute fields have been updated like the 'defaultValue' field
                        setTimeout(function () {
                            // argument options changed so get new options and set args
                            var options = value;

                            var prevNumCurves = args.curves.length;

                            setCurvePickerArgs(options);

                            // reset field value which will trigger a refresh of the curve picker as well
                            var attributeValue = scripts[0].get('attributes.' + attribute.name + '.value');
                            if (prevNumCurves !== args.curves.length) {
                                attributeValue = scripts[0].get('attributes.' + attribute.name + '.defaultValue');
                                scripts[0].set('attributes.' + attribute.name + '.value', attributeValue);
                            }

                            field.curveNames = args.curves;
                            field.value = [attributeValue];
                        });
                    });
                    events.push(evtOptionsChanged);

                    // if we change the attribute type then don't listen to options changes
                    var evtTypeChanged = scripts[0].on('attributes.' + attribute.name + '.type:set', function (value) {
                        if (value !== curveType) {
                            evtOptionsChanged.unbind();
                            evtTypeChanged.unbind();
                        }
                    });

                    events.push(evtTypeChanged);
                }

                field = editor.call('attributes:addField', args);

                if (attribute.type === 'curve' || attribute.type === 'colorcurve') {
                    if (entities.length > 1)
                        field.disabled = true;
                }
            }

            if (attribute.type !== 'enumeration' && scriptAttributeTypes[attribute.type] === 'number') {
                field.flexGrow = 1;
                field.style.width = '32px';

                // friction slider
                var slider = editor.call('attributes:addField', {
                    panel: field.parent,
                    min: attribute.options.min || 0,
                    max: attribute.options.max || 1,
                    type: 'number',
                    slider: true,
                    link: scripts,
                    path: 'attributes.' + attribute.name + '.value'
                });
                slider.style.width = '32px';
                slider.flexGrow = 4;

                var evtMin = scripts[0].on('attributes.' + attribute.name + '.options.min:set', function(value) {
                    slider.min = value;
                    slider.hidden = isNaN(scripts[0].get('attributes.' + attribute.name + '.options.min')) || isNaN(scripts[0].get('attributes.' + attribute.name + '.options.max'));
                });
                events.push(evtMin)

                var evtMax = scripts[0].on('attributes.' + attribute.name + '.options.max:set', function(value) {
                    slider.max = value;
                    slider.hidden = isNaN(scripts[0].get('attributes.' + attribute.name + '.options.min')) || isNaN(scripts[0].get('attributes.' + attribute.name + '.options.max'));
                });
                events.push(evtMax);

                var evtMinUnset = scripts[0].on('attributes.' + attribute.name + '.options.min:unset', function() {
                    slider.hidden = true;
                });
                events.push(evtMinUnset);

                var evtMaxUnset = script.on('attributes.' + attribute.name + '.options.max:unset', function() {
                    slider.hidden = true;
                });
                events.push(evtMaxUnset);

                events.push(field.once('destroy', function() {
                    evtMin.unbind();
                    evtMax.unbind();
                    evtMinUnset.unbind();
                    evtMaxUnset.unbind();
                }));
            } else if (scriptAttributeTypes[attribute.type] === 'assets') {
                // assets
                field = editor.call('attributes:addAssetsList', {
                    panel: parent,
                    title: 'Asset',
                    type: attribute.options.type || '*',
                    link: scripts,
                    path: 'attributes.' + attribute.name + '.value'
                });
                field.parent._label.text = attribute.displayName || attribute.name;
            }

            var fieldParent;
            if (field instanceof Array) {
                fieldParent = field[0].parent;
            } else {
                fieldParent = field.parent;
            }

            var evtType = script.on('attributes.' + attribute.name + '.type:set', function(value) {
                setTimeout(function() {
                    updateAttributeFields(script, parent);
                }, 0);
            });
            events.push(evtType);

            events.push(fieldParent.once('destroy', function() {
                evtType.unbind();
            }));

            fieldParent.attribute = attribute.name;
            fieldParent.attributeUiType = scriptAttributeTypes[attribute.type];
            fieldParent.attributeType = attribute.type;

            return fieldParent;
        };

        var createScriptPanel = function(script) {
            var panelScript = scriptsIndex[script.get('url')];
            if (panelScript) {
                panelScript.count++;
                panelScript._link.textContent = (panelScript.count === entities.length ? '' : '* ') + panelScript._originalTitle;
                return;
            }

            panelScript = new ui.Panel(script.get('url'));
            panelScript.class.add('component-script');
            panelScript.count = 1;

            var href = document.createElement('a');

            var url = script.get('url');
            var lowerUrl = url.toLowerCase();
            var isExternalUrl = urlRegex.test(lowerUrl);
            if (! isExternalUrl && ! jsRegex.test(url))
                url += '.js';

            panelScript._originalTitle = script.get('name') || getFilenameFromUrl(url);
            panelScript._link = href;
            href.textContent = (panelScript.count === entities.length ? '' : '* ') + panelScript._originalTitle;
            href.target = '_blank';
            href.href = isExternalUrl ? url : '/editor/code/' + config.project.id + '/' + url;
            panelScript.headerElementTitle.textContent = '';
            panelScript.headerElementTitle.appendChild(href);

            // name change
            events.push(script.on('name:set', function(value) {
                panelScript._originalTitle = value;
                href.textContent = (panelScript.count === entities.length ? '' : '* ') + panelScript._originalTitle;
            }));

            // remove
            var fieldRemoveScript = new ui.Button();
            fieldRemoveScript.parent = panelScript;
            fieldRemoveScript.class.add('remove');
            fieldRemoveScript.on('click', function (value) {
                var records = [ ];

                for(var i = 0; i < entities.length; i++) {
                    entities[i].history.enabled = false;
                    var scripts = entities[i].getRaw('components.script.scripts');
                    for(var s = 0; s < scripts.length; s++) {
                        if (scripts[s].get('url') === script.get('url')) {
                            var data = scripts[s].json();

                            records.push({
                                get: entities[i].history._getItemFn,
                                value: data,
                                ind: s
                            });

                            entities[i].remove('components.script.scripts', s);
                            break;
                        }
                    }
                    entities[i].history.enabled = true;
                }

                delete scriptsIndex[script.get('url')];

                if (! records.length)
                    return;

                editor.call('history:add', {
                    name: 'entities.components.script.scripts',
                    undo: function() {
                        for(var i = 0; i < records.length; i++) {
                            var item = records[i].get();
                            if (! item)
                                continue;

                            var scripts = item.getRaw('components.script.scripts');
                            if (! scripts)
                                continue;

                            var addScript = true;

                            for(var s = 0; s < scripts.length; s++) {
                                if (scripts[s].get('url') === records[i].value.url) {
                                    addScript = false;
                                    break;
                                }
                            }

                            if (! addScript)
                                continue;

                            var script = new Observer(records[i].value);

                            item.history.enabled = false;
                            item.insert('components.script.scripts', script, records[i].ind);
                            item.history.enabled = true;
                        }

                        refreshScriptAttributes(records[0].value.url);
                    },
                    redo: function() {
                        for(var i = 0; i < records.length; i++) {
                            var item = records[i].get();
                            if (! item)
                                continue;

                            var scripts = item.getRaw('components.script.scripts');

                            for(var s = 0; s < scripts.length; s++) {
                                if (scripts[s].get('url') !== records[i].value.url)
                                    continue;

                                item.history.enabled = false;
                                item.removeValue('components.script.scripts', scripts[s]);
                                item.history.enabled = true;
                                break;
                            }
                        }

                        delete scriptsIndex[records[0].value.url];
                    }
                });
            });
            panelScript.headerElement.appendChild(fieldRemoveScript.element);

            // TODO
            // allow reordering scripts if all entities scripts components are identical

            // move down
            var fieldMoveDown = new ui.Button();
            fieldMoveDown.class.add('move-down');
            fieldMoveDown.element.title = 'Move script down';
            fieldMoveDown.on('click', function () {
                var scripts = entities[0].getRaw('components.script.scripts');
                var ind = scripts.indexOf(script);
                if (ind < scripts.length - 1)
                    entities[0].move('components.script.scripts', ind, ind + 1);
            });
            panelScript.headerElement.appendChild(fieldMoveDown.element);
            if (entities.length > 1)
                fieldMoveDown.style.visibility = 'hidden';

            // move up
            var fieldMoveUp = new ui.Button();
            fieldMoveUp.class.add('move-up');
            fieldMoveUp.element.title = 'Move script up';
            fieldMoveUp.on('click', function () {
                var ind = entities[0].getRaw('components.script.scripts').indexOf(script);
                if (ind > 0)
                    entities[0].move('components.script.scripts', ind, ind - 1);
            });
            panelScript.headerElement.appendChild(fieldMoveUp.element);
            if (entities.length > 1)
                fieldMoveUp.style.visibility = 'hidden';

            // refresh attributes
            var fieldRefreshAttributes = new ui.Button();
            fieldRefreshAttributes.class.add('refresh');
            fieldRefreshAttributes.element.title = "Refresh script attributes";
            panelScript.headerElement.appendChild(fieldRefreshAttributes.element);

            fieldRefreshAttributes.on('click', function () {
                refreshScriptAttributes(script.get('url'));
            });

            // attributes panel
            var attributes = new ui.Panel();
            panelScript.append(attributes);

            if (script.has('attributesOrder')) {
                // add attributes if has any
                var order = script.get('attributesOrder');
                if (order) {
                    for(var i = 0; i < order.length; i++) {
                        createAttributeField(script, order[i], attributes);
                    }
                }
            }

            var timerUpdateAttributes = null;
            // when attributes order changed, schedule update
            events.push(script.on('attributesOrder:set', function() {
                if (timerUpdateAttributes)
                    return;

                timerUpdateAttributes = setTimeout(function() {
                    timerUpdateAttributes = null;
                    updateAttributeFields(script, attributes);
                }, 0);
            }));

            return panelScript;
        };

        // Converts URL to script name
        var getFilenameFromUrl = function(url) {
            var filename = url;

            if (jsRegex.test(filename))
                filename = filename.substring(0, filename.length - 3);

            var lastIndexOfSlash = filename.lastIndexOf('/');
            if (lastIndexOfSlash >= 0)
                filename = filename.substring(lastIndexOfSlash + 1, filename.length);

            return filename;
        };

        // add existing scripts and subscribe to scripts Observer list
        for(var i = 0; i < entities.length; i++) {
            var scripts = entities[i].getRaw('components.script.scripts');

            if (scripts) {
                for(var s = 0; s < scripts.length; s++) {
                    var panelScript = createScriptPanel(scripts[s]);
                    if (! panelScript)
                        continue;

                    scriptsIndex[scripts[s].get('url')] = panelScript;
                    panelScripts.append(panelScript);
                }
            }

            // subscribe to scripts:insert
            events.push(entities[i].on('components.script.scripts:insert', function (script, ind) {
                var panelScript = createScriptPanel(script);
                if (! panelScript)
                    return;

                scriptsIndex[script.get('url')] = panelScript;

                var panels = panelScripts.innerElement.childNodes;

                if (ind === panels.length) {
                    // append at the end
                    panelScripts.append(panelScript);
                } else {
                    // append before panel at next index
                    panelScripts.appendBefore(panelScript, panels[ind]);
                }
            }));

            events.push(entities[i].on('components.script.scripts:move', function (value, indNew, indOld) {
                var elementOld = scriptsIndex[this.get('components.script.scripts.' + indOld + '.url')];
                var elementNew = scriptsIndex[value.get('url')];

                panelScripts.innerElement.removeChild(elementNew.element);

                if (indNew > indOld) {
                    if (elementOld.element.nextSibling) {
                        panelScripts.innerElement.insertBefore(elementNew.element, elementOld.element.nextSibling);
                    } else {
                        panelScripts.innerElement.appendChild(elementNew.element);
                    }
                } else {
                    panelScripts.innerElement.insertBefore(elementNew.element, elementOld.element);
                }
            }));

            // subscribe to scripts:remove
            events.push(entities[i].on('components.script.scripts:remove', function (script, ind) {
                var scriptPanel = scriptsIndex[script.get('url')];
                if (! scriptPanel)
                    return;

                scriptPanel.count--;
                scriptPanel._link.textContent = (scriptPanel.count === entities.length ? '' : '* ') + scriptPanel._originalTitle;

                if (scriptPanel.count === 0) {
                    scriptsIndex[script.get('url')].destroy();
                    script.destroy();
                    delete scriptsIndex[script.get('url')];
                }
            }));
        }

        panel.once('destroy', function() {
            for(var i = 0; i < events.length; i++)
                events[i].unbind();
        });
    });
});
