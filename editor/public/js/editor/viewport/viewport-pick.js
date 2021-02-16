editor.once('load', function () {
    'use strict';

    var app = editor.call('viewport:app');
    if (! app) return; // webgl not available

    var picker = new pc.Picker(app, 1, 1);
    var pickedData = {
        node: null,
        picked: null
    };
    var mouseCoords = new pc.Vec2();
    var inViewport = false;
    var picking = true;
    var filter = null;
    var mouseDown = false;

    editor.method('viewport:pick:filter', function (fn) {
        if (filter === fn)
            return;

        filter = fn;
    });

    editor.method('viewport:pick:state', function (state) {
        picking = state;
    });

    editor.on('viewport:update', function () {
        if (! mouseDown && ! inViewport && pickedData.node) {
            pickedData.node = null;
            pickedData.picked = null;
            editor.emit('viewport:pick:hover', null, null);
        }

        if (! inViewport || ! picking)
            return;

        // pick
        editor.call('viewport:pick', mouseCoords.x, mouseCoords.y, function (node, picked) {
            if (pickedData.node !== node || pickedData.picked !== picked) {
                pickedData.node = node;
                pickedData.picked = picked;

                editor.emit('viewport:pick:hover', pickedData.node, pickedData.picked);
            }
        });
    });

    editor.on('viewport:hover', function (hover) {
        inViewport = hover;
    });

    editor.on('viewport:resize', function (width, height) {
        picker.resize(width, height);
    });

    editor.method('viewport:pick', function (x, y, fn) {
        var scene = app.scene;

        // if (filter) {
        //     scene = {
        //         drawCalls: app.scene.drawCalls.filter(filter)
        //     };
        // }

        // prepare picker
        picker.prepare(editor.call('camera:current').camera, scene);

        // pick node
        var picked = picker.getSelection(x, y);

        if (! picked.length || ! picked[0]) {
            fn(null, null);
        } else {
            var node = picked[0].node;

            // traverse to pc.Entity
            while (! (node instanceof pc.Entity) && node && node.parent) {
                node = node.parent;
            }
            if (! node || !(node instanceof pc.Entity)) return;

            fn(node, picked[0]);
        }
    });

    editor.on('viewport:tap:start', function (tap) {
        if (! tap.mouse) return;

        mouseDown = true;
    });

    editor.on('viewport:tap:end', function (tap) {
        if (! tap.mouse) return;

        mouseDown = false;

        if (! inViewport && pickedData.node) {
            pickedData.node = null;
            pickedData.picked = null;
            editor.emit('viewport:pick:hover', null, null);
        }
    });

    editor.on('viewport:mouse:move', function (tap) {
        mouseCoords.x = tap.x;
        mouseCoords.y = tap.y;
    });

    editor.on('viewport:tap:click', function (tap) {
        if (! inViewport || (tap.mouse && tap.button !== 0))
            return;

        if (pickedData.node) {
            editor.emit('viewport:pick:node', pickedData.node, pickedData.picked);
        } else {
            editor.call('viewport:pick', tap.x, tap.y, function (node, picked) {
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

    editor.on('scene:unload', function () {
        // this is needed to clear the picker layer composition
        // from any mesh instances that are no longer there...
        if (picker) {
            picker.layer._dirty = true;
        }
    });
});
