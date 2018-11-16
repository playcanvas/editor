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

    editor.method('attributes:addAssetsList', function (args) {
        var link = args.link;
        var title = args.title;
        var assetType = args.type;
        var panel = args.panel;
        var events = [];
        var itemAdd;
        // index list items by asset id
        var assetIndex = {};

        // assets
        var fieldAssetsList = new ui.List();
        fieldAssetsList.flexGrow = 1;

        fieldAssetsList.on('select', function (item) {
            if (item === itemAdd || !item.asset)
                return;

            editor.call('selector:set', 'asset', [item.asset]);
        });

        // drop
        var dropRef = editor.call('drop:target', {
            ref: fieldAssetsList.element,
            type: 'asset.' + assetType,
            filter: function (type, data) {
                // type
                if ((assetType && assetType !== '*' && type !== 'asset.' + assetType) || !type.startsWith('asset') || editor.call('assets:get', parseInt(data.id, 10)).get('source'))
                    return false;

                // overflowed
                var rectA = root.innerElement.getBoundingClientRect();
                var rectB = fieldAssetsList.element.getBoundingClientRect();
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

                var records = [];

                var id = parseInt(data.id, 10);

                for (var i = 0; i < link.length; i++) {
                    var path = pathAt(args, i);
                    if (link[i].get(path).indexOf(id) !== -1)
                        continue;

                    records.push({
                        get: link[i].history !== undefined ? link[i].history._getItemFn : null,
                        item: link[i],
                        path: path,
                        value: id
                    });

                    historyState(link[i], false);
                    link[i].insert(path, id);
                    historyState(link[i], true);
                }

                editor.call('history:add', {
                    name: pathAt(args, 0),
                    undo: function () {
                        for (var i = 0; i < records.length; i++) {
                            var item;
                            if (records[i].get) {
                                item = records[i].get();
                                if (!item)
                                    continue;
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
                                if (!item)
                                    continue;
                            } else {
                                item = records[i].item;
                            }

                            historyState(item, false);
                            item.insert(records[i].path, records[i].value);
                            historyState(item, true);
                        }
                    }
                });
            }
        });
        dropRef.disabled = panel.disabled;
        panel.on('enable', function () {
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

            assetIndex = {};
        });
        fieldAssetsList.on('destroy', function () {
            dropRef.unregister();
        });

        var fieldAssets = editor.call('attributes:addField', {
            parent: panel,
            name: args.name || 'Assets',
            type: 'element',
            element: fieldAssetsList,
            reference: args.reference
        });
        fieldAssets.class.add('assets');

        // reference assets
        editor.call('attributes:reference:attach', assetType + ':assets', fieldAssets.parent.innerElement.firstChild.ui);

        // assets list
        itemAdd = new ui.ListItem({
            text: 'Add ' + title
        });
        itemAdd.class.add('add-asset');
        fieldAssetsList.append(itemAdd);

        // add asset icon
        var iconAdd = document.createElement('span');
        iconAdd.classList.add('icon');
        itemAdd.element.appendChild(iconAdd);

        // add asset
        var addAsset = function (assetId, after) {
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
            item.count = 1;
            item.asset = asset;
            item._assetText = text;

            if (after) {
                fieldAssetsList.appendAfter(item, after);
            } else {
                fieldAssetsList.append(item);
            }

            assetIndex[assetId] = item;

            // remove button
            var btnRemove = new ui.Button();
            btnRemove.class.add('remove');
            btnRemove.on('click', function () {
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
                                if (!item)
                                    continue;
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
                                if (!item)
                                    continue;
                            } else {
                                item = records[i].item;
                            }

                            historyState(item, false);
                            item.removeValue(records[i].path, records[i].value);
                            historyState(item, true);
                        }
                    }
                });
            });
            btnRemove.parent = item;
            item.element.appendChild(btnRemove.element);

            item.once('destroy', function () {
                delete assetIndex[assetId];
            });
        };

        var removeAsset = function (assetId) {
            var item = assetIndex[assetId];

            if (!item)
                return;

            item.count--;

            if (item.count === 0) {
                item.destroy();
                fieldAssets.emit('remove', item);
            } else {
                item.text = (item.count === link.length ? '' : '* ') + item._assetText;
            }
        };

        // on adding new asset
        itemAdd.on('click', function () {
            // call picker
            editor.call('picker:asset', assetType, null);

            // on pick
            var evtPick = editor.once('picker:asset', function (asset) {
                if (legacyScripts && asset.get('type') === 'script')
                    return;

                var records = [];
                var assetId = parseInt(asset.get('id'), 10);

                for (var i = 0; i < link.length; i++) {
                    var path = pathAt(args, i);

                    // already in list
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
                    evtPick = null;
                }

                editor.call('history:add', {
                    name: pathAt(args, 0),
                    undo: function () {
                        for (var i = 0; i < records.length; i++) {
                            var item;
                            if (records[i].get) {
                                item = records[i].get();
                                if (!item)
                                    continue;
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
                                if (!item)
                                    continue;
                            } else {
                                item = records[i].item;
                            }

                            historyState(item, false);
                            item.insert(records[i].path, records[i].value);
                            historyState(item, true);
                        }
                    }
                });
            });

            editor.once('picker:asset:close', function () {
                if (evtPick) {
                    evtPick.unbind();
                    evtPick = null;
                }
            });
        });

        var createInsertHandler = function (index) {
            var path = pathAt(args, index);
            return link[index].on(path + ':insert', function (assetId, ind) {
                var before;
                if (ind === 0) {
                    before = itemAdd;
                } else {
                    before = assetIndex[this.get(path + '.' + ind)];
                }
                addAsset(assetId, before);
            });
        };

        // list
        for (var i = 0; i < link.length; i++) {
            var assets = link[i].get(pathAt(args, i));
            if (assets) {
                for (var a = 0; a < assets.length; a++)
                    addAsset(assets[a]);
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

                    removeAsset(id);
                }

                // add
                for (id in assetIds)
                    addAsset(id);
            }));

            events.push(createInsertHandler(i));

            events.push(link[i].on(pathAt(args, i) + ':remove', removeAsset));
        }

        fieldAssetsList.once('destroy', function () {
            for (var i = 0; i < events.length; i++)
                events[i].unbind();
        });

        return fieldAssetsList;
    });
});
