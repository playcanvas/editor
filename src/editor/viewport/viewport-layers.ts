editor.once('load', () => {
    const app = editor.call('viewport:app');
    if (!app) {
        return;
    } // webgl not available

    const projectSettings = editor.call('settings:project');

    const layerIndex = {};

    const events = [];

    const createLayer = function (id, data) {
        id = parseInt(id, 10);
        return new pc.Layer({
            id: id,
            enabled: true, // disable depth layer - it will be enabled by the engine as needed
            name: data.name,
            opaqueSortMode: data.opaqueSortMode,
            transparentSortMode: data.transparentSortMode
        });
    };

    const initLayers = function () {
        for (let i = 0; i < events.length; i++) {
            events[i].unbind();
        }
        events.length = 0;

        // on settings change
        events.push(projectSettings.on('*:set', (path, value) => {
            let parts, id;

            if (path.startsWith('layers.')) {
                parts = path.split('.');

                if (parts.length === 2) {
                    id = parseInt(parts[1], 10);
                    const layer = createLayer(id, value);
                    layerIndex[layer.id] = layer;

                    const existing = app.scene.layers.getLayerById(value.id);
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

                        const subLayerId = parseInt(parts[1], 10);
                        app.scene.layers.subLayerEnabled[subLayerId] = value;

                        editor.call('gizmo:layers:addToComposition');

                        editor.call('viewport:render');
                    }
                }
            }
        }));

        events.push(projectSettings.on('*:unset', (path) => {
            if (path.startsWith('layers.')) {
                const parts = path.split('.');
                // remove layer
                if (parts.length === 2) {
                    const id = parseInt(parts[1], 10);
                    delete layerIndex[id];

                    const existing = app.scene.layers.getLayerById(id);
                    if (existing) {
                        app.scene.layers.remove(existing);
                    }

                }
            }
        }));

        events.push(projectSettings.on('layerOrder:insert', (value, index) => {
            const id = value.get('layer');
            const layer = layerIndex[id];
            if (!layer) {
                return;
            }

            const transparent = value.get('transparent');

            editor.call('gizmo:layers:removeFromComposition');

            if (transparent) {
                app.scene.layers.insertTransparent(layer, index);
            } else {
                app.scene.layers.insertOpaque(layer, index);
            }

            editor.call('gizmo:layers:addToComposition');


            editor.call('viewport:render');
        }));

        events.push(projectSettings.on('layerOrder:remove', (value) => {
            const id = value.get('layer');
            const layer = layerIndex[id];
            if (!layer) {
                return;
            }

            const transparent = value.get('transparent');

            editor.call('gizmo:layers:removeFromComposition');

            if (transparent) {
                app.scene.layers.removeTransparent(layer);
            } else {
                app.scene.layers.removeOpaque(layer);
            }

            editor.call('gizmo:layers:addToComposition');

            editor.call('viewport:render');
        }));

        events.push(projectSettings.on('layerOrder:move', (value, indNew, indOld) => {
            const id = value.get('layer');
            const layer = layerIndex[id];
            if (!layer) {
                return;
            }

            editor.call('gizmo:layers:removeFromComposition');

            const transparent = value.get('transparent');
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

        const layers = projectSettings.get('layers');
        if (!layers) {
            return;
        }

        const layerOrder = projectSettings.get('layerOrder');
        if (!layerOrder) {
            return;
        }

        let i, len;
        const composition = new pc.LayerComposition('viewport-layers');

        for (const key in layers) {
            layerIndex[key] = createLayer(key, layers[key]);
        }

        for (i = 0, len = layerOrder.length; i < len; i++) {
            const sublayer = layerOrder[i];
            const layer = layerIndex[sublayer.layer];
            if (!layer) {
                continue;
            }

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
