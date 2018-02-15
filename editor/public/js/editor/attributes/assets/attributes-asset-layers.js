editor.once('load', function() {
    'use strict';

    var RESERVED_NAMES = [
        'World',
        'Depth',
        'Skybox',
        'UI',
        'Gizmos'
    ];

    var COLORS = [
        "#FF7F50",
        "#00BFFF",
        "#FF00FF",
        "#FFA500",
        "#FF69B4",
        "#F60",
        "#7FFF00",
        "#8A2BE2",
        "#DC143C",
        "#00f"
    ];

    var VERSION = 1;
    var root = editor.call('layout.root');

    // overlay
    var overlay = new ui.Overlay();
    overlay.class.add('asset-layers-drag');
    overlay.hidden = true;
    root.append(overlay);

    editor.on('attributes:inspect[asset]', function(assets) {
        var numAssets = assets.length;

        for (var i = 0; i<numAssets; i++) {
            if (assets[i].get('type') !== 'layers')
                return;
        }

        editor.call('attributes:header', 'LAYER COMPOSITION' + (numAssets > 1 ? 'S' : ''));

        var events = [];

        var layersByName = {};
        var layerColors = {};
        var colorIndex = 0;

        var draggedSublayer = null;
        var selectedLayer = null;

        var panelLayerProperties = null;

        var getLayerInfo = function (layerName, asset) {
            var result = null;

            var layers = asset.getRaw('data.layers')._data;
            for (var key in layers) {
                if (layers[key]._data.name === layerName) {
                    result = {
                        key: key,
                        layer: utils.deepCopy(layers[key]._data),
                        transparent: null,
                        opaque: null
                    };

                    var sublayers = asset.getRaw('data.sublayerOrder');
                    for (var i = 0, len = sublayers.length; i<len; i++) {
                        if (sublayers[i]._data.layer === key) {
                            if (sublayers[i]._data.transparent) {
                                result.transparent = i;
                            } else {
                                result.opaque = i;
                            }

                            if (result.transparent !== null && result.opaque !== null) {
                                break;
                            }
                        }
                    }

                    break;
                }
            }

            return result;
        };

        var refreshLayersByName = function () {
            layersByName = {};

            for (var i = 0; i<numAssets; i++) {
                var id = assets[i].get('id');
                var layers = assets[i].getRaw('data.layers')._data;

                // get all keys in each asset for all layers
                for (var key in layers) {
                    var name = layers[key]._data.name;
                    if (! layersByName[name]) {
                        layersByName[name] = {};
                    }

                    layersByName[name][id] = getLayerInfo(name, assets[i]);
                }
            }
        };

        refreshLayersByName();

        var getLayerKeys = function (name, transparent) {
            var result = [];

            for (var i = 0; i<numAssets; i++) {
                var layers = assets[i].getRaw('data.layers')._data;
                var found = false;
                for (var key in layers) {
                    if (layers[key]._data.name === name) {
                        // check if the asset has sub-layers with same transparent setting
                        var sublayers = assets[i].getRaw('data.sublayerOrder');
                        for (var j = 0, jlen = sublayers.length; j<jlen; j++) {
                            if (sublayers[j]._data.layer === key && sublayers[j]._data.transparent === transparent) {
                                result.push(key);
                                found = true;
                                break;
                            }
                        }

                        if (found)
                            break;
                    }
                }

                if (! found)
                    return null;
            }

            return result;
        };

         // panel
        var panel = editor.call('attributes:assets:panel');

        var panelEdit = editor.call('attributes:addPanel', {
            name: 'LAYERS'
        });
        panelEdit.class.add('component', 'asset-layers');

        var fieldNewLayerName = editor.call('attributes:addField', {
            parent: panelEdit,
            name: 'New Layer',
            type: 'string',
            placeholder: 'Name',
        });
        fieldNewLayerName.class.add('new-name');

        var panelMode = editor.call('attributes:addField', {
            parent: panelEdit,
            name: ' '
        });
        var label = panelMode;
        panelMode = panelMode.parent;
        label.destroy();

        var fieldOpaqueMode = editor.call('attributes:addField', {
            panel: panelMode,
            type: 'checkbox',
            value: true
        });
        label = new ui.Label({ text: 'Opaque' });
        label.class.add('label-infield');
        label.style.fontSize = '12px';
        label.style.paddingRight = '12px';
        panelMode.append(label);

        fieldOpaqueMode.on('change', function (value) {
            if (! value && ! fieldTransparentMode.value)
                fieldTransparentMode.value = true;
        });

        var fieldTransparentMode = editor.call('attributes:addField', {
            panel: panelMode,
            type: 'checkbox',
            value: true
        });
        label = new ui.Label({ text: 'Transparent' });
        label.class.add('label-infield');
        label.style.fontSize = '12px';
        label.style.paddingRight = '12px';
        panelMode.append(label);

        fieldTransparentMode.on('change', function (value) {
            if (! value && ! fieldOpaqueMode.value)
                fieldOpaqueMode.value = true;
        });

        var addSublayerToAsset = function (asset, layerData, transparent, index) {
            var info = getLayerInfo(layerData.name, asset);
            var key = info && info.key;
            var result = {};

            // add new layer if it doesn't exist
            if (! key) {
                var maxKey = 0;
                var layers = asset.getRaw('data.layers')._data;
                for (var key in layers) {
                    maxKey = Math.max(parseInt(key, 10) + 1, maxKey);
                }
                maxKey = maxKey.toString();

                asset.set('data.layers.' + maxKey, layerData);

                key = maxKey;

                result.layer = maxKey;
            }

            if (transparent && (! info || info.transparent === null)) {
                asset.insert('data.sublayerOrder', {
                    layer: key,
                    transparent: true
                }, index);

                result.transparent = asset.getRaw('data.sublayerOrder').length - 1;
            } else if (! transparent && (! info || info.opaque === null)) {
                asset.insert('data.sublayerOrder', {
                    layer: key,
                    transparent: false
                }, index);

                result.opaque = asset.getRaw('data.sublayerOrder').length - 1;
            }

            return result;
        };

        var removeSublayerFromAsset = function (asset, layerName, transparent) {
            var info = getLayerInfo(layerName, asset);
            if (! info) return;

            var removeLayer = false;
            if (transparent && info.transparent !== null) {
                asset.remove('data.sublayerOrder', info.transparent);
                removeLayer = info.opaque === null;
            } else if (!transparent && info.opaque !== null) {
                asset.remove('data.sublayerOrder', info.opaque);
                removeLayer = info.transparent === null;
            }

            if (removeLayer) {
                asset.unset('data.layers.' + info.key);
            }
        };

        var createLayer = function (name, opaque, transparent) {
            var changes = {};

            var redo = function () {
                var result;

                var layer = {
                    name: name,
                    enabled: true,
                    opaqueSortMode: 2,
                    transparentSortMode: 3
                };

                for (var i = 0; i<numAssets; i++) {
                    var id = assets[i].get('id');
                    var asset = editor.call('assets:get', id);
                    if (! asset) continue;

                    var history = asset.history.enabled;
                    asset.history.enabled = false;

                    if (opaque) {
                        result = addSublayerToAsset(asset, layer, false);
                        for (var key in result) {
                            changes[id] = changes[id] || {};
                            changes[id][key] = result[key];
                        }
                    }
                    if (transparent) {
                        result = addSublayerToAsset(asset, layer, true);
                        for (var key in result) {
                            changes[id] = changes[id] || {};
                            changes[id][key] = result[key];
                        }
                    }

                    asset.history.enabled = history;
                }

                return !!changes[id];
            };

            var undo = function () {
                for (var i = 0; i<numAssets; i++) {
                    var id = assets[i].get('id');
                    if (! changes[id]) continue;

                    var asset = editor.call('assets:get', id);
                    if (! asset) continue;

                    var history = asset.history.enabled;
                    asset.history.enabled = false;

                    if (opaque && changes[id].transparent !== undefined) {
                        asset.remove('data.sublayerOrder', changes[id].transparent);
                        // removeSublayerFromAsset(asset, name, false);
                    }
                    if (transparent && changes[id].opaque !== undefined) {
                        asset.remove('data.sublayerOrder', changes[id].opaque);
                        // removeSublayerFromAsset(asset, name, true);
                    }

                    if (changes[id].layer) {
                        asset.unset('data.layers.' + changes[id].layer);
                    }

                    asset.history.enabled = history;
                }
               selectLayer(null);
            };

            // try to add opaque or transparent layer
            // to selected assets but if they all already have them
            // then mark the name field with an error
            if (redo()) {
                editor.call('history:add', {
                    name: 'new layer',
                    undo: undo,
                    redo: redo
                });

                return true;
            } else {
                return false;
            }
        };

        var removeSublayer = function (name, transparent) {

            var redo = function () {

            };

            var undo = function () {

            };

            editor.call('history:add', {
                name: 'remove sublayer',
                undo: undo,
                redo: redo
            });

            redo();
        };

        var btnAdd = editor.call('attributes:addField', {
            parent: panelEdit,
            name: ' ',
            text: 'ADD NEW LAYER',
            type: 'button'
        });
        btnAdd.class.add('icon', 'create');

        // Add new layer
        btnAdd.on('click', function () {
            var opaque = fieldOpaqueMode.value;
            var transparent = fieldTransparentMode.value;
            var name = fieldNewLayerName.value;

            if (! name || RESERVED_NAMES.indexOf(name) !== -1) {
                fieldNewLayerName.class.add('error');
                return;
            }

            fieldNewLayerName.class.remove('error');

            var result = createLayer(name, opaque, transparent);
            if (! result) {
                fieldNewLayerName.class.add('error');
            }
        });

        var panelLayers = editor.call('attributes:addPanel', {
            parent: panelEdit
        });
        panelLayers.class.add('component', 'layers');

        var panelSublayers = {};

        var createSublayer = function (name, transparent, index) {
            var panelEvents = [];

            var panel = new ui.Panel();
            panel.class.add('sublayer');
            if (transparent)
                panel.class.add('transparent');

            if (! panelSublayers[name]) {
                panelSublayers[name] = {
                    opaque: null,
                    transparent: null
                };
            }

            if (transparent) {
                panelSublayers[name].transparent = panel;
            } else {
                panelSublayers[name].opaque = panel;
            }

            var fieldHandle = document.createElement('div');
            fieldHandle.classList.add('handle');
            if (numAssets > 1 || RESERVED_NAMES.indexOf(name) !== -1) {
                fieldHandle.classList.add('disabled');
            }
            panel.append(fieldHandle);

            var onDragStart = function (evt) {
                draggedSublayer = {
                    name: fieldName.value,
                    transparent: transparent,
                    index: Array.prototype.indexOf.call(panelLayers.innerElement.childNodes, panel.element)
                };

                panel.class.add('dragged');
                panelEdit.class.add('dragged');

                window.addEventListener('mouseup', onDragEnd);
                panelLayers.innerElement.addEventListener('mousemove', onDragMove);

                overlay.hidden = false;
            };

            // only allow dragging if one asset is selected
            if (! fieldHandle.classList.contains('disabled')) {
                fieldHandle.addEventListener('mousedown', onDragStart);
            }

            if (! layerColors[name]) {
                layerColors[name] = COLORS[colorIndex++ % COLORS.length];
            }

            var fieldColor = document.createElement('div');
            fieldColor.classList.add('color');
            fieldColor.style.backgroundColor = layerColors[name];
            panel.append(fieldColor);

            // name
            var fieldName = new ui.Label({
                text: name
            });
            fieldName.class.add('name');
            panel.append(fieldName);

            for (var i = 0; i < numAssets; i++) {
                panelEvents.push(assets[i].on('data.layers.' + layersByName[name][assets[i].get('id')].key + '.name:set', function (value) {
                    fieldName.value = value;
                    name = value;
                }));
            }

            // transparent
            var fieldTransparent = new ui.Label({
                text: transparent ? 'Transparent' : 'Opaque'
            });
            fieldTransparent.class.add('transparent');
            panel.append(fieldTransparent);

            var btnRemove = new ui.Button();
            btnRemove.class.add('remove');
            panel.append(btnRemove);
            btnRemove.hidden = RESERVED_NAMES.indexOf(name) !== -1;

            // Remove sublayer
            btnRemove.on('click', function () {
                removeSublayer(name, transparent);
            });

            panel.on('click', function () {
                selectLayer(fieldName.value);
            });

            panel.on('destroy', function () {
                fieldHandle.removeEventListener('mousedown', onDragStart);
                if (panel.class.contains('dragged')) {
                    panelLayers.innerElement.removeEventListener('mousemove', onDragMove);
                    window.removeEventListener('mouseup', onDragEnd);
                }

                for (var i = 0, len = panelEvents.length; i<len; i++) {
                    panelEvents[i].unbind();
                }
                panelEvents.length = 0;
            });

            var before = null;

            if (typeof(index) === 'number')
                before = panelLayers.innerElement.childNodes[index];

            if (before) {
                panelLayers.appendBefore(panel, before);
            } else {
                panelLayers.append(panel);
            }
        };

        // Move dragged sublayer
        var onDragMove = function (evt) {
            var draggedPanel = panelSublayers[draggedSublayer.name][draggedSublayer.transparent ? 'transparent' : 'opaque'];
            var rect = panelLayers.innerElement.getBoundingClientRect();
            var height = draggedPanel.element.offsetHeight;
            var top = evt.clientY - rect.top - 6;
            var overPanelIndex = Math.floor(top / height);
            var overPanel = panelLayers.innerElement.childNodes[overPanelIndex];

            if (overPanel && overPanel.ui !== draggedPanel) {
                panelLayers.remove(draggedPanel);
                panelLayers.appendBefore(draggedPanel, panelLayers.innerElement.childNodes[overPanelIndex]);
            }
        };

        // End sublayer drag
        var onDragEnd = function (evt) {
            var draggedPanel = panelSublayers[draggedSublayer.name][draggedSublayer.transparent ? 'transparent' : 'opaque'];
            if (draggedPanel) {
                draggedPanel.class.remove('dragged');
            }
            panelEdit.class.remove('dragged');
            window.removeEventListener('mouseup', onDragEnd);
            panelLayers.innerElement.removeEventListener('mousemove', onDragMove);

            overlay.hidden = true;

            var oldIndex = draggedSublayer.index;
            var newIndex = Array.prototype.indexOf.call(panelLayers.innerElement.childNodes, draggedPanel.element);

            if (newIndex !== oldIndex) {
                // NOTE: If a remote user moves the same indices then undoing this move
                // will move the wrong items.
                assets[0].move('data.sublayerOrder', oldIndex, newIndex);
            }

            draggedSublayer = null;

        };

        // Check if sublayer exists in all selected assets
        var isSublayerCommon = function (name, transparent) {
            var result = true;

            for (var i = 0; i<numAssets; i++) {
                var id = assets[i].get('id');
                if (! layersByName[name][id]) {
                    result = false;
                    break;
                } else if (layersByName[name][id]) {
                    if (layersByName[name][id][transparent ? 'transparent' : 'opaque'] === null) {
                        result = false;
                        break;
                    }
                }
            }

            return result;
        };

        // create common sublayers
        var createCommonSublayers = function () {
            var sublayers = assets[0].getRaw('data.sublayerOrder');
            var layers = assets[0].getRaw('data.layers')._data;
            for (var i = 0, len = sublayers.length; i<len; i++) {
                var layer = layers[sublayers[i]._data.layer];
                if (! layer) continue;
                var name = layer._data.name;
                var transparent = sublayers[i]._data.transparent;
                if (isSublayerCommon(name, transparent)) {
                    createSublayer(name, transparent);
                }
            }
        };

        var updateCommonSublayers = function () {

        };

        var showLayerProperties = function (name) {
            hideLayerProperties();

            // panel that shows layer properties
            panelLayerProperties = editor.call('attributes:addPanel', {
                name: 'LAYER'
            });
            panelLayerProperties.class.add('component');

            var labelMinWidth = '100px';

            // panelLayer.hidden = true;
            var fieldEnabled = editor.call('attributes:addField', {
                parent: panelLayerProperties,
                name: 'Enabled',
                type: 'checkbox',
                link: assets,
                path: assets.map(function (asset) {
                    return 'data.layers.' + layersByName[name][asset.get('id')].key + '.enabled';
                })
            });
            fieldEnabled.parent.innerElement.childNodes[0].style.minWidth = labelMinWidth;

            var fieldName = editor.call('attributes:addField', {
                parent: panelLayerProperties,
                name: 'Name',
                type: 'string',
                link: assets,
                path: assets.map(function (asset) {
                    return 'data.layers.' + layersByName[name][asset.get('id')].key + '.name';
                })
            });
            fieldName.parent.innerElement.childNodes[0].style.minWidth = labelMinWidth;
            fieldName.disabled = RESERVED_NAMES.indexOf(name) !== -1;

            var fieldOpaqueSort = editor.call('attributes:addField', {
                parent: panelLayerProperties,
                name: 'Opaque Sort',
                type: 'number',
                enum: [
                    {v: 0, t: 'None'},
                    {v: 1, t: 'Manual'},
                    {v: 2, t: 'Material / Mesh'},
                    {v: 3, t: 'Back To Front'},
                    {v: 4, t: 'Front To Back'}
                ],
                link: assets,
                path: assets.map(function (asset) {
                    return 'data.layers.' + layersByName[name][asset.get('id')].key + '.opaqueSortMode';
                })
            });
            fieldOpaqueSort.parent.innerElement.childNodes[0].style.minWidth = labelMinWidth;

            var fieldTransparentSort = editor.call('attributes:addField', {
                parent: panelLayerProperties,
                name: 'Transparent Sort',
                type: 'number',
                enum: [
                    {v: 0, t: 'None'},
                    {v: 1, t: 'Manual'},
                    {v: 2, t: 'Material / Mesh'},
                    {v: 3, t: 'Back To Front'},
                    {v: 4, t: 'Front To Back'}
                ],
                link: assets,
                path: assets.map(function (asset) {
                    return 'data.layers.' + layersByName[name][asset.get('id')].key + '.transparentSortMode';
                })
            });
            fieldTransparentSort.parent.innerElement.childNodes[0].style.minWidth = labelMinWidth;

            // scroll to bottom
            panel.parent.innerElement.scrollTop = panel.parent.innerElement.scrollHeight;
        };

        var hideLayerProperties = function () {
            if (panelLayerProperties) {
                panelLayerProperties.destroy();
                panelLayerProperties = null;
            }
        };

        var selectLayer = function (name) {
            if (! name) {
                selectedLayer = null;
                hideLayerProperties();
                return;
            }

            var old = selectedLayer;

            if (old === name)
                return;

            if (old) {
                var p = panelSublayers[old];
                if (p.opaque) {
                    p.opaque.class.remove('hover');
                }
                if (p.transparent) {
                    p.transparent.class.remove('hover');
                }

                selectedLayer = null;
            }

            if (old === name) {
                hideLayerProperties();
                return;
            }

            selectedLayer = name;

            if (panelSublayers[name].transparent) {
                panelSublayers[name].transparent.class.add('hover');
            }

            if (panelSublayers[name].opaque) {
                panelSublayers[name].opaque.class.add('hover');
            }


            showLayerProperties(name);
        };

        // Add listener on every asset to check when a sublayer is removed
        var hookSublayerRemovedListener = function (asset) {
            events.push(asset.on('data.sublayerOrder:remove', function (value, index) {
                var layers = asset.getRaw('data.layers')._data;
                var layer = layers[value._data.layer];
                if (! layer) return;

                var name = layer._data.name;
                var id = asset.get('id');

                var field = value._data.transparent ? 'transparent' : 'opaque';
                var otherField = field === 'transparent' ? 'opaque' : 'transparent';

                layersByName[name][id][field] = null;
                if (layersByName[name][id][otherField] === null) {
                    delete layersByName[name][id];

                    if (! Object.keys(layersByName[name]).length) {
                        delete layersByName[name];
                    }
                }

                if (panelSublayers[name] && panelSublayers[name][field]) {
                    panelSublayers[name][field].destroy();
                    panelSublayers[name][field] = null;
                    if (! panelSublayers[name][otherField]) {
                        delete panelSublayers[name];
                    }
                }

                var sublayers = asset.getRaw('data.sublayerOrder');
                for (var i = index; i < sublayers.length; i++) {
                    name = layers[sublayers[i]._data.layer]._data.name;
                    field = sublayers[i]._data.transparent ? 'transparent' : 'opaque';
                    layersByName[name][id][field]--;
                }

                // if the layer was deleted then deselect it
                if (selectedLayer === name && ! layersByName[name]) {
                    selectLayer(null);
                }
            }));
        };

        // Add listener on every asset to check when a sublayer is added
        var hookSublayerAddedListener = function (asset) {
            events.push(asset.on('data.sublayerOrder:insert', function (value, index) {
                var layers = asset.getRaw('data.layers')._data;
                var layer = layers[value._data.layer];
                if (! layer) return;

                var name = layer._data.name;
                var id = asset.get('id');

                var field = value._data.transparent ? 'transparent' : 'opaque';
                var otherField = field === 'transparent' ? 'opaque' : 'transparent';

                if (! layersByName[name]) {
                    layersByName[name] = {};
                }

                if (! layersByName[name][id]) {
                    layersByName[name][id] = {
                        key: value._data.layer,
                        opaque: null,
                        transparent: null
                    };
                }

                layersByName[name][id][field] = index;

               if (! panelSublayers[name] || ! panelSublayers[name][field]) {
                    if (isSublayerCommon(name, value._data.transparent)) {
                        createSublayer(name, value._data.transparent, asset === assets[0] ? index : layersByName[name][assets[0].get('id')][field]);
                    }
                }

                var sublayers = asset.getRaw('data.sublayerOrder');
                for (var i = index + 1; i < sublayers.length; i++) {
                    name = layers[sublayers[i]._data.layer]._data.name;
                    field = sublayers[i]._data.transparent ? 'transparent' : 'opaque';
                    layersByName[name][id][field]++;
                }

                hookNameChangeListener(asset, name);
            }));
        };

        var nameChangeTimeout = null;

        var hookNameChangeListener = function (asset, layerName) {
            var id = asset.get('id');
            var entry = layersByName[layerName][id];
            if (! entry) return;

            events.push(asset.on('data.layers.' + entry.key + '.name:set', function (value) {
                if (nameChangeTimeout) {
                    clearTimeout(nameChangeTimeout);
                }

                nameChangeTimeout = setTimeout(function () {
                    refreshLayersByName();
                });
                // if (panelSublayers[layerName]) {
                //     panelSublayers[value] = panelSublayers[layerName];
                //     delete panelSublayers[layerName];
                // }

                // if (layerColors[layerName]) {
                //     layerColors[value] = layerColors[layerName];
                //     delete layerColors[layerName];
                // }

                // if (selectedLayer === layerName) {
                //     selectedLayer = value;
                // }

                // if (! layersByName[value]) {
                //     layersByName[value] = {};
                // }

                // layersByName[value][id] = layersByName[layerName][id];
                // delete layersByName[layerName][id];

                // if (! Object.keys(layersByName[layerName]))  {
                //     delete layersByName[layerName];
                // }

                // if (isSublayerCommon)

                // layerName = value;
            }));
        };

        events.push(assets[0].on('data.sublayerOrder:move', function (value, indNew, indOld) {
            var layerKey = value.get('layer');
            var transparent = value.get('transparent');
            var layers = assets[0].getRaw('data.layers')._data;
            var name = layers[layerKey] ? layers[layerKey]._data.name : null;
            if (! name) return;

            var movedPanel = panelSublayers[name][transparent ? 'transparent' : 'opaque'];
            if (! movedPanel) return;

            var index = Array.prototype.indexOf.call(panelLayers.innerElement.childNodes, movedPanel.element);
            if (index === indOld) {
                panelLayers.remove(movedPanel);
                panelLayers.appendBefore(movedPanel, panelLayers.innerElement.childNodes[indNew]);
            }
        }));

        for (var i = 0; i<numAssets; i++) {
            hookSublayerRemovedListener(assets[i]);
            hookSublayerAddedListener(assets[i]);
        }

        createCommonSublayers();

        for (var key in layersByName) {
            for (var id in layersByName[key]) {
                hookNameChangeListener(editor.call('assets:get', id), layersByName[key][id].layer.name);
            }
        }

        panel.once('destroy', function() {
            for (var i = 0, len = events.length; i<len; i++) {
                events[i].unbind();
            }
            events = null;
        });
    });
});
