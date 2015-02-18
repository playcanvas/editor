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
    }

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
        var evtComponentSet = entity.on('components.script:set', function(value) {
            panel.disabled = ! value;
            panel.hidden = ! value;
        });
        var evtComponentUnset = entity.on('components.script:unset', function() {
            panel.disabled = true;
            panel.hidden = true;

            scriptPanels.forEach(function (p) {
                p.destroy();
            });

            scriptPanels.length = 0;
        });
        panel.on('destroy', function() {
            evtComponentSet.unbind();
            evtComponentUnset.unbind();
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

                if (!scriptNameRegex.test(url)) {
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

                var script = {
                    name: data.name,
                    url: url,
                    attributes: data.attributes,
                    attributesOrder: data.attributesOrder
                };

                var scripts = entity.get('components.script.scripts');

                var scriptObserver = new Observer(script);
                scripts.add(scriptObserver);

                addExistingScript(scriptObserver);
            });
        }

        function addExistingScript (script, index) {
            var panel = new ui.Panel(script.url);
            panelScriptsList.append(panel);
            scriptPanels.push(panel);

            var link = document.createElement('a');

            var url = script.url;
            var lowerUrl = url.toLowerCase();
            var isExternalUrl = urlRegex.test(lowerUrl);
            if (!isExternalUrl && !jsRegex.test(url)) {
                url += '.js';
            }

            var title = script.name || getFilenameFromUrl(url);
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
                    var scripts = entity.get('components.script.scripts');
                    scripts.remove(script);
                    panel.destroy();
                }
            });

            panel.headerElement.appendChild(fieldRemoveScript.element);

            var attributes = new ui.Panel();
            panel.append(attributes);
            if (script.attributesOrder) {
                for(var a = 0; a < script.attributesOrder.length; a++) {
                    var attribute = script.attributes[script.attributesOrder[a]];

                    var choices = null;
                    if (attribute.type === 'enumeration') {
                        choices = { };
                        try {
                            for(var e = 0; e < attribute.options.enumerations.length; e++) {
                                choices[attribute.options.enumerations.get(e).value] = attribute.options.enumerations.get(e).name;
                            }
                        } catch(ex) {
                            console.log('could not recreate enumeration for script attribute, ' + script.url);
                        }
                    }

                    editor.call('attributes:addField', {
                        parent: attributes,
                        name: attribute.displayName,
                        type: scriptAttributeTypes[attribute.type],
                        enum: choices,
                        link: script,
                        path: 'attributes.' + attribute.name + '.value'
                    });
                }
            }
        }

        function getFilenameFromUrl (url) {
            var filename = url;
            var lastIndexOfSlash = url.lastIndexOf('/');
            if (lastIndexOfSlash >= 0) {
                filename = url.substring(lastIndexOfSlash + 1, url.length);
            }

            return filename;
        }

        // scripts.list
        var items = entity.get('components.script.scripts');
        if (items) {
            for(var i = 0; i < items.length; i++) {
                addExistingScript(items.get(i));
            }
        }
    });
});
