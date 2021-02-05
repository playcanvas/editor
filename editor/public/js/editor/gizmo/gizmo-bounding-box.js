editor.once('load', function () {
    'use strict';
    var app = null;
    var entities = [];

    var BOUNDING_BOX_MIN_EXTENTS = new pc.Vec3(0.01, 0.01, 0.01);

    var visible = true;

    var color = new pc.Color(1, 1, 1);
    var colorBehind = new pc.Color(1, 1, 1, 0.2);

    var colorNew = new pc.Color(1, 0.5, 0);

    var immediateRenderOptions;
    var immediateMaskRenderOptions;

    var points = [];
    for (var c = 0; c < 32; c++)
        points[c] = new pc.Vec3();

    // temp variables for getBoundingBoxForHierarchy
    var _entityResultBB = new pc.BoundingBox();

    // temp variables for getBoundingBoxForEntity
    var _tmpBB = new pc.BoundingBox();
    var _matA = new pc.Mat4();

    // temp variables for entities:getBoundingBoxForEntity
    var _resultBB = new pc.BoundingBox();

    // tmp variable used to render bounding box
    var _selectionBB = new pc.BoundingBox();

    editor.on('selector:change', function (type, items) {
        if (type === 'entity') {
            entities = items.map(function (item) {
                return item.entity;
            });
        } else {
            entities = [];
        }
    });

    editor.method('gizmo:boundingbox:visible', function (state) {
        if (state !== visible) {
            visible = state;
            editor.call('viewport:render');
        }
    });

    editor.method('viewport:render:aabb', function (aabb) {
        if (! app) return; // webgl not available

        if (! visible) return;

        var ind = 0;
        for (var x = -1; x <= 1; x += 2) {
            for (var y = -1; y <= 1; y += 2) {
                for (var z = -1; z <= 1; z += 2) {
                    points[ind * 4].copy(aabb.halfExtents);
                    points[ind * 4].x *= x;
                    points[ind * 4].y *= y;
                    points[ind * 4].z *= z;
                    points[ind * 4].add(aabb.center);

                    points[ind * 4 + 1].copy(points[ind * 4]);
                    points[ind * 4 + 1].x -= aabb.halfExtents.x * 0.3 * x;

                    points[ind * 4 + 2].copy(points[ind * 4]);
                    points[ind * 4 + 2].y -= aabb.halfExtents.y * 0.3 * y;

                    points[ind * 4 + 3].copy(points[ind * 4]);
                    points[ind * 4 + 3].z -= aabb.halfExtents.z * 0.3 * z;

                    app.renderLine(points[ind * 4], points[ind * 4 + 1], colorBehind, immediateRenderOptions);
                    app.renderLine(points[ind * 4], points[ind * 4 + 2], colorBehind, immediateRenderOptions);
                    app.renderLine(points[ind * 4], points[ind * 4 + 3], colorBehind, immediateRenderOptions);

                    app.renderLine(points[ind * 4], points[ind * 4 + 1], color, immediateMaskRenderOptions);
                    app.renderLine(points[ind * 4], points[ind * 4 + 2], color, immediateMaskRenderOptions);
                    app.renderLine(points[ind * 4], points[ind * 4 + 3], color, immediateMaskRenderOptions);

                    ind++;
                }
            }
        }
    });


    // Get the bounding box the encloses a hierarchy of entities
    // {pc.Entity} root - the root entity of the hierarchy
    var getBoundingBoxForHierarchy = function (root, hierarchyBB) {
        var bb = getBoundingBoxForEntity(root, _entityResultBB);

        // first time through we initialize with the new boundingbox
        if (!hierarchyBB) {
            hierarchyBB = new pc.BoundingBox();
            hierarchyBB.copy(bb);
        } else {
            hierarchyBB.add(bb);
        }

        var children = root.children;
        for (var i = 0; i < children.length; i++) {
            if (children[i].__editor || ! (children[i] instanceof pc.Entity))
                continue;

            // now we pass in the bounding box to be added to
            getBoundingBoxForHierarchy(children[i], hierarchyBB);
        }

        return hierarchyBB;
    };

    // calculate the bounding box for a single entity and return it
    // bounding box is calculated from one of the components
    // attached to the entity in a priority order
    var getBoundingBoxForEntity = function (entity, resultBB) {
        // why is this here? to sync the hierarchy?
        entity.getWorldTransform();

        // clear result box
        resultBB.center.set(0, 0, 0);
        resultBB.halfExtents.set(0, 0, 0);

        // first choice is to use the bounding box of all mesh instances on a model or render component
        if (entity.model || entity.render) {

            var meshInstances;
            if (entity.model && entity.model.model && entity.model.meshInstances.length) {
                meshInstances = entity.model.meshInstances;
            }
            if (entity.render && entity.render.meshInstances && entity.render.meshInstances.length) {
                meshInstances = entity.render.meshInstances;
            }

            if (meshInstances) {
                for (var i = 0; i < meshInstances.length; i++) {
                    if (meshInstances[i]._hidden)
                        continue;

                    // not sure why this is here, probably to force hierachy to sync
                    meshInstances[i].node.getWorldTransform();

                    if (i === 0) {
                        resultBB.copy(meshInstances[i].aabb);
                    } else {
                        resultBB.add(meshInstances[i].aabb);
                    }
                }

                return resultBB;
            }
        }

        // next is the collision bounding box
        if (entity.collision) {
            switch (entity.collision.type) {
                case 'box':
                    _tmpBB.center.set(0, 0, 0);
                    _tmpBB.halfExtents.copy(entity.collision.halfExtents);
                    resultBB.setFromTransformedAabb(_tmpBB, entity.getWorldTransform());
                    return resultBB;
                case 'sphere':
                    resultBB.center.copy(entity.getPosition());
                    resultBB.halfExtents.set(entity.collision.radius, entity.collision.radius, entity.collision.radius);
                    return resultBB;
                case 'capsule':
                case 'cylinder':
                    _tmpBB.halfExtents.set(entity.collision.radius, entity.collision.radius, entity.collision.radius);
                    var axes = ['x', 'y', 'z'];
                    _tmpBB.halfExtents[axes[entity.collision.axis]] = entity.collision.height / 2;
                    resultBB.setFromTransformedAabb(_tmpBB, entity.getWorldTransform());
                    return resultBB;
            }
        }

        // the an element component
        if (entity.element) {
            // if the element has an aabb (image or text element)
            var aabb = entity.element.aabb;
            if (aabb) {
                resultBB.copy(aabb);
            } else {
                resultBB.center.copy(entity.getPosition());
                // otherwise for group element use the world corners
                entity.element.worldCorners.forEach(function (corner) {
                    _tmpBB.center.copy(corner);
                    _tmpBB.halfExtents.set(0, 0, 0);
                    resultBB.add(_tmpBB);
                });
            }
            return resultBB;
        }

        // then sprite component
        if (entity.sprite) {
            var aabb = entity.sprite.aabb;
            if (aabb) {
                resultBB.copy(aabb);
            }
            return resultBB;
        }

        // the particle system
        if (entity.particlesystem) {
            if (entity.particlesystem.emitter) {
                _tmpBB.center.set(0, 0, 0);
                _tmpBB.copy(entity.particlesystem.emitter.localBounds);
                resultBB.setFromTransformedAabb(_tmpBB, entity.getWorldTransform());
                return resultBB;
            } else if (entity.particlesystem.emitterShape === pc.EMITTERSHAPE_BOX) {
                _tmpBB.center.set(0, 0, 0);
                _tmpBB.halfExtents.copy(entity.particlesystem.emitterExtents).scale(0.5);
                resultBB.setFromTransformedAabb(_tmpBB, entity.getWorldTransform());
                return resultBB;
            } else if (entity.particlesystem.emitterShape === pc.EMITTERSHAPE_SPHERE) {
                resultBB.center.copy(entity.getPosition());
                resultBB.halfExtents.set(entity.particlesystem.emitterRadius, entity.particlesystem.emitterRadius, entity.particlesystem.emitterRadius);
                return resultBB;
            }
        }

        // then zone
        if (entity.zone) {
            _tmpBB.halfExtents.copy(entity.zone.size).scale(0.5);
            var position = entity.getPosition();
            var rotation = entity.getRotation();
            _matA.setTRS(position, rotation, pc.Vec3.ONE);
            resultBB.setFromTransformedAabb(_tmpBB, _matA);
            return resultBB;
        }

        // finally just return a default bounding box
        resultBB.center.copy(entity.getPosition());
        resultBB.halfExtents.copy(BOUNDING_BOX_MIN_EXTENTS);
        return resultBB;
    };

    editor.method('entities:getBoundingBoxForEntity', function (entity) {
        return getBoundingBoxForEntity(entity, _resultBB);
    });

    editor.once('viewport:load', function () {
        app = editor.call('viewport:app');

        immediateRenderOptions = {
            layer: editor.call('gizmo:layers', 'Axis Gizmo Immediate'),
            mask: GIZMO_MASK
        };

        immediateMaskRenderOptions = {
            layer: editor.call('gizmo:layers', 'Bright Gizmo'),
            mask: GIZMO_MASK
        };

        editor.on('viewport:postUpdate', function () {
            if (! entities.length)
                return;

            // firstBB = true;
            var noEntities = true;

            for (var i = 0; i < entities.length; i++) {
                if (! entities[i])
                    continue;

                noEntities = false;
                var entityBox = getBoundingBoxForHierarchy(entities[i]);
                if (i === 0) {
                    _selectionBB.copy(entityBox);
                } else {
                    _selectionBB.add(entityBox);
                }
            }

            if (! noEntities) {
                _selectionBB.halfExtents.add(BOUNDING_BOX_MIN_EXTENTS);
                editor.call('viewport:render:aabb', _selectionBB);
            }
        });
    });
});
