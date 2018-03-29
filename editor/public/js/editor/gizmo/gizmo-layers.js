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

    // Grid layer
    editor.call('gizmo:layers:register', 'Viewport Grid', true);
    // Layer before every scene layer
    editor.call('gizmo:layers:register', 'Bright Gizmo', true);
    // First layer after every scene layer
    editor.call('gizmo:layers:register', 'Bright Collision');
    // Second layer after every scene layer - clears depth buffer
    editor.call('gizmo:layers:register', 'Dim Gizmo', false, {
        overrideClear: true,
        clearDepthBuffer: true,
        onPreRender: function () {

        }
    });
    // Third layer after every scene layer - clears depth and color buffer (used by viewport-outline)
    editor.call('gizmo:layers:register', 'Viewport Outline', false, {
        passThrough: true,
        isPostEffect: true
    });

    editor.call('gizmo:layers:register', 'Axis Gizmo Immediate', false, {
        passThrough: true,
        overrideClear: true,
        clearDepthBuffer: true,
        opaqueSortMode: pc.SORTMODE_NONE,
        transparentSortMode: pc.SORTMODE_NONE
    });

    editor.call('gizmo:layers:register', 'Axis Rotate Gizmo Immediate', false, {
        passThrough: true,
        overrideClear: true,
        clearDepthBuffer: true,
        opaqueSortMode: pc.SORTMODE_NONE,
        transparentSortMode: pc.SORTMODE_NONE
    });

    editor.call('gizmo:layers:register', 'Axis Gizmo', false, {
    });

    editor.call('gizmo:layers:register', 'Camera Preview', false, {
      passThrough: true,
      isPostEffect: true
    });

    editor.once('viewport:load', function () {
        var app = editor.call('viewport:app');
        if (! app) return; // webgl not available

        editor.call('gizmo:layers:addToComposition');
    });
});
