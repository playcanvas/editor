editor.once('load', function() {
    'use strict';

    var gizmoType = 'translate';
    var coordSystem = 'world'

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

    editor.once('viewport:load', function() {
        var app = editor.call('viewport:framework');

        // clear depth buffer before gizmo layer
        app.scene.drawCalls.push(new pc.scene.Command(pc.LAYER_GIZMO, pc.BLEND_NONE, function() {
            app.graphicsDevice.clear({
                flags: pc.CLEARFLAG_DEPTH
            });
        }));
    })
});
