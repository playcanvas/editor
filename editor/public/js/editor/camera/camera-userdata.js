editor.once('camera:load', function() {
    'use strict';

    var userdata = editor.call('userdata');
    var camera = editor.call('camera:current');


    editor.on('viewport:update', function() {
        var name = camera.__editorName;

        var data = userdata.get('cameras.' + name);
        if (! data) return;

        var pos = camera.getPosition();
        if (data.position[0] !== pos.x || data.position[1] !== pos.y || data.position[2] !== pos.z)
            userdata.set('cameras.' + name + '.position', [ pos.x, pos.y, pos.z ]);

        var rot = camera.getEulerAngles();
        if (data.rotation[0] !== rot.x || data.rotation[1] !== rot.y || data.rotation[2] !== rot.z)
            userdata.set('cameras.' + name + '.rotation', [ rot.x, rot.y, rot.z ]);

        var focus = camera.focus;
        if (data.focus[0] !== focus.x || data.focus[1] !== focus.y || data.focus[2] !== focus.z)
            userdata.set('cameras.' + name + '.focus', [ focus.x, focus.y, focus.z ]);

        // orthoHeight
        if (camera.camera.projection === pc.PROJECTION_ORTHOGRAPHIC) {
            var orthoHeight = camera.camera.orthoHeight;
            if (data.orthoHeight !== orthoHeight)
                userdata.set('cameras.' + name + '.orthoHeight', orthoHeight);
        }
    });

    editor.on('camera:change', function(cameraNew) {
        camera = cameraNew;
    });
});
