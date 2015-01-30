editor.once('load', function() {
    'use strict';

    var entities = new ObserverList();
    entities.index = 'resource_id';


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
        entities.add(entity);
    });

    // allow remove entity
    editor.method('entities:remove', function(entity) {
        entities.remove(entity);
    });


    // get entity
    editor.method('entities:get', function(resourceId) {
        return entities.get(resourceId);
    });


    // list entities
    editor.method('entities:list', function() {
        return entities.array();
    });
});
