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

    // Get entity by resource id
    app.method('entities:get', function (resourceId) {
        return entities.get(resourceId);
    });

    app.on('scene:raw', function(data) {
        for(var key in data.entities) {
            entities.add(new Observer(data.entities[key]));
        }

        // Global value where PackResourceHandler loads pack data from
        pc.content = {
            packs: {}
        };

        // convert to hierarchy data format
        var hierarchy = null;
        for (var id in data.entities) {
            if (!data.entities[id].parent) {
                hierarchy = data.entities[id];
            }

            for (var i = 0; i < data.entities[id].children.length; i++) {
                data.entities[id].children[i] = data.entities[data.entities[id].children[i]];
            }
        }

        pc.content.packs[config.scene.id] = {
            hierarchy: hierarchy
        };

        if (framework.content) {
            //...
        } else {
            framework.content = {
                toc: {}
            };
            framework.content.toc[config.scene.id] = {
                packs: [config.scene.id]
            };
        }

        app.emit('entities:load');
    });
});
