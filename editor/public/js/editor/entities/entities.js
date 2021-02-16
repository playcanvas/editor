editor.once('load', function () {
    'use strict';

    var entities = new ObserverList({
        index: 'resource_id'
    });

    var entityRoot = null;

    function createLatestFn(resourceId) {
        return function () {
            return entities.get(resourceId);
        };
    }

    // on adding
    entities.on('add', function (entity) {
        editor.emit('entities:add', entity, entity === entityRoot);
    });

    // on removing
    entities.on('remove', function (entity) {
        if (entity === entityRoot) {
            entityRoot = null;
        }

        editor.emit('entities:remove', entity);
        entity.destroy();
        entity.entity = null;
    });

    // return entities ObserverList
    editor.method('entities:raw', function () {
        return entities;
    });

    // allow adding entity
    editor.method('entities:add', function (entity) {
        if (! entity.get('parent')) {
            if (entityRoot) {
                // this is a bad scene it has more than one entities
                // with a null parent.. Check for a bad scene merge.
                editor.call('status:error', `More than one root entities in Scene. Current root is Entity "${entityRoot.get('name')}" [${entity.get('resource_id')}] but Entity "${entity.get('name')}" [${entity.get('resource_id')}] also has a null parent`);
            }

            entityRoot = entity;
        }

        entities.add(entity);

        // function to get latest version of entity observer
        entity.latestFn = createLatestFn(entity.get('resource_id'));
    });

    // allow remove entity
    editor.method('entities:remove', function (entity) {
        entities.remove(entity);
    });

    // remove all entities
    editor.method('entities:clear', function () {
        entities.clear();
        editor.emit('entities:clear');
    });

    // get entity
    editor.method('entities:get', function (resourceId) {
        return entities.get(resourceId);
    });


    // list entities
    editor.method('entities:list', function () {
        return entities.array();
    });


    // get root entity
    editor.method('entities:root', function () {
        return entityRoot;
    });

});
