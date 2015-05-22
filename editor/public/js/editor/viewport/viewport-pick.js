editor.once('load', function() {
    'use strict';

    var framework = editor.call('viewport:framework');
    var picker = new pc.scene.Picker(framework.graphicsDevice, 1, 1);
    var pickedData = {
        node: null,
        picked: null
    };

    var mouseTap = null;

    editor.on('viewport:resize', function(width, height) {
        picker.resize(width, height);
    });

    editor.method('viewport:pick', function(x, y, fn) {
        // prepare picker
        picker.prepare(framework.activeCamera.camera.camera, framework.scene);

        // pick node
        var picked = picker.getSelection({
            x: x,
            y: framework.graphicsDevice.canvas.height - y
        });

        if (! picked.length || ! picked[0]) {
            fn(null, null);
        } else {
            var node = picked[0].node;
            // traverse to pc.Entity
            while (! (node instanceof pc.Entity) && node !== null/* && node !== this.activeGizmo.node*/) {
                node = node.getParent();
            }
            if (! node) return;

            fn(node, picked);
        }
    });

    editor.on('viewport:tap:move', function(tap) {
        mouseTap = tap;

        if (tap.down)
            return;

        editor.call('viewport:pick', tap.x, tap.y, function(node, picked) {
            if (pickedData.node !== node) {
                pickedData.node = node;
                pickedData.picked = picked;

                editor.emit('viewport:pick:hover', node, picked);
            }
        });
    });

    editor.on('viewport:tap:click', function(tap) {
        if (pickedData.node) {
            editor.emit('viewport:pick:node', pickedData.node, pickedData.picked);
        } else {
            editor.emit('viewport:pick:clear');
        }
    });
});
