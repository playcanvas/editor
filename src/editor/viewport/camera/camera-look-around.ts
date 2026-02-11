import { PROJECTION_PERSPECTIVE, Vec2 } from 'playcanvas';

editor.once('viewport:load', (app) => {
    // Looking around with right mouse button

    let looking = false;
    const sensitivity = 0.2;
    const vecA = new Vec2();
    let lookCamera;

    let pitch = 0;
    let yaw = 0;

    editor.on('viewport:tap:start', (tap) => {
        if (tap.button !== 2 || looking) {
            return;
        }

        editor.call('camera:focus:stop');
        const camera = editor.call('camera:current');

        if (camera.camera.projection === PROJECTION_PERSPECTIVE) {
            looking = true;
            lookCamera = camera;
            editor.call('camera:history:start', lookCamera);

            // pitch
            const x = Math.cos(Math.asin(camera.forward.y));
            vecA.set(x, camera.forward.y).normalize();
            pitch =  Math.max(-89.99, Math.min(89.99, Math.atan2(vecA.y, vecA.x) / (Math.PI / 180)));

            // yaw
            vecA.set(camera.forward.x, -camera.forward.z).normalize();
            yaw = -Math.atan2(vecA.x, vecA.y) / (Math.PI / 180);
        } else {
            editor.call('camera:pan:start', tap);
        }
    });

    editor.on('viewport:tap:end', (tap) => {
        if (tap.button !== 2 || !looking) {
            return;
        }

        looking = false;
        editor.call('camera:history:stop', lookCamera);
    });

    editor.on('viewport:tap:move', (tap) => {
        if (!looking || tap.button !== 2) {
            return;
        }

        const camera = editor.call('camera:current');

        if (camera.camera.projection !== PROJECTION_PERSPECTIVE) {
            return;
        }

        pitch = Math.max(-89.99, Math.min(89.99, pitch + (tap.ly - tap.y) * sensitivity));
        yaw += (tap.lx - tap.x) * sensitivity;

        camera.setEulerAngles(pitch, yaw, 0);

        editor.call('viewport:render');
    });
});
