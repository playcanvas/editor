editor.once('load', () => {
    // Numpad camera preset shortcuts
    // Numpad 1: Front, Numpad 3: Right, Numpad 7: Top
    // Ctrl+Numpad 1: Back, Ctrl+Numpad 3: Left, Ctrl+Numpad 7: Bottom
    // Numpad 5: Toggle Ortho/Perspective
    // Numpad 0: Reset to Perspective camera

    const presetCallback = function (name: string): () => void {
        return function () {
            if (editor.call('picker:isOpen')) {
                return;
            }

            const camera = editor.call('camera:get', name);
            if (camera) {
                editor.call('camera:set', camera);
            }
        };
    };

    // Numpad 1: Front view
    editor.call('hotkey:register', 'camera:front', {
        key: '1',
        numpadOnly: true,
        callback: presetCallback('front')
    });

    // Ctrl + Numpad 1: Back view
    editor.call('hotkey:register', 'camera:back', {
        key: '1',
        ctrl: true,
        numpadOnly: true,
        callback: presetCallback('back')
    });

    // Numpad 3: Right view
    editor.call('hotkey:register', 'camera:right', {
        key: '3',
        numpadOnly: true,
        callback: presetCallback('right')
    });

    // Ctrl + Numpad 3: Left view
    editor.call('hotkey:register', 'camera:left', {
        key: '3',
        ctrl: true,
        numpadOnly: true,
        callback: presetCallback('left')
    });

    // Numpad 7: Top view
    editor.call('hotkey:register', 'camera:top', {
        key: '7',
        numpadOnly: true,
        callback: presetCallback('top')
    });

    // Ctrl + Numpad 7: Bottom view
    editor.call('hotkey:register', 'camera:bottom', {
        key: '7',
        ctrl: true,
        numpadOnly: true,
        callback: presetCallback('bottom')
    });

    // Numpad 5: Toggle between Perspective and last-used orthographic camera
    let lastOrthoCamera = 'front';

    editor.call('hotkey:register', 'camera:toggle-projection', {
        key: '5',
        numpadOnly: true,
        callback: function () {
            if (editor.call('picker:isOpen')) {
                return;
            }

            const current = editor.call('camera:current');
            if (!current || !current.__editorCamera) {
                return;
            }

            const name: string = current.__editorName;

            if (name === 'perspective') {
                // Switch to last-used orthographic camera
                const orthoCamera = editor.call('camera:get', lastOrthoCamera);
                if (orthoCamera) {
                    editor.call('camera:set', orthoCamera);
                }
            } else {
                // Remember this ortho camera and switch to perspective
                lastOrthoCamera = name;
                const perspCamera = editor.call('camera:get', 'perspective');
                if (perspCamera) {
                    editor.call('camera:set', perspCamera);
                }
            }
        }
    });

    // Numpad 0: Switch to Perspective camera
    editor.call('hotkey:register', 'camera:perspective', {
        key: '0',
        numpadOnly: true,
        callback: presetCallback('perspective')
    });
});
