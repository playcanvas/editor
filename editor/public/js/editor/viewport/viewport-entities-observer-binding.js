editor.once('load', function() {
    'use strict';

    editor.on('entities:add', function (obj) {
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

    editor.on('entities:remove', function (obj) {
        var entity = obj.entity;
        if (entity) {

            var framework = editor.call('viewport:framework');
            if (framework && framework.selectedEntity === entity) {
                framework.deselectEntity();
            }

            entity.destroy();
            obj.entity = null;
        }
    });
});
