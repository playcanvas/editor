editor.once('load', function() {
    'use strict';

    var app = editor.call('viewport:framework');
    var defaultSize = new pc.Vec3(1, 1, 1);
    var defaultSizeSmall = new pc.Vec3(.2, .2, .2);
    var aabb = new pc.BoundingBox();
    var aabbA = new pc.BoundingBox();
    var aabbB = new pc.BoundingBox();
    var aabbC = new pc.BoundingBox();

    var calculateChildAABB = function(entity) {
        aabbB.center.copy(entity.getPosition());
        aabbB.halfExtents.copy(defaultSizeSmall);
        aabbA.add(aabbB);

        if (entity.model && entity.model.model && entity.model.model.meshInstances.length) {
            var meshes = entity.model.model.meshInstances;
            for(var i = 0; i < meshes.length; i++) {
                meshes[i].node.getWorldTransform();
                aabbA.add(meshes[i].aabb);
            }
        } else if (entity.collision) {
            switch(entity.collision.type) {
                case 'box':
                    aabbC.halfExtents.copy(entity.collision.halfExtents);
                    aabbB.setFromTransformedAabb(aabbC, entity.getWorldTransform());
                    aabbA.add(aabbB);
                    break;
                case 'sphere':
                    aabbB.center.copy(entity.getPosition());
                    aabbB.halfExtents.set(entity.collision.radius, entity.collision.radius, entity.collision.radius);
                    aabbA.add(aabbB);
                    break;
                case 'capsule':
                case 'cylinder':
                    aabbC.halfExtents.set(entity.collision.radius, entity.collision.radius, entity.collision.radius);
                    aabbC.halfExtents.data[entity.collision.axis] = entity.collision.height;
                    aabbB.setFromTransformedAabb(aabbC, entity.getWorldTransform());
                    aabbA.add(aabbB);
                    break;
            }
        } else {
            aabbB.center.copy(entity.getPosition());
            aabbB.halfExtents.copy(defaultSize);
            aabbA.add(aabbB);
        }

        var children = entity.getChildren();
        for(var i = 0; i < children.length; i++) {
            if (! (children[i] instanceof pc.Entity))
                continue;

            calculateChildAABB(children[i]);
        }
    };

    editor.method('selection:aabb', function() {
        if (editor.call('selector:type') !== 'entity')
            return null;

        var items = editor.call('selector:items');

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
