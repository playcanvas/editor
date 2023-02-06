editor.once('viewport:load', function () {
    // Moving towards mouse point in world using mouse wheel
    // Speed is relative to distance of point in world

    var settings = editor.call('settings:user');

    var zoom = 0;
    var zoomTarget = 0;

    var zoomSpeed = settings.get('editor.zoomSensitivity') / 100;
    var zoomSpeedFast = zoomSpeed * 5;
    settings.on('editor.zoomSensitivity:set', function (sensitivity) {
        zoomSpeed = sensitivity / 100;
        zoomSpeedFast = zoomSpeed * 5;
    });

    var zoomEasing = 0.3;
    var zoomMax = 300;
    var zoomCamera;
    var altKey = false;
    var hovering = false;
    var firstUpdate = 3;
    var mouseCoords = new pc.Vec2();
    var vecA = new pc.Vec3();
    var vecB = new pc.Vec3();
    var distance = 1;

    var selectorLastType = null;
    var aabbSelection = new pc.BoundingBox();
    var aabbSelectionLast = 0;
    var aabbRoot = new pc.BoundingBox();
    var aabbRootLast = 0;

    editor.on('viewport:hover', function (state) {
        hovering = state;
    });

    editor.on('selector:change', function (type) {
        if (selectorLastType !== type || type === 'entity') {
            selectorLastType = type;
            aabbSelectionLast = 0;
        }
    });

    editor.on('viewport:update', function (dt) {
        if (zoomTarget !== zoom) {
            var diff = zoom;
            zoom += (zoomTarget - zoom) * Math.min(1.0, zoomEasing * ((firstUpdate === 1 ? 1 / 60 : dt) / (1 / 60)));
            diff = zoom - diff;

            var orbiting = editor.call('camera:orbit:state');
            var camera = editor.call('camera:current');

            if (firstUpdate === 1) {
                zoomCamera = camera;
                editor.call('camera:history:start', zoomCamera);
            }

            if (diff !== 0) {
                if (orbiting) {
                    var dist = editor.call('camera:orbit:distance');
                    dist -= diff * Math.max(1, Math.min(zoomMax, dist));
                    editor.call('camera:orbit:distance', dist);
                } else {
                    if (camera.camera.projection === pc.PROJECTION_PERSPECTIVE) {
                        var mouseWPos = camera.camera.screenToWorld(mouseCoords.x, mouseCoords.y, 1);
                        var rayDirection = vecB.copy(mouseWPos).sub(camera.getPosition()).normalize();

                        var point = editor.call('camera:depth:pixelAt', camera.camera, mouseCoords.x, mouseCoords.y);
                        if (point) {
                            point.sub(camera.getPosition());
                            distance = Math.max(1, Math.min(zoomMax, point.length()));
                        } else {
                            // distance to selected entity
                            var aabb;

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
                                var root = editor.call('entities:root');
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
                        var orthoHeight = camera.camera.orthoHeight;
                        diff *= -orthoHeight;
                        if (diff) camera.camera.orthoHeight = Math.max(0.1, orthoHeight + diff);

                        // TODO
                        // on zoom, move camera same as google maps does
                    }
                }

                if (Math.abs(zoomTarget - zoom) < 0.001)
                    zoom = zoomTarget;
            }

            editor.call('viewport:render');
            firstUpdate = 2;
        } else {
            if (firstUpdate === 2) {
                firstUpdate = 3;
                editor.once('viewport:postUpdate', function () {
                    editor.call('camera:history:stop', zoomCamera);
                });
            }
        }
    });

    var onMouseWheel = function (evt) {
        if (!hovering)
            return;

        altKey = evt.altKey;

        var delta = (evt.deltaY > 0) ? -2 : (evt.deltaY < 0) ? 2 : 0;

        if (delta !== 0) {
            editor.call('camera:focus:stop');

            if (firstUpdate === 3)
                firstUpdate = 1;

            // Detect whether user is using trackpad
            if (evt.ctrlKey) {
                evt.preventDefault();  // Prevent pinch to zoom browser functionality
            }

            var speed = delta * (altKey ? zoomSpeedFast : zoomSpeed);
            zoomTarget += speed;

            editor.call('viewport:render');
        }
    };

    var onFocus = function (point, dist) {
        distance = Math.max(1, Math.min(zoomMax, dist));
    };

    editor.on('camera:focus', onFocus);
    editor.on('camera:focus:end', onFocus);

    editor.on('viewport:mouse:move', function (tap) {
        mouseCoords.x = tap.x;
        mouseCoords.y = tap.y;
    });

    window.addEventListener('wheel', onMouseWheel, { passive: false });
});
