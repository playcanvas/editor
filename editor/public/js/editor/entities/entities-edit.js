editor.once('load', function() {
    'use strict';


    // index
    var childToParent = { };

    var deletedCache = { };

    // add
    editor.on('entities:add', function(entity) {
        var children = entity.get('children');
        for(var i = 0; i < children.length; i++) {
            childToParent[children[i]] = entity.get('resource_id');
        }

        entity.on('children:insert', function(value) {
            childToParent[value] = this.get('resource_id');
        });
        entity.on('children:remove', function(value) {
            delete childToParent[value];
        });
    });


    // new entity
    editor.method('entities:new', function (raw) {
        // get root if parent is null
        raw = raw || { };
        var parent = raw.parent || editor.call('entities:root');

        var data = {
            name: raw.name || 'New Entity',
            enabled: true,
            resource_id: pc.guid.create(),
            parent: parent.get('resource_id'),
            children: [ ],
            position: [ 0, 0, 0 ],
            rotation: [ 0, 0, 0 ],
            scale: [ 1, 1, 1 ],
            components: raw.components || { }
        };

        var selectorType = editor.call('selector:type');
        var selectorItems = editor.call('selector:items');
        if (selectorType === 'entity') {
            for(var i = 0; i < selectorItems.length; i++)
                selectorItems[i] = selectorItems[i].get('resource_id');
        }

        // create new Entity data
        var entity = new Observer(data);
        childToParent[entity.get('resource_id')] = parent.get('resource_id');
        addEntity(entity, parent, true);

        // history
        var resourceId = entity.get('resource_id');
        var parentId = parent.get('resource_id');

        editor.call('history:add', {
            name: 'new entity ' + resourceId,
            undo: function() {
                var entity = editor.call('entities:get', resourceId);
                if (! entity)
                    return;

                removeEntity(entity);

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

                var entity = new Observer(data);
                childToParent[entity.get('resource_id')] = parent.get('resource_id');
                addEntity(entity, parent, true);
            }
        });

        return entity;
    });

    var addEntity = function(entity, parent, select, ind) {
        var children = entity.get('children');
        if (children.length)
            entity.set('children', [ ]);

        // call add event
        editor.call('entities:add', entity);

        // sharejs
        editor.call('realtime:scene:op', {
            p: [ 'entities', entity.get('resource_id') ],
            oi: entity.json()
        });

        // this is necessary for the entity to be added to the tree view
        parent.history.enabled = false;
        parent.insert('children', entity.get('resource_id'), ind);
        parent.history.enabled = true;

        if (select) {
            setTimeout(function() {
                editor.call('selector:history', false);
                editor.call('selector:set', 'entity', [ entity ]);
                editor.once('selector:change', function() {
                    editor.call('selector:history', true);
                });
            }, 0);
        }

        // add children too
        children.forEach(function(childId) {
            var data = deletedCache[childId];
            if (! data)
                return;

            var child = new Observer(data);
            childToParent[child.get('resource_id')] = entity.get('resource_id');
            addEntity(child, entity);
        });
    };

    var removeEntity = function(entity) {
        deletedCache[entity.get('resource_id')] = entity.json();

        // remove children
        entity.get('children').forEach(function (child) {
            var entity = editor.call('entities:get', child);
            if (! entity)
                return;

            removeEntity(entity);
        });

        if (editor.call('selector:type') === 'entity' && editor.call('selector:items').indexOf(entity) !== -1) {
            editor.call('selector:history', false);
            editor.call('selector:remove', entity);
            editor.once('selector:change', function() {
                editor.call('selector:history', true);
            });
        }

        // remove from parent
        var parentId = childToParent[entity.get('resource_id')];
        if (parentId) {
            var parent = editor.call('entities:get', parentId);
            if (parent) {
                parent.history.enabled = false;
                parent.removeValue('children', entity.get('resource_id'));
                parent.history.enabled = true;
            }
        }

        // call remove method
        editor.call('entities:remove', entity);

        // sharejs
        editor.call('realtime:scene:op', {
            p: [ 'entities', entity.get('resource_id') ],
            od: { }
        });
    };

    var duplicateEntity = function(entity, parent, ind) {
        var resourceId = entity.get('resource_id');
        var data = entity.json();
        var children = data.children;

        data.children = [ ];
        data.resource_id = pc.guid.create();
        data.parent = parent.get('resource_id');

        entity = new Observer(data);
        childToParent[entity.get('resource_id')] = parent.get('resource_id');

        // call add event
        editor.call('entities:add', entity);

        // sharejs
        editor.call('realtime:scene:op', {
            p: [ 'entities', entity.get('resource_id') ],
            oi: entity.json()
        });

        // this is necessary for the entity to be added to the tree view
        parent.history.enabled = false;
        parent.insert('children', entity.get('resource_id'), ind);
        parent.history.enabled = true;

        // add children too
        children.forEach(function(childId) {
            duplicateEntity(editor.call('entities:get', childId), entity);
        });

        return entity;
    };

    // duplicate entity
    editor.method('entities:duplicate', function (entity) {
        var resourceId = entity.get('resource_id');
        var parentId = childToParent[resourceId];
        var parent = editor.call('entities:get', parentId);

        var ind = parent.get('children').indexOf(resourceId);

        var entityNew = duplicateEntity(entity, parent, ind + 1);
        var data = entityNew.json();

        var selectorType = editor.call('selector:type');
        var selectorItems = editor.call('selector:items');
        if (selectorType === 'entity') {
            for(var i = 0; i < selectorItems.length; i++)
                selectorItems[i] = selectorItems[i].get('resource_id');
        }

        setTimeout(function() {
            editor.call('selector:history', false);
            editor.call('selector:set', 'entity', [ entityNew ]);
            editor.once('selector:change', function() {
                editor.call('selector:history', true);
            });
        }, 0);

        editor.call('history:add', {
            name: 'duplicate entity ' + resourceId,
            undo: function() {
                var entity = editor.call('entities:get', data.resource_id);
                if (! entity)
                    return;

                removeEntity(entity);

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

                var entity = new Observer(data);
                childToParent[entity.get('resource_id')] = parent.get('resource_id');
                addEntity(entity, parent, true, ind + 1);
            }
        });
    });

    // delete entity
    editor.method('entities:delete', function (entity) {
        var resourceId = entity.get('resource_id');
        var ind;
        var data = entity.json();
        var parentId = childToParent[entity.get('resource_id')];
        if (parentId) {
            var parent = editor.call('entities:get', parentId);
            if (parent)
                ind = parent.get('children').indexOf(resourceId);
        }

        removeEntity(entity);

        editor.call('history:add', {
            name: 'delete entity ' + entity.get('resource_id'),
            undo: function() {
                var parent = editor.call('entities:get', parentId);
                if (! parent)
                    return;

                var entity = new Observer(data);
                childToParent[entity.get('resource_id')] = parent.get('resource_id');
                addEntity(entity, parent, true, ind);
            },
            redo: function() {
                var entity = editor.call('entities:get', resourceId);
                if (! entity)
                    return;

                removeEntity(entity);
            }
        });
    });
});