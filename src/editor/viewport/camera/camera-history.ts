editor.once('load', () => {
    let camera;
    let overlapping = 0;
    let position, rotation, eulers, orthoHeight;

    editor.method('camera:history:start', (entity) => {
        if (entity === camera) {
            overlapping++;
            return;
        }
        if (camera) {
            editor.call('camera:history:stop');
        }

        const obj = editor.call('entities:get', entity.getGuid());
        if (!obj) {
            return;
        }

        camera = entity;
        overlapping = 1;
        position = camera.getLocalPosition().clone();
        rotation = camera.getLocalRotation().clone();
        eulers = obj.get('rotation');
        orthoHeight = camera.camera.orthoHeight;

        obj.history.enabled = false;
    });

    editor.method('camera:history:stop', (entity) => {
        if (!camera) {
            return;
        }

        if (entity) {
            if (entity !== camera) {
                return;
            }

            overlapping--;
            if (overlapping > 0) {
                return;
            }
        }

        const obj = editor.call('entities:get', camera.getGuid());
        if (!obj) {
            camera = null;
            return;
        }

        obj.history.enabled = true;

        const dist = position.clone().sub(camera.getLocalPosition()).length();
        const rotA = rotation;
        const rotB = camera.getLocalRotation();
        const theta = rotA.w * rotB.w + rotA.x * rotB.x + rotA.y * rotB.y + rotA.z * rotB.z;

        // not changed
        if (dist < 0.001 && theta > 0.999 && orthoHeight === camera.camera.orthoHeight) {
            camera = null;
            return;
        }

        const localPos = camera.getLocalPosition();
        const posCur = [localPos.x, localPos.y, localPos.z];
        const localEul = camera.getLocalEulerAngles();
        const rotCur = [localEul.x, localEul.y, localEul.z];
        const ortCur = camera.camera.orthoHeight;

        const posPrev = [position.x, position.y, position.z];
        const rotPrev = eulers.slice(0);
        const ortPrev = orthoHeight;

        camera = null;

        editor.api.globals.history.add({
            name: 'camera.user',
            combine: false,
            undo: function () {
                const item = obj.latest();
                if (!item) {
                    return;
                }

                item.history.enabled = false;
                item.set('position', posPrev);
                item.set('rotation', rotPrev);
                item.set('components.camera.orthoHeight', ortPrev);
                item.history.enabled = true;
            },
            redo: function () {
                const item = obj.latest();
                if (!item) {
                    return;
                }

                item.history.enabled = false;
                item.set('position', posCur);
                item.set('rotation', rotCur);
                item.set('components.camera.orthoHeight', ortCur);
                item.history.enabled = true;
            }
        });
    });
});
