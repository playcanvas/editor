editor.once('load', () => {
    editor.on('userdata:load', (userdata) => {
        if (!editor.call('permissions:read')) {
            return;
        }

        const cameras = userdata.get('cameras');

        if (cameras) {
            for (const name in cameras) {
                if (!cameras.hasOwnProperty(name)) {
                    continue;
                }

                const camera = editor.call('camera:get', name);
                if (!camera) {
                    continue;
                }

                const data = cameras[name];

                if (data.position) {
                    camera.setPosition(data.position[0], data.position[1], data.position[2]);
                }

                if (data.rotation) {
                    camera.setEulerAngles(data.rotation[0], data.rotation[1], data.rotation[2]);
                }

                if (data.orthoHeight && camera.camera.projection === pc.PROJECTION_ORTHOGRAPHIC) {
                    camera.camera.orthoHeight = parseInt(data.orthoHeight, 10);
                }

                if (data.focus) {
                    camera.focus.set(data.focus[0], data.focus[1], data.focus[2]);
                }
            }
        }

        editor.call('viewport:render');
    });
});
