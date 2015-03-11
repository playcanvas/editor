editor.once('load', function() {
    'use strict';

    var scriptAttributeTypes = {
        'number': 'number',
        'string': 'string',
        'boolean': 'checkbox',
        'asset': 'string', // TEMP
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
        panel.class.add('component');

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

        // enabled
        var fieldEnabled = new ui.Checkbox();
        fieldEnabled.class.add('component-toggle');
        fieldEnabled.link(entity, 'components.script.enabled');
        panel.headerAppend(fieldEnabled);

        // remove
        var fieldRemove = new ui.Button();
        fieldRemove.class.add('component-remove');
        fieldRemove.on('click', function(value) {
            entity.unset('components.script');
        });
        panel.headerAppend(fieldRemove);


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
        fieldScriptsAdd.parent.style.marginBottom = '8px';

        fieldScriptsAdd.element.addEventListener('keydown', function (e) {
            if (e.which !== 13 || ! fieldScriptsAdd.value)
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

                refreshScriptAttributes(script);
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
                Ajax
                .get(fullUrl)
                .on('load', function(status, data) {
                    refreshScriptAttributes(script);
                })
                .on('error', function (status) {
                    // script does not exist so create it
                    if (status === 404) {
                        editor.call('sourcefiles:create', url);
                    } else if (status === 0) {
                        // invalid json which is fine because the response is text.
                        // TODO: fix this it's not really an error
                        refreshScriptAttributes(script);
                    }
                });
            }

            return true;
        }

        function refreshScriptAttributes (script) {
            var fullUrl = urlRegex.test(script.get('url')) ? script.get('url') : editor.call('sourcefiles:url', script.get('url'));

            editor.call('sourcefiles:scan', fullUrl, function (data) {
                data.url = script.get('url');

                // get all entities with the same script
                var scriptComponents = [];
                for (var key in entitiesWithScripts) {
                    var scripts = entitiesWithScripts[key].getRaw('components.script.scripts');
                    if (scripts) {
                        for (var i = 0; i < scripts.length; i++) {
                            if (scripts[i].get('url') === script.get('url')) {
                                scriptComponents.push(scripts[i]);
                                break;
                            }
                        }
                    }
                }

                // merge old attributes with new attributes for all script components with this script
                scriptComponents.forEach(function (script) {
                    var oldAttributes = script.get('attributes') || {};
                    for (var key in data.attributes) {
                        if (data.attributes.hasOwnProperty(key)) {
                            var value = data.attributes[key].defaultValue;
                            if (key in oldAttributes && oldAttributes[key].type === data.attributes[key].type) {
                                value = oldAttributes[key].value !== oldAttributes[key].defaultValue ? oldAttributes[key].value : value;
                            }
                            data.attributes[key].value = value;
                        }
                    }

                    script.patch(data);
                });

                // updateAttributeFields(script, scr);
            });
        }

        function updateAttributeFields(script, parent) {
            var attributes = script.get('attributesOrder');
            var children = parent.innerElement.childNodes;
            var list = [ ];
            var index = { };
            var toDestroy = [ ];
            var toCreate = [ ];

            console.log("!")

            for(var i = 0; i < children.length; i++) {
                var attribute = children[i].ui.attribute;
                if (attributes.indexOf(attribute) === -1) {
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

            console.log(attributes, list);

            for(var i = 0; i < attributes.length; i++) {
                var ind = list.indexOf(attributes[i]);
                if (ind === -1) {
                    // new attibute
                    var panel = createAttributeField(script, attributes[i], parent).parent;

                    if (i === 0 && list.length > 0) {
                        parent.innerElement.removeChild(panel.element);
                        parent.innerElement.insertBefore(panel.element, parent.innerElement.firstChild);
                    } else if (i > 0) {
                        parent.innerElement.removeChild(panel.element);

                        var next = index[list[i - 1]].element.nextSibling;
                        if (next) {
                            parent.innerElement.insertBefore(panel.element, next);
                        } else {
                            parent.innerElement.appendChild(panel.element);
                        }
                    }

                    list.splice(ind, 0, attributes[i]);
                    index[attributes[i]] = panel;
                } else if (ind !== i) {
                    // needs to be moved
                    console.log('move', attributes[i])
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

            // var evtRemove = script.once('attributes.' + attribute.name + ':unset', function() {
            //     field.parent.destroy();
            // });

            // events.push(evtRemove);

            // field.parent.on('destroy', function() {
            //     evtRemove.unbind();
            // });

            field.parent.attribute = attribute.name;

            return field;
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

            // events.push(script.on('*:unset', function(path) {
            //     console.log('unset', path);
            // }))

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
                refreshScriptAttributes(script);
            });


            var attributes = new ui.Panel();
            panel.append(attributes);

            var order = script.get('attributesOrder');
            // holds all attribute fields in order

            for(var i = 0; i < order.length; i++) {
                createAttributeField(script, order[i], attributes);
                // attributes.append(attributeField);
            }

            var timerUpdateAttributes = null;

            events.push(script.on('attributesOrder:set', function() {
                if (timerUpdateAttributes)
                    return;

                console.log('!!!!!!');

                timerUpdateAttributes = setTimeout(function() {
                    timerUpdateAttributes = null;
                    updateAttributeFields(script, attributes);
                }, 0);
            }));

            // var fieldsInOrder = [];
        //     // holds all attributes fields indexed by attribute name
        //     var fieldsIndex = {};

        //     if (order) {
        //         for(var a = 0; a < order.length; a++) {
        //             var attribute = script.get('attributes.' + order[a]);

        //             var field = createAttributeField(attribute, script, attributes);

        //             fieldsInOrder.push({
        //                 name: attribute.name,
        //                 type: attribute.type,
        //                 field: field
        //             });

        //             fieldsIndex[attribute.name] = fieldsInOrder[fieldsInOrder.length-1];
        //         }
        //     }

        //     // Handle setting different attributes
        //     events.push(script.on('attributes:set', function (newAttributes) {
        //         for (var key in fieldsIndex) {
        //             // remove attributes that no longer exist
        //             if (!(key in newAttributes)) {
        //                 for (var i = 0; i < fieldsInOrder.length; i++) {
        //                     if (fieldsInOrder[i] === fieldsIndex[key]) {
        //                         fieldsInOrder[i].field.parent.destroy();
        //                         fieldsInOrder.splice(i, 1);
        //                         delete fieldsIndex[key];
        //                         break;
        //                     }
        //                 }

        //             }
        //             // recreate attribute fields that changed type
        //             else if (fieldsIndex[key].type !== newAttributes[key].type) {
        //                 var field = fieldsIndex[key].field;
        //                 // remember sibling
        //                 var sibling = field.parent.element.nextSibling;
        //                 // destroy old field
        //                 field.parent.destroy();

        //                 // create new field
        //                 var newField = createAttributeField(newAttributes[key], script, attributes);
        //                 // append before last sibling
        //                 attributes.appendBefore(newField.parent, sibling);
        //                 // set new value
        //                 newField.value = newAttributes[key].value;

        //                 // update index
        //                 fieldsIndex[key].field = newField;
        //                 fieldsIndex[key].type = newAttributes[key].type;
        //             }
        //         }
        //     }));

        // //     events.push(script.on('attributesOrder:set', function (order) {
        // //         // do this in a timeout to make sure attributes have been set first
        // //         setTimeout(function () {
        // //             var field;

        // //             for (var index = 0; index < order.length; index++) {
        // //                 var attr = script.get('attributes.' + order[index]);
        // //                 var oldIndex = -1;

        // //                 // find previous index of attribute
        // //                 for (var i = 0; i < fieldsInOrder.length; i++) {
        // //                     if (fieldsInOrder[i].name == attr.name) {
        // //                         oldIndex = i;
        // //                         break;
        // //                     }
        // //                 }

        // //                 if (oldIndex < 0) {
        // //                     // creaete new attribute field
        // //                     field = createAttributeField(attr, script, attributes);

        // //                     var entry = {
        // //                         name: attr.name,
        // //                         type: attr.type,
        // //                         field: field
        // //                     };

        // //                     fieldsIndex[attr.name] = entry;

        // //                     fieldsInOrder.splice(index, 0, entry);

        // //                     // append it at the right spot
        // //                     if (index > 0) {
        // //                         attributes.appendAfter(field.parent, fieldsInOrder[index-1].field.parent);
        // //                     } else {
        // //                         attributes.appendBefore(field.parent, fieldsInOrder[index+1] ? fieldsInOrder[index+1].field.parent : null);
        // //                     }

        // //                 } else {
        // //                     var record = fieldsInOrder[oldIndex];

        // //                     // if wrong order then just re-order attribute fields
        // //                     if (oldIndex !== index && fieldsInOrder[index].name !== attr.name) {
        // //                         fieldsInOrder.splice(oldIndex);
        // //                         fieldsInOrder.splice(index, 0, record);
        // //                         attributes.appendBefore(record.field.parent, index < order.length - 1 ? fieldsInOrder[index+1].field.parent : null);
        // //                     }

        // //                     // set new value to field
        // //                     record.field.value = attr.value;
        // //                 }
        // //             }
        // //         }, 0);
        // //     }));

            return panel;
        }

        // // Creates new field for script attribute
        // function createAttributeField(attribute, script, parent) {
        //     var choices = null;

        //     if (attribute.type === 'enumeration') {
        //         choices = { };
        //         try {
        //             for(var e = 0; e < attribute.options.enumerations.length; e++) {
        //                 choices[attribute.options.enumerations[e].value] = attribute.options.enumerations[e].name;
        //             }
        //         } catch(ex) {
        //             console.log('could not recreate enumeration for script attribute, ' + script.get('url'));
        //         }
        //     }

        //     var field = editor.call('attributes:addField', {
        //         parent: parent,
        //         name: attribute.displayName,
        //         type: scriptAttributeTypes[attribute.type],
        //         enum: choices,
        //         link: script,
        //         path: 'attributes.' + attribute.name + '.value'
        //     });

        //     events.push(script.on('attributes.' + attribute.name + ':unset', function() {
        //         field.parent.destroy();
        //     }));

        //     return field;
        // }

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
        events.push(entity.on('components.script.scripts:insert', function (script, index) {
            var scriptPanel = createScriptPanel(script);
            scriptPanels.splice(index, 0, scriptPanel);

            if (index === scriptPanels.length - 1) {
                // append at the end
                panelScripts.append(scriptPanel);
            } else {
                // append before panel at next index
                panelScripts.appendBefore(scriptPanel, scriptPanels[index + 1]);
            }
        }));

        events.push(entity.on('components.script.scripts:move', function (value, idxNew, idxOld) {
            panelScripts.appendBefore(scriptPanels[idxOld], scriptPanels[idxNew > idxOld ? idxNew + 1 : idxNew]);
            var temp = scriptPanels[idxOld];
            scriptPanels[idxOld] = scriptPanels[idxNew];
            scriptPanels[idxNew] = temp;
        }));

        // subscribe to scripts:remove
        events.push(entity.on('components.script.scripts:remove', function (script, index) {
            if (scriptPanels[index]) {
                scriptPanels[index].destroy();
                scriptPanels.splice(index, 1);
            }
            script.destroy();
        }));
    });
});
