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
        if (! entity.get('components.script')) {
            panel.disabled = true;
            panel.hidden = true;
        }

        var events = [];
        events.push(entity.on('components.script:set', function(value) {
            panel.disabled = ! value;
            panel.hidden = ! value;
        }));

        events.push(entity.on('components.script:unset', function() {
            panel.disabled = true;
            panel.hidden = true;

            scriptPanels.forEach(function (p) {
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
        fieldEnabled.parent = panel;
        fieldEnabled.style.float = 'left';
        fieldEnabled.style.backgroundColor = '#323f42';
        fieldEnabled.style.margin = '3px 4px 3px -5px';
        fieldEnabled.link(entity, 'components.script.enabled');
        panel.headerElement.appendChild(fieldEnabled.element);

        // remove
        var fieldRemove = new ui.Checkbox();
        fieldRemove.parent = panel;
        fieldRemove.style.float = 'right';
        fieldRemove.style.backgroundColor = '#323f42';
        fieldRemove.style.margin = '3px 4px 3px -5px';
        fieldRemove.on('change', function (value) {
            if (value) {
                entity.unset('components.script');
                fieldRemove.value = false;
            }
        });
        panel.headerElement.appendChild(fieldRemove.element);

        // scripts list
        var panelScriptsList = editor.call('attributes:addPanel', {
            parent: panel
        });

        var urlRegex = new RegExp(/^http(s)?:/);
        var jsRegex = new RegExp(/\.js$/);
        var scriptNameRegex = new RegExp(/^(?:[\w\d\.-]+\/)*[\w\d\.-]+(?:\.[j|J][s|S](?:[o|O][n|N])?)?$/);

        // scripts.add
        var fieldScriptsAdd = editor.call('attributes:addField', {
            parent: panelScriptsList,
            name: 'Add',
            type: 'string',
            placeholder: 'Script URL'
        });

        var suspendEvents = false;
        fieldScriptsAdd.on('change', function (value) {
            if (suspendEvents) return;
            if (value) {
                suspendEvents = true;
                if (addScript(value)) {
                    fieldScriptsAdd.value = '';
                } else {
                    fieldScriptsAdd.elementInput.select();
                }
                suspendEvents = false;
            }
        });

        function addScript (url) {
            var result = true;
            if (urlRegex.test(url)) {
                scanAndAddScript(url, url);
            } else {
                if (!jsRegex.test(url)) {
                    url += '.js';
                }

                if (!scriptNameRegex.test(url) || url.indexOf('..') >= 0) {
                    result = false;
                } else {
                    var fullUrl = editor.call('sourcefiles:url', url);
                    // try to get the script and if it doesn't exist create it
                    Ajax
                    .get(fullUrl)
                    .on('load', function(status, data) {
                        scanAndAddScript(url, fullUrl);
                    })
                    .on('error', function (status) {
                        // script does not exist so create it
                        if (status === 404) {
                            editor.call('sourcefiles:create', url, function () {
                                scanAndAddScript(url, fullUrl);
                            });
                        } else if (status === 0) {
                            // invalid json which is fine because the response is text.
                            // TODO: fix this it's not really an error
                            scanAndAddScript(url, fullUrl);
                        }
                    });
                }
            }

            return result;
        }

        function scanAndAddScript (url, fullUrl) {
            editor.call('sourcefiles:scan', fullUrl, function (data) {
                data.url = url;
                entity.insert('components.script.scripts', new Observer(data));
            });
        }

        function refreshScriptAttributes (script) {
            var fullUrl = urlRegex.test(script.get('url')) ? script.get('url') : editor.call('sourcefiles:url', script.get('url'));
            editor.call('sourcefiles:scan', fullUrl, function (data) {
                data.url = script.get('url');

                // get all entities with the same script
                var scriptComponents = [];
                for (var key in entitiesWithScripts) {
                    var scripts = entitiesWithScripts[key].get('components.script.scripts', true);
                    if (scripts) {
                        for (var i = 0; i < scripts.length; i++) {
                            if (scripts[i].url === script.get('url')) {
                                scriptComponents.push(scripts[i]);
                                break;
                            }
                        }
                    }
                }

                // merge old attributes with new attributes for all script components with this script
                scriptComponents.forEach(function (script) {
                    var oldAttributes = script.get('attributes');
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

            });
        }

        function createScriptPanel (script) {
            var panel = new ui.Panel(script.get('url'));
            panel.class.add('panel-components-script');

            var link = document.createElement('a');

            var url = script.get('url');
            var lowerUrl = url.toLowerCase();
            var isExternalUrl = urlRegex.test(lowerUrl);
            if (!isExternalUrl && !jsRegex.test(url)) {
                url += '.js';
            }

            var title = script.get('name') || getFilenameFromUrl(url);
            link.textContent = title;
            link.target = title;
            link.href = isExternalUrl ? url : '/editor/code/' + config.project.id + '/' + url;
            panel.headerElement.textContent = '';
            panel.headerElement.appendChild(link);

            var fieldRemoveScript = new ui.Checkbox();
            fieldRemoveScript.parent = panel;
            fieldRemoveScript.style.float = 'right';
            fieldRemoveScript.style.backgroundColor = '#323f42';
            fieldRemoveScript.style.margin = '3px 4px 3px -5px';
            fieldRemoveScript.on('change', function (value) {
                if (value) {
                    // remove script
                    entity.removeValue('components.script.scripts', script);
                }
            });

            panel.headerElement.appendChild(fieldRemoveScript.element);

            var fieldRefreshAttributes = new ui.Button({
                text: '<img src="https://s3-eu-west-1.amazonaws.com/static.playcanvas.com/images/icons/fa/16x16/refresh.png" />'
            });
            fieldRefreshAttributes.style.float = 'right';
            fieldRefreshAttributes.style['margin-right'] = '10px';
            fieldRefreshAttributes.style['line-height'] = '28px';
            fieldRefreshAttributes.style.height = '22px';
            fieldRefreshAttributes.element.title = "Refresh script attributes";
            panel.headerElement.appendChild(fieldRefreshAttributes.element);

            fieldRefreshAttributes.on('click', function () {
                refreshScriptAttributes(script);
            });

            var attributes = new ui.Panel();
            panel.append(attributes);

            var order = script.get('attributesOrder');
            if (order && order.length) {
                var attributeFields = [];

                for(var a = 0; a < order.length; a++) {
                    var attribute = script.get('attributes.' + order[a]);

                    var field = createAttributeField(attribute, script, attributes);

                    attributeFields.push({
                        name: attribute.name,
                        field: field
                    });
                }

                events.push(script.on('attributesOrder:set', function (order, oldOrder) {
                    // do this in a timeout to make sure attributes have been set first
                    setTimeout(function () {
                        for (var o = 0; o < order.length; o++) {
                            var name = order[o];
                            var oldIndex = oldOrder.indexOf(name);
                            if (oldIndex < 0) {
                                // create new attribute field
                                var field = createAttributeField(script.get('attributes.' + name), script, attributes);
                                attributeFields.splice(o, 0, {
                                    name: name,
                                    field: field
                                });

                            } else {
                                // if wrong order then just re-order attribute fields
                                if (oldIndex !== o && attributeFields[o].name !== name) {
                                    var record = attributeFields[oldIndex];
                                    attributeFields.splice(oldIndex);
                                    attributeFields.splice(o, 0, record);
                                    attributes.appendBefore(record.field.parent, o < order.length - 1 ? attributeFields[o+1].field.parent : null);
                                    attributeFields[o].field.value = script.get('attributes.' + name + '.value');
                                }
                            }
                        }
                    }, 0);
                }));

            }

            return panel;
        }

        function createAttributeField (attribute, script, parent) {
            var choices = null;
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

            field.value = attribute.value;

            return field;
        }

        function getFilenameFromUrl (url) {
            var filename = url;
            var lastIndexOfSlash = url.lastIndexOf('/');
            if (lastIndexOfSlash >= 0) {
                filename = url.substring(lastIndexOfSlash + 1, url.length);
            }

            return filename;
        }

        // add existing scripts and subscribe to scripts Observer list
        var items = entity.get('components.script.scripts', true);
        if (items) {
            for(var i = 0; i < items.length; i++) {
                var scriptPanel = createScriptPanel(items[i]);
                scriptPanels.push(scriptPanel);
                panelScriptsList.append(scriptPanel);
            }
        }


        // subscribe to scripts:insert
        events.push(entity.on('components.script.scripts:insert', function (script, index) {
            // TEMP: find observer because currently the 'script' argument is not the observer
            var observer = entity.get('components.script.scripts.' + index, true);
            var scriptPanel = createScriptPanel(observer);
            scriptPanels.splice(index, 0, scriptPanel);
            if (index === scriptPanels.length - 1) {
                // append at the end
                panelScriptsList.append(scriptPanel);
            } else {
                // append before panel at next index
                panelScriptsList.appendBefore(scriptPanels[index+1]);
            }
        }));

        // subscribe to scripts:remove
        events.push(entity.on('components.script.scripts:remove', function (script, index) {
            if (scriptPanels[index]) {
                scriptPanels[index].destroy();
                scriptPanels.splice(index, 1);
            }
        }));
    });
});
