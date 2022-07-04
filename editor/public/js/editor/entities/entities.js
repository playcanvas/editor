editor.once('load', function () {
    'use strict';

    const entities = editor.entities._entities;

    editor.entities.on('add', (entity, isRoot) => {
        editor.emit('entities:add', entity._observer, isRoot);
    });

    editor.entities.on('remove', (entity) => {
        editor.emit('entities:remove', entity._observer);
    });

    // return entities ObserverList
    editor.method('entities:raw', function () {
        return entities;
    });

    // allow adding entity
    editor.method('entities:add', function (entity) {
        editor.entities.add(entity.apiEntity);
    });

    // // allow remove entity
    editor.method('entities:remove', function (entity) {
        throw new Error('entities:remove: Not implemented');
    });

    // remove all entities
    editor.method('entities:clear', function () {
        editor.entities.clear();
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
        return editor.entities.root && editor.entities.root._observer;
    });

});
