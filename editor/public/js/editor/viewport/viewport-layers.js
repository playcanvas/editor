editor.once('load', function () {
    'use strict';

    const app = editor.call('viewport:app');
    if (!app) return; // webgl not available

    const projectSettings = editor.call('settings:project');

    var layerIndex = {};

    var events = [];

    var createLayer = function (id, data) {
        id = parseInt(id, 10);
        return new pc.Layer({
            id: id,
            enabled: true, // disable depth layer - it will be enabled by the engine as needed
            name: data.name,
            opaqueSortMode: data.opaqueSortMode,
            transparentSortMode: data.transparentSortMode
        });
    };

    var initLayers = function () {
        for (let i = 0; i < events.length; i++) {
            events[i].unbind();
        }
        events.length = 0;

        // on settings change
        events.push(projectSettings.on('*:set', function (path, value) {
            var parts, id;

            if (path.startsWith('layers.')) {
                parts = path.split('.');

                if (parts.length === 2) {
                    id = parseInt(parts[1], 10);
                    var layer = createLayer(id, value);
                    layerIndex[layer.id] = layer;

                    var existing = app.scene.layers.getLayerById(value.id);
                    if (existing) {
                        app.scene.layers.remove(existing);
                    }
                } else if (parts.length === 3) {
                    id = parseInt(parts[1], 10);
                    // change layer property
                    if (layerIndex[id]) {
                        layerIndex[id][parts[2]] = value;
                    }
                }

            } else if (path.startsWith('layerOrder.')) {
                parts = path.split('.');

                if (parts.length === 3) {
                    if (parts[2] === 'enabled') {
                        editor.call('gizmo:layers:removeFromComposition');

                        var subLayerId = parseInt(parts[1], 10);
                        app.scene.layers.subLayerEnabled[subLayerId] = value;

                        editor.call('gizmo:layers:addToComposition');

                        editor.call('viewport:render');
                    }
                }
            }
        }));

        events.push(projectSettings.on('*:unset', function (path) {
            if (path.startsWith('layers.')) {
                var parts = path.split('.');
                // remove layer
                if (parts.length === 2) {
                    var id = parseInt(parts[1], 10);
                    delete layerIndex[id];

                    var existing = app.scene.layers.getLayerById(id);
                    if (existing) {
                        app.scene.layers.remove(existing);
                    }

                }
            }
        }));

        events.push(projectSettings.on('layerOrder:insert', function (value, index) {
            var id = value.get('layer');
            var layer = layerIndex[id];
            if (!layer) return;

            var transparent = value.get('transparent');

            editor.call('gizmo:layers:removeFromComposition');

            if (transparent) {
                app.scene.layers.insertTransparent(layer, index);
            } else {
                app.scene.layers.insertOpaque(layer, index);
            }

            editor.call('gizmo:layers:addToComposition');


            editor.call('viewport:render');
        }));

        events.push(projectSettings.on('layerOrder:remove', function (value) {
            var id = value.get('layer');
            var layer = layerIndex[id];
            if (!layer) return;

            var transparent = value.get('transparent');

            editor.call('gizmo:layers:removeFromComposition');

            if (transparent) {
                app.scene.layers.removeTransparent(layer);
            } else {
                app.scene.layers.removeOpaque(layer);
            }

            editor.call('gizmo:layers:addToComposition');

            editor.call('viewport:render');
        }));

        events.push(projectSettings.on('layerOrder:move', function (value, indNew, indOld) {
            var id = value.get('layer');
            var layer = layerIndex[id];
            if (!layer) return;

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
        }));

        var layers = projectSettings.get('layers');
        if (!layers) return;

        var layerOrder = projectSettings.get('layerOrder');
        if (!layerOrder) return;

        var i, len;
        var composition = new pc.LayerComposition("viewport-layers");

        for (const key in layers) {
            layerIndex[key] = createLayer(key, layers[key]);
        }

        for (i = 0, len = layerOrder.length; i < len; i++) {
            var sublayer = layerOrder[i];
            var layer = layerIndex[sublayer.layer];
            if (!layer) continue;

            if (sublayer.transparent) {
                composition.pushTransparent(layer);
            } else {
                composition.pushOpaque(layer);
            }

            composition.subLayerEnabled[i] = sublayer.enabled;
        }

        editor.call('gizmo:layers:addToComposition', composition);

        app.scene.layers = composition;
    };

    editor.on('settings:project:load', initLayers);
});
