editor.once('load', function() {
    'use strict';

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
        if (numAssets > 1) return;

        if (assets[0].get('type') !== 'layers') return;

        editor.call('attributes:header', 'LAYER COMPOSITION');

        var events = [];

        // var layerColors = {};
        var colorIndex = 0;

        var draggedSublayer = null;
        var selectedLayer = null;

        var panelLayerProperties = null;

         // panel
        var rootPanel = editor.call('attributes:assets:panel');

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

        var createLayer = function (name, opaque, transparent) {
            var layer = {
                name: name,
                enabled: true,
                opaqueSortMode: 2,
                transparentSortMode: 3
            };

            var dirty = false;
            var changes = {};

            var redo = function () {
                var result;

                var asset = editor.call('assets:get', assets[0].get('id'));
                if (! asset) return;

                var history = asset.history.enabled;
                asset.history.enabled = false;

                // check if layer with that name already exists
                var key = null;
                var layers = asset.get('data.layers');
                for (var k in layers) {
                    if (layers[k].name === name) {
                        key = k;
                        break;
                    }
                }

                // create new layer
                if (! key) {
                    var maxKey = 0;
                    for (var k in layers) {
                        maxKey = Math.max(parseInt(k, 10) + 1, maxKey);
                    }
                    maxKey = maxKey.toString();

                    asset.set('data.layers.' + maxKey, layer);

                    key = maxKey;

                    changes.newKey = key;

                    dirty = true;
                }

                changes.key = key;

                var sublayers = asset.get('data.sublayerOrder');
                var hasOpaque = false;
                var hasTransparent = false;
                for (var i = 0, len = sublayers.length; i<len; i++) {
                    if (sublayers[i].layer === key) {
                        if (sublayers[i].transparent) {
                            hasTransparent = true;
                            if (hasOpaque)
                                break;
                        } else {
                            hasOpaque = true;
                            if (hasTransparent)
                                break;
                        }
                    }
                }

                if (opaque && ! hasOpaque) {
                    asset.insert('data.sublayerOrder', {layer: key, transparent: false});
                    changes.opaque = true;
                    dirty = true;
                }
                if (transparent && ! hasTransparent) {
                    changes.transparent = true;
                    asset.insert('data.sublayerOrder', {layer: key, transparent: true});
                    dirty = true;
                }

                asset.history.enabled = history;

                return dirty;
            };

            var undo = function () {
                var asset = editor.call('assets:get', assets[0].get('id'));
                if (! asset) return;

                var history = asset.history.enabled;
                asset.history.enabled = false;

                var transparentIndex = null;
                var opaqueIndex = null;

                var sublayers = asset.get('data.sublayerOrder');
                var i = sublayers.length;
                while (i--) {
                    if (sublayers[i].layer === changes.key) {
                        if (changes.transparent && sublayers[i].transparent) {
                            asset.remove('data.sublayerOrder', i);
                            changes.transparent = false;
                            if (! changes.opaque)
                                break;
                        } else if (changes.opaque && ! sublayers[i].transparent) {
                            asset.remove('data.sublayerOrder', i);
                            changes.opaque = false;
                            if (! changes.transparent)
                                break;
                        }
                    }
                }

                if (changes.newKey) {
                    asset.unset('data.layers.' + changes.newKey);
                }

                changes = {};

                asset.history.enabled = history;
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

        var removeSublayer = function (key, transparent) {
            var opaqueIndex = null;
            var transparentIndex = null;
            var prevLayerData = null;

            var redo = function () {
                var asset = editor.call('assets:get', assets[0].get('id'));
                if (! asset) return;

                var sublayers = asset.get('data.sublayerOrder');

                for (var i = 0, len = sublayers.length; i<len; i++) {
                    if (sublayers[i].layer === key) {
                        if (sublayers[i].transparent) {
                            transparentIndex = i;
                            if (opaqueIndex !== null) {
                                break;
                            }
                        } else {
                            opaqueIndex = i;
                            if (transparentIndex !== null) {
                                break;
                            }
                        }
                    }
                }

                var history = asset.history.enabled;
                asset.history.enabled = false;

                var removeLayer = false;

                if (transparent) {
                    if (transparentIndex !== null) {
                        asset.remove('data.sublayerOrder', transparentIndex);
                        removeLayer = opaqueIndex !== null;
                    }
                } else {
                    if (opaqueIndex !== null) {
                        asset.remove('data.sublayerOrder', opaqueIndex);
                        removeLayer = transparentIndex !== null;
                    }
                }

                if (removeLayer) {
                    prevLayerData = asset.get('data.layers.' + key);
                    asset.unset('data.layers.' + key);
                }

                asset.history.enabled = history;
            };

            var undo = function () {
                var asset = editor.call('assets:get', assets[0].get('id'));
                if (! asset) return;

                var history = asset.history.enabled;
                asset.history.enabled = false;

                if (prevLayerData) {
                    asset.set('data.layers.' + key, prevLayerData);
                    prevLayerData = null;
                }

                if (transparent) {
                    if (transparentIndex !== null) {
                        asset.insert('data.sublayerOrder', {
                            layer: key,
                            transparent: true
                        }, transparentIndex);
                    }
                } else {
                    if (opaqueIndex !== null) {
                        asset.insert('data.sublayerOrder', {
                            layer: key,
                            transparent: false
                        }, opaqueIndex);
                    }
                }

                asset.history.enabled = history;
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

            if (! name) {
                fieldNewLayerName.class.add('error');
                return;
            }

            fieldNewLayerName.class.remove('error');

            if (! createLayer(name, opaque, transparent)) {
                fieldNewLayerName.class.add('error');
            }
        });

        var panelLayers = editor.call('attributes:addPanel', {
            parent: panelEdit
        });
        panelLayers.class.add('component', 'layers');

        var panelSublayers = {};

        var createSublayer = function (key, name, transparent, index) {
            var panelEvents = [];

            var panel = new ui.Panel();
            panel.class.add('sublayer');
            if (transparent)
                panel.class.add('transparent');

            if (! panelSublayers[key]) {
                panelSublayers[key] = {
                    opaque: null,
                    transparent: null
                };
            }

            if (transparent) {
                panelSublayers[key].transparent = panel;
            } else {
                panelSublayers[key].opaque = panel;
            }

            var fieldHandle = document.createElement('div');
            fieldHandle.classList.add('handle');
            panel.append(fieldHandle);

            var onDragStart = function (evt) {
                draggedSublayer = {
                    key: key,
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

            // if (! layerColors[name]) {
            //     layerColors[name] = COLORS[colorIndex++ % COLORS.length];
            // }

            // var fieldColor = document.createElement('div');
            // fieldColor.classList.add('color');
            // fieldColor.style.backgroundColor = layerColors[name];
            // panel.append(fieldColor);

            // name
            var fieldName = new ui.Label({
                text: name
            });
            fieldName.class.add('name');
            panel.append(fieldName);

            panelEvents.push(assets[0].on('data.layers.' + key + '.name:set', function (value) {
                fieldName.value = value;

                // if (name !== value) {
                //     layerColors[value] = layerColors[name];
                //     delete layerColors[name];
                //     name = value;
                // }
            }));

            // transparent
            var fieldTransparent = new ui.Label({
                text: transparent ? 'Transparent' : 'Opaque'
            });
            fieldTransparent.class.add('transparent');
            panel.append(fieldTransparent);

            var btnRemove = new ui.Button();
            btnRemove.class.add('remove');
            panel.append(btnRemove);

            // Remove sublayer
            btnRemove.on('click', function () {
                removeSublayer(key, transparent);
            });

            panel.on('click', function () {
                selectLayer(key);
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
            var draggedPanel = panelSublayers[draggedSublayer.key][draggedSublayer.transparent ? 'transparent' : 'opaque'];
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
            var draggedPanel = panelSublayers[draggedSublayer.key][draggedSublayer.transparent ? 'transparent' : 'opaque'];
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

        var showLayerProperties = function (key) {
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
                link: assets[0],
                path: 'data.layers.' + key + '.enabled'
            });
            fieldEnabled.parent.innerElement.childNodes[0].style.minWidth = labelMinWidth;

            var fieldName = editor.call('attributes:addField', {
                parent: panelLayerProperties,
                name: 'Name',
                type: 'string',
                link: assets[0],
                path: 'data.layers.' + key + '.name'
            });
            fieldName.parent.innerElement.childNodes[0].style.minWidth = labelMinWidth;

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
                link: assets[0],
                path: 'data.layers.' + key + '.opaqueSortMode'
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
                link: assets[0],
                path: 'data.layers.' + key + '.transparentSortMode'
            });
            fieldTransparentSort.parent.innerElement.childNodes[0].style.minWidth = labelMinWidth;

            // scroll to bottom
            panelLayerProperties.parent.innerElement.scrollTop = panelLayerProperties.parent.innerElement.scrollHeight;
        };

        var hideLayerProperties = function () {
            if (panelLayerProperties) {
                panelLayerProperties.destroy();
                panelLayerProperties = null;
            }
        };

        var selectLayer = function (key) {
            if (! key) {
                selectedLayer = null;
                hideLayerProperties();
                return;
            }

            var old = selectedLayer;


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

            selectedLayer = key;

            if (panelSublayers[key].transparent) {
                panelSublayers[key].transparent.class.add('hover');
            }

            if (panelSublayers[key].opaque) {
                panelSublayers[key].opaque.class.add('hover');
            }


            showLayerProperties(key);
        };

        // Create sublayer panels
        var init = function () {
            var sublayers = assets[0].get('data.sublayerOrder');
            var layers = assets[0].get('data.layers');
            for (var i = 0, len = sublayers.length; i<len; i++) {
                var layer = layers[sublayers[i].layer];
                if (layer) {
                    var transparent = sublayers[i].transparent;
                    createSublayer(sublayers[i].layer, layer.name, transparent);
                }
            }
        };

        init();

        // On sublayer removed
        events.push(assets[0].on('data.sublayerOrder:remove', function (value, index) {
            var key = value._data.layer;
            var field = value._data.transparent ? 'transparent' : 'opaque';
            var otherField = field === 'transparent' ? 'opaque' : 'transparent';

            if (panelSublayers[key] && panelSublayers[key][field]) {
                panelSublayers[key][field].destroy();
                panelSublayers[key][field] = null;
                if (! panelSublayers[key][otherField]) {
                    delete panelSublayers[key];
                }
            }

            // if the layer was deleted then deselect it
            if (selectedLayer === key && ! panelSublayers[key]) {
                selectLayer(null);
            }
        }));

        // on sublayer added
        events.push(assets[0].on('data.sublayerOrder:insert', function (value, index, remote) {
            var key = value._data.layer;
            var field = value._data.transparent ? 'transparent' : 'opaque';
            if (! panelSublayers[key] || ! panelSublayers[key][field]) {
                var name = assets[0].get('data.layers.' + key + '.name');
                createSublayer(key, name, value._data.transparent, index);
            }

            if (! remote) {
                selectLayer(key);
            }
        }));

        // on sublayer moved
        events.push(assets[0].on('data.sublayerOrder:move', function (value, indNew, indOld) {
            var key = value.get('layer');
            var transparent = value.get('transparent');

            if (! panelSublayers[key]) return;

            var movedPanel = panelSublayers[key][transparent ? 'transparent' : 'opaque'];
            if (! movedPanel) return;

            var index = Array.prototype.indexOf.call(panelLayers.innerElement.childNodes, movedPanel.element);
            if (index === indOld) {
                panelLayers.remove(movedPanel);
                panelLayers.appendBefore(movedPanel, panelLayers.innerElement.childNodes[indNew]);
            }
        }));

        // Clean up
        rootPanel.once('destroy', function() {
            for (var i = 0, len = events.length; i<len; i++) {
                events[i].unbind();
            }
            events = null;
        });
    });
});
