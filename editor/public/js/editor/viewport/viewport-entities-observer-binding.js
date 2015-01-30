editor.once('load', function() {
    'use strict';

    editor.on('entities:add', function (obj) {
        var entity = obj.entity;

        if (! entity)
            return;

        // subscribe to changes
        obj.on('*:set', function(path, value) {
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
                if (parent && parent.entity) {
                    entity.reparent(parent.entity);
                }
            }

            // render
            editor.call('viewport:render');
        });

        obj.on('delete', function () {
            entity.destroy();
        });

    });
});
