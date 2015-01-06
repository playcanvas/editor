(function() {
    'use strict';

    var entities = new ObserverList();
    entities.index = 'resource_id';


    // on adding
    entities.on('add', function(entity) {
        msg.emit('entities:add', entity);
    });

    // on removing
    entities.on('remove', function(entity) {
        msg.emit('entities:remove', entity);
        entity.destroy();
    });


    // allow adding entity
    msg.hook('entities:add', function(entity) {
        entities.add(entity);
    });

    // allow remove entity
    msg.hook('entities:remove', function(entity) {
        entities.remove(entity);
    });
})();
