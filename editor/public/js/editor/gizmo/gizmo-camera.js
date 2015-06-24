editor.once('load', function () {
    var selectedEntities = [];

    var lines = [];
    for (var i = 0; i < 24; i++) {
        lines.push(new pc.Vec3());
    }

    var yellow = new pc.Color(1, 1, 0);
    var colors = lines.map(function () {
        return yellow;
    });

    editor.on('selector:add', function (item, type) {
        if (type === 'entity' && item.entity && item.entity.camera) {
            if (selectedEntities.indexOf(item.entity) === -1) {
                selectedEntities.push(item.entity);
            }
        }
    });

    editor.on('selector:remove', function (item, type) {
        if (type === 'entity' && item.entity && item.entity.camera) {
            var idx = selectedEntities.indexOf(item.entity);
            if (idx >= 0)
                selectedEntities.splice(idx, 1);

        }
    });

    editor.on('viewport:update', function (dt) {
        var app = editor.call('viewport:framework');

        selectedEntities.forEach(function (entity) {
            var camera = entity.camera;

            var nearClip    = camera.nearClip;
            var farClip     = camera.farClip;
            var fov         = camera.fov * Math.PI / 180.0;
            var projection  = camera.projection;

            // calculate aspect ratio based on the current width / height of the
            // graphics device
            var device = app.graphicsDevice;
            var rect = camera.rect;
            var aspectRatio = (device.width * rect.z) / (device.height * rect.w);

            var nx, ny, fx, fy;
            if (projection === pc.PROJECTION_PERSPECTIVE) {
                ny = Math.tan(fov / 2.0) * nearClip;
                fy = Math.tan(fov / 2.0) * farClip;
                nx = ny * aspectRatio;
                fx = fy * aspectRatio;
            } else {
                ny = camera.camera.getOrthoHeight();
                fy = ny;
                nx = ny * aspectRatio;
                fx = nx;
            }

            // near plane
            lines[0].set(nx, -ny, -nearClip);
            lines[1].set(nx, ny, -nearClip);
            lines[2].set(nx, ny, -nearClip);
            lines[3].set(-nx, ny, -nearClip);
            lines[4].set(-nx, ny, -nearClip);
            lines[5].set(-nx, -ny, -nearClip);
            lines[6].set(-nx, -ny, -nearClip);
            lines[7].set(nx, -ny, -nearClip);
            // far plane
            lines[8].set(fx, -fy, -farClip);
            lines[9].set(fx, fy, -farClip);
            lines[10].set(fx, fy, -farClip);
            lines[11].set(-fx, fy, -farClip);
            lines[12].set(-fx, fy, -farClip);
            lines[13].set(-fx, -fy, -farClip);
            lines[14].set(-fx, -fy, -farClip);
            lines[15].set(fx, -fy, -farClip);
            // plane connecting lines
            lines[16].set(nx, -ny, -nearClip);
            lines[17].set(fx, -fy, -farClip);
            lines[18].set(nx, ny, -nearClip);
            lines[19].set(fx, fy, -farClip);
            lines[20].set(-nx, ny, -nearClip);
            lines[21].set(-fx, fy, -farClip);
            lines[22].set(-nx, -ny, -nearClip);
            lines[23].set(-fx, -fy, -farClip);

            // transform lines according to camera transform
            var wtm = new pc.Mat4().setTRS(entity.getPosition(), entity.getRotation(), pc.Vec3.ONE);
            lines.forEach(function (line) {
                wtm.transformPoint(line, line);
            });

            // draw frustum
            app.renderLines(lines, colors);
        });
    });
});