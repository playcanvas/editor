editor.once('load', function () {
    'use strict';

    var legacyScripts = editor.call('settings:project').get('useLegacyScripts');
    var root = editor.call('layout.right');

    // get the right path from args
    var pathAt = function (args, index) {
        return args.paths ? args.paths[index] : args.path;
    };

    var historyState = function (item, state) {
        if (item.history !== undefined) {
            if (typeof(item.history) === 'boolean') {
                item.history = state;
            } else {
                item.history.enabled = state;
            }
        } else {
            if (item._parent && item._parent.history !== undefined) {
                item._parent.history.enabled = state;
            }
        }
    };

    /**
     * Creates an Asset List widget
     * @param {Object} args Widget arguments
     * @param {Observer[]} args.link The observers we are editing
     * @param {String} [args.type] The asset type that is selectible from the asset list
     * @param {Function} [args.filterFn] A custom function that filters assets that can be dragged on the list. The function
     * takes the asset as its only argument.
     */
    editor.method('attributes:addAssetsList', function (args) {
        var link = args.link;
        var assetType = args.type;
        var assetFilterFn = args.filterFn;
        var panel = args.panel;
        var events = [];
        // index list items by asset id
        var assetIndex = {};

        var panelWidget = new ui.Panel();
        panelWidget.class.add('asset-list');

        var isSelectingAssets = false;
        var currentSelection = null;

        // button that enables selection mode
        var btnSelectionMode = new ui.Button({
            text: 'Add Assets'
        });
        btnSelectionMode.class.add('selection-mode');
        panelWidget.append(btnSelectionMode);

        // panel for buttons
        var panelButtons = new ui.Panel();
        panelButtons.class.add('buttons');
        panelButtons.flex = true;
        panelButtons.hidden = true;

        // label
        var labelAdd = new ui.Label({
            text: 'Add Assets'
        });
        panelButtons.append(labelAdd);

        // add button
        var btnAdd = new ui.Button({
            text: 'ADD SELECTION'
        });
        btnAdd.disabled = true;
        btnAdd.class.add('add-assets');

        panelButtons.append(btnAdd);

        // done button
        var btnDone = new ui.Button({
            text: 'DONE'
        });
        btnDone.class.add('done');
        panelButtons.append(btnDone);

        panelWidget.append(panelButtons);

        btnSelectionMode.on('click', function () {
            isSelectingAssets = true;
            panelButtons.hidden = false;
            btnSelectionMode.hidden = true;

            fieldAssets.parent.style.zIndex = 102;
            dropRef.disabled = true;

            // asset picker
            editor.call('picker:asset', {
                type: assetType,
                multi: true
            });

            // on pick
            var evtPick = editor.on('picker:assets', function (assets) {
                currentSelection = assets.filter(function (asset) {
                    if (assetFilterFn) {
                        return assetFilterFn(asset);
                    }

                    if (legacyScripts && asset.get('type') === 'script') {
                        return false;
                    }

                    return true;
                }).map(function (asset) {
                    return parseInt(asset.get('id'), 10);
                });

                btnAdd.disabled = !currentSelection.length;
            });

            editor.once('picker:asset:close', function () {
                currentSelection = null;
                isSelectingAssets = false;
                panelButtons.hidden = true;
                btnSelectionMode.hidden = false;
                btnAdd.disabled = true;
                fieldAssets.parent.style.zIndex = '';
                dropRef.disabled = !panel.enabled;

                if (evtPick) {
                    evtPick.unbind();
                    evtPick = null;
                }
            });
        });

        btnDone.on('click', function () {
            editor.call('picker:asset:close');
        });

        // search field
        var fieldFilter = new ui.TextField();
        fieldFilter.hidden = true;
        fieldFilter.elementInput.setAttribute('placeholder', 'Type to filter');
        fieldFilter.keyChange = true;
        fieldFilter.renderChanges = false;
        panelWidget.append(fieldFilter);

        // assets
        var fieldAssets;
        var fieldAssetsList = new ui.List();
        fieldAssetsList.class.add('empty');
        fieldAssetsList.flexGrow = 1;

        fieldAssetsList.on('select', function (item) {
            if (!item.asset) return;
            editor.call('selector:set', 'asset', [item.asset]);
        });

        // Adds asset ids to the list
        var addAssets = function (assetIds) {
            var records = [];

            for (var i = 0; i < link.length; i++) {
                var path = pathAt(args, i);

                for (var j = 0; j < assetIds.length; j++) {
                    var assetId = assetIds[j];

                    // check if already in list
                    if (link[i].get(path).indexOf(assetId) !== -1)
                        continue;

                    records.push({
                        get: link[i].history !== undefined ? link[i].history._getItemFn : null,
                        item: link[i],
                        path: path,
                        value: assetId
                    });

                    historyState(link[i], false);
                    link[i].insert(path, assetId);
                    historyState(link[i], true);
                }
            }

            editor.call('history:add', {
                name: pathAt(args, 0),
                undo: function () {
                    for (var i = 0; i < records.length; i++) {
                        var item;
                        if (records[i].get) {
                            item = records[i].get();
                            if (!item) continue;
                        } else {
                            item = records[i].item;
                        }

                        historyState(item, false);
                        item.removeValue(records[i].path, records[i].value);
                        historyState(item, true);
                    }
                },
                redo: function () {
                    for (var i = 0; i < records.length; i++) {
                        var item;
                        if (records[i].get) {
                            item = records[i].get();
                            if (!item) continue;
                        } else {
                            item = records[i].item;
                        }

                        historyState(item, false);
                        item.insert(records[i].path, records[i].value);
                        historyState(item, true);
                    }
                }
            });
        };

        // Removes asset id from the list
        var removeAsset = function (assetId) {
            var records = [];

            for (var i = 0; i < link.length; i++) {
                var path = pathAt(args, i);
                var ind = link[i].get(path).indexOf(assetId);
                if (ind === -1)
                    continue;

                records.push({
                    get: link[i].history !== undefined ? link[i].history._getItemFn : null,
                    item: link[i],
                    path: path,
                    value: assetId,
                    ind: ind
                });

                historyState(link[i], false);
                link[i].removeValue(path, assetId);
                historyState(link[i], true);
            }

            editor.call('history:add', {
                name: pathAt(args, 0),
                undo: function () {
                    for (var i = 0; i < records.length; i++) {
                        var item;
                        if (records[i].get) {
                            item = records[i].get();
                            if (!item) continue;
                        } else {
                            item = records[i].item;
                        }

                        historyState(item, false);
                        item.insert(records[i].path, records[i].value, records[i].ind);
                        historyState(item, true);
                    }
                },
                redo: function () {
                    for (var i = 0; i < records.length; i++) {
                        var item;
                        if (records[i].get) {
                            item = records[i].get();
                            if (!item) continue;
                        } else {
                            item = records[i].item;
                        }

                        historyState(item, false);
                        item.removeValue(records[i].path, records[i].value);
                        historyState(item, true);
                    }
                }
            });
        };

        // add asset list item to the list
        var addAssetListItem = function (assetId, after) {
            assetId = parseInt(assetId, 10);

            var item = assetIndex[assetId];
            if (item) {
                item.count++;
                item.text = (item.count === link.length ? '' : '* ') + item._assetText;
                return;
            }

            var asset = editor.call('assets:get', assetId);
            var text = assetId;
            if (asset && asset.get('name'))
                text = asset.get('name');

            item = new ui.ListItem({
                text: (link.length === 1) ? text : '* ' + text
            });
            item.class.add('type-' + asset.get('type'));
            item.count = 1;
            item.asset = asset;
            item._assetText = text;

            if (after) {
                fieldAssetsList.appendAfter(item, after);
            } else {
                fieldAssetsList.append(item);
            }

            fieldAssetsList.class.remove('empty');
            fieldFilter.hidden = false;

            assetIndex[assetId] = item;

            // remove button
            var btnRemove = new ui.Button();
            btnRemove.class.add('remove');
            btnRemove.on('click', function () {
                removeAsset(assetId);

            });
            btnRemove.parent = item;
            item.element.appendChild(btnRemove.element);

            item.once('destroy', function () {
                delete assetIndex[assetId];
            });
        };

        // Removes list item for the specified asset id
        var removeAssetListItem = function (assetId) {
            var item = assetIndex[assetId];

            if (!item)
                return;

            item.count--;

            if (item.count === 0) {
                item.destroy();
                fieldAssets.emit('remove', item);

                if (!fieldAssetsList.element.children.length) {
                    fieldAssetsList.class.add('empty');
                    fieldFilter.hidden = true;
                }

            } else {
                item.text = (item.count === link.length ? '' : '* ') + item._assetText;
            }
        };

        // drop
        var dropRef = editor.call('drop:target', {
            ref: panelWidget.element,
            type: 'asset.' + assetType,
            filter: function (type, data) {
                // type
                if ((assetType && assetType !== '*' && type !== 'asset.' + assetType) || !type.startsWith('asset') || editor.call('assets:get', parseInt(data.id, 10)).get('source'))
                    return false;

                // if a custom filter function has
                // been provided then use it now
                if (assetFilterFn) {
                    if (!assetFilterFn(editor.call('assets:get', data.id))) {
                        return false;
                    }
                }

                // overflowed
                var rectA = root.innerElement.getBoundingClientRect();
                var rectB = panelWidget.element.getBoundingClientRect();
                if (rectB.top <= rectA.top || rectB.bottom >= rectA.bottom)
                    return false;

                // already added
                var id = parseInt(data.id, 10);
                for (var i = 0; i < link.length; i++) {
                    if (link[i].get(pathAt(args, i)).indexOf(id) === -1)
                        return true;
                }

                return false;
            },
            drop: function (type, data) {
                if ((assetType && assetType !== '*' && type !== 'asset.' + assetType) || !type.startsWith('asset') || editor.call('assets:get', parseInt(data.id, 10)).get('source'))
                    return;

                var assetId = parseInt(data.id, 10);
                addAssets([assetId]);
            }
        });
        dropRef.disabled = panel.disabled;
        panel.on('enable', function () {
            if (!isSelectingAssets)
                dropRef.disabled = false;
        });
        panel.on('disable', function () {
            dropRef.disabled = true;

            // clear list item
            var items = fieldAssetsList.element.children;
            var i = items.length;
            while (i-- > 1) {
                if (!items[i].ui || !(items[i].ui instanceof ui.ListItem))
                    continue;

                items[i].ui.destroy();
            }

            fieldAssetsList.class.add('empty');
            fieldFilter.hidden = true;

            assetIndex = {};
        });
        fieldAssetsList.on('destroy', function () {
            dropRef.unregister();
        });

        panelWidget.append(fieldAssetsList);

        fieldAssets = editor.call('attributes:addField', {
            parent: panel,
            name: args.name || '',
            type: 'element',
            element: panelWidget,
            reference: args.reference
        });
        fieldAssets.class.add('assets');

        // reference assets
        editor.call('attributes:reference:attach', assetType + ':assets', fieldAssets.parent.innerElement.firstChild.ui);

        // on adding new asset
        btnAdd.on('click', function () {
            if (isSelectingAssets) {
                if (currentSelection) {
                    addAssets(currentSelection);
                    currentSelection = null;
                }
            }
        });

        var createInsertHandler = function (index) {
            var path = pathAt(args, index);
            return link[index].on(path + ':insert', function (assetId, ind) {
                var before;
                if (ind === 0) {
                    before = null;
                } else {
                    before = assetIndex[this.get(path + '.' + ind)];
                }
                addAssetListItem(assetId, before);
            });
        };

        // list
        for (var i = 0; i < link.length; i++) {
            var assets = link[i].get(pathAt(args, i));
            if (assets) {
                for (var a = 0; a < assets.length; a++)
                    addAssetListItem(assets[a]);
            }

            events.push(link[i].on(pathAt(args, i) + ':set', function (assets, assetsOld) {
                var a, id;

                if (!(assets instanceof Array))
                    return;

                if (!(assetsOld instanceof Array))
                    assetsOld = [];

                var assetIds = {};
                for (a = 0; a < assets.length; a++)
                    assetIds[assets[a]] = true;

                var assetOldIds = {};
                for (a = 0; a < assetsOld.length; a++)
                    assetOldIds[assetsOld[a]] = true;

                // remove
                for (id in assetOldIds) {
                    if (assetIds[id])
                        continue;

                    removeAssetListItem(id);
                }

                // add
                for (id in assetIds)
                    addAssetListItem(id);
            }));

            events.push(createInsertHandler(i));

            events.push(link[i].on(pathAt(args, i) + ':remove', removeAssetListItem));
        }

        var filterAssets = function (filter) {
            var id;

            if (! filter) {
                for (id in assetIndex) {
                    assetIndex[id].hidden = false;
                }
                return;
            }

            var items = [];
            for (id in assetIndex) {
                items.push([assetIndex[id].text, parseInt(id, 10)]);
            }
            var results = editor.call('search:items', items, filter);
            for (id in assetIndex) {
                if (results.indexOf(parseInt(id, 10)) === -1) {
                    assetIndex[id].hidden = true;
                } else {
                    assetIndex[id].hidden = false;
                }
            }
        };

        fieldFilter.on('change', filterAssets);

        fieldAssetsList.once('destroy', function () {
            for (var i = 0; i < events.length; i++) {
                events[i].unbind();
            }

            events.length = 0;
        });

        return fieldAssetsList;
    });
});
