editor.once('load', function() {
    'use strict';

    var canvas = editor.call('viewport:canvas');
    if (! canvas) return;

    var dropRef = editor.call('drop:target', {
        ref: canvas.element,
        filter: function(type, data) {
            if (type === 'asset.model')
                return true;

            if (type === 'assets') {
                for(var i = 0; i < data.ids.length; i++) {
                    var asset = editor.call('assets:get', data.ids[i]);
                    if (! asset)
                        return false;

                    if (asset.get('type') !== 'model')
                        return false;
                }

                return true;
            }
        },
        drop: function(type, data) {
            if (!config.scene.id)
                return;

            var assets = [ ];

            if (type === 'asset.model') {
                var asset = editor.call('assets:get', parseInt(data.id, 10));
                if (asset) assets.push(asset);
            } else if (type === 'assets') {
                for(var i = 0; i < data.ids.length; i++) {
                    var asset = editor.call('assets:get', parseInt(data.ids[i], 10));
                    if (asset && asset.get('type') === 'model')
                        assets.push(asset);
                }
            }

            if (! assets.length)
                return;

            // parent
            var parent = null;
            if (editor.call('selector:type') === 'entity')
                parent = editor.call('selector:items')[0];

            if (! parent)
                parent = editor.call('entities:root');

            var entities = [ ];
            var data = [ ];

            for(var i = 0; i < assets.length; i++) {
                var component = editor.call('components:getDefault', 'model');
                component.type = 'asset';
                component.asset = parseInt(assets[i].get('id'), 10);

                var name = assets[i].get('name');
                if (/\.json$/i.test(name))
                    name = name.slice(0, -5) || 'Untitled';

                // new entity
                var entity = editor.call('entities:new', {
                    parent: parent,
                    name: name,
                    components: {
                        model: component
                    },
                    noSelect: true,
                    noHistory: true
                });

                entities.push(entity);
                data.push(entity.json());
            }

            editor.call('selector:history', false);
            editor.call('selector:set', 'entity', entities);
            editor.once('selector:change', function() {
                editor.call('selector:history', true);
            });

            var selectorType = editor.call('selector:type');
            var selectorItems = editor.call('selector:items');
            if (selectorType === 'entity') {
                for(var i = 0; i < selectorItems.length; i++)
                    selectorItems[i] = selectorItems[i].get('resource_id');
            }

            var parentId = parent.get('resource_id');
            var resourceIds = [ ];
            for(var i = 0; i < entities.length; i++)
                resourceIds.push(entities[i].get('resource_id'));

            editor.call('history:add', {
                name: 'new model entities ' + entities.length,
                undo: function() {
                    for(var i = 0; i < resourceIds.length; i++) {
                        var entity = editor.call('entities:get', resourceIds[i]);
                        if (! entity)
                            continue;

                        editor.call('entities:removeEntity', entity);
                    }

                    if (selectorType === 'entity' && selectorItems.length) {
                        var items = [ ];
                        for(var i = 0; i < selectorItems.length; i++) {
                            var item = editor.call('entities:get', selectorItems[i]);
                            if (item)
                                items.push(item);
                        }

                        if (items.length) {
                            editor.call('selector:history', false);
                            editor.call('selector:set', selectorType, items);
                            editor.once('selector:change', function() {
                                editor.call('selector:history', true);
                            });
                        }
                    }
                },
                redo: function() {
                    var parent = editor.call('entities:get', parentId);
                    if (! parent)
                        return;

                    var entities = [ ];

                    for(var i = 0; i < data.length; i++) {
                        var entity = new Observer(data[i]);
                        entities.push(entity);
                        editor.call('entities:childToParent', entity, parent);
                        editor.call('entities:addEntity', entity, parent, false);
                    }

                    editor.call('selector:history', false);
                    editor.call('selector:set', 'entity', entities);
                    editor.once('selector:change', function() {
                        editor.call('selector:history', true);
                    });

                    editor.call('viewport:render');
                    editor.once('viewport:update', function() {
                        editor.call('viewport:focus');
                    });
                }
            });

            editor.call('viewport:render');
            editor.once('viewport:update', function() {
                editor.once('viewport:update', function() {
                    editor.call('viewport:focus');
                });
            });
        }
    });
});
