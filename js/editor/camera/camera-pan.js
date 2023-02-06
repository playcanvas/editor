editor.once('viewport:load', function (app) {
    // Panning with left mouse button while shift key is down

    let panning = false;
    let panCamera;
    let shiftKey = false;
    const vecA = new pc.Vec2();
    const vecB = new pc.Vec3();
    const vecC = new pc.Vec3();
    const vecD = new pc.Vec3();
    const panPoint = new pc.Vec3();
    let grabbed = false;
    let panButton = 0;

    editor.on('hotkey:shift', function (state) {
        shiftKey = state;
    });

    editor.on('viewport:update', function (dt) {
        if (!panning)
            return;

        const camera = editor.call('camera:current');

        if (grabbed) {
            const mouseWPos = camera.camera.screenToWorld(vecA.x, vecA.y, 1);
            const rayOrigin = vecB.copy(camera.getPosition());
            const rayDirection = vecC.set(0, 0, -1);
            const planeNormal = vecD.copy(camera.forward);

            if (camera.camera.projection === pc.PROJECTION_PERSPECTIVE) {
                rayDirection.copy(mouseWPos).sub(rayOrigin).normalize();
            } else {
                rayOrigin.copy(mouseWPos);
                camera.getWorldTransform().transformVector(rayDirection, rayDirection);
            }

            const rayPlaneDot = planeNormal.dot(rayDirection);
            const planeDist = panPoint.dot(planeNormal);
            const pointPlaneDist = (planeNormal.dot(rayOrigin) - planeDist) / rayPlaneDot;
            const pickedPos = rayDirection.scale(-pointPlaneDist).add(rayOrigin);

            vecB.copy(panPoint).sub(pickedPos);

            if (vecB.length())
                camera.setPosition(camera.getPosition().add(vecB));
        }

        editor.call('viewport:render');
    });

    const onPanStart = function (tap) {
        if (panning)
            return;

        panButton = tap.button;

        editor.call('camera:focus:stop');
        panning = true;

        const camera = editor.call('camera:current');
        const point = editor.call('camera:depth:pixelAt', camera.camera, tap.x, tap.y);

        panCamera = camera;
        editor.call('camera:history:start', panCamera);

        vecA.x = tap.x;
        vecA.y = tap.y;

        if (point) {
            panPoint.copy(point);
            grabbed = true;
        } else {
            // distance to selected entity
            let aabb = editor.call('selection:aabb');

            if (aabb) {
                const dist = aabb.center.clone().sub(camera.getPosition()).length();
                panPoint.copy(camera.camera.screenToWorld(vecA.x, vecA.y, dist));
                grabbed = true;
            } else {
                // nothing selected, then size of aabb of scene or distance to center of aabb
                aabb = editor.call('entities:aabb', editor.call('entities:root'));

                if (editor.call('entities:root')) {
                    const dist = Math.max(aabb.halfExtents.length(), aabb.center.clone().sub(camera.getPosition()).length());
                    panPoint.copy(camera.camera.screenToWorld(vecA.x, vecA.y, dist));
                    grabbed = true;
                } else {
                    grabbed = false;
                }
            }
        }

        editor.call('viewport:render');
    };
    editor.method('camera:pan:start', onPanStart);

    editor.on('viewport:tap:start', function (tap) {
        if (panning || ((tap.button !== 0 || !shiftKey) && tap.button !== 1))
            return;

        onPanStart(tap);
    });

    editor.on('viewport:tap:end', function (tap) {
        if (!panning || tap.button !== panButton)
            return;

        panning = false;
        editor.call('camera:history:stop', panCamera);
    });

    editor.on('viewport:tap:move', function (tap) {
        if (!panning)
            return;

        vecA.x = tap.x;
        vecA.y = tap.y;

        editor.call('viewport:render');
    });

    editor.on('camera:toggle', function (state) {
        if (!state && panning) {
            panning = false;
            editor.call('camera:history:stop', panCamera);
        }
    });
});
