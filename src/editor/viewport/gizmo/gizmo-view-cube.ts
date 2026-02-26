import { PROJECTION_PERSPECTIVE, Quat, Vec3, Vec4, ViewCube } from 'playcanvas';

editor.once('viewport:load', () => {
    // Create ViewCube anchored bottom-right (Vec4: top, right, bottom, left)
    const viewCube = new ViewCube(new Vec4(0, 1, 1, 0));

    // Move DOM from document.body into viewport container
    const viewport = editor.call('layout.viewport');
    viewport.dom.appendChild(viewCube.dom);
    viewCube.dom.style.margin = '16px';

    // Prevent pointer events from reaching viewport orbit/pan controls
    viewCube.dom.addEventListener('pointerdown', (evt: PointerEvent) => {
        evt.stopPropagation();
    });

    // Hide ViewCube for orthographic editor cameras (Top, Bottom, Left, Right, Front, Back)
    const updateVisibility = (camera: any) => {
        const visible = !camera.__editorCamera || camera.camera.projection === PROJECTION_PERSPECTIVE;
        viewCube.dom.style.display = visible ? '' : 'none';
    };

    editor.on('camera:change', (camera: any) => {
        updateVisibility(camera);
    });

    const initialCamera = editor.call('camera:current');
    if (initialCamera) {
        updateVisibility(initialCamera);
    }

    // Temp vectors/quats for calculations
    const vecA = new Vec3();
    const quatA = new Quat();

    // Animation state
    let animating = false;
    let firstUpdate = false;
    const flySpeed = 0.25;
    const targetPos = new Vec3();
    const targetRot = new Quat();
    const animPivot = new Vec3();
    let animDistance = 0;
    let animCamera: any;

    // Handle face click — rotate camera to face the clicked direction
    viewCube.on(ViewCube.EVENT_CAMERAALIGN, (face: Vec3) => {
        const camera = editor.call('camera:current');
        if (!camera) {
            return;
        }

        // If already animating, snap to current target and finish previous animation
        if (animating) {
            animCamera.setPosition(targetPos);
            animCamera.setRotation(targetRot);
            if (animCamera.focus) {
                animCamera.focus.copy(animPivot);
            }
            editor.emit('camera:focus', animPivot, animDistance);
            animating = false;
            editor.call('camera:history:stop', animCamera);
        }

        // Determine pivot (the point camera orbits around)
        animPivot.set(0, 0, 0);
        if (camera.focus) {
            animPivot.copy(camera.focus);
        } else {
            animPivot.copy(camera.forward).mulScalar(10).add(camera.getPosition());
        }

        // Distance from camera to pivot
        const distance = vecA.copy(camera.getPosition()).sub(animPivot).length();
        animDistance = distance;

        // Compute target position: pivot + faceDirection * distance
        targetPos.copy(face).mulScalar(distance).add(animPivot);

        // Compute target rotation without visually moving the camera
        const startPos = new Vec3().copy(camera.getPosition());
        const startRot = new Quat().copy(camera.getRotation());
        camera.setPosition(targetPos);
        if (Math.abs(face.y) === 1) {
            camera.lookAt(animPivot, face.y > 0 ? Vec3.FORWARD : Vec3.BACK);
        } else {
            camera.lookAt(animPivot);
        }
        targetRot.copy(camera.getRotation());
        camera.setPosition(startPos);
        camera.setRotation(startRot);

        editor.call('camera:focus:stop');
        editor.call('camera:history:start', camera);

        animCamera = camera;
        animating = true;
        firstUpdate = true;
        editor.call('viewport:render');
    });

    // Animation update loop
    editor.on('viewport:update', (dt: number) => {
        if (!animating) {
            return;
        }

        const camera = animCamera;
        const pos = camera.getPosition();
        const rot = camera.getRotation();

        const dist = vecA.copy(pos).sub(targetPos).length();
        if (dist > 0.01) {
            const speed = Math.min(1.0, flySpeed * ((firstUpdate ? 1 / 60 : dt) / (1 / 60)));

            // Slerp rotation only
            quatA.copy(rot).slerp(rot, targetRot, speed);
            camera.setRotation(quatA);

            // Derive position: pivot + (-forward * distance)
            vecA.copy(camera.forward).mulScalar(-animDistance).add(animPivot);
            camera.setPosition(vecA);

            editor.call('viewport:render');
        } else {
            // Snap to final values
            camera.setPosition(targetPos);
            camera.setRotation(targetRot);

            if (camera.focus) {
                camera.focus.copy(animPivot);
            }
            editor.emit('camera:focus', animPivot, animDistance);

            animating = false;

            editor.once('viewport:postUpdate', () => {
                editor.call('camera:history:stop', animCamera);
            });
        }

        firstUpdate = false;
    });

    // Update ViewCube orientation every frame
    editor.on('viewport:gizmoUpdate', () => {
        const camera = editor.call('camera:current');
        if (camera) {
            viewCube.update(camera.getWorldTransform());
        }
    });
});
