app.once('load', function() {
    'use strict';

    var entities = new ObserverList();
    entities.index = 'resource_id';

    // on adding
    entities.on('add', function(obj) {
        // app.emit('entities:add', entity);

        // subscribe to changes
        obj.on('*:set', function(path, value) {
            var entity = obj.entity;
            if (!entity) {
                return;
            }

            if (path === 'name') {
                entity.setName(obj.name);

            } else if (path.indexOf('position') === 0) {
                entity.setLocalPosition(new pc.Vec3(obj.position[0], obj.position[1], obj.position[2]));

            } else if (path.indexOf('rotation') === 0) {
                entity.setLocalEulerAngles(new pc.Vec3(obj.rotation[0], obj.rotation[1], obj.rotation[2]));

            } else if (path.indexOf('scale') === 0) {
                entity.setLocalScale(new pc.Vec3(obj.scale[0], obj.scale[1], obj.scale[2]));

            } else if (path.indexOf('enabled') === 0) {
                entity.enabled = obj.enabled;

            } else if (path.indexOf('parent') === 0) {
                var parent = editor.call('entities:get', obj.parent);
                if (parent && parent.entity)
                    entity.reparent(parent.entity);
            }

            // render
            editor.call('viewport:render');
        });

        var reparent = function (child, index) {
            var childEntity = editor.call('entities:get', child);
            if (childEntity && childEntity.entity && obj.entity) {
                childEntity.entity.reparent(obj.entity, index);
            }
        };

        obj.on('children:insert', reparent);
        obj.on('children:move', reparent);

        obj.on('delete', function () {
            if (obj.entity) {
                obj.entity.destroy();
            }
        });
    });

    // on removing
    entities.on('remove', function(obj) {
        // app.emit('entities:remove', entity);

        var entity = obj.entity;
        if (entity) {
            entity.destroy();
            obj.entity = null;
        }

        obj.destroy();
    });


    app.once('scene:raw', function(data) {
        for(var key in data.entities) {
            // components.script.scripts > ObserverList
            if (data.entities[key].components.script && data.entities[key].components.script.scripts.length === 0)
                data.entities[key].components.script.scripts = ObserverList;

            entities.add(new Observer(data.entities[key]));
        }
    });
});
