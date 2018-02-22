editor.once('load', function() {
    'use strict';

    var projectSettings = editor.call('settings:project');

    var folded = true;

    var root = editor.call('layout.root');

    // overlay
    var overlay = new ui.Overlay();
    overlay.class.add('layers-drag');
    overlay.hidden = true;
    root.append(overlay);

    editor.on('attributes:inspect[editorSettings]', function() {
        var events = [];

        var draggedSublayer = null;

        var indexSublayerPanels = {};
        var indexLayerPanels = {};

        var panel = editor.call('attributes:addPanel', {
            name: 'Layers'
        });
        panel.foldable = true;
        panel.folded = folded;
        panel.on('fold', function () {folded = true;});
        panel.on('unfold', function () {folded = false;});
        panel.class.add('component', 'layers');

        var fieldNewLayerName = editor.call('attributes:addField', {
            parent: panel,
            name: 'New Layer',
            type: 'string',
            placeholder: 'Name',
        });
        fieldNewLayerName.class.add('new-name');

        var btnAddLayer = editor.call('attributes:addField', {
            parent: panel,
            name: ' ',
            text: 'ADD LAYER',
            type: 'button'
        });
        btnAddLayer.class.add('icon', 'create');

        // Add new layer
        btnAddLayer.on('click', function () {
            var name = fieldNewLayerName.value;

            if (! name) {
                fieldNewLayerName.class.add('error');
                return;
            }

            fieldNewLayerName.class.remove('error');

            var key = createLayer(name);

            if (key) {
                indexLayerPanels[key].folded = false;
                scrollIntoView(indexLayerPanels[key]);
            }
        });

        var panelLayers = new ui.Panel();
        panelLayers.class.add('layers-container');
        panel.append(panelLayers);

        var createLayerPanel = function (key, data, index) {
            var panelEvents = [];

            var panelLayer = new ui.Panel(data.name);
            panelLayer.class.add('component', 'layer');
            panelLayer.foldable = true;
            panelLayer.folded = true;
            indexLayerPanels[key] = panelLayer;

            var btnRemove = new ui.Button();
            btnRemove.class.add('remove');
            panelLayer.headerElement.appendChild(btnRemove.element);

            // Remove sublayer
            btnRemove.on('click', function () {
                removeLayer(key);
            });

            var fieldName = editor.call('attributes:addField', {
                parent: panelLayer,
                name: 'Name',
                type: 'string',
                link: projectSettings,
                path: 'layers.' + key + '.name'
            });

            fieldName.on('change', function (value) {
                panelLayer.header = value;
            });

            var fieldOpaqueSort = editor.call('attributes:addField', {
                parent: panelLayer,
                name: 'Opaque Sort',
                type: 'number',
                enum: [
                    {v: 0, t: 'None'},
                    {v: 1, t: 'Manual'},
                    {v: 2, t: 'Material / Mesh'},
                    {v: 3, t: 'Back To Front'},
                    {v: 4, t: 'Front To Back'}
                ],
                link: projectSettings,
                path: 'layers.' + key + '.opaqueSortMode'
            });

            var fieldTransparentSort = editor.call('attributes:addField', {
                parent: panelLayer,
                name: 'Transparent Sort',
                type: 'number',
                enum: [
                    {v: 0, t: 'None'},
                    {v: 1, t: 'Manual'},
                    {v: 2, t: 'Material / Mesh'},
                    {v: 3, t: 'Back To Front'},
                    {v: 4, t: 'Front To Back'}
                ],
                link: projectSettings,
                path: 'layers.' + key + '.transparentSortMode'
            });

            panelLayer.on('destroy', function () {
                for (var i = 0; i < panelEvents.length; i++) {
                    panelEvents[i].unbind();
                }
                panelEvents.length = 0;
            });


            var before;
            if (typeof(index) === 'number')
                before = panelLayers.innerElement.childNodes[index];

            if (before) {
                panelLayers.appendBefore(panelLayer, before);
            } else {
                panelLayers.append(panelLayer);
            }
        };

        var createLayer = function (name) {
            var layer = {
                name: name,
                opaqueSortMode: 2,
                transparentSortMode: 3
            };

            var newLayerKey = null;

            var redo = function () {
                var history = projectSettings.history.enabled;
                projectSettings.history.enabled = false;

                // find max key to insert new layer
                var maxKey = 0;
                var layers = projectSettings.get('layers');
                for (var key in layers) {
                    maxKey = Math.max(parseInt(key, 10) + 1, maxKey);
                }

                // create new layer
                newLayerKey = maxKey.toString();

                projectSettings.set('layers.' + newLayerKey, layer);

                projectSettings.history.enabled = history;

                return newLayerKey;
            };

            var undo = function () {
                var history = projectSettings.history.enabled;
                projectSettings.history.enabled = false;

                var transparentIndex = null;
                var opaqueIndex = null;

                // remove any sublayers that might have
                // been created by another user
                var order = projectSettings.get('layerOrder');
                var i = order.length;
                while (i--) {
                    if (order[i].layer === newLayerKey) {
                        projectSettings.remove('layerOrder', i);
                    }
                }

                projectSettings.unset('layers.' + newLayerKey);

                newLayerKey = null;

                projectSettings.history.enabled = history;
            };

            editor.call('history:add', {
                name: 'new layer',
                undo: undo,
                redo: redo
            });

            return redo();
        };

        var addSublayer = function (key, transparent) {
            var redo = function () {
                var history = projectSettings.history.enabled;
                projectSettings.history.enabled = false;

                var order = projectSettings.get('layerOrder');
                for (var i = 0; i < order.length; i++) {
                    if (order[i].layer === key && order[i].transparent === transparent) {
                        // already exists so return
                        return;
                    }
                }

                projectSettings.insert('layerOrder', {
                    layer: key,
                    transparent: transparent,
                    enabled: true
                });

                projectSettings.history.enabled = history;

                return true;
            };

            var undo = function () {
                var history = projectSettings.history.enabled;
                projectSettings.history.enabled = false;

                var order = projectSettings.get('layerOrder');
                for (var i = 0; i < order.length; i++) {
                    if (order[i].layer === key && order[i].transparent === transparent) {
                        projectSettings.remove('layerOrder', i);
                        break;
                    }
                }

                projectSettings.history.enabled = history;
            };


            if (redo()) {
                editor.call('history:add', {
                    name: 'add sublayer',
                    undo: undo,
                    redo: redo
                });
            }
        };

        var removeSublayer = function (key, transparent) {
            var index = null;
            var enabled = false;

            var redo = function () {
                var order = projectSettings.get('layerOrder');

                for (var i = 0, len = order.length; i<len; i++) {
                    if (order[i].layer === key && order[i].transparent === transparent) {
                        index = i;
                        enabled = order[i].enabled;
                        break;
                    }
                }

                var history = projectSettings.history.enabled;
                projectSettings.history.enabled = false;

                if (index !== null) {
                    projectSettings.remove('layerOrder', index);
                }

                projectSettings.history.enabled = history;
            };

            var undo = function () {
                if (index === null) return;

                var history = projectSettings.history.enabled;
                projectSettings.history.enabled = false;

                // check if the sublayer already exists
                var order = projectSettings.get('layerOrder');

                for (var i = 0, len = order.length; i<len; i++) {
                    if (order[i].layer === key && order[i].transparent === transparent) {
                        // layer already exists so return
                        return;
                    }
                }

                projectSettings.insert('layerOrder', {
                    layer: key,
                    transparent: transparent,
                    enabled: enabled
                }, Math.min(index, order.length - 1));

                index = null;
                enabled = false;

                projectSettings.history.enabled = history;
            };

            editor.call('history:add', {
                name: 'remove sublayer',
                undo: undo,
                redo: redo
            });

            redo();
        };

        var removeLayer = function (key) {
            var prev = null;
            var prevSublayers = [];

            var redo = function () {
                var history = projectSettings.history.enabled;
                projectSettings.history.enabled = false;
                prev = projectSettings.get('layers.' + key);
                projectSettings.unset('layers.' + key);

                var order = projectSettings.get('layerOrder');
                var i = order.length;
                while (i--) {
                    if (order[i].layer === key) {
                        projectSettings.remove('layerOrder', i);
                        prevSublayers.unshift({
                            index: i,
                            transparent: order[i].transparent
                        });
                    }
                }

                projectSettings.history.enabled = history;
            };

            var undo = function () {
                var history = projectSettings.history.enabled;
                projectSettings.history.enabled = false;
                projectSettings.set('layers.' + key, prev);

                var layerOrder = projectSettings.get('layerOrder');

                for (var i = 0; i < prevSublayers.length; i++) {
                    var idx = prevSublayers[i].index;
                    var transparent = prevSublayers[i].transparent;
                    projectSettings.insert('layerOrder', {
                        layer: key,
                        transparent: transparent
                    },  Math.min(idx, layerOrder.length - 1));
                }

                prevSublayers.length = 0;
                prev = null;

                projectSettings.history.enabled = history;
            };

            editor.call('history:add', {
                name: 'remove layer',
                undo: undo,
                redo: redo
            });

            redo();
        };

        var scrollIntoView = function (panel) {
            var attributesPanel = editor.call('attributes.rootPanel');
            var parentRect = attributesPanel.innerElement.getBoundingClientRect();
            var rect = panel.element.getBoundingClientRect();
            var diff;
            if (rect.bottom > parentRect.bottom) {
                diff = rect.bottom - parentRect.bottom;
                attributesPanel.innerElement.scrollTop += diff;
            } else if (rect.top < parentRect.top) {
                diff = parentRect.top - rect.top;
                attributesPanel.innerElement.scrollTop -= diff;
            }
        };

        var panelRenderOrder = editor.call('attributes:addPanel', {
            parent: panel,
            name: 'RENDER ORDER'
        });
        panelRenderOrder.foldable = true;
        panelRenderOrder.folded = false;
        panelRenderOrder.class.add('layer-order');

        // add sublayer to order
        var panelAddSublayer = editor.call('attributes:addPanel', {
            parent: panelRenderOrder
        });
        panelAddSublayer.class.add('add-sublayer');

        var lastAutoCompleteText = null;
        var highlightedAutoCompleteItem = null;
        var inputAddSublayer = new ui.TextField();
        inputAddSublayer.blurOnEnter = false;
        inputAddSublayer.renderChanges = false;
        inputAddSublayer.keyChange = true;
        panelAddSublayer.append(inputAddSublayer);

        inputAddSublayer.on('input:focus', function () {
            autoComplete.hidden = false;
            focusFirstAutocomplete();
        });

        inputAddSublayer.on('input:blur', function () {
            autoComplete.hidden = true;
            highlightedAutoCompleteItem = null;
            for (var key in autoComplete.index) {
                for (var field in autoComplete.index[key][field]) {
                    autoComplete.index[key][field].class.remove('active');
                }
            }
        });

        inputAddSublayer.on('change', function (value) {
            if (lastAutoCompleteText === value)
                return;

            lastAutoCompleteText = value;
            if (value) {
                inputAddSublayer.class.add('not-empty');

                var items = [];
                for (var key in autoComplete.index) {
                    if (autoComplete.index[key].transparent) {
                        items.push([autoComplete.index[key].transparent.item.text, {key: key, transparent: true}]);
                        autoComplete.index[key].transparent.item.class.remove('active');
                    }
                    if (autoComplete.index[key].opaque) {
                        items.push([autoComplete.index[key].opaque.item.text, {key: key, transparent: false}]);
                        autoComplete.index[key].opaque.item.class.remove('active');
                    }
                }

                var search = editor.call('search:items', items, value) ;
                var searchIndex = {};
                for (var i = 0; i < search.length; i++) {
                    if (! searchIndex[search[i].key]) {
                        searchIndex[search[i].key] = {};
                    }
                    searchIndex[search[i].key][search[i].transparent ? 'transparent' : 'opaque'] = true;
                }

                for (var key in autoComplete.index) {
                    if (autoComplete.index[key].transparent) {
                        autoComplete.index[key].transparent.item.hidden = !searchIndex[key] || !searchIndex[key].transparent;
                    }

                    if (autoComplete.index[key].opaque) {
                        autoComplete.index[key].opaque.item.hidden = !searchIndex[key] || !searchIndex[key].opaque;
                    }
                }
            } else {
                inputAddSublayer.class.remove('not-empty');

                for (var key in autoComplete.index) {
                    if (autoComplete.index[key].transparent) {
                        autoComplete.index[key].transparent.item.hidden = false;
                        autoComplete.index[key].transparent.item.class.remove('active');
                    }

                    if (autoComplete.index[key].opaque) {
                        autoComplete.index[key].opaque.item.hidden = false;
                        autoComplete.index[key].opaque.item.class.remove('active');
                    }
                }
            }

            focusFirstAutocomplete();
        });

        var focusFirstAutocomplete = function() {
            var first = autoComplete.innerElement.firstChild;
            var found = false;
            while(! found && first) {
                if (first.ui && ! first.ui.hidden) {
                    found = true;
                    break;
                }
                first = first.nextSibling;
            }

            if (found && first && first.ui) {
                highlightedAutoCompleteItem = first.ui;
                highlightedAutoCompleteItem.class.add('active');
            } else {
                highlightedAutoCompleteItem = null;
            }
        };

        var onInputKeyDown = function (evt) {
            var candidate, found;
            var findFirst = false;
            var direction = '';

            if (evt.keyCode === 40 || (evt.keyCode === 9 && ! evt.shiftKey)) {
                // down
                if (highlightedAutoCompleteItem) {
                    direction = 'nextSibling';
                } else {
                    findFirst = true;
                }

                evt.preventDefault();
            } else if (evt.keyCode === 38 || (evt.keyCode === 9 && evt.shiftKey)) {
                // up
                if (highlightedAutoCompleteItem) {
                    direction = 'previousSibling';
                } else {
                    findFirst = true;
                }

                evt.preventDefault();
            } else if (evt.keyCode === 13) {
                // enter
                if (highlightedAutoCompleteItem) {
                    addSublayer(highlightedAutoCompleteItem.layerKey, highlightedAutoCompleteItem.transparent);
                    inputAddSublayer.value = '';
                    inputAddSublayer.elementInput.blur();
                } else {
                    findFirst = true;
                }
            }

            if (findFirst) {
                // try finding first available option
                candidate = autoComplete.innerElement.firstChild;
                found = false;

                while(! found && candidate) {
                    if (candidate.ui && ! candidate.ui.hidden) {
                        found = true;
                        break;
                    }
                    candidate = candidate.nextSibling;
                }

                if (found && candidate && candidate.ui) {
                    highlightedAutoCompleteItem = candidate.ui;
                    highlightedAutoCompleteItem.class.add('active');
                }

                if (evt.keyCode === 13) {
                    if (highlightedAutoCompleteItem) {
                        addSublayer(highlightedAutoCompleteItem.layerKey, highlightedAutoCompleteItem.transparent);
                    }

                    inputAddSublayer.elementInput.blur();
                }
            } else if (direction) {
                // try finding next or previous available option
                candidate = highlightedAutoCompleteItem.element[direction];
                found = false;

                while(! found && candidate) {
                    if (candidate.ui && ! candidate.ui.hidden) {
                        found = true;
                        break;
                    }
                    candidate = candidate[direction];
                }
                if (candidate && candidate.ui) {
                    highlightedAutoCompleteItem.class.remove('active');
                    highlightedAutoCompleteItem = candidate.ui;
                    highlightedAutoCompleteItem.class.add('active');
                }
            }
        };

        inputAddSublayer.elementInput.addEventListener('keydown', onInputKeyDown);
        inputAddSublayer.once('destroy', function () {
            inputAddSublayer.elementInput.removeEventListener('keydown', onInputKeyDown);
        });

        var autoComplete = new ui.List();
        autoComplete.empty = true;
        autoComplete.hidden = true;
        autoComplete.index = {};
        panelAddSublayer.append(autoComplete);

        var addAutoCompleteItem = function (layerKey, transparent) {
            if (autoComplete.index[layerKey] && autoComplete.index[layerKey][transparent ? 'transparent' : 'opaque']) {
                return;
            }

            var item = new ui.ListItem({
                text: projectSettings.get('layers.' + layerKey + '.name') + (transparent ? ' Transparent' : ' Opaque')
            });
            item.element.addEventListener('mousedown', function () {
                addSublayer(layerKey, transparent);
            });
            item.layerKey = layerKey;
            item.transparent = transparent;

            autoComplete.append(item);

            if (! autoComplete.index[layerKey]) {
                autoComplete.index[layerKey] = {};
            }

            var entry = {
                item: item
            };

            // listen to name change to update the item's text
            entry.evtName = projectSettings.on('layers.' + layerKey + '.name:set', function (value) {
                item.text = value + (transparent ? ' Transparent' : ' Opaque');
            });

            autoComplete.index[layerKey][transparent ? 'transparent' : 'opaque'] = entry;

            return item;
        };

        var removeAutoCompleteItem = function (layerKey, transparent) {
            if (! autoComplete.index[layerKey]) return;
            var field = transparent ? 'transparent' : 'opaque';
            var entry = autoComplete.index[layerKey][field];
            if (! entry) return;

            entry.item.destroy();
            entry.evtName.unbind();

            delete autoComplete.index[layerKey][field];
            if (! Object.keys(autoComplete.index[layerKey]).length) {
                delete autoComplete.index[layerKey];
            }
        };

        var panelSublayers = editor.call('attributes:addPanel', {
            parent: panelRenderOrder
        });
        panelSublayers.class.add('sublayers', 'component');

        var createSublayerPanel = function (key, transparent, enabled, index) {
            var panelEvents = [];

            var panelSublayer = new ui.Panel();
            panelSublayer.class.add('sublayer');
            if (transparent)
                panelSublayer.class.add('transparent');

            if (! indexSublayerPanels[key]) {
                indexSublayerPanels[key] = {
                    opaque: null,
                    transparent: null
                };
            }

            if (transparent) {
                indexSublayerPanels[key].transparent = panelSublayer;
            } else {
                indexSublayerPanels[key].opaque = panelSublayer;
            }

            var fieldHandle = document.createElement('div');
            fieldHandle.classList.add('handle');
            panelSublayer.append(fieldHandle);

            var onDragStart = function (evt) {
                draggedSublayer = {
                    key: key,
                    transparent: transparent,
                    index: Array.prototype.indexOf.call(panelSublayers.innerElement.childNodes, panelSublayer.element)
                };

                panel.class.add('dragged');
                panelSublayer.class.add('dragged');

                window.addEventListener('mouseup', onDragEnd);
                panelSublayers.innerElement.addEventListener('mousemove', onDragMove);

                overlay.hidden = false;
            };

            fieldHandle.addEventListener('mousedown', onDragStart);

            // name
            var fieldName = new ui.Label({
                text: projectSettings.get('layers.' + key + '.name')
            });
            fieldName.class.add('name');
            panelSublayer.append(fieldName);

            // transparent
            var fieldTransparent = new ui.Label({
                text: transparent ? 'Transparent' : 'Opaque'
            });
            fieldTransparent.class.add('transparent');
            panelSublayer.append(fieldTransparent);

            // enabled
            var fieldEnabled = new ui.Checkbox();
            fieldEnabled.class.add('tick');
            panelSublayer.append(fieldEnabled);
            fieldEnabled.value = enabled;

            fieldEnabled.on('change', function (value) {
                var order = projectSettings.get('layerOrder');
                for (var i = 0; i < order.length; i++) {
                    if (order[i].layer === key && order[i].transparent === transparent) {
                        projectSettings.set('layerOrder.' + i + '.enabled', value);
                    }
                }
            });

            // remove
            var btnRemove = new ui.Button();
            btnRemove.class.add('remove');
            panelSublayer.append(btnRemove);

            // Remove sublayer
            btnRemove.on('click', function () {
                removeSublayer(key, transparent);
            });

            panelSublayer.on('destroy', function () {
                fieldHandle.removeEventListener('mousedown', onDragStart);
                if (panelSublayer.class.contains('dragged')) {
                    panelSublayers.innerElement.removeEventListener('mousemove', onDragMove);
                    window.removeEventListener('mouseup', onDragEnd);
                }

                for (var i = 0, len = panelEvents.length; i<len; i++) {
                    panelEvents[i].unbind();
                }
                panelEvents.length = 0;
            });

            var before = null;

            if (typeof(index) === 'number')
                before = panelSublayers.innerElement.childNodes[index];

            if (before) {
                panelSublayers.appendBefore(panelSublayer, before);
            } else {
                panelSublayers.append(panelSublayer);
            }
        };

        // Move dragged sublayer
        var onDragMove = function (evt) {
            var draggedPanel = indexSublayerPanels[draggedSublayer.key][draggedSublayer.transparent ? 'transparent' : 'opaque'];
            var rect = panelSublayers.innerElement.getBoundingClientRect();
            var height = draggedPanel.element.offsetHeight;
            var top = evt.clientY - rect.top - 6;
            var overPanelIndex = Math.floor(top / height);
            var overPanel = panelSublayers.innerElement.childNodes[overPanelIndex];

            if (overPanel && overPanel.ui !== draggedPanel) {
                panelSublayers.remove(draggedPanel);
                panelSublayers.appendBefore(draggedPanel, panelSublayers.innerElement.childNodes[overPanelIndex]);
            }
        };

        // End sublayer drag
        var onDragEnd = function (evt) {
            var draggedPanel = indexSublayerPanels[draggedSublayer.key][draggedSublayer.transparent ? 'transparent' : 'opaque'];
            if (draggedPanel) {
                draggedPanel.class.remove('dragged');
            }
            panel.class.remove('dragged');
            window.removeEventListener('mouseup', onDragEnd);
            panelSublayers.innerElement.removeEventListener('mousemove', onDragMove);

            overlay.hidden = true;

            var oldIndex = draggedSublayer.index;
            var newIndex = Array.prototype.indexOf.call(panelSublayers.innerElement.childNodes, draggedPanel.element);

            if (newIndex !== oldIndex) {
                // NOTE: If a remote user moves the same indices then undoing this move
                // will move the wrong items.
                projectSettings.move('layerOrder', oldIndex, newIndex);
            }

            draggedSublayer = null;

        };

        // Create sublayer panels
        var init = function () {
            var layers = projectSettings.get('layers');
            for (var key in layers) {
                createLayerPanel(key, layers[key]);
            }

            var index = {};

            var order = projectSettings.get('layerOrder');
            for (var i = 0, len = order.length; i<len; i++) {
                var layer = layers[order[i].layer];
                if (layer) {
                    var transparent = order[i].transparent;
                    createSublayerPanel(order[i].layer, transparent, order[i].enabled);
                    if (! index[order[i].layer]) {
                        index[order[i].layer] = {};
                    }

                    index[order[i].layer][transparent ? 'transparent' : 'opaque'] = true;
                }
            }

            // Add missing items to autoComplete
            for (var key in layers) {
                if (! index[key]) {
                    addAutoCompleteItem(key, false);
                    addAutoCompleteItem(key, true);
                } else if (! index[key].opaque) {
                    addAutoCompleteItem(key, false);
                } else if (! index[key].transparent) {
                    addAutoCompleteItem(key, true);
                }
            }
        };

        init();

        // On layer removed
        events.push(projectSettings.on('*:unset', function (path) {
            var match = path.match(/^layers\.(\d+)$/);
            if (! match) return;

            var key = match[1];
            if (indexLayerPanels[key]) {
                indexLayerPanels[key].destroy();
                delete indexLayerPanels[key];
            }

            removeAutoCompleteItem(key, true);
            removeAutoCompleteItem(key, false);
        }));

        // On layer added
        events.push(projectSettings.on('*:set', function (path) {
            var match = path.match(/^layers\.(\d+)$/);
            if (! match) return;

            var key = match[1];
            if (indexLayerPanels[key]) {
                indexLayerPanels[key].destroy();
            }

            var layers = projectSettings.get('layers');
            var index = Object.keys(layers).indexOf(key);

            createLayerPanel(key, layers[key], index);

            addAutoCompleteItem(key, false);
            addAutoCompleteItem(key, true);
        }));

        // On sublayer removed
        events.push(projectSettings.on('layerOrder:remove', function (value, index) {
            var key = value.get('layer');
            var transparent = value.get('transparent');
            var field = transparent ? 'transparent' : 'opaque';
            var otherField = transparent ? 'opaque' : 'transparent';

            if (indexSublayerPanels[key] && indexSublayerPanels[key][field]) {
                indexSublayerPanels[key][field].destroy();
                indexSublayerPanels[key][field] = null;
                if (! indexSublayerPanels[key][otherField]) {
                    delete indexSublayerPanels[key];
                }
            }

            addAutoCompleteItem(key, transparent);
        }));

        // on sublayer added
        events.push(projectSettings.on('layerOrder:insert', function (value, index, remote) {
            var key = value.get('layer');
            var transparent = value.get('transparent');
            var field = transparent ? 'transparent' : 'opaque';
            var enabled = value.get('enabled');
            if (! indexSublayerPanels[key] || ! indexSublayerPanels[key][field]) {
                var name = projectSettings.get('layers.' + key + '.name');
                createSublayerPanel(key, transparent, enabled, index);
            }

            removeAutoCompleteItem(key, transparent);
        }));

        // on sublayer moved
        events.push(projectSettings.on('layerOrder:move', function (value, indNew, indOld) {
            var key = value.get('layer');
            var transparent = value.get('transparent');

            if (! indexSublayerPanels[key]) return;

            var movedPanel = indexSublayerPanels[key][transparent ? 'transparent' : 'opaque'];
            if (! movedPanel) return;

            var index = Array.prototype.indexOf.call(panelSublayers.innerElement.childNodes, movedPanel.element);
            if (index === indOld) {
                panelSublayers.remove(movedPanel);
                panelSublayers.appendBefore(movedPanel, panelSublayers.innerElement.childNodes[indNew]);
            }
        }));

        // Clean up
        panel.once('destroy', function() {
            for (var i = 0, len = events.length; i<len; i++) {
                events[i].unbind();
            }
            events = null;

            for (var key in autoComplete.index) {
                if (autoComplete.index[key].transparent) {
                    autoComplete.index[key].transparent.evtName.unbind();
                }

                if (autoComplete.index[key].opaque) {
                    autoComplete.index[key].opaque.evtName.unbind();
                }
            }

            autoComplete.index = {};
        });
    });
});
