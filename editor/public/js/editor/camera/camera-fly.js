editor.once('viewport:load', function() {
    'use strict';

    // Flying with WASD or Arrows

    var vecA = new pc.Vec3();
    var direction = new pc.Vec3();

    var flying = false;
    var flySpeed = 7;
    var flySpeedFast = 25;
    var flySpeedTarget = 0;
    var flyEasing = 0.5;
    var flyVec = new pc.Vec3();
    var firstUpdate = false;
    var shiftKey = false;

    var keys = {
        forward: false,
        left: false,
        back: false,
        right: false,
        up: false,
        down: false
    };
    var keysMovement = { 87: 1, 38: 1, 65: 1, 37: 1, 83: 1, 40: 1, 68: 1, 39: 1, 81: 1, 69: 1 };


    editor.method('camera:fly:state', function() {
        return flying;
    });

    editor.on('viewport:update', function(dt) {
        var camera;
        var speed = 0;

        if (flying) {
            speed = shiftKey ? flySpeedFast : flySpeed;
            speed *= firstUpdate ? (1 / 60) : dt;

            camera = editor.call('camera:current');

            vecA.copy(direction).scale(speed);

            if (camera.camera.projection === pc.PROJECTION_ORTHOGRAPHIC) {
                vecA.y = -vecA.z;
                vecA.z = 0;
            }

            if (vecA.length()) {
                camera.getRotation().transformVector(vecA, vecA);
                flyVec.lerp(flyVec, vecA, Math.min(1.0, flyEasing * ((firstUpdate ? 1 / 60 : dt) / (1 / 60))));
            } else {
                speed = 0;
            }

            editor.call('viewport:render');
        }

        if (flyVec.length() > 0.01) {
            if (speed === 0)
                flyVec.lerp(flyVec, vecA.set(0, 0, 0), Math.min(1.0, flyEasing * ((firstUpdate ? 1 / 60 : dt) / (1 / 60))));

            if (flyVec.length()) {
                camera = camera || editor.call('camera:current');
                camera.setPosition(camera.getPosition().add(flyVec));
            }

            firstUpdate = false;
            editor.call('viewport:render');
        }
    });

    editor.on('hotkey:shift', function(state) {
        shiftKey = state;
    });

    window.addEventListener('keydown', function(evt) {
        if (! keysMovement[evt.keyCode] || evt.ctrlKey || evt.metaKey || evt.altKey)
            return;

        if (evt.target && /(input)|(textarea)/i.test(evt.target.tagName))
            return;

        if (evt.keyCode === 87 || evt.keyCode === 38) {
            keys.forward = true;
        } else if (evt.keyCode === 65 || evt.keyCode === 37) {
            keys.left = true;
        } else if (evt.keyCode === 83 || evt.keyCode === 40) {
            keys.back = true;
        } else if (evt.keyCode === 68 || evt.keyCode === 39) {
            keys.right = true;
        } else if (evt.keyCode === 69) {
            keys.up = true;
        } else if (evt.keyCode === 81) {
            keys.down = true;
        }

        direction.set(keys.right - keys.left, keys.up - keys.down, keys.back - keys.forward).normalize();

        flying = true;
        firstUpdate = true;
        editor.call('camera:focus:stop');
        editor.call('viewport:render');
    }, false);

    window.addEventListener('keyup', function(evt) {
        if (! flying || ! keysMovement[evt.keyCode] || evt.ctrlKey || evt.metaKey || evt.altKey)
            return;

        if (evt.target && /(input)|(textarea)/i.test(evt.target.tagName))
            return;

        if (evt.keyCode === 87 || evt.keyCode === 38) {
            keys.forward = false;
        } else if (evt.keyCode === 65 || evt.keyCode === 37) {
            keys.left = false;
        } else if (evt.keyCode === 83 || evt.keyCode === 40) {
            keys.back = false;
        } else if (evt.keyCode === 68 || evt.keyCode === 39) {
            keys.right = false;
        } else if (evt.keyCode === 69) {
            keys.up = false;
        } else if (evt.keyCode === 81) {
            keys.down = false;
        }

        direction.set(keys.right - keys.left, keys.up - keys.down, keys.back - keys.forward).normalize();

        if (! keys.forward && ! keys.left && ! keys.back && ! keys.right && ! keys.up && ! keys.down) {
            flying = false;
            editor.call('viewport:render');
        }
    }, false);
});
