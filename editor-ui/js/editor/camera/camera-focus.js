editor.once('viewport:load', function () {
    'use strict';

    // Focusing on a point and a distance

    var focusTarget = new pc.Vec3();
    var focusPoint = new pc.Vec3();
    var focusOrthoHeight = 0;
    var focusCamera;
    var focusing = false;
    var firstUpdate = false;
    var flySpeed = 0.25;
    var vecA = new pc.Vec3();

    editor.method('camera:focus', function (point, distance) {
        var camera = editor.call('camera:current');

        if (!focusing) {
            focusCamera = camera;
            editor.call('camera:history:start', focusCamera);
        }

        focusing = true;
        firstUpdate = true;

        if (camera.camera.projection === pc.PROJECTION_ORTHOGRAPHIC) {
            focusOrthoHeight = distance / 2;
            distance = (camera.camera.farClip - (camera.camera.nearClip || 0.0001)) / 2 + (camera.camera.nearClip || 0.0001);
        }

        focusTarget.copy(point);
        vecA.copy(camera.forward).scale(-distance);
        focusPoint.copy(point).add(vecA);

        editor.emit('camera:focus', point, distance);
        editor.call('viewport:render');
    });

    editor.method('camera:focus:stop', function () {
        if (!focusing)
            return;

        focusing = false;
        var camera = editor.call('camera:current');
        editor.emit('camera:focus:end', focusTarget, vecA.copy(focusTarget).sub(camera.getPosition()).length());
        editor.once('viewport:postUpdate', function () {
            editor.call('camera:history:stop', focusCamera);
        });
    });

    editor.on('viewport:update', function (dt) {
        if (focusing) {
            var camera = editor.call('camera:current');

            var pos = camera.getPosition();
            var dist = vecA.copy(pos).sub(focusPoint).length();
            if (dist > 0.01) {
                var speed = Math.min(1.0, Math.min(1.0, flySpeed * ((firstUpdate ? 1 / 60 : dt) / (1 / 60))));
                vecA.copy(pos).lerp(pos, focusPoint, speed);
                camera.setPosition(vecA);

                if (camera.camera.projection === pc.PROJECTION_ORTHOGRAPHIC) {
                    var orthoHeight = camera.camera.orthoHeight;
                    orthoHeight += (focusOrthoHeight - orthoHeight) * Math.min(1.0, flySpeed * ((firstUpdate ? 1 / 60 : dt) / (1 / 60)));
                    camera.camera.orthoHeight = orthoHeight;
                }

                editor.call('viewport:render');
            } else {
                camera.setPosition(focusPoint);
                if (camera.camera.projection === pc.PROJECTION_ORTHOGRAPHIC)
                    camera.camera.orthoHeight = focusOrthoHeight;

                focusing = false;

                editor.emit('camera:focus:end', focusTarget, vecA.copy(focusTarget).sub(camera.getPosition()).length());
                editor.once('viewport:postUpdate', function () {
                    editor.call('camera:history:stop', focusCamera);
                });
            }

            firstUpdate = false;
        }
    });
});
