editor.once('viewport:load', (app) => {
    // Moving towards mouse point in world using mouse wheel
    // Speed is relative to distance of point in world

    const settings = editor.call('settings:user');

    let zoom = 0;
    let zoomTarget = 0;

    let zoomSpeed = settings.get('editor.zoomSensitivity') / 100;
    let zoomSpeedFast = zoomSpeed * 5;
    settings.on('editor.zoomSensitivity:set', (sensitivity) => {
        zoomSpeed = sensitivity / 100;
        zoomSpeedFast = zoomSpeed * 5;
    });

    const zoomEasing = 0.3;
    const zoomMax = 300;
    let zoomCamera;
    let altKey = false;
    let hovering = false;
    let firstUpdate = 3;
    const mouseCoords = new pc.Vec2();
    const vecA = new pc.Vec3();
    const vecB = new pc.Vec3();
    let distance = 1;

    let selectorLastType = null;
    const aabbSelection = new pc.BoundingBox();
    let aabbSelectionLast = 0;
    const aabbRoot = new pc.BoundingBox();
    let aabbRootLast = 0;

    editor.on('viewport:hover', (state) => {
        hovering = state;
    });

    editor.on('selector:change', (type) => {
        if (selectorLastType !== type || type === 'entity') {
            selectorLastType = type;
            aabbSelectionLast = 0;
        }
    });

    editor.on('viewport:update', (dt) => {
        if (zoomTarget !== zoom) {
            let diff = zoom;
            zoom += (zoomTarget - zoom) * Math.min(1.0, zoomEasing * ((firstUpdate === 1 ? 1 / 60 : dt) / (1 / 60)));
            diff = zoom - diff;

            const orbiting = editor.call('camera:orbit:state');
            const camera = editor.call('camera:current');

            if (firstUpdate === 1) {
                zoomCamera = camera;
                editor.call('camera:history:start', zoomCamera);
            }

            if (diff !== 0) {
                if (orbiting) {
                    let dist = editor.call('camera:orbit:distance');
                    dist -= diff * Math.max(1, Math.min(zoomMax, dist));
                    editor.call('camera:orbit:distance', dist);
                } else {
                    if (camera.camera.projection === pc.PROJECTION_PERSPECTIVE) {
                        const mouseWPos = camera.camera.screenToWorld(mouseCoords.x, mouseCoords.y, 1);
                        const rayDirection = vecB.copy(mouseWPos).sub(camera.getPosition()).normalize();

                        const point = editor.call('camera:depth:pixelAt', camera.camera, mouseCoords.x, mouseCoords.y);
                        if (point) {
                            point.sub(camera.getPosition());
                            distance = Math.max(1, Math.min(zoomMax, point.length()));
                        } else {
                            // distance to selected entity
                            let aabb;

                            // cache and recalculate aabb only periodically
                            if (selectorLastType === 'entity') {
                                if ((Date.now() - aabbSelectionLast > 1000)) {
                                    aabbSelectionLast = Date.now();
                                    aabb = editor.call('selection:aabb');
                                    if (aabb) aabbSelection.copy(aabb);
                                } else {
                                    aabb = aabbSelection;
                                }
                            }

                            if (aabb) {
                                distance = Math.max(1, Math.min(zoomMax, aabb.center.clone().sub(camera.getPosition()).length()));
                            } else {
                                // nothing selected, then size of aabb of scene or distance to center of aabb
                                const root = editor.call('entities:root');
                                if (root) {
                                    if ((Date.now() - aabbRootLast) > 1000) {
                                        aabbRootLast = Date.now();
                                        aabbRoot.copy(editor.call('entities:aabb', root));
                                    }
                                }

                                aabb = aabbRoot;

                                if (root) {
                                    distance = Math.max(aabb.halfExtents.length(), aabb.center.clone().sub(camera.getPosition()).length());
                                    distance = Math.max(1, Math.min(zoomMax, distance));
                                }
                            }
                        }

                        diff *= distance;

                        if (diff) {
                            vecA.copy(rayDirection).scale(diff);
                            camera.setPosition(camera.getPosition().add(vecA));
                        }
                    } else {
                        const orthoHeight = camera.camera.orthoHeight;
                        diff *= -orthoHeight;
                        if (diff) camera.camera.orthoHeight = Math.max(0.1, orthoHeight + diff);

                        // TODO
                        // on zoom, move camera same as google maps does
                    }
                }

                if (Math.abs(zoomTarget - zoom) < 0.001) {
                    zoom = zoomTarget;
                }
            }

            editor.call('viewport:render');
            firstUpdate = 2;
        } else {
            if (firstUpdate === 2) {
                firstUpdate = 3;
                editor.once('viewport:postUpdate', () => {
                    editor.call('camera:history:stop', zoomCamera);
                });
            }
        }
    });

    const onMouseWheel = function (evt) {
        if (!hovering) {
            return;
        }

        altKey = evt.altKey;

        const delta = (evt.deltaY > 0) ? -2 : (evt.deltaY < 0) ? 2 : 0;

        if (delta !== 0) {
            editor.call('camera:focus:stop');

            if (firstUpdate === 3) {
                firstUpdate = 1;
            }

            // Detect whether user is using trackpad
            if (evt.ctrlKey) {
                evt.preventDefault();  // Prevent pinch to zoom browser functionality
            }

            const speed = delta * (altKey ? zoomSpeedFast : zoomSpeed);
            zoomTarget += speed;

            editor.call('viewport:render');
        }
    };

    const onFocus = function (point, dist) {
        distance = Math.max(1, Math.min(zoomMax, dist));
    };

    editor.on('camera:focus', onFocus);
    editor.on('camera:focus:end', onFocus);

    editor.on('viewport:mouse:move', (tap) => {
        mouseCoords.x = tap.x;
        mouseCoords.y = tap.y;
    });

    window.addEventListener('wheel', onMouseWheel, { passive: false });
});
