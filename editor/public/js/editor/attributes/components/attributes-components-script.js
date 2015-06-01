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
        'enumeration': 'number'
    };

    // index entities with script components
    // so we can easily find them when we need
    // to refresh script attributes
    var entitiesWithScripts = {};

    editor.on('entities:add', function (entity) {
        if (entity.get('components.script')) {
            entitiesWithScripts[entity.get('resource_id')] = entity;
        }

        entity.on('components.script:set', function (value) {
            if (value) {
                entitiesWithScripts[entity.get('resource_id')] = entity;
            }
        });

        entity.on('components.script:unset', function () {
            delete entitiesWithScripts[entity.get('resource_id')];
        });
    });

    editor.on('entities:remove', function (entity) {
        delete entitiesWithScripts[entity.get('resource_id')];
    });

    editor.on('attributes:inspect[entity]', function(entities) {
        if (entities.length !== 1)
            return;

        var entity = entities[0];

        var panelComponents = editor.call('attributes:entity.panelComponents');
        if (! panelComponents)
            return;

        // holds each script panel
        var scriptPanels = [];

        // script
        var panel = editor.call('attributes:addPanel', {
            parent: panelComponents,
            name: 'Scripts'
        });
        panel.class.add('component', 'entity', 'script');
        // reference
        editor.call('attributes:reference:script:attach', panel, panel.headerElementTitle);

        if (! entity.get('components.script')) {
            panel.disabled = true;
            panel.hidden = true;
        }

        var events = [ ];
        events.push(entity.on('components.script:set', function(value) {
            panel.disabled = ! value;
            panel.hidden = ! value;
        }));

        events.push(entity.on('components.script:unset', function() {
            panel.disabled = true;
            panel.hidden = true;

            scriptPanels.forEach(function(p) {
                p.destroy();
            });

            scriptPanels.length = 0;
        }));

        panel.on('destroy', function() {
            events.forEach(function (e) {
                e.unbind();
            });
        });


        // remove
        var fieldRemove = new ui.Button();
        fieldRemove.class.add('component-remove');
        fieldRemove.on('click', function(value) {
            entity.unset('components.script');
        });
        panel.headerAppend(fieldRemove);

        // enabled
        var fieldEnabled = new ui.Checkbox();
        fieldEnabled.class.add('component-toggle');
        fieldEnabled.link(entity, 'components.script.enabled');
        panel.headerAppend(fieldEnabled);

        // toggle-label
        var labelEnabled = new ui.Label();
        labelEnabled.renderChanges = false;
        labelEnabled.class.add('component-toggle-label');
        panel.headerAppend(labelEnabled);
        labelEnabled.text = fieldEnabled.value ? 'On' : 'Off';
        fieldEnabled.on('change', function(value) {
            labelEnabled.text = value ? 'On' : 'Off';
        });


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
        // reference
        editor.call('attributes:reference:script:scripts:attach', fieldScriptsAdd.parent.innerElement.firstChild.ui);

        fieldScriptsAdd.renderChanges = false;

        fieldScriptsAdd.parent.style.marginBottom = '8px';

        // autocomplete
        var sourcefiles = editor.call('sourcefiles:get');

        var autocomplete = new ui.AutoCompleteElement();
        autocomplete.items = sourcefiles.map(function (sourcefile) {
            return sourcefile.get('filename');
        });

        autocomplete.attach(fieldScriptsAdd);

        fieldScriptsAdd.element.addEventListener('keydown', function (e) {
            if (e.keyCode === 13 && !autocomplete.isFocused) {
                if (fieldScriptsAdd.value) {
                    if (addScript(fieldScriptsAdd.value)) {
                        fieldScriptsAdd.value = '';
                    } else {
                        fieldScriptsAdd.elementInput.select();
                    }

                }
            }
        });

        var panelScripts = new ui.Panel();
        panelScripts.class.add('components-scripts');
        panel.append(panelScripts);

        function addScript (url) {
            var script, scripts;

            if (urlRegex.test(url)) {
                // check if url already exists first
                scripts = entity.getRaw('components.script.scripts');
                for (var i = 0; i < scripts.length; i++) {
                    if (scripts[i].get('url') === url)
                        return false;
                }

                script = new Observer({
                    url: url
                });
                entity.insert('components.script.scripts', script);

                refreshScriptAttributes(script.get('url'));
            } else {
                if (! jsRegex.test(url))
                    url += '.js';

                if (! scriptNameRegex.test(url) || url.indexOf('..') >= 0)
                    return false;

                // check if url already exists first
                scripts = entity.getRaw('components.script.scripts');
                for (var i = 0; i < scripts.length; i++) {
                    if (scripts[i].get('url') === url)
                        return false;
                }

                var fullUrl = editor.call('sourcefiles:url', url);

                script = new Observer({
                    url: url
                });
                entity.insert('components.script.scripts', script);

                // try to get the script and if it doesn't exist create it
                new AjaxRequest({
                    url: fullUrl,
                    notJson: true
                })
                .on('load', function(status, data) {
                    refreshScriptAttributes(script.get('url'));
                })
                .on('error', function (status) {
                    // script does not exist so create it
                    if (status === 404) {
                        editor.call('sourcefiles:create', url);
                    } else if (status === 0) {
                        // invalid json which is fine because the response is text.
                        // TODO: fix this it's not really an error
                        refreshScriptAttributes(script.get('url'));
                    }
                });
            }

            return true;
        }

        function refreshScriptAttributes (url) {
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
        }

        function updateAttributeFields(script, parent) {
            var attributes = script.get('attributesOrder');
            var children = parent.innerElement.childNodes;
            var list = [ ];
            var index = { };
            var toDestroy = [ ];
            var toCreate = [ ];

            for(var i = 0; i < children.length; i++) {
                var attribute = children[i].ui.attribute;
                var attributeType = children[i].ui.attributeType;

                if (attributes.indexOf(attribute) === -1 || attributeType !== scriptAttributeTypes[script.get('attributes.' + attribute + '.type')]) {
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
                    var panel = null;

                    if (ind === -1) {
                        // new attibute
                        panel = createAttributeField(script, attributes[i], parent);
                        list.splice(i, 0, attributes[i]);
                        index[attributes[i]] = panel;
                    } else if (ind !== i) {
                        // moved attribute
                        panel = index[attributes[i]];
                        list.splice(ind, 1);
                        list.splice(i, 0, attributes[i]);
                    }

                    if (! panel)
                        continue;

                    parent.innerElement.removeChild(panel.element);

                    var ref = null;
                    if (i === 0) {
                        ref = parent.innerElement.firstChild;
                    } else {
                        ref = index[list[i - 1]].element.nextSibling;
                    }

                    if (ref) {
                        parent.innerElement.insertBefore(panel.element, ref);
                    } else {
                        parent.innerElement.appendChild(panel.element);
                    }
                }
            }
        };

        function createAttributeField(script, attribute, parent) {
            var choices = null;
            attribute = script.get('attributes.' + attribute);

            if (attribute.type === 'enumeration') {
                choices = { };
                try {
                    for(var e = 0; e < attribute.options.enumerations.length; e++) {
                        choices[attribute.options.enumerations[e].value] = attribute.options.enumerations[e].name;
                    }
                } catch(ex) {
                    console.log(ex)
                    console.log('could not recreate enumeration for script attribute, ' + script.get('url'));
                }
            }

            var field = editor.call('attributes:addField', {
                parent: parent,
                name: attribute.displayName,
                type: scriptAttributeTypes[attribute.type],
                enum: choices,
                link: script,
                path: 'attributes.' + attribute.name + '.value'
            });

            if (scriptAttributeTypes[attribute.type] === 'number') {
                field.flexGrow = 1;
                field.style.width = '32px';

                var slider = new ui.Slider({
                    min: attribute.options.min || 0,
                    max: attribute.options.max || 1
                });
                slider.hidden = isNaN(attribute.options.min) || isNaN(attribute.options.max);
                slider.flexGrow = 4;
                slider.style.width = '32px';
                slider.link(script, 'attributes.' + attribute.name + '.value');
                field.parent.append(slider);

                var evtMin = script.on('attributes.' + attribute.name + '.options.min:set', function(value) {
                    slider.min = value;
                    slider.hidden = isNaN(script.get('attributes.' + attribute.name + '.options.min')) || isNaN(script.get('attributes.' + attribute.name + '.options.max'));
                });
                events.push(evtMin);

                var evtMax = script.on('attributes.' + attribute.name + '.options.max:set', function(value) {
                    slider.max = value;
                    slider.hidden = isNaN(script.get('attributes.' + attribute.name + '.options.min')) || isNaN(script.get('attributes.' + attribute.name + '.options.max'));
                });
                events.push(evtMax);

                var evtMinUnset = script.on('attributes.' + attribute.name + '.options.min:unset', function() {
                    slider.hidden = true;
                });
                events.push(evtMinUnset);

                var evtMaxUnset = script.on('attributes.' + attribute.name + '.options.max:unset', function() {
                    slider.hidden = true;
                });
                events.push(evtMaxUnset);

                events.push(field.once('destroy', function() {
                    evtType.unbind();
                    evtMin.unbind();
                    evtMax.unbind();
                    evtMinUnset.unbind();
                    evtMaxUnset.unbind();
                }));
            } else if (scriptAttributeTypes[attribute.type] === 'assets') {
                field.unlink();

                // assets
                var fieldAssetsList = new ui.List();
                fieldAssetsList.class.add('assets');
                fieldAssetsList.flexGrow = 1;
                field.parent.append(fieldAssetsList);
                field.destroy();
                field = fieldAssetsList;

                // drop
                var dropRef = editor.call('drop:target', {
                    ref: fieldAssetsList.element,
                    filter: function(type, data) {
                        return type.startsWith('asset') && script.get('attributes.' + attribute.name + '.value').indexOf(data.id) === -1 && (! attribute.options.type || (editor.call('assets:get', data.id).get('type') === attribute.options.type));
                    },
                    drop: function(type, data) {
                        // already in list
                        if (script.get('attributes.' + attribute.name + '.value').indexOf(data.id) !== -1)
                            return;

                        // script type
                        if (attribute.options.type && editor.call('assets:get', data.id).get('type') !== attribute.options.type)
                            return;

                        // add to component
                        script.insert('attributes.' + attribute.name + '.value', data.id, 0);
                    }
                });
                events.push(fieldAssetsList.on('destroy', function() {
                    dropRef.unregister();
                }));

                // assets list
                var itemAdd = new ui.ListItem({
                    text: 'Add Asset'
                });
                itemAdd.class.add('add-asset');
                fieldAssetsList.append(itemAdd);

                // add asset icon
                var iconAdd = document.createElement('span');
                iconAdd.classList.add('icon');
                itemAdd.element.appendChild(iconAdd);

                // index list items by asset id
                var assetItems = { };

                // add asset
                var addAsset = function(assetId, after) {
                    var asset = editor.call('assets:get', assetId);
                    var text = assetId;
                    if (asset && asset.get('name'))
                        text = asset.get('name');

                    var item = new ui.ListItem({
                        text: text
                    });

                    if (after) {
                        fieldAssetsList.appendAfter(item, after);
                    } else {
                        fieldAssetsList.append(item);
                    }

                    assetItems[assetId] = item;

                    // remove button
                    var btnRemove = new ui.Button();
                    btnRemove.class.add('remove');
                    btnRemove.on('click', function() {
                        script.removeValue('attributes.' + attribute.name + '.value', assetId);
                    });
                    btnRemove.parent = item;
                    item.element.appendChild(btnRemove.element);
                };

                // on adding new asset
                itemAdd.on('click', function() {
                    // call picker
                    editor.call('picker:asset', attribute.options.type ? attribute.options.type : '*', null);

                    // on pick
                    var evtPick = editor.once('picker:asset', function(asset) {
                        // already in list
                        if (script.get('attributes.' + attribute.name + '.value').indexOf(asset.get('id')) !== -1)
                            return;

                        // script type
                        if (attribute.options.type && asset.get('type') !== attribute.options.type)
                            return;

                        // add to component
                        script.insert('attributes.' + attribute.name + '.value', asset.get('id'), 0);
                        evtPick = null;
                    });

                    editor.once('picker:asset:close', function() {
                        if (evtPick) {
                            evtPick.unbind();
                            evtPick = null;
                        }
                    });
                });

                // assets
                var assets = script.get('attributes.' + attribute.name + '.value');
                if (assets) {
                    for(var i = 0; i < assets.length; i++) {
                        addAsset(assets[i]);
                    }
                }
                // on asset insert
                var evtAssetInsert = script.on('attributes.' + attribute.name + '.value:insert', function(assetId, ind) {
                    var before;
                    if (ind === 0) {
                        before = itemAdd;
                    } else {
                        before = assetItems[script.get('attributes.' + attribute.name + '.value.' + ind)];
                    }
                    addAsset(assetId, before);
                });
                events.push(evtAssetInsert);

                // on asset remove
                var evtAssetRemove = script.on('attributes.' + attribute.name + '.value:remove', function(assetId) {
                    if (! assetItems[assetId])
                        return;

                    assetItems[assetId].destroy();
                });
                events.push(evtAssetRemove);

                events.push(field.parent.once('destroy', function() {
                    evtAssetInsert.unbind();
                    evtAssetRemove.unbind();
                }));
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
            fieldParent.attributeType = scriptAttributeTypes[attribute.type];

            return fieldParent;
        };

        function createScriptPanel(script) {
            var panel = new ui.Panel(script.get('url'));
            panel.class.add('component-script');

            var link = document.createElement('a');

            var url = script.get('url');
            var lowerUrl = url.toLowerCase();
            var isExternalUrl = urlRegex.test(lowerUrl);
            if (! isExternalUrl && ! jsRegex.test(url))
                url += '.js';

            var title = script.get('name') || getFilenameFromUrl(url);
            link.textContent = title;
            link.target = '_blank';
            link.href = isExternalUrl ? url : '/editor/code/' + config.project.id + '/' + url;
            panel.headerElementTitle.textContent = '';
            panel.headerElementTitle.appendChild(link);

            // name change
            events.push(script.on('name:set', function(value) {
                link.textContent = value;
            }));

            // remove
            var fieldRemoveScript = new ui.Button();
            fieldRemoveScript.parent = panel;
            fieldRemoveScript.class.add('remove');
            fieldRemoveScript.on('click', function (value) {
                entity.removeValue('components.script.scripts', script);
            });
            panel.headerElement.appendChild(fieldRemoveScript.element);

            // move down
            var fieldMoveDown = new ui.Button();
            fieldMoveDown.class.add('move-down');
            fieldMoveDown.element.title = 'Move script down';
            fieldMoveDown.on('click', function () {
                var scripts = entity.getRaw('components.script.scripts');
                var ind = scripts.indexOf(script);
                if (ind < scripts.length - 1)
                    entity.move('components.script.scripts', ind, ind + 1);
            });
            panel.headerElement.appendChild(fieldMoveDown.element);

            // move up
            var fieldMoveUp = new ui.Button();
            fieldMoveUp.class.add('move-up');
            fieldMoveUp.element.title = 'Move script up';
            fieldMoveUp.on('click', function () {
                var ind = entity.getRaw('components.script.scripts').indexOf(script);
                if (ind > 0)
                    entity.move('components.script.scripts', ind, ind - 1);
            });
            panel.headerElement.appendChild(fieldMoveUp.element);

            // refresh attributes
            var fieldRefreshAttributes = new ui.Button();
            fieldRefreshAttributes.class.add('refresh');
            fieldRefreshAttributes.element.title = "Refresh script attributes";
            panel.headerElement.appendChild(fieldRefreshAttributes.element);

            fieldRefreshAttributes.on('click', function () {
                refreshScriptAttributes(script.get('url'));
            });

            // attributes panel
            var attributes = new ui.Panel();
            panel.append(attributes);

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

            return panel;
        }

        // Converts URL to script name
        function getFilenameFromUrl (url) {
            var filename = url;

            if (jsRegex.test(filename))
                filename = filename.substring(0, filename.length - 3);

            var lastIndexOfSlash = filename.lastIndexOf('/');
            if (lastIndexOfSlash >= 0)
                filename = filename.substring(lastIndexOfSlash + 1, filename.length);

            return filename;
        }

        // add existing scripts and subscribe to scripts Observer list
        var items = entity.getRaw('components.script.scripts');
        if (items) {
            for(var i = 0; i < items.length; i++) {
                var scriptPanel = createScriptPanel(items[i]);
                scriptPanels.push(scriptPanel);
                panelScripts.append(scriptPanel);
            }
        }

        // subscribe to scripts:insert
        events.push(entity.on('components.script.scripts:insert', function (script, ind) {
            var scriptPanel = createScriptPanel(script);
            scriptPanels.splice(ind, 0, scriptPanel);

            if (ind === scriptPanels.length - 1) {
                // append at the end
                panelScripts.append(scriptPanel);
            } else {
                // append before panel at next index
                panelScripts.appendBefore(scriptPanel, scriptPanels[ind + 1]);
            }
        }));

        events.push(entity.on('components.script.scripts:move', function (value, indNew, indOld) {
            panelScripts.appendBefore(scriptPanels[indOld], scriptPanels[indNew > indOld ? indNew + 1 : indNew]);
            var temp = scriptPanels[indOld];
            scriptPanels[indOld] = scriptPanels[indNew];
            scriptPanels[indNew] = temp;
        }));

        // subscribe to scripts:remove
        events.push(entity.on('components.script.scripts:remove', function (script, ind) {
            if (scriptPanels[ind]) {
                scriptPanels[ind].destroy();
                scriptPanels.splice(ind, 1);
            }
            script.destroy();
        }));
    });
});
