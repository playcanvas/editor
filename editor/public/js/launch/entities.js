app.once('load', function() {
    'use strict';

    var framework = app.call('viewport');

    var entities = new ObserverList();
    entities.index = 'resource_id';

    // on adding
    entities.on('add', function(obj) {
        app.emit('entities:add', obj);
    });

    app.method('entities:add', function (obj) {
        entities.add(obj);
    });

    // on removing
    entities.on('remove', function(obj) {
        app.emit('entities:remove', obj);
    });

    app.method('entities:remove', function (obj) {
        entities.remove(obj);
    });

    // remove all entities
    app.method('entities:clear', function () {
        entities.clear();
    });

    // Get entity by resource id
    app.method('entities:get', function (resourceId) {
        return entities.get(resourceId);
    });

    app.once('scene:raw', function(data) {
        for(var key in data.entities) {
            entities.add(new Observer(data.entities[key]));
        }

        app.emit('entities:load', data);
    });
});
