editor.once('load', function() {
    'use strict';

    var app = editor.call('viewport:framework');
    var defaultSize = new pc.Vec3(1, 1, 1);
    var aabb = new pc.shape.Aabb();
    var aabbA = new pc.shape.Aabb();
    var aabbB = new pc.shape.Aabb();
    var aabbC = new pc.shape.Aabb();

    editor.method('selection:aabb', function() {
        if (editor.call('selector:type') !== 'entity')
            return null;

        var items = editor.call('selector:items');

        // calculate aabb for selected entities
        for(var i = 0; i < items.length; i++) {
            var entity = items[i].entity;

            aabbA.center.set(Infinity, Infinity, Infinity);

            // model
            if (entity.model && entity.model.model.meshInstances.length) {
                var meshes = entity.model.model.meshInstances;
                for(var n = 0; n < meshes.length; n++) {
                    // clean tranformation matrix
                    meshes[n].node.getWorldTransform();

                    if (n === 0) {
                        aabbA.copy(meshes[n].aabb);
                    } else {
                        aabbA.add(meshes[n].aabb);
                    }
                }
            }

            // collision
            if (entity.collision && aabbA.center.x === Infinity) {
                switch(entity.collision.type) {
                    case 'box':
                        aabbB.halfExtents.copy(entity.collision.halfExtents);
                        aabbA.setFromTransformedAabb(aabbB, entity.getWorldTransform());
                        break;
                    case 'sphere':
                        aabbA.center.copy(entity.getPosition());
                        aabbA.halfExtents.set(entity.collision.radius, entity.collision.radius, entity.collision.radius);
                        break;
                    case 'capsule':
                    case 'cylinder':
                        aabbB.halfExtents.set(entity.collision.radius, entity.collision.radius, entity.collision.radius);
                        aabbB.halfExtents.data[entity.collision.axis] = entity.collision.height;
                        aabbA.setFromTransformedAabb(aabbB, entity.getWorldTransform());
                        break;
                    // case 'mesh':
                        // TODO
                        // break;
                }
            }

            // light
            if (entity.light && aabbA.center.x === Infinity) {
                switch(entity.light.type) {
                    case 'spot':
                    case 'point':
                        aabbA.center.copy(entity.getPosition());
                        aabbA.halfExtents.set(entity.light.range, entity.light.range, entity.light.range);
                        break;
                }
            }

            if (aabbA.center.x === Infinity) {
                aabbA.center.copy(entity.getPosition());
                aabbA.halfExtents.copy(defaultSize);
            }

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
        transition.active = true;

        editor.call('viewport:frameSelectionStart');
        editor.call('viewport:render');
    });
});
