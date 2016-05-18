editor.once('camera:load', function() {
    'use strict';

    var userdata = editor.call('userdata');
    var camera = editor.call('camera:current');


    editor.on('viewport:update', function() {
        var name = camera.__editorName;

        var data = userdata.get('cameras.' + name);
        if (data) {
            var pos = camera.getPosition();
            if (data.position[0] !== pos.x || data.position[1] !== pos.y || data.position[2] !== pos.z)
                userdata.set('cameras.' + name + '.position', [ pos.x, pos.y, pos.z ]);

            var rot = camera.getEulerAngles();
            if (data.rotation[0] !== rot.x || data.rotation[1] !== rot.y || data.rotation[2] !== rot.z)
                userdata.set('cameras.' + name + '.rotation', [ rot.x, rot.y, rot.z ]);

            var focus = camera.focus;
            if (data.focus[0] !== focus.x || data.focus[1] !== focus.y || data.focus[2] !== focus.z)
                userdata.set('cameras.' + name + '.focus', [ focus.x, focus.y, focus.z ]);

            if (camera.camera.projection === pc.PROJECTION_ORTHOGRAPHIC) {
                var orthoHeight = camera.camera.orthoHeight;
                if (data.orthoHeight !== orthoHeight)
                    userdata.set('cameras.' + name + '.orthoHeight', orthoHeight);
            }
        } else if (! camera.__editorCamera) {
            var obj = editor.call('entities:get', camera.getGuid());
            if (! obj) return;

            var pos = camera.getLocalPosition();
            var posOld = obj.get('position');

            if (pos.x !== posOld[0] || pos.y !== posOld[1] || pos.z !== posOld[2])
                obj.set('position', [ pos.x, pos.y, pos.z ]);

            var rotA = camera.getLocalRotation();
            var rotOld = obj.get('rotation');
            var rotB = new pc.Quat();
            rotB.setFromEulerAngles(rotOld[0], rotOld[1], rotOld[2]);
            var theta = rotA.w * rotB.w + rotA.x * rotB.x + rotA.y * rotB.y + rotA.z * rotB.z;

            if (theta < 0.999) {
                var rot = camera.getLocalEulerAngles();
                if (rot.x !== rotOld[0] || rot.y !== rotOld[1] || rot.z !== rotOld[2])
                    obj.set('rotation', [ rot.x, rot.y, rot.z ]);
            }

            if (camera.camera.projection === pc.PROJECTION_ORTHOGRAPHIC) {
                var orthoHeight = camera.camera.orthoHeight;
                if (obj.get('components.camera.orthoHeight') !== orthoHeight)
                    obj.set('components.camera.orthoHeight', orthoHeight);
            }
        }
    });

    editor.on('camera:change', function(cameraNew) {
        camera = cameraNew;
    });
});
