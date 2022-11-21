editor.once('viewport:load', function () {
    'use strict';

    // Orbit camera with virtual point of focus
    // Zooming / Flying will not move virtual point forward/backwards

    let orbiting = false;
    let orbitCamera;
    const pivot = new pc.Vec3();
    let distance = 1;
    const sensitivity = 0.2;
    let pitch = 0;
    let yaw = 0;
    const vec2 = new pc.Vec2();
    const vecA = new pc.Vec3();
    const quat = new pc.Quat();


    editor.on('viewport:update', function (dt) {
        const camera = editor.call('camera:current');

        if (camera.camera.projection !== pc.PROJECTION_PERSPECTIVE)
            return;

        distance = Math.max(0.01, vecA.copy(pivot).sub(camera.getPosition()).length());
        pivot.copy(camera.forward).scale(distance).add(camera.getPosition());

        if (orbiting) {
            quat.setFromEulerAngles(pitch, yaw, 0);
            vecA.set(0, 0, distance);
            quat.transformVector(vecA, vecA);
            vecA.add(pivot);

            camera.setPosition(vecA);
            camera.lookAt(pivot);

            editor.call('viewport:render');
        }

        if (camera.focus)
            camera.focus.copy(pivot);
    });

    editor.on('camera:change', function (camera) {
        if (!camera.focus)
            return;

        pivot.copy(camera.focus);
    });

    editor.on('camera:focus', function (point) {
        pivot.copy(point);

        const camera = editor.call('camera:current');
        if (camera.focus)
            camera.focus.copy(pivot);
    });

    editor.on('camera:focus:end', function (point, value) {
        const camera = editor.call('camera:current');
        distance = value;
        pivot.copy(camera.forward).scale(distance).add(camera.getPosition());

        if (camera.focus)
            camera.focus.copy(pivot);
    });

    editor.on('viewport:tap:start', function (tap, evt) {
        if (tap.button !== 0 || evt.shiftKey || orbiting)
            return;

        editor.call('camera:focus:stop');

        const camera = editor.call('camera:current');

        if (camera.camera.projection === pc.PROJECTION_PERSPECTIVE) {
            orbiting = true;

            // disable history
            orbitCamera = camera;
            editor.call('camera:history:start', orbitCamera);

            // pitch
            const x = Math.cos(Math.asin(camera.forward.y));
            vec2.set(x, camera.forward.y).normalize();
            pitch =  Math.max(-89.99, Math.min(89.99, Math.atan2(vec2.y, vec2.x) / (Math.PI / 180)));

            // yaw
            vec2.set(camera.forward.x, -camera.forward.z).normalize();
            yaw = -Math.atan2(vec2.x, vec2.y) / (Math.PI / 180);

            editor.call('viewport:render');
        } else {
            editor.call('camera:pan:start', tap);
        }
    });

    editor.on('viewport:tap:end', function (tap) {
        if (tap.button !== 0 || !orbiting)
            return;

        orbiting = false;
        editor.call('camera:history:stop', orbitCamera);
    });

    editor.on('viewport:tap:move', function (tap) {
        if (!orbiting || tap.button !== 0)
            return;

        pitch = Math.max(-89.99, Math.min(89.99, pitch - (tap.y - tap.ly) * sensitivity));
        yaw += (tap.lx - tap.x) * sensitivity;

        editor.call('viewport:render');
    });

    editor.on('camera:toggle', function (state) {
        if (!state && orbiting) {
            orbiting = false;
            editor.call('camera:history:stop', orbitCamera);
        }
    });
});
