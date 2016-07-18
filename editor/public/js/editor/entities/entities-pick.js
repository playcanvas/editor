editor.once('load', function() {
    'use strict';

    editor.on('viewport:pick:clear', function() {
        if (! editor.call('hotkey:ctrl'))
            editor.call('selector:clear');
    });

    editor.on('viewport:pick:node', function(node, picked) {
        // icon
        if (node._icon || (node.__editor && node._getEntity)) {
            node = node._getEntity();
            if (! node) return;
        }

        // get entity
        var entity = editor.call('entities:get', node.getGuid());
        if (! entity) return;

        // get selector data
        var type = editor.call('selector:type');
        var items = editor.call('selector:items');

        if (type === 'entity' && items.length === 1 && items.indexOf(entity) !== -1 && ! editor.call('hotkey:ctrl')) {
            // if entity already selected
            // try selecting model asset
            // with highlighting mesh instance
            if (node.model && node.model.type === 'asset' && node.model.model) {
                var meshInstances = node.model.model.meshInstances;

                for(var i = 0; i < meshInstances.length; i++) {
                    var instance = meshInstances[i];
                    if (instance !== picked)
                        continue;

                    var index = i;

                    // if the model component has a material mapping then
                    // open the model component otherwise go to the model asset
                    if (node.model.mapping && node.model.mapping[i] !== undefined) {
                        editor.call('selector:set', 'entity', [entity]);
                    } else {
                        // get model asset
                        var asset = editor.call('assets:get', node.model.asset);
                        if (! asset) break;

                        // select model asset
                        editor.call('selector:set', 'asset', [ asset ]);
                    }

                    // highlight selected node
                    setTimeout(function() {
                        var node = editor.call('attributes.rootPanel').element.querySelector('.field-asset.node-' + index);
                        if (node) {
                            node.classList.add('active');
                            var field = node.querySelector('.ui-image-field');
                            field.focus();
                            field.blur();
                        }
                    }, 0);

                    break;
                }
            }
        } else {
            // select entity
            if (type === 'entity' && editor.call('hotkey:ctrl')) {
                // with ctrl
                if (items.indexOf(entity) !== -1) {
                    // deselect
                    editor.call('selector:remove', entity);
                } else {
                    // add to selection
                    editor.call('selector:add', 'entity', entity);
                }
            } else {
                // set selection
                editor.call('selector:set', 'entity', [ entity ]);
            }
        }
    })
});
