import { PROJECTION_ORTHOGRAPHIC, Vec3 } from 'playcanvas';

editor.once('viewport:load', (app) => {
    // Focusing on a point and a distance

    const focusTarget = new Vec3();
    const focusPoint = new Vec3();
    let focusOrthoHeight = 0;
    let focusCamera;
    let focusing = false;
    let firstUpdate = false;
    const flySpeed = 0.25;
    const vecA = new Vec3();

    editor.method('camera:focus', (point, distance) => {
        const camera = editor.call('camera:current');

        if (!focusing) {
            focusCamera = camera;
            editor.call('camera:history:start', focusCamera);
        }

        focusing = true;
        firstUpdate = true;

        if (camera.camera.projection === PROJECTION_ORTHOGRAPHIC) {
            focusOrthoHeight = distance / 2;
            distance = (camera.camera.farClip - (camera.camera.nearClip || 0.0001)) / 2 + (camera.camera.nearClip || 0.0001);
        }

        focusTarget.copy(point);
        vecA.copy(camera.forward).mulScalar(-distance);
        focusPoint.copy(point).add(vecA);

        editor.emit('camera:focus', point, distance);
        editor.call('viewport:render');
    });

    editor.method('camera:focus:stop', () => {
        if (!focusing) {
            return;
        }

        focusing = false;
        const camera = editor.call('camera:current');
        editor.emit('camera:focus:end', focusTarget, vecA.copy(focusTarget).sub(camera.getPosition()).length());
        editor.once('viewport:postUpdate', () => {
            editor.call('camera:history:stop', focusCamera);
        });
    });

    editor.on('viewport:update', (dt) => {
        if (focusing) {
            const camera = editor.call('camera:current');

            const pos = camera.getPosition();
            const dist = vecA.copy(pos).sub(focusPoint).length();
            if (dist > 0.01) {
                const speed = Math.min(1.0, Math.min(1.0, flySpeed * ((firstUpdate ? 1 / 60 : dt) / (1 / 60))));
                vecA.copy(pos).lerp(pos, focusPoint, speed);
                camera.setPosition(vecA);

                if (camera.camera.projection === PROJECTION_ORTHOGRAPHIC) {
                    let orthoHeight = camera.camera.orthoHeight;
                    orthoHeight += (focusOrthoHeight - orthoHeight) * Math.min(1.0, flySpeed * ((firstUpdate ? 1 / 60 : dt) / (1 / 60)));
                    camera.camera.orthoHeight = orthoHeight;
                }

                editor.call('viewport:render');
            } else {
                camera.setPosition(focusPoint);
                if (camera.camera.projection === PROJECTION_ORTHOGRAPHIC) {
                    camera.camera.orthoHeight = focusOrthoHeight;
                }

                focusing = false;

                editor.emit('camera:focus:end', focusTarget, vecA.copy(focusTarget).sub(camera.getPosition()).length());
                editor.once('viewport:postUpdate', () => {
                    editor.call('camera:history:stop', focusCamera);
                });
            }

            firstUpdate = false;
        }
    });
});
