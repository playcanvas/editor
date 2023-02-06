editor.once('load', function () {
    const vecA = new pc.Vec3();
    const vecB = new pc.Vec3();
    const vecC = new pc.Vec3();
    const vecD = new pc.Vec3();

    let selectedEntity = null;

    let evtTapStart = null;
    let moving = false;
    let mouseTap = null;
    let mouseTapMoved = false;
    const pickStart = new pc.Vec3();
    const posCameraLast = new pc.Vec3();

    let posStart = [];
    const posCurrent = [];
    const sizeStart = [0, 0];
    const sizeCurrent = [0, 0];
    const startWorldCorners = [new pc.Vec3(), new pc.Vec3(), new pc.Vec3(), new pc.Vec3()];
    const worldToEntitySpace = new pc.Mat4();
    const entitySpaceToParentSpace = new pc.Mat4();
    let dirty = false;

    let offset = new pc.Vec3();
    const localOffset = new pc.Vec3();
    const offsetWithPivot = new pc.Vec3();

    const createGizmo = function () {
        const obj = {
            root: null,
            handles: [null, null, null, null],
            matActive: null,
            matInactive: null,
            handle: null
        };

        obj.root = new pc.Entity();
        obj.root.enabled = false;

        const createMaterial = function (color) {
            const mat = new pc.BasicMaterial();
            mat.color = color;
            if (color.a !== 1) {
                mat.blend = true;
                mat.blendSrc = pc.BLENDMODE_SRC_ALPHA;
                mat.blendDst = pc.BLENDMODE_ONE_MINUS_SRC_ALPHA;
            }
            mat.update();
            return mat;
        };

        obj.matInactive = createMaterial(new pc.Color(1, 1, 0, 0.5));
        obj.matActive = createMaterial(new pc.Color(1, 1, 0, 1));

        const layer = editor.call('gizmo:layers', 'Axis Gizmo');

        const createHandle = function () {
            const sphere = new pc.Entity();
            sphere.addComponent('model', {
                type: 'sphere',
                layers: [layer.id]
            });
            sphere.model.castShadows = false;
            sphere.model.receiveShadows = false;
            sphere.model.meshInstances[0].material = obj.matInactive;
            sphere.model.meshInstances[0].mask = GIZMO_MASK;
            sphere.setLocalScale(0.5, 0.5, 0.5);
            obj.root.addChild(sphere);
            return sphere;
        };

        for (let i = 0; i < 4; i++)
            obj.handles[i] = createHandle();

        return obj;
    };

    const gizmoEnabled = function () {
        if (editor.call('gizmo:type') === 'resize' && editor.call('permissions:write') && editor.selection.items.length === 1) {
            return (selectedEntity && selectedEntity.has('components.element') && selectedEntity.entity);
        }

        return false;
    };

    editor.once('viewport:load', function (app) {
        const gizmo = createGizmo();
        app.root.addChild(gizmo.root);

        const pickPlane = function (x, y) {
            const camera = editor.call('camera:current');
            const entity = selectedEntity.entity;

            const posEntity = startWorldCorners[gizmo.handles.indexOf(gizmo.handle)];
            const posMouse = camera.camera.screenToWorld(x, y, 1);
            const rayOrigin = vecA.copy(camera.getPosition());
            const rayDirection = vecB.set(0, 0, 0);

            vecC.copy(entity.forward);
            const planeNormal = vecC.scale(-1);

            if (camera.camera.projection === pc.PROJECTION_PERSPECTIVE) {
                rayDirection.copy(posMouse).sub(rayOrigin).normalize();
            } else {
                rayOrigin.add(posMouse);
                camera.getWorldTransform().transformVector(vecD.set(0, 0, -1), rayDirection);
            }

            const rayPlaneDot = planeNormal.dot(rayDirection);
            const planeDist = posEntity.dot(planeNormal);
            const pointPlaneDist = (planeNormal.dot(rayOrigin) - planeDist) / rayPlaneDot;
            const pickedPos = rayDirection.scale(-pointPlaneDist).add(rayOrigin);

            return pickedPos;
        };

        editor.on('selector:add', function (item, type) {
            if (type !== 'entity') return;

            if (!selectedEntity) {
                selectedEntity = item;
            }
        });

        editor.on('selector:remove', function (item, type) {
            if (selectedEntity === item) {
                selectedEntity = null;
            }
        });

        editor.on('viewport:gizmoUpdate', function (dt) {
            gizmo.root.enabled = gizmoEnabled();
            if (!gizmo.root.enabled)
                return;

            const entity = selectedEntity.entity;

            // scale to screen space
            let scale = 1;
            const gizmoSize = 0.2;
            const camera = editor.call('camera:current');
            const posCamera = camera.getPosition();
            const worldCorners = entity.element.worldCorners;

            for (let i = 0; i < 4; i++) {
                if (camera.camera.projection === pc.PROJECTION_PERSPECTIVE) {
                    const dot = vecA.copy(worldCorners[i]).sub(posCamera).dot(camera.forward);
                    const denom = 1280 / (2 * Math.tan(camera.camera.fov * pc.math.DEG_TO_RAD / 2));
                    scale = Math.max(0.0001, (dot / denom) * 150) * gizmoSize;
                } else {
                    scale = camera.camera.orthoHeight / 3 * gizmoSize;
                }

                gizmo.handles[i].setPosition(worldCorners[i]);
                gizmo.handles[i].setLocalScale(scale, scale, scale);
            }

            if (moving && (vecA.copy(posCameraLast).sub(posCamera).length() > 0.01 || mouseTapMoved)) {
                offset = pickPlane(mouseTap.x, mouseTap.y);
                if (offset) {
                    dirty = true;

                    posCurrent[0] = posStart[0];
                    posCurrent[1] = posStart[1];
                    posCurrent[2] = posStart[2];
                    sizeCurrent[0] = sizeStart[0];
                    sizeCurrent[1] = sizeStart[1];

                    const pivot = entity.element.pivot;
                    let px, py, sx, sy;

                    if (gizmo.handle === gizmo.handles[0]) { // bottom left
                        px = 1 - pivot.x;
                        py = 1 - pivot.y;
                        sx = -1;
                        sy = -1;
                    } else if (gizmo.handle === gizmo.handles[1]) { // bottom right
                        px = pivot.x;
                        py = 1 - pivot.y;
                        sx = 1;
                        sy = -1;
                    } else if (gizmo.handle === gizmo.handles[2]) { // top right
                        px = pivot.x;
                        py = pivot.y;
                        sx = 1;
                        sy = 1;
                    } else if (gizmo.handle === gizmo.handles[3]) { // top left
                        px = 1 - pivot.x;
                        py = pivot.y;
                        sx = -1;
                        sy = 1;
                    }

                    // world space offset
                    offset.sub(pickStart);
                    // offset in element space
                    worldToEntitySpace.transformVector(offset, localOffset);

                    // position changes based on the pivot - calculate the
                    // offset in element space after applying pivot
                    offsetWithPivot.set(px * localOffset.x, py * localOffset.y, 0);
                    // transform result to world space and then to element parent space
                    entitySpaceToParentSpace.transformVector(offsetWithPivot, offsetWithPivot);

                    // apply offset
                    posCurrent[0] += offsetWithPivot.x;
                    posCurrent[1] += offsetWithPivot.y;
                    posCurrent[2] += offsetWithPivot.z;

                    // apply size change
                    sizeCurrent[0] += sx * localOffset.x;
                    sizeCurrent[1] += sy * localOffset.y;

                    selectedEntity.set('position', posCurrent);
                    selectedEntity.set('components.element.width', sizeCurrent[0]);
                    selectedEntity.set('components.element.height', sizeCurrent[1]);
                }

                editor.call('viewport:render');
            }

            posCameraLast.copy(posCamera);
            mouseTapMoved = false;

        });

        const onTapStart = function (tap) {
            if (moving || tap.button !== 0)
                return;

            editor.emit('camera:toggle', false);
            editor.call('viewport:pick:state', false);

            moving = true;
            mouseTap = tap;
            dirty = false;

            if (selectedEntity) {
                selectedEntity.history.enabled = false;

                posStart = selectedEntity.get('position').slice(0);
                sizeStart[0] = selectedEntity.get('components.element.width');
                sizeStart[1] = selectedEntity.get('components.element.height');
                worldToEntitySpace.copy(selectedEntity.entity.getWorldTransform()).invert();
                entitySpaceToParentSpace.copy(selectedEntity.entity.parent.getWorldTransform()).invert().mul(selectedEntity.entity.getWorldTransform());

                for (let i = 0; i < 4; i++)
                    startWorldCorners[i].copy(selectedEntity.entity.element.worldCorners[i]);

            }

            if (gizmo.root.enabled) {
                pickStart.copy(pickPlane(tap.x, tap.y));
            }

            editor.call('gizmo:translate:visible', false);
            editor.call('gizmo:rotate:visible', false);
            editor.call('gizmo:scale:visible', false);
        };

        const onTapMove = function (tap) {
            if (!moving)
                return;

            mouseTap = tap;
            mouseTapMoved = true;
        };

        const onTapEnd = function (tap) {
            if (tap.button !== 0)
                return;

            editor.emit('camera:toggle', true);

            if (!moving)
                return;

            moving = false;
            mouseTap = tap;

            editor.call('gizmo:translate:visible', true);
            editor.call('gizmo:rotate:visible', true);
            editor.call('gizmo:scale:visible', true);
            editor.call('viewport:pick:state', true);

            if (selectedEntity) {
                if (dirty) {
                    const resourceId = selectedEntity.get('resource_id');
                    const previousPos = posStart.slice(0);
                    const newPos = posCurrent.slice(0);
                    const previousSize = sizeStart.slice(0);
                    const newSize = sizeCurrent.slice(0);

                    editor.call('history:add', {
                        name: 'entity.element.size',
                        undo: function () {
                            const item = editor.call('entities:get', resourceId);
                            if (!item)
                                return;

                            const history = item.history.enabled;
                            item.history.enabled = false;
                            item.set('position', previousPos);
                            item.set('components.element.width', previousSize[0]);
                            item.set('components.element.height', previousSize[1]);
                            item.history.enabled = history;
                        },
                        redo: function () {
                            const item = editor.call('entities:get', resourceId);
                            if (!item)
                                return;

                            const history = item.history.enabled;
                            item.history.enabled = false;
                            item.set('position', newPos);
                            item.set('components.element.width', newSize[0]);
                            item.set('components.element.height', newSize[1]);
                            item.history.enabled = history;
                        }
                    });
                }

                selectedEntity.history.enabled = true;
            }
        };

        editor.on('viewport:pick:hover', function (node, picked) {
            if (!node || gizmo.handles.indexOf(node) === -1) {
                if (gizmo.handle) {
                    gizmo.handle = null;

                    for (let i = 0; i < 4; i++) {
                        gizmo.handles[i].model.meshInstances[0].material = gizmo.matInactive;
                    }

                    if (evtTapStart) {
                        evtTapStart.unbind();
                        evtTapStart = null;
                    }
                }
            } else if (!gizmo.handle || gizmo.handle !== node) {

                gizmo.handle = node;

                for (let i = 0; i < 4; i++) {
                    gizmo.handles[i].model.meshInstances[0].material = (gizmo.handles[i] === node ? gizmo.matActive : gizmo.matInactive);
                }

                if (!evtTapStart) {
                    evtTapStart = editor.on('viewport:tap:start', onTapStart);
                }
            }
        });

        editor.on('viewport:tap:move', onTapMove);
        editor.on('viewport:tap:end', onTapEnd);
    });
});
