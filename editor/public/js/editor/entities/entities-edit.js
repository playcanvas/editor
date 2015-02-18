editor.once('load', function() {
    'use strict';

    // new entity
    editor.method('entities:new', function (parent) {
        // get root if parent is null
        if (! parent)
            parent = editor.call('entities:root');

        var data = {
            name: 'New Entity',
            resource_id: pc.guid.create(),
            parent: parent.get('resource_id'),
            children: [],
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            enabled: true,
            components: {}
        };

        // create new Entity data
        var entity = new Observer(data);
        addEntity(entity, parent, true);

        // history
        var resource_id = entity.get('resource_id');

        editor.call('history:add', {
            name: 'new entity ' + entity.get('resource_id'),
            undo: function() {
                removeEntity(entity, parent);
            },
            redo: function() {
                addEntity(entity, parent, true);
            }
        });
    });

    var addEntity = function (entity, parent, select) {
        entity.__destroyed = false;

        // call add event
        editor.call('entities:add', entity);

        // sharejs
        editor.call('realtime:op', {
            p: [ 'entities', entity.get('resource_id') ],
            oi: entity.json()
        });

        // this is necessary for the entity to be added to the tree view
        parent.history.enabled = false;
        parent.insert('children', entity.get('resource_id'));
        parent.history.enabled = true;

        if (select) {
            // disable selector history
            editor.call('selector:history', false);
            // select new entity
            editor.call('selector:add', 'entity', entity);
            // re-enable selector history
            editor.call('selector:history', true);
        }

        // // do the same for children
        // entity.children.forEach(function (child) {
        //     addEntity(editor.call('entities:get', child), entity, false);
        // });
    };

    var removeEntity = function (entity, parent) {
        // start from children
        entity.get('children').forEach(function (child) {
            removeEntity(editor.call('entities:get', child), entity);
        });

        // disable selector history
        editor.call('selector:history', false);
        // deselect entity
        editor.call('selector:remove', entity);
        // re-enable selector history
        editor.call('selector:history', true);

        // remove from parent
        if (parent) {
            parent.history.enabled = false;
            parent.removeValue('children', entity.get('resource_id'));
            parent.history.enabled = true;
        }

        // call remove method
        editor.call('entities:remove', entity);


        // sharejs
        editor.call('realtime:op', {
            p: [ 'entities', entity.get('resource_id') ],
            od: { }
        });
    };

    // duplicate entity
    editor.method('entities:duplicate', function (entity) {
        var duplicatedEntities = {};

        function duplicate (resourceId, parentId, select) {
            var source = editor.call('entities:get', resourceId);
            var parent = editor.call('entities:get', parentId);

            var newChildren = [];

            // remember the entity that was duplicated using the resource id
            // of the source entity as the key, so that when we undo / redo
            // we re-add the same entities in the hierarchy
            if (!duplicatedEntities[source.get('resource_id')]) {
                // create new Entity data
                var data = source.json();
                data.resource_id = pc.guid.create();
                data.parent = parentId;
                data.children = newChildren;
                duplicatedEntities[source.get('resource_id')] = new Observer(data);
            }

            var duplicated = duplicatedEntities[source.get('resource_id')];

            addEntity(duplicated, parent, select);

            source.get('children').forEach(function (child) {
                var c = duplicate(child, duplicated.get('resource_id'), false);
                newChildren.push(c.get('resource_id'));
            });

            duplicated.history.enabled = false;
            duplicated.children = newChildren;
            duplicated.history.enabled = true;

            return duplicated;
        }

        var duplicated = duplicate(entity.get('resource_id'), entity.get('parent'), true);
        var parent = editor.call('entities:get', duplicated.get('parent'));

        // history
        if (history) {
            editor.call('history:add', {
                name: 'duplicate entity ' + entity.get('resource_id'),
                undo: function() {
                    removeEntity(duplicated, parent);
                },
                redo: function() {
                    duplicated = duplicate(entity.get('resource_id'), parent.get('resource_id'), true);
                }
            });
        }
    });

    // delete entity
    editor.method('entities:delete', function (entity) {
        var parent = editor.call('entities:get', entity.get('parent'));

        removeEntity(entity, parent);

        editor.call('history:add', {
            name: 'delete entity ' + entity.get('resource_id'),
            undo: function() {
                addEntity(entity, parent, true);
            },
            redo: function() {
                removeEntity(entity, parent);
            }
        });
    });

});


