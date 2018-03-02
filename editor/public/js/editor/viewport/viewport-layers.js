editor.once('load', function() {
    'use strict';

    var app = editor.call('viewport:app');
    if (! app) return; // webgl not available

    var projectSettings = editor.call('settings:project');

    var layerIndex = {};

    // on settings change
    projectSettings.on('*:set', function (path, value) {
        var parts;

        if (path.startsWith('layers.')) {
            parts = path.split('.');

            if (parts.length === 2) {
                var layer = createLayer(parts[1], value);
                layerIndex[layer.id] = layer;

                var existing = app.scene.layers.getLayerById(value.id);
                if (existing) {
                    app.scene.layers.remove(existing);
                }
            } else if (parts.length === 3) {
                // change layer property
                if (layerIndex[parts[1]]) {
                    layerIndex[parts[1]][parts[2]] = value;
                }
            }
        }
    });

    projectSettings.on('*:unset', function (path) {
        if (path.startsWith('layers.')) {
            var parts = path.split('.');
            // remove layer
            if (parts.length === 2) {
                delete layerIndex[parts[1]];

                var existing = app.scene.layers.getLayerById(parts[1]);
                if (existing) {
                    app.scene.layers.remove(existing);
                }

            }
        }
    });

    projectSettings.on('layerOrder:insert', function (value, index) {
        var id = value.get('layer');
        var layer = layerIndex[id];
        if (! layer) return;

        var transparent = value.get('transparent');

        editor.call('gizmo:layers:removeFromComposition');

        if (transparent) {
            app.scene.layers.insertTransparent(layer, index);
        } else {
            app.scene.layers.insertOpaque(layer, index);
        }

        editor.call('gizmo:layers:addToComposition');


        editor.call('viewport:render');
    });

    projectSettings.on('layerOrder:remove', function (value) {
        var id = value.get('layer');
        var layer = layerIndex[id];
        if (! layer) return;

        var transparent = value.get('transparent');

        editor.call('gizmo:layers:removeFromComposition');

        if (transparent) {
            app.scene.layers.removeTransparent(layer);
        } else {
            app.scene.layers.removeOpaque(layer);
        }

        editor.call('gizmo:layers:addToComposition');

        editor.call('viewport:render');
    });

    projectSettings.on('layerOrder:move', function (value, indNew, indOld) {
        var id = value.get('layer');
        var layer = layerIndex[id];
        if (! layer) return;

        editor.call('gizmo:layers:removeFromComposition');

        var transparent = value.get('transparent');
        if (transparent) {
            app.scene.layers.removeTransparent(layer);
            app.scene.layers.insertTransparent(layer, indNew);
        } else {
            app.scene.layers.removeOpaque(layer);
            app.scene.layers.insertOpaque(layer, indNew);
        }

        editor.call('gizmo:layers:addToComposition');

        editor.call('viewport:render');
    });

    var createLayer = function (key, data) {
        return new pc.Layer({
            id: parseInt(key, 10),
            enabled: true,
            name: data.name,
            opaqueSortMode: data.opaqueSortMode,
            transparentSortMode: data.transparentSortMode
        });
    };

    var initLayers = function () {
        var layers = projectSettings.get('layers');
        if (! layers) return;

        var layerOrder = projectSettings.get('layerOrder');
        if (! layerOrder) return;

        var i, len;
        var composition = new pc.LayerComposition();

        var index = {};
        for (var key in layers) {
            layerIndex[key] = createLayer(key, layers[key]);
        }

        for (i = 0, len = layerOrder.length; i<len; i++) {
            var sublayer = layerOrder[i];
            var layer = layerIndex[sublayer.layer];
            if (! layer) continue;

            if (sublayer.transparent) {
                composition.pushTransparent(layer);
            } else {
                composition.pushOpaque(layer);
            }
        }

        editor.call('gizmo:layers:addToComposition', composition);

        app.scene.layers = composition;
    };

    initLayers();

});
