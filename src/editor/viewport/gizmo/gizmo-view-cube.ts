import { type Entity, PROJECTION_PERSPECTIVE, Quat, Vec3, Vec4, ViewCube } from 'playcanvas';

// editor camera entity with dynamic properties added by camera.ts
type EditorCamera = Entity & { focus?: Vec3; __editorCamera?: boolean };

const FIXED_DT = 1 / 60;

editor.once('viewport:load', () => {
    const vc = new ViewCube(new Vec4(0, 1, 1, 0));

    // move dom into viewport container
    const viewport = editor.call('layout.viewport');
    viewport.dom.appendChild(vc.dom);
    vc.dom.style.margin = '16px';

    // block pointer events from reaching orbit/pan controls
    vc.dom.addEventListener('pointerdown', (evt: PointerEvent) => {
        evt.stopPropagation();
    });

    // hide for orthographic editor cameras, when disabled via settings, or in fullscreen mode
    let enabled = true;
    let fullscreen = false;

    const setVisible = (camera: EditorCamera) => {
        const show = enabled && !fullscreen && (!camera.__editorCamera || camera.camera.projection === PROJECTION_PERSPECTIVE);
        vc.dom.style.display = show ? '' : 'none';
    };
    editor.on('camera:change', (camera: EditorCamera) => setVisible(camera));

    const initCam = editor.call('camera:current');
    if (initCam) {
        setVisible(initCam);
    }

    editor.on('viewport:fullscreenMode', (on: boolean) => {
        fullscreen = on;
        const camera = editor.call('camera:current');
        if (camera) {
            setVisible(camera);
        }
    });

    editor.once('settings:user:load', () => {
        const settings = editor.call('settings:user');
        const bind = <T>(path: string, cb: (v: T) => void) => {
            settings.on(`${path}:set`, cb);
            settings.emit(`${path}:set`, settings.get(path));
        };
        bind<boolean>('editor.showViewCube', (value: boolean) => {
            enabled = value ?? true;
            const camera = editor.call('camera:current');
            if (camera) {
                setVisible(camera);
            }
        });
        bind<number>('editor.viewCubeSize', (value: number) => {
            const scale = value ?? 1;
            vc.radius = 10 * scale;
            vc.textSize = 10 * scale;
            vc.lineThickness = 2 * scale;
            vc.lineLength = 40 * scale;
            editor.call('viewport:render');
        });
    });

    // temp math
    const vecA = new Vec3();
    const quatA = new Quat();

    // animation state
    let active = false;
    let first = false;
    const flySpeed = 0.25;
    const targetPos = new Vec3();
    const targetRot = new Quat();
    const pivot = new Vec3();
    let distance = 0;
    let cam: EditorCamera | null = null;

    // face click — orbit camera to clicked direction
    vc.on(ViewCube.EVENT_CAMERAALIGN, (face: Vec3) => {
        const camera = editor.call('camera:current');
        if (!camera) {
            return;
        }

        // snap previous animation
        if (active) {
            cam.setPosition(targetPos);
            cam.setRotation(targetRot);
            if (cam.focus) {
                cam.focus.copy(pivot);
            }
            editor.emit('camera:focus', pivot, distance);
            active = false;
            editor.call('camera:history:stop', cam);
        }

        // determine pivot
        pivot.set(0, 0, 0);
        if (camera.focus) {
            pivot.copy(camera.focus);
        } else {
            pivot.copy(camera.forward).mulScalar(10).add(camera.getPosition());
        }

        // distance from camera to pivot
        distance = vecA.copy(camera.getPosition()).sub(pivot).length();

        // target position and rotation
        targetPos.copy(face).mulScalar(distance).add(pivot);

        const sPos = new Vec3().copy(camera.getPosition());
        const sRot = new Quat().copy(camera.getRotation());
        camera.setPosition(targetPos);
        if (Math.abs(face.y) === 1) {
            camera.lookAt(pivot, face.y > 0 ? Vec3.FORWARD : Vec3.BACK);
        } else {
            camera.lookAt(pivot);
        }
        targetRot.copy(camera.getRotation());
        camera.setPosition(sPos);
        camera.setRotation(sRot);

        editor.call('camera:focus:stop');
        editor.call('camera:history:start', camera);

        cam = camera;
        active = true;
        first = true;
        editor.call('viewport:render');
    });

    // stop animation in place when user interacts with the viewport
    editor.method('camera:viewcube:stop', () => {
        if (!active) {
            return;
        }
        active = false;
        if (cam.focus) {
            cam.focus.copy(pivot);
        }
        editor.emit('camera:focus', pivot, distance);
        editor.call('camera:history:stop', cam);
    });

    // animation loop
    editor.on('viewport:update', (dt: number) => {
        if (!active) {
            return;
        }

        const camera = cam;
        const pos = camera.getPosition();
        const rot = camera.getRotation();

        const d = vecA.copy(pos).sub(targetPos).length();
        if (d > 0.01) {
            const t = Math.min(1.0, flySpeed * ((first ? FIXED_DT : dt) / FIXED_DT));

            // slerp rotation, derive position from pivot
            quatA.copy(rot).slerp(rot, targetRot, t);
            camera.setRotation(quatA);
            vecA.copy(camera.forward).mulScalar(-distance).add(pivot);
            camera.setPosition(vecA);

            editor.call('viewport:render');
        } else {
            // snap to final values
            camera.setPosition(targetPos);
            camera.setRotation(targetRot);
            if (camera.focus) {
                camera.focus.copy(pivot);
            }
            editor.emit('camera:focus', pivot, distance);

            active = false;
            editor.once('viewport:postUpdate', () => {
                editor.call('camera:history:stop', cam);
            });
        }

        first = false;
    });

    // update orientation every frame
    editor.on('viewport:gizmoUpdate', () => {
        const camera = editor.call('camera:current');
        if (camera) {
            vc.update(camera.getWorldTransform());
        }
    });
});
