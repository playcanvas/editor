editor.once('load', function() {
    'use strict';

    var entities = new ObserverList({
        index: 'resource_id'
    });

    var entityRoot = null;

    // on adding
    entities.on('add', function(entity) {
        editor.emit('entities:add', entity);
    });

    // on removing
    entities.on('remove', function(entity) {
        editor.emit('entities:remove', entity);
        entity.destroy();
    });


    // allow adding entity
    editor.method('entities:add', function(entity) {
        if (! entity.get('parent'))
            entityRoot = entity;

        entities.add(entity);
    });

    // allow remove entity
    editor.method('entities:remove', function(entity) {
        entities.remove(entity);
    });

    // remove all entities
    editor.method('entities:clear', function () {
        entities.clear();
    });

    // get entity
    editor.method('entities:get', function(resourceId) {
        return entities.get(resourceId);
    });


    // list entities
    editor.method('entities:list', function() {
        return entities.array();
    });


    // get root entity
    editor.method('entities:root', function () {
        return entityRoot;
    });

});
