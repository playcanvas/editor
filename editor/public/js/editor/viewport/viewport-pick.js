editor.once('load', function() {
    'use strict';

    var app = editor.call('viewport:framework');
    var picker = new pc.scene.Picker(app.graphicsDevice, 1, 1);
    var pickedData = {
        node: null,
        picked: null
    };
    var mouseCoords = new pc.Vec2();
    var mouseTap = false;
    var inViewport = false;
    var picking = true;


    editor.method('viewport:pick:state', function(state) {
        picking = state;
    });

    editor.on('viewport:update', function() {
        if (! inViewport && pickedData.node) {
            pickedData.node = null;
            pickedData.picked = null;
            editor.emit('viewport:pick:hover', null, null);
        }

        if (! inViewport || ! picking)
            return;

        // pick
        editor.call('viewport:pick', mouseCoords.x, mouseCoords.y, function(node, picked) {
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
        picker.prepare(editor.call('camera:current').camera.camera, app.scene);

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

    editor.on('viewport:mouse:move', function(tap) {
        mouseCoords.x = tap.x;
        mouseCoords.y = tap.y;
    });

    editor.on('viewport:tap:click', function(tap) {
        if (! inViewport)
            return;

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
