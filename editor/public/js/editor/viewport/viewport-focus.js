editor.once('load', function() {
    'use strict';

    var app = editor.call('viewport:app');
    if (! app) return; // webgl not available

    var defaultSize = new pc.Vec3(1, 1, 1);
    var defaultSizeSmall = new pc.Vec3(.2, .2, .2);
    var aabb = new pc.BoundingBox();
    var aabbA = new pc.BoundingBox();

    var calculateChildAABB = function(entity) {
        aabbA.add(editor.call('entities:getBoundingBoxForEntity', entity));

        var children = entity.children;
        for(var i = 0; i < children.length; i++) {
            if (! (children[i] instanceof pc.Entity) || children[i].__editor)
                continue;

            calculateChildAABB(children[i]);
        }
    };

    editor.method('selection:aabb', function() {
        if (editor.call('selector:type') !== 'entity')
            return null;

        return editor.call('entities:aabb', editor.call('selector:items'));
    });

    editor.method('entities:aabb', function(items) {
        if (! items)
            return null;

        if (! (items instanceof Array))
            items = [ items ];

        aabb.center.set(0, 0, 0);
        aabb.halfExtents.copy(defaultSizeSmall);

        // calculate aabb for selected entities
        for(var i = 0; i < items.length; i++) {
            var entity = items[i].entity;

            if (! entity)
                continue;

            aabbA.center.copy(entity.getPosition());
            aabbA.halfExtents.copy(defaultSizeSmall);
            calculateChildAABB(entity);

            if (i === 0) {
                aabb.copy(aabbA);
            } else {
                aabb.add(aabbA);
            }
        }

        return aabb;
    });

    editor.method('viewport:focus', function() {
        var selection = editor.call('selection:aabb');
        if (! selection) return;

        var camera = editor.call('camera:current');

        // aabb
        var distance = Math.max(aabb.halfExtents.x, Math.max(aabb.halfExtents.y, aabb.halfExtents.z));
        // fov
        distance = (distance / Math.tan(0.5 * camera.camera.fov * Math.PI / 180.0));
        // extra space
        distance = distance * 1.1 + 1;

        editor.call('camera:focus', aabb.center, distance);
    });
});
