import type { Entity, EntityObserver } from '@playcanvas/editor-api';

editor.once('load', () => {
    const entities = editor.api.globals.entities.raw;

    editor.api.globals.entities.on('add', (entity: Entity, isRoot) => {
        editor.emit('entities:add', entity.observer, isRoot);
    });

    editor.api.globals.entities.on('remove', (entity: Entity) => {
        editor.emit('entities:remove', entity.observer);
    });

    // return entities ObserverList
    editor.method('entities:raw', () => {
        return entities;
    });

    // allow adding entity
    editor.method('entities:add', (entity: EntityObserver) => {
        editor.api.globals.entities.add(entity.apiEntity);
    });

    // // allow remove entity
    editor.method('entities:remove', (entity: EntityObserver) => {
        throw new Error('entities:remove: Not implemented');
    });

    // remove all entities
    editor.method('entities:clear', () => {
        editor.api.globals.entities.clear();
        entities.clear();
        editor.emit('entities:clear');
    });

    // get entity
    editor.method('entities:get', (resourceId) => {
        return entities.get(resourceId);
    });


    // list entities
    editor.method('entities:list', () => {
        return entities.array();
    });


    // get root entity
    editor.method('entities:root', () => {
        return editor.api.globals.entities.root && editor.api.globals.entities.root.observer;
    });

});
