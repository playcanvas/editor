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

        // render-on-demand viewport: request a frame so the new gizmo is drawn
        editor.call('viewport:render');
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
        editor.call('viewport:render');
    });

    const checkSnap = function () {
        const state = (snapToggle || snapShift) && snapToggle !== snapShift;
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

    // classic keeps the 2.23 transform gizmo look and the line grid; default uses the engine ones
    let preset: 'classic' | 'default' = 'classic';

    editor.method('gizmo:preset', () => preset);

    const userSettings = editor.call('settings:user');
    const setPreset = (value: string) => {
        const next = value === 'default' ? 'default' : 'classic';
        if (next === preset) {
            return;
        }
        preset = next;
        editor.emit('gizmo:preset', preset);
        editor.call('viewport:render');
    };
    userSettings.on('editor.gizmoPreset:set', setPreset);
    setPreset(userSettings.get('editor.gizmoPreset'));
    editor.once('settings:user:load', () => setPreset(userSettings.get('editor.gizmoPreset')));
});
