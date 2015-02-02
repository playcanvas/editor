editor.once('load', function() {
    'use strict';

    // new entity
    editor.method('entities:new', function (parent) {
        // get root if parent is null
        if (!parent) {
            parent = editor.call('entities:root');
        }

        // create new Entity data
        var entity = new Observer({
            name: 'New Entity',
            resource_id: pc.guid.create(),
            parent: parent.resource_id,
            children: [],
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            enabled: true,
            components: {}
        });

        addEntity(entity, parent, true);

        return entity;
    });

    var addEntity = function (entity, parent, undo) {
        // call add event
        editor.call('entities:add', entity);

        // this is necessary for the entity to be added to the tree view
        parent.history.enabled = false;
        parent.insert('children', entity.resource_id);
        parent.history.enabled = true;

        // sharejs
        editor.call('realtime:op', {
            p: ['entities', entity.resource_id],
            oi: entity.json()
        });

        // disable selector history
        editor.call('selector:toggleHistory', false);

        // select new entity
        editor.call('selector:add', 'entity', entity);

        // re-enable selector history
        editor.call('selector:toggleHistory', true);

        // history
        if (undo) {
            editor.call('history:add', {
                name: 'new entity ' + entity.resource_id,
                undo: function() {
                    parent.history.enabled = false;
                    removeEntity(entity, parent);
                    parent.history.enabled = true;
                },
                redo: function() {
                    parent.history.enabled = false;
                    addEntity(entity, parent);
                    parent.history.enabled = true;
                }
            });
        }
    };

    var removeEntity = function (entity, parent) {
        // disable selector history
        editor.call('selector:toggleHistory', false);
        // deselect entity
        editor.call('selector:remove', entity);
        // re-enable selector history
        editor.call('selector:toggleHistory', true);

        // remove from parent
        if (parent) {
            parent.remove('children', entity.resource_id);
        }

        // call remove method
        editor.call('entities:remove', entity);

        // sharejs
        editor.call('realtime:op', {
            p: ['entities', entity.resource_id],
            od: {}
        });
    };

    // duplicate entity
    editor.method('entities:duplicate', function (entity) {
        var parent = editor.call('entities:get', entity.parent);

        // create new Entity data
        var data = entity.json();
        data.resource_id = pc.guid.create();
        var duplicate = new Observer(data);

        addEntity(duplicate, parent, true);

        return duplicate;
    });

    // delete entity
    editor.method('entities:delete', function (entity) {
        var parent = editor.call('entities:get', entity.parent);

        removeEntity(entity, parent);

        // history
        editor.call('history:add', {
            name: 'delete entity ' + entity.resource_id,
            undo: function() {
                parent.history.enabled = false;
                addEntity(entity, parent);
                parent.history.enabled = true;
            },
            redo: function() {
                parent.history.enabled = false;
                removeEntity(entity, parent);
                parent.history.enabled = true;
            }
        });
    });

});


