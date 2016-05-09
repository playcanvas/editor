editor.once('viewport:load', function() {
    'use strict';

    // Moving towards mouse point in world using mouse wheel
    // Speed is relative to distance of point in world

    var zoom = 0;
    var zoomTarget = 0;
    var zoomSpeed = 0.1;
    var zoomSpeedFast = 0.5;
    var zoomEasing = 0.5;
    var zoomMax = 60;
    var shiftKey = false;
    var hovering = false;
    var firstUpdate = false;
    var mouseCoords = new pc.Vec2();
    var vecA = new pc.Vec3();
    var vecB = new pc.Vec3();
    var distance = 1;


    editor.on('hotkey:shift', function(state) {
        shiftKey = state;
    });
    editor.on('viewport:hover', function(state) {
        hovering = state;
    });

    editor.on('viewport:update', function(dt) {
        if (zoomTarget !== zoom) {
            zoom += (zoomTarget - zoom) * (zoomEasing * ((firstUpdate ? 1 / 60 : dt) / (1 / 60)));
            var diff = zoomTarget - zoom;

            var orbiting = editor.call('camera:orbit:state');

            if (diff !== 0) {
                if (orbiting) {
                    var dist = editor.call('camera:orbit:distance');
                    dist -= diff * Math.max(1, Math.min(zoomMax, dist));
                    editor.call('camera:orbit:distance', dist);
                } else {
                    var camera = editor.call('camera:current');

                    if (camera.camera.projection === pc.PROJECTION_PERSPECTIVE) {

                        var mouseWPos = camera.camera.screenToWorld(mouseCoords.x, mouseCoords.y, 1);
                        var rayDirection = vecB.copy(mouseWPos).sub(camera.getPosition()).normalize();

                        var point = editor.call('camera:depth:pixelAt', camera.camera.camera, mouseCoords.x, mouseCoords.y);
                        if (point) {
                            point.sub(camera.getPosition());
                            distance = Math.max(1, Math.min(zoomMax, point.length()));
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
            firstUpdate = false;
        }
    });

    var onMouseWheel = function(evt) {
        if (! hovering)
            return;

        shiftKey = evt.shiftKey;

        var delta = 0;
        if (evt.detail)
            delta = -1 * evt.detail * 0.05;
        else if (evt.wheelDelta)
            delta = evt.wheelDelta / 120;

        if (delta !== 0) {
            editor.call('camera:focus:stop');

            var camera = editor.call('camera:current');
            var speed = delta * (shiftKey ? zoomSpeedFast : zoomSpeed);
            zoomTarget += speed;
            firstUpdate = true;

            editor.call('viewport:render');
        }
    };

    var onFocus = function(point, dist) {
        distance = Math.max(1, Math.min(zoomMax, dist));
    };

    editor.on('camera:focus', onFocus);
    editor.on('camera:focus:end', onFocus);

    editor.on('viewport:mouse:move', function(tap) {
        mouseCoords.x = tap.x;
        mouseCoords.y = tap.y;
    });

    window.addEventListener('mousewheel', onMouseWheel, false);
    window.addEventListener('DOMMouseScroll', onMouseWheel, false);
});
