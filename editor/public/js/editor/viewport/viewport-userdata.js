editor.once('load', function() {
    'use strict';

    var framework = editor.call('viewport:framework');

    if (! editor.call('permissions:read'))
        return;

    editor.once('userdata:load', function (userdata) {
        var cameras = framework ? framework.cameras : null;
        // get framework cameras and restore transforms and camera data
        // from userdata
        if (! cameras || ! cameras.length)
            return;

        cameras.forEach(function (camera) {
            var name = camera.getName().toLowerCase();
            if (! userdata.get('cameras.' + name))
                return;

            var pos = userdata.get('cameras.' + name + '.position');
            if (pos)
                camera.setPosition(pos[0], pos[1], pos[2]);

            var rot = userdata.get('cameras.' + name + '.rotation');
            if (rot)
                camera.setEulerAngles(rot[0], rot[1], rot[2]);

            if (camera.camera.projection === 1)
                camera.camera.orthoHeight = Number(userdata.get('cameras.' + name + '.orthoHeight'));

            var focus = userdata.get('cameras.' + name + '.focus');
            // store focus on entity where designer_camera script can pick it up
            // when it initializes
            if (focus)
                camera.focus = new pc.Vec3(focus[0], focus[1], focus[2]);

            // if we already have a designer_camera script initialized then re-set the focus
            if (camera.script && camera.script.designer_camera)
                camera.script.designer_camera.focus.copy(camera.focus);
        });

        editor.call('viewport:render');
    });
});
