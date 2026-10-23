import { BoundingBox, EMITTERSHAPE_BOX, EMITTERSHAPE_SPHERE, Mat4, Vec3 } from 'playcanvas';
import type { Entity } from 'playcanvas';

// selection bounds are drawn by the engine bounding box gizmo (gizmo-helpers); this keeps the
// per-entity bounds used to frame the camera and whether the bounds show
editor.once('load', () => {
    const BOUNDING_BOX_MIN_EXTENTS = new Vec3(0.01, 0.01, 0.01);

    let visible = true;

    // temp variables for getBoundingBoxForEntity
    const _tmpBB = new BoundingBox();
    const _matA = new Mat4();

    // temp variables for entities:getBoundingBoxForEntity
    const _resultBB = new BoundingBox();

    editor.method('gizmo:boundingbox:visible', (state?: boolean) => {
        if (state === undefined) {
            return visible;
        }
        if (state !== visible) {
            visible = state;
            editor.emit('gizmo:boundingbox:visible', visible);
            editor.call('viewport:render');
        }
    });

    // calculate the bounding box for a single entity and return it
    // bounding box is calculated from one of the components
    // attached to the entity in a priority order
    const getBoundingBoxForEntity = function (entity: Entity, resultBB: BoundingBox): BoundingBox {
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
                    const meshInstance = meshInstances[i];
                    if (meshInstance._hidden) {
                        continue;
                    }

                    if (first) {
                        first = false;
                        resultBB.copy(meshInstance.aabb);
                    } else {
                        resultBB.add(meshInstance.aabb);
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
                const screenScale =
                    entity.screen.scaleMode === 'blend'
                        ? entity.screen._calcScale(entity.screen.resolution, entity.screen.referenceResolution) ||
                          Number.MIN_VALUE
                        : 1;

                resultBB.halfExtents.set(
                    (0.5 * entity.screen.resolution.x * scale.x) / screenScale,
                    (0.5 * entity.screen.resolution.y * scale.y) / screenScale,
                    0.1 // small z extent since screens are 2D
                );
            } else {
                // For non-screen space, create unrotated box and transform it
                _tmpBB.center.set(0, 0, 0);
                _tmpBB.halfExtents.set(
                    0.5 * entity.screen.resolution.x * scale.x,
                    0.5 * entity.screen.resolution.y * scale.y,
                    0.1 // small z extent since screens are 2D
                );
                resultBB.setFromTransformedAabb(_tmpBB, entity.getWorldTransform(), true);
            }
            return resultBB;
        }

        // then element component
        if (entity.element) {
            resultBB.center.copy(entity.getPosition());
            entity.element.worldCorners.forEach((corner: Vec3) => {
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
                resultBB.halfExtents.set(
                    entity.particlesystem.emitterRadius,
                    entity.particlesystem.emitterRadius,
                    entity.particlesystem.emitterRadius
                );
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

    editor.method('entities:getBoundingBoxForEntity', (entity: Entity) => {
        return getBoundingBoxForEntity(entity, _resultBB);
    });
});
