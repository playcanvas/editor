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
        'enumeraton': 'number'
    }

    editor.on('attributes:inspect[entity]', function(entities) {
        if (entities.length !== 1)
            return;

        var entity = entities[0];

        var panelComponents = editor.call('attributes:entity.panelComponents');
        if (! panelComponents)
            return;


        // scripts
        var panelScripts = editor.call('attributes:addPanel', {
            parent: panelComponents,
            name: 'Scripts'
        });
        if (! entity.get('components.script')) {
            panelScripts.disabled = true;
            panelScripts.hidden = true;
        }

        // scripts.enabled
        var fieldScriptsEnabled = editor.call('attributes:addField', {
            parent: panelScripts,
            name: 'Enabled',
            type: 'checkbox',
            link: entity,
            path: 'components.script.enabled'
        });

        // scripts list
        var panelScriptsList = editor.call('attributes:addPanel', {
            parent: panelScripts
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
                link.href = '/' + config.owner.username + '/' + config.project.name + '/editor/' + items.get(i).url;
                script.headerElement.textContent = '';
                script.headerElement.appendChild(link);

                var attributes = new ui.Panel();
                script.append(attributes);
                for(var a = 0; a < items.get(i).attributes.length; a++) {
                    var attribute = items.get(i).attributes.get(a);

                    var choices = null;
                    if (attribute.type === 'enumeraton') {
                        choices = { };
                        try {
                            for(var e = 0; e < attribute.enumeratons.length; e++) {
                                choices[attribute.enumeratons[e].value] = attribute.enumeratons[e].name;
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
