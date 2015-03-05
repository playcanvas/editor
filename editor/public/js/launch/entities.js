app.once('load', function() {
    'use strict';

    var framework = app.call('viewport');

    var entities = new ObserverList();
    entities.index = 'resource_id';

    // on adding
    entities.on('add', function(obj) {
        // subscribe to changes
        obj.on('*:set', function(path, value) {
            var entity = obj.entity;
            if (! entity)
                return;

            if (path === 'name') {
                entity.setName(obj.get('name'));

            } else if (path.indexOf('position') === 0) {
                entity.setLocalPosition(new pc.Vec3(obj.get('position.0'), obj.get('position.1'), obj.get('position.2')));

            } else if (path.indexOf('rotation') === 0) {
                entity.setLocalEulerAngles(new pc.Vec3(obj.get('rotation.0'), obj.get('rotation.1'), obj.get('rotation.2')));

            } else if (path.indexOf('scale') === 0) {
                entity.setLocalScale(new pc.Vec3(obj.get('scale.0'), obj.get('scale.1'), obj.get('scale.2')));

            } else if (path.indexOf('enabled') === 0) {
                entity.enabled = obj.get('enabled');

            } else if (path.indexOf('parent') === 0) {
                var parent = editor.call('entities:get', obj.get('parent'));
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
