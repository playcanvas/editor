editor.once('load', function() {
    'use strict';

    // holds all layers that are to be added in the beginning of the composition
    var layerIndexBefore = {};
    // holds all layers that are to be added to the end of the composition
    var layerIndexAfter = {};
    // holds all layers by name
    var nameIndex = {};

    var id = 1000000000;

    editor.method('gizmo:layers:register', function (name, insertToBeginning, data) {
        if (nameIndex[name]) {
            console.warn('Layer with name ' + name + ' already exists.');
        }

        if (! data)
            data = {};

        data.id = id++;
        data.enabled = true;
        data.name = 'Editor Layer ' + name;

        if (data.opaqueSortMode === undefined) {
            data.opaqueSortMode = pc.SORTMODE_NONE;
        }
        if (data.transparentSortMode === undefined) {
            data.transparentSortMode = pc.SORTMODE_BACK2FRONT;
        }

        var index = insertToBeginning ? layerIndexBefore : layerIndexAfter;
        var keys = Object.keys(index);
        var previous = keys.length ? index[keys[keys.length - 1]] : null;

        index[data.id] = new pc.Layer(data);
        nameIndex[name] = index[data.id];

        return index[data.id];
    });

    editor.method('gizmo:layers', function (name) {
        return nameIndex[name];
    });

    editor.method('gizmo:layers:list', function () {
        var result = [];
        for (var key in nameIndex) {
            result.push(nameIndex[key]);
        }

        return result;
    });

    editor.method('gizmo:layers:removeFromComposition', function (composition) {
        if (! composition) {
            var app = editor.call('viewport:app');
            if (! app) return;
            composition = app.scene.layers;
        }

        for (var key in layerIndexBefore) {
            composition.remove(layerIndexBefore[key]);
        }

        for (var key in layerIndexAfter) {
            composition.remove(layerIndexAfter[key]);
        }
    });

    editor.method('gizmo:layers:addToComposition', function (composition) {
        if (! composition) {
            var app = editor.call('viewport:app');
            if (! app) return;

            composition = app.scene.layers;

        }

        var key;
        var index = 0;
        for (key in layerIndexBefore) {
            composition.insert(layerIndexBefore[key], index++);
        }

        for (key in layerIndexAfter) {
            composition.push(layerIndexAfter[key]);
        }

    });

    // Layer before every scene layer
    editor.call('gizmo:layers:register', 'before-0', true);
    // First layer after every scene layer
    editor.call('gizmo:layers:register', 'after-0');
    // Second layer after every scene layer - clears depth buffer
    editor.call('gizmo:layers:register', 'after-1', false, {
        onPreRender: function () {
            var app = editor.call('viewport:app');
            if (app) {
                // clear depth so that gizmos appear in front of
                // objects in the regualar scene
                app.graphicsDevice.clear({
                    flags: pc.CLEARFLAG_DEPTH,
                    depth: 1
                });
            }
        }
    });
    // Third layer after every scene layer - clears depth and color buffer (used by viewport-outline)
    editor.call('gizmo:layers:register', 'after-2', false, {
        onPreRender: function () {
            // var app = editor.call('viewport:app');
            // if (app) {
            //     app.graphicsDevice.clear({
            //         color: [ 0, 0, 0, 0 ],
            //         depth: 1.0,
            //         flags: pc.CLEARFLAG_COLOR | pc.CLEARFLAG_DEPTH
            //     });
            // }
        }
    });

    // Forth layer after every scene layer - clears depth buffer
    var after3 = editor.call('gizmo:layers:register', 'after-3', false, {
        overrideClear: true,
        clearDepthBuffer: true
    });

    // Forth layer after every scene layer - clears depth buffer
    var gizmoImmediateLayer = editor.call('gizmo:layers:register', 'gizmo-immediate', false, {
        passThrough: true
    });

    editor.once('viewport:load', function () {
        var app = editor.call('viewport:app');
        if (! app) return; // webgl not available
        app._immediateLayer = gizmoImmediateLayer;

        editor.call('gizmo:layers:addToComposition');
    });
});
