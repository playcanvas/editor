editor.once('load', function() {
    'use strict';

    var gizmoType = 'translate';
    var coordSystem = 'world';
    var snap = false;
    var snapToggle = false;
    var snapShift = false;
    var snapIncrement = 1;

    editor.method('gizmo:type', function(type) {
        if (type === undefined)
            return gizmoType;

        if (gizmoType === type)
            return;

        gizmoType = type;

        editor.emit('gizmo:type', type);
    });

    editor.method('gizmo:coordSystem', function(system) {
        if (system === undefined)
            return coordSystem;

        if (coordSystem === system)
            return;

        coordSystem = system;

        editor.emit('gizmo:coordSystem', system);
    });

    var checkSnap = function() {
        var state = (snapToggle || snapShift) && (snapToggle !== snapShift);
        if (snap === state)
            return;

        snap = state;
        editor.emit('gizmo:snap', snap, snapIncrement);
    };

    editor.method('gizmo:snap', function(state) {
        if (snapToggle === state)
            return;

        snapToggle = state;
        checkSnap();
    });

    var editorSettings = editor.call('editorSettings');
    editorSettings.on('snap_increment:set', function(value) {
        if (snapIncrement === (value || 1))
            return;

        snapIncrement = value || 1;
        editor.emit('gizmo:snap', snap, snapIncrement);
    });
    snapIncrement = editorSettings.get('snap_increment') || 1;

    editor.on('hotkey:shift', function(state) {
        if (snapShift === state)
            return;

        snapShift = state;
        checkSnap();
    });

    editor.once('viewport:load', function() {
        var app = editor.call('viewport:app');
        if (! app) return; // webgl not available

        // clear depth buffer before gizmo layer
        app.scene.drawCalls.push(new pc.scene.Command(pc.LAYER_GIZMO, pc.BLEND_NONE, function() {
            app.graphicsDevice.clear({
                flags: pc.CLEARFLAG_DEPTH
            });
        }));
    })
});
