editor.once('load', function() {
    'use strict';

    var app = editor.call('viewport:framework');
    var picker = new pc.scene.Picker(app.graphicsDevice, 1, 1);
    var pickedData = {
        node: null,
        picked: null
    };
    var mouseTap = null;
    var inViewport = false;

    editor.on('viewport:update', function() {
        if (! inViewport || ! mouseTap || mouseTap.down)
            return;

        // pick
        editor.call('viewport:pick', mouseTap.x, mouseTap.y, function(node, picked) {
            if (pickedData.node !== node || pickedData.picked !== picked) {
                pickedData.node = node;
                pickedData.picked = picked;

                editor.emit('viewport:pick:hover', pickedData.node, pickedData.picked);
            }
        });
    });

    editor.on('viewport:hover', function(hover) {
        inViewport = hover;
    });

    editor.on('viewport:resize', function(width, height) {
        picker.resize(width, height);
    });

    editor.method('viewport:pick', function(x, y, fn) {
        // prepare picker
        picker.prepare(app.activeCamera.camera.camera, app.scene);

        // pick node
        var picked = picker.getSelection({
            x: x,
            y: app.graphicsDevice.canvas.height - y
        });

        if (! picked.length || ! picked[0]) {
            fn(null, null);
        } else {
            var node = picked[0].node;

            // traverse to pc.Entity
            while (! (node instanceof pc.Entity) && node && node.getParent) {
                node = node.getParent();
            }
            if (! node) return;

            fn(node, picked[0]);
        }
    });

    editor.on('viewport:tap:move', function(tap) {
        mouseTap = tap;
    });

    editor.on('viewport:tap:click', function(tap) {
        if (pickedData.node) {
            editor.emit('viewport:pick:node', pickedData.node, pickedData.picked);
        } else {
            editor.call('viewport:pick', tap.x, tap.y, function(node, picked) {
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
});
