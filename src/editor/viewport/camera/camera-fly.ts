editor.once('viewport:load', (app) => {

    // Variables
    let flying = false;
    const flySpeed = 7;
    const flySpeedFast = 25;
    const flyEasing = 0.5;
    const flyVec = new pc.Vec3();
    const direction = new pc.Vec3();
    let flyCamera = null;
    let firstUpdate = false;
    let shiftKey = false;
    const vecA = new pc.Vec3();

    const keys = {
        forward: false,
        left: false,
        back: false,
        right: false,
        up: false,
        down: false
    };

    const keyMappings = new Map([
        // Arrow keys (use evt.key - consistent across layouts)
        ['arrowup', 'forward'],
        ['arrowleft', 'left'],
        ['arrowdown', 'back'],
        ['arrowright', 'right'],
        ['pageup', 'up'],
        ['pagedown', 'down'],
        // WASD keys (use evt.code - physical position)
        ['keyw', 'forward'],
        ['keya', 'left'],
        ['keys', 'back'],
        ['keyd', 'right'],
        ['keyq', 'down'],
        ['keye', 'up']
    ]);

    // Helper functions
    const isInputOrTextarea = target => /input|textarea/i.test(target.tagName);

    const setKeyState = (evt, state) => {
        // Try physical key code first (for letter keys on all keyboard layouts)
        let action = keyMappings.get(evt.code.toLowerCase());
        // Fallback to character key (for arrow keys, page keys, etc.)
        if (!action) {
            action = keyMappings.get(evt.key.toLowerCase());
        }
        if (action) {
            keys[action] = state;
        }
    };

    const updateDirection = () => {
        const x = Number(keys.right) - Number(keys.left);
        const y = Number(keys.up) - Number(keys.down);
        const z = Number(keys.back) - Number(keys.forward);
        direction.set(x, y, z).normalize();
    };

    const endFly = () => {
        if (!flying) {
            return;
        }

        Object.keys(keys).forEach((key) => {
            keys[key] = false;
        });
        flying = false;
        editor.call('camera:history:stop', flyCamera);
        editor.call('viewport:render');
    };

    // Event handlers
    window.addEventListener('keydown', (evt) => {
        if (isInputOrTextarea(evt.target) || evt.ctrlKey || evt.metaKey || evt.altKey) {
            return;
        }

        // Check if the pressed key corresponds to a flying action
        // Check both physical key code (for WASD) and character key (for arrows)
        const hasKeyCode = keyMappings.has(evt.code.toLowerCase());
        const hasKey = keyMappings.has(evt.key.toLowerCase());
        if (!hasKeyCode && !hasKey) {
            return;
        }

        // Prevent this event from triggering other handlers (like hotkeys)
        evt.preventDefault();

        setKeyState(evt, true);
        updateDirection();

        if (!flying) {
            flyCamera = editor.call('camera:current');
            editor.call('camera:history:start', flyCamera);
        }

        flying = true;
        firstUpdate = true;
        editor.call('camera:focus:stop');
        editor.call('viewport:render');
    }, false);

    window.addEventListener('keyup', (evt) => {
        if (!flying || isInputOrTextarea(evt.target) || evt.ctrlKey || evt.metaKey || evt.altKey) {
            return;
        }

        // Check if this key was handled by camera fly
        const hasKeyCode = keyMappings.has(evt.code.toLowerCase());
        const hasKey = keyMappings.has(evt.key.toLowerCase());
        if (!hasKeyCode && !hasKey) {
            return;
        }

        // Prevent this event from triggering other handlers (like hotkeys)
        evt.preventDefault();

        setKeyState(evt, false);
        updateDirection();

        if (Object.values(keys).every(state => !state)) {
            endFly();
        }
    }, false);

    window.addEventListener('blur', endFly);
    document.addEventListener('visibilitychange', endFly);

    editor.on('viewport:update', (dt) => {
        let camera;
        let speed = 0;

        if (flying) {
            speed = shiftKey ? flySpeedFast : flySpeed;
            speed *= firstUpdate ? (1 / 60) : dt;

            camera = editor.call('camera:current');

            vecA.copy(direction).mulScalar(speed);

            if (camera.camera.projection === pc.PROJECTION_ORTHOGRAPHIC) {
                vecA.y = -vecA.z;
                vecA.z = 0;
            }

            if (vecA.length()) {
                camera.getRotation().transformVector(vecA, vecA);
                flyVec.lerp(flyVec, vecA, Math.min(1.0, flyEasing * ((firstUpdate ? 1 / 60 : dt) / (1 / 60))));
            } else {
                speed = 0;
            }

            editor.call('viewport:render');
        }

        if (flyVec.length() > 0.01) {
            if (speed === 0) {
                flyVec.lerp(flyVec, vecA.set(0, 0, 0), Math.min(1.0, flyEasing * ((firstUpdate ? 1 / 60 : dt) / (1 / 60))));
            }

            if (flyVec.length()) {
                camera = camera || editor.call('camera:current');
                camera.setPosition(camera.getPosition().add(flyVec));
            }

            firstUpdate = false;
            editor.call('viewport:render');

            editor.emit('gizmo:carry');
        }
    });

    editor.on('hotkey:shift', (state) => {
        shiftKey = state;
    });

});
