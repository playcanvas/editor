editor.once('load', function() {
    'use strict';

    var entities = new ObserverList({
        index: 'resource_id'
    });

    // on adding
    entities.on('add', function(obj) {
        editor.emit('entities:add', obj);
    });

    editor.method('entities:add', function (obj) {
        entities.add(obj);
    });

    // on removing
    entities.on('remove', function(obj) {
        editor.emit('entities:remove', obj);
    });

    editor.method('entities:remove', function (obj) {
        entities.remove(obj);
    });

    // remove all entities
    editor.method('entities:clear', function () {
        entities.clear();
    });

    // Get entity by resource id
    editor.method('entities:get', function (resourceId) {
        return entities.get(resourceId);
    });

    editor.on('scene:raw', function(data) {
        for(var key in data.entities) {
            entities.add(new Observer(data.entities[key]));
        }

        editor.emit('entities:load', data);
    });
});
