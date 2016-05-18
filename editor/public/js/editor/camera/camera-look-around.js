editor.once('viewport:load', function() {
    'use strict';

    // Looking around with right mouse button

    var looking = false;
    var sensivity = 0.2;
    var vecA = new pc.Vec2();
    var lookCamera;

    var pitch = 0;
    var yaw = 0;

    editor.on('viewport:tap:start', function(tap) {
        if (tap.button !== 2 || looking)
            return;

        editor.call('camera:focus:stop');
        var camera = editor.call('camera:current');

        if (camera.camera.projection === pc.PROJECTION_PERSPECTIVE) {
            looking = true;
            lookCamera = camera;
            editor.call('camera:history:start', lookCamera);

            // pitch
            var x = Math.cos(Math.asin(camera.forward.y));
            vecA.set(x, camera.forward.y).normalize();
            pitch =  Math.max(-89.99, Math.min(89.99, Math.atan2(vecA.y, vecA.x) / (Math.PI / 180)));

            // yaw
            vecA.set(camera.forward.x, -camera.forward.z).normalize();
            yaw = -Math.atan2(vecA.x, vecA.y) / (Math.PI / 180);
        } else {
            editor.call('camera:pan:start', tap);
        }
    });

    editor.on('viewport:tap:end', function(tap) {
        if (tap.button !== 2 || ! looking)
            return;

        looking = false;
        editor.call('camera:history:stop', lookCamera);
    });

    editor.on('viewport:tap:move', function(tap) {
        if (! looking || tap.button !== 2)
            return;

        var camera = editor.call('camera:current');

        if (camera.camera.projection !== pc.PROJECTION_PERSPECTIVE)
            return;

        pitch = Math.max(-89.99, Math.min(89.99, pitch + (tap.ly - tap.y) * sensivity));
        yaw += (tap.lx - tap.x) * sensivity;

        camera.setEulerAngles(pitch, yaw, 0);

        editor.call('viewport:render');
    });
});
