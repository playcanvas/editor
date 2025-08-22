editor.once('load', () => {
    const app = editor.call('viewport:app');
    if (!app) {
        return;
    } // webgl not available

    const picker = new pc.Picker(app, 1, 1);
    const pickedData = {
        node: null,
        picked: null
    };
    const mouseCoords = new pc.Vec2();
    let inViewport = false;
    let picking = true;
    let filter = null;
    let mouseDown = false;
    let gizmoHover = false;

    editor.on('viewport:gizmo:hover', (hover) => {
        gizmoHover = hover;
    });

    editor.method('viewport:pick:filter', (fn) => {
        if (filter === fn) {
            return;
        }

        filter = fn;
    });

    editor.method('viewport:pick:state', (state) => {
        picking = state;
    });

    editor.on('viewport:update', () => {
        if (!mouseDown && !inViewport && pickedData.node) {
            pickedData.node = null;
            pickedData.picked = null;
            editor.emit('viewport:pick:hover', null, null);
        }

        if (!inViewport || !picking) {
            return;
        }

        // pick
        editor.call('viewport:pick', mouseCoords.x, mouseCoords.y, (node, picked) => {
            if (gizmoHover) {
                node = null;
                picked = null;
            }
            if (pickedData.node !== node || pickedData.picked !== picked) {
                pickedData.node = node;
                pickedData.picked = picked;

                editor.emit('viewport:pick:hover', pickedData.node, pickedData.picked);
            }
        });
    });

    editor.on('viewport:hover', (hover) => {
        inViewport = hover;
    });

    editor.on('viewport:resize', (width, height) => {
        picker.resize(width, height);
    });

    editor.method('viewport:pick', (x, y, fn) => {
        const scene = app.scene;

        // if (filter) {
        //     scene = {
        //         drawCalls: app.scene.drawCalls.filter(filter)
        //     };
        // }

        // prepare picker
        picker.prepare(editor.call('camera:current').camera, scene);

        // pick node
        const picked = picker.getSelection(x, y);

        if (!picked.length || !picked[0]) {
            fn(null, null);
        } else {
            let node = picked[0].node;

            // traverse to pc.Entity
            while (!(node instanceof pc.Entity) && node && node.parent) {
                node = node.parent;
            }
            if (!node || !(node instanceof pc.Entity)) {
                return;
            }

            fn(node, picked[0]);
        }
    });

    editor.on('viewport:tap:start', (tap) => {
        if (!tap.mouse) {
            return;
        }

        mouseDown = true;
    });

    editor.on('viewport:tap:end', (tap) => {
        if (!tap.mouse) {
            return;
        }

        mouseDown = false;

        if (!inViewport && pickedData.node) {
            pickedData.node = null;
            pickedData.picked = null;
            editor.emit('viewport:pick:hover', null, null);
        }
    });

    editor.on('viewport:mouse:move', (tap) => {
        mouseCoords.x = tap.x;
        mouseCoords.y = tap.y;
    });

    editor.on('viewport:tap:click', (tap) => {
        if (!inViewport || (tap.mouse && tap.button !== 0)) {
            return;
        }

        if (pickedData.node) {
            editor.emit('viewport:pick:node', pickedData.node, pickedData.picked);
        } else {
            editor.call('viewport:pick', tap.x, tap.y, (node, picked) => {
                if (pickedData.node !== node || pickedData.picked !== picked) {
                    pickedData.node = node;
                    pickedData.picked = picked;
                }

                if (pickedData.node) {
                    editor.emit('viewport:pick:node', pickedData.node, pickedData.picked);
                } else {
                    editor.emit('viewport:pick:clear');
                }
            });
        }
    });

    editor.on('scene:unload', () => {
        // this is needed to clear the picker layer composition
        // from any mesh instances that are no longer there...
        if (picker?.layer) {
            picker.layer._dirty = true;
        }
    });
});
