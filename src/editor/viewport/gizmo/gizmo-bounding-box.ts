import { BoundingBox, Color, EMITTERSHAPE_BOX, EMITTERSHAPE_SPHERE, Entity, Mat4, Vec3 } from 'playcanvas';

editor.once('load', () => {
    let app = null;
    let entities = [];

    const BOUNDING_BOX_MIN_EXTENTS = new Vec3(0.01, 0.01, 0.01);

    let visible = true;

    const color = new Color(1, 1, 1);
    const colorBehind = new Color(1, 1, 1, 0.2);

    const points = [];
    for (let c = 0; c < 32; c++) {
        points[c] = new Vec3();
    }

    // temp variables for getBoundingBoxForHierarchy
    const _entityResultBB = new BoundingBox();

    // temp variables for getBoundingBoxForEntity
    const _tmpBB = new BoundingBox();
    const _matA = new Mat4();

    // temp variables for entities:getBoundingBoxForEntity
    const _resultBB = new BoundingBox();

    // tmp variable used to render bounding box
    const _selectionBB = new BoundingBox();

    editor.on('selector:change', (type, items) => {
        if (type === 'entity') {
            entities = items.map((item) => {
                return item.entity;
            });
        } else {
            entities = [];
        }
    });

    editor.method('gizmo:boundingbox:visible', (state) => {
        if (state !== visible) {
            visible = state;
            editor.call('viewport:render');
        }
    });

    editor.method('viewport:render:aabb', (aabb) => {
        if (!app) {
            return;
        } // webgl not available

        if (!visible) {
            return;
        }

        const immediateLayer = editor.call('gizmo:layers', 'Axis Gizmo Immediate');
        const brightLayer = editor.call('gizmo:layers', 'Bright Gizmo');

        let ind = 0;
        for (let x = -1; x <= 1; x += 2) {
            for (let y = -1; y <= 1; y += 2) {
                for (let z = -1; z <= 1; z += 2) {
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

                    app.drawLine(points[ind * 4], points[ind * 4 + 1], colorBehind, true, immediateLayer);
                    app.drawLine(points[ind * 4], points[ind * 4 + 2], colorBehind, true, immediateLayer);
                    app.drawLine(points[ind * 4], points[ind * 4 + 3], colorBehind, true, immediateLayer);

                    app.drawLine(points[ind * 4], points[ind * 4 + 1], color, true, brightLayer);
                    app.drawLine(points[ind * 4], points[ind * 4 + 2], color, true, brightLayer);
                    app.drawLine(points[ind * 4], points[ind * 4 + 3], color, true, brightLayer);

                    ind++;
                }
            }
        }
    });

    // calculate the bounding box for a single entity and return it
    // bounding box is calculated from one of the components
    // attached to the entity in a priority order
    const getBoundingBoxForEntity = function (entity, resultBB) {

        // clear result box
        resultBB.center.set(0, 0, 0);
        resultBB.halfExtents.set(0, 0, 0);

        // first choice is to use the bounding box of all mesh instances on a model or render component
        if (entity.model || entity.render) {

            let meshInstances;
            if (entity.model && entity.model.model && entity.model.meshInstances.length) {
                meshInstances = entity.model.meshInstances;
            }
            if (entity.render && entity.render.meshInstances && entity.render.meshInstances.length) {
                meshInstances = entity.render.meshInstances;
            }

            if (meshInstances) {
                let first = true;
                for (let i = 0; i < meshInstances.length; i++) {
                    if (meshInstances[i]._hidden) {
                        continue;
                    }

                    if (first) {
                        first = false;
                        resultBB.copy(meshInstances[i].aabb);
                    } else {
                        resultBB.add(meshInstances[i].aabb);
                    }
                }

                return resultBB;
            }
        }

        if (entity.gsplat) {
            const aabb = entity.gsplat.instance?.meshInstance?.aabb;
            if (aabb) {
                resultBB.copy(aabb);
                return resultBB;
            }
        }

        // next is the collision bounding box
        if (entity.collision) {
            const axes = ['x', 'y', 'z'];

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
                    _tmpBB.center.set(0, 0, 0);
                    _tmpBB.halfExtents.set(entity.collision.radius, entity.collision.radius, entity.collision.radius);
                    _tmpBB.halfExtents[axes[entity.collision.axis]] = entity.collision.height / 2;
                    resultBB.setFromTransformedAabb(_tmpBB, entity.getWorldTransform());
                    return resultBB;
            }
        }

        // then screen component
        if (entity.screen) {
            const position = entity.getPosition();
            const scale = entity.getLocalScale();

            if (entity.screen.screenSpace) {
                resultBB.center.copy(position);
                const screenScale = entity.screen.scaleMode === 'blend' ?
                    entity.screen._calcScale(entity.screen.resolution, entity.screen.referenceResolution) || Number.MIN_VALUE :
                    1;

                resultBB.halfExtents.set(
                    0.5 * entity.screen.resolution.x * scale.x / screenScale,
                    0.5 * entity.screen.resolution.y * scale.y / screenScale,
                    0.1  // small z extent since screens are 2D
                );
            } else {
                // For non-screen space, create unrotated box and transform it
                _tmpBB.center.set(0, 0, 0);
                _tmpBB.halfExtents.set(
                    0.5 * entity.screen.resolution.x * scale.x,
                    0.5 * entity.screen.resolution.y * scale.y,
                    0.1  // small z extent since screens are 2D
                );
                resultBB.setFromTransformedAabb(_tmpBB, entity.getWorldTransform(), true);
            }
            return resultBB;
        }

        // then element component
        if (entity.element) {
            resultBB.center.copy(entity.getPosition());
            entity.element.worldCorners.forEach((corner) => {
                _tmpBB.center.copy(corner);
                _tmpBB.halfExtents.set(0, 0, 0);
                resultBB.add(_tmpBB);
            });
            return resultBB;
        }

        // then sprite component
        if (entity.sprite) {
            const aabb = entity.sprite.aabb;
            if (aabb) {
                resultBB.copy(aabb);
            }
            return resultBB;
        }

        // then particle system
        if (entity.particlesystem) {
            if (entity.particlesystem.emitter) {
                _tmpBB.center.set(0, 0, 0);
                _tmpBB.copy(entity.particlesystem.emitter.localBounds);
                resultBB.setFromTransformedAabb(_tmpBB, entity.getWorldTransform());
                return resultBB;
            }
            if (entity.particlesystem.emitterShape === EMITTERSHAPE_BOX) {
                _tmpBB.center.set(0, 0, 0);
                _tmpBB.halfExtents.copy(entity.particlesystem.emitterExtents).mulScalar(0.5);
                resultBB.setFromTransformedAabb(_tmpBB, entity.getWorldTransform());
                return resultBB;
            }
            if (entity.particlesystem.emitterShape === EMITTERSHAPE_SPHERE) {
                resultBB.center.copy(entity.getPosition());
                resultBB.halfExtents.set(entity.particlesystem.emitterRadius, entity.particlesystem.emitterRadius, entity.particlesystem.emitterRadius);
                return resultBB;
            }
        }

        // then zone
        if (entity.zone) {
            _tmpBB.halfExtents.copy(entity.zone.size).mulScalar(0.5);
            const position = entity.getPosition();
            const rotation = entity.getRotation();
            _matA.setTRS(position, rotation, Vec3.ONE);
            resultBB.setFromTransformedAabb(_tmpBB, _matA);
            return resultBB;
        }

        // finally just return a default bounding box
        resultBB.center.copy(entity.getPosition());
        resultBB.halfExtents.copy(BOUNDING_BOX_MIN_EXTENTS);
        return resultBB;
    };

    // Get the bounding box the encloses a hierarchy of entities
    // {Entity} root - the root entity of the hierarchy
    const getBoundingBoxForHierarchy = function (root, hierarchyBB) {
        const bb = getBoundingBoxForEntity(root, _entityResultBB);

        // first time through we initialize with the new boundingbox
        if (!hierarchyBB) {
            hierarchyBB = new BoundingBox();
            hierarchyBB.copy(bb);
        } else {
            hierarchyBB.add(bb);
        }

        const children = root.children;
        for (let i = 0; i < children.length; i++) {
            if (children[i].__editor || !(children[i] instanceof Entity)) {
                continue;
            }

            // now we pass in the bounding box to be added to
            getBoundingBoxForHierarchy(children[i], hierarchyBB);
        }

        return hierarchyBB;
    };

    editor.method('entities:getBoundingBoxForEntity', (entity) => {
        return getBoundingBoxForEntity(entity, _resultBB);
    });

    editor.once('viewport:load', (application) => {
        app = application;

        editor.on('viewport:postUpdate', () => {
            if (!entities.length) {
                return;
            }

            // firstBB = true;
            let noEntities = true;

            for (let i = 0; i < entities.length; i++) {
                if (!entities[i]) {
                    continue;
                }

                noEntities = false;
                const entityBox = getBoundingBoxForHierarchy(entities[i]);
                if (i === 0) {
                    _selectionBB.copy(entityBox);
                } else {
                    _selectionBB.add(entityBox);
                }
            }

            if (!noEntities) {
                _selectionBB.halfExtents.add(BOUNDING_BOX_MIN_EXTENTS);
                editor.call('viewport:render:aabb', _selectionBB);
            }
        });
    });
});
