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

        if (! selection)
            return;

        // camera
        var camera = app.activeCamera;
        // get tranform
        var camWtm = camera.getWorldTransform();
        // looking vector
        var camPos = camWtm.getZ();
        // calculate offset distance
        var averageExtent = (selection.halfExtents.x + selection.halfExtents.y + selection.halfExtents.z) / 3;
        var offset = averageExtent / Math.tan(0.5 * camera.camera.fov * Math.PI / 180.0);
        // get camera position
        camPos.normalize().scale(offset * 1.5).add(selection.center);

        var transition = camera.script.designer_camera.transition;
        // set transition information
        transition.eyeStart.copy(camera.getPosition());
        transition.eyeEnd.copy(camPos);
        transition.focusStart.copy(transition.focusEnd);
        transition.focusEnd.copy(aabb.center);
        transition.startTime = pc.time.now();

        if (camera.camera.projection === pc.PROJECTION_ORTHOGRAPHIC) {
            transition.orthoHeightStart = camera.camera.orthoHeight;
            transition.orthoHeightEnd = averageExtent * 1.1;

            // move camera back 1000 meters so that the speed for moving around can remain constant
            transition.eyeEnd.add2(transition.focusEnd, camWtm.getZ().scale(1000));
        }


        transition.active = true;

        editor.call('viewport:frameSelectionStart');
        editor.call('viewport:render');
    });
});
