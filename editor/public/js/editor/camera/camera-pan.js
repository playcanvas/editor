editor.once('viewport:load', function(app) {
    'use strict';

    // Panning with left mouse button while shift key is down

    var panning = false;
    var panSpeed = 0.01;
    var shiftKey = false;
    var vecA = new pc.Vec2();
    var vecB = new pc.Vec3();
    var vecC = new pc.Vec3();
    var vecD = new pc.Vec3();
    var vecE = new pc.Vec3();
    var quat = new pc.Quat();
    var panLastPosition = new pc.Vec3();
    var panPosition = new pc.Vec3();
    var firstPan = false;
    var panPoint = new pc.Vec3();
    var grabbed = false;
    var panButton = 0;


    editor.on('hotkey:shift', function(state) {
        shiftKey = state;
    });

    editor.on('viewport:update', function(dt) {
        if (! panning)
            return;

        var camera = editor.call('camera:current');

        if (grabbed) {
            var mouseWPos = camera.camera.screenToWorld(vecA.x, vecA.y, 1);
            var rayOrigin = vecB.copy(camera.getPosition());
            var rayDirection = vecC.set(0, 0, -1);
            var planeNormal = vecD.copy(camera.forward);

            if (camera.camera.projection === pc.PROJECTION_PERSPECTIVE) {
                rayDirection.copy(mouseWPos).sub(rayOrigin).normalize();
            } else {
                rayOrigin.copy(mouseWPos);
                camera.getWorldTransform().transformVector(rayDirection, rayDirection);
            }

            var rayPlaneDot = planeNormal.dot(rayDirection);
            var planeDist = panPoint.dot(planeNormal);
            var pointPlaneDist = (planeNormal.dot(rayOrigin) - planeDist) / rayPlaneDot;
            var pickedPos = rayDirection.scale(-pointPlaneDist).add(rayOrigin);

            vecB.copy(panPoint).sub(pickedPos);

            if (vecB.length())
                camera.setPosition(camera.getPosition().add(vecB));
        } else {

        }

        editor.call('viewport:render');
    });

    var onPanStart = function(tap) {
        panButton = tap.button;

        editor.call('camera:focus:stop');
        panning = true;
        firstPan = true;

        var camera = editor.call('camera:current');
        var point = editor.call('camera:depth:pixelAt', camera.camera.camera, tap.x, tap.y);

        if (point) {
            panPoint.copy(point);
            grabbed = true;
        } else if (camera.camera.projection === pc.PROJECTION_ORTHOGRAPHIC) {
            // TODO
            // camera panning when nothing is grabbed
            grabbed = false;
        } else {
            grabbed = false;
        }

        vecA.x = tap.x;
        vecA.y = tap.y;

        editor.call('viewport:render');
    };
    editor.method('camera:pan:start', onPanStart);

    editor.on('viewport:tap:start', function(tap) {
        if (panning || ((tap.button !== 0 || ! shiftKey) && tap.button !== 1))
            return;

        onPanStart(tap);
    });

    editor.on('viewport:tap:end', function(tap) {
        if (! panning || tap.button !== panButton)
            return;

        panning = false;
    });

    editor.on('viewport:tap:move', function(tap) {
        if (! panning)
            return;

        vecA.x = tap.x;
        vecA.y = tap.y;

        editor.call('viewport:render');
    });

    editor.on('camera:toggle', function(state) {
        if (! state)
            panning = false;
    });
});
