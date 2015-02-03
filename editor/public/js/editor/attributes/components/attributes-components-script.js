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
        });
        panel.on('destroy', function() {
            evtComponentSet.unbind();
            evtComponentUnset.unbind();
        });


        // enabled
        var fieldEnabled = new ui.Checkbox();
        fieldEnabled.style.float = 'left';
        fieldEnabled.style.backgroundColor = '#323f42';
        fieldEnabled.style.margin = '3px 4px 3px -5px';
        fieldEnabled.link(entity, 'components.script.enabled');
        panel.headerElement.appendChild(fieldEnabled.element);
        panel.on('destroy', function() {
            fieldEnabled.destroy();
        });

        // remove
        var fieldRemove = new ui.Checkbox();
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
        panel.on('destroy', function() {
            fieldRemove.destroy();
        });

        // scripts list
        var panelScriptsList = editor.call('attributes:addPanel', {
            parent: panel
        });

        // scripts.add
        // TODO
        var fieldScriptsAdd = editor.call('attributes:addField', {
            parent: panelScriptsList,
            name: 'Add',
            value: 'not implemented'
        });


        // scripts.list
        var items = entity.get('components.script.scripts');
        if (items) {
            for(var i = 0; i < items.length; i++) {
                var script = new ui.Panel(items.get(i).url);
                panelScriptsList.append(script);

                var link = document.createElement('a');
                link.textContent = items.get(i).url;
                link.target = '_blank';
                // link.href = '/' + config.owner.username + '/' + config.project.name + '/editor/' + items.get(i).url;
                link.href = '#';
                script.headerElement.textContent = '';
                script.headerElement.appendChild(link);

                var attributes = new ui.Panel();
                script.append(attributes);
                for(var a = 0; a < items.get(i).attributes.length; a++) {
                    var attribute = items.get(i).attributes.get(a);

                    var choices = null;
                    if (attribute.type === 'enumeration') {
                        choices = { };
                        try {
                            for(var e = 0; e < attribute.options.enumerations.length; e++) {
                                choices[attribute.options.enumerations.get(e).value] = attribute.options.enumerations.get(e).name;
                            }
                        } catch(ex) {
                            console.log('could not recreate enumeration for script attribute, ' + items.get(i).url);
                        }
                    }

                    editor.call('attributes:addField', {
                        parent: attributes,
                        name: attribute.displayName,
                        type: scriptAttributeTypes[attribute.type],
                        enum: choices,
                        link: entity,
                        path: 'components.script.scripts.' + i + '.attributes.' + a + '.value'
                    });
                }
            }
        }
    });
});
