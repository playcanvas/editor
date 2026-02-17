editor.once('load', () => {
    let gizmoType = 'translate';
    let coordSystem = 'world';
    let snap = false;
    let snapToggle = false;
    let snapShift = false;
    let snapIncrement = 1;

    editor.method('gizmo:type', (type?: string) => {
        if (type === undefined) {
            return gizmoType;
        }

        if (gizmoType === type) {
            return;
        }

        gizmoType = type;

        editor.emit('gizmo:type', type);
    });

    editor.method('gizmo:coordSystem', (system?: string) => {
        if (system === undefined) {
            return coordSystem;
        }

        if (coordSystem === system) {
            return;
        }

        coordSystem = system;

        editor.emit('gizmo:coordSystem', system);
    });

    const checkSnap = function () {
        const state = (snapToggle || snapShift) && (snapToggle !== snapShift);
        if (snap === state) {
            return;
        }

        snap = state;
        editor.emit('gizmo:snap', snap, snapIncrement);
    };

    editor.method('gizmo:snap', (state: boolean) => {
        if (snapToggle === state) {
            return;
        }

        snapToggle = state;
        checkSnap();
    });

    const editorSettings = editor.call('settings:projectUser');
    editorSettings.on('editor.snapIncrement:set', (value: number) => {
        if (snapIncrement === (value || 1)) {
            return;
        }

        snapIncrement = value || 1;
        editor.emit('gizmo:snap', snap, snapIncrement);
    });
    snapIncrement = editorSettings.get('editor.snapIncrement') || 1;

    editor.on('hotkey:shift', (state: boolean) => {
        if (snapShift === state) {
            return;
        }

        snapShift = state;
        checkSnap();
    });
});
