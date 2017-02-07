editor.once('load', function () {
    'use strict';

    var panel = editor.call('layout.left');

    var isTreeEditable = function () {
        return  editor.call('permissions:write') &&
                editor.call('realtime:isConnected') &&
                ! editor.call('errors:hasRealtime');
    };

    // files tree
    var tree = new ui.Tree();
    tree.allowRenaming = false;
    tree.draggable = false;
    tree.reordering = false;
    tree.class.add('files');
    tree.hidden = true;
    panel.append(tree);

    // loading progress bar
    var progressBar = new ui.Progress();
    panel.append(progressBar);

    editor.on('assets:load:progress', function (progress) {
        progressBar.hidden = progress >= 1;
        progressBar.progress = progress;
    });

    var refreshTreePermissions = function () {
        tree.allowRenaming = isTreeEditable();
        tree.draggable = isTreeEditable();
    }

    refreshTreePermissions();

    editor.on('permissions:writeState', refreshTreePermissions);
    editor.on('realtime:authenticated', refreshTreePermissions);
    editor.on('realtime:disconnected', refreshTreePermissions);

    var resizeQueued = false;
    var resizeTree = function() {
        resizeQueued = false;
        tree.element.style.width = '';
        tree.element.style.width = (panel.innerElement.scrollWidth - 5) + 'px';
    };
    var resizeQueue = function() {
        if (resizeQueued) return;
        resizeQueued = true;
        requestAnimationFrame(resizeTree);
    };
    panel.on('resize', resizeQueue);
    tree.on('open', resizeQueue);
    tree.on('close', resizeQueue);
    setInterval(resizeQueue, 1000);

    // tree root
    var treeRoot = new ui.TreeItem({
        text: '/'
    });
    treeRoot.class.add('type-folder');
    tree.append(treeRoot);
    treeRoot.open = true;
    treeRoot.on('select', function() {
        this.selected = false;
    });
    editor.call('files:contextmenu:attach', treeRoot);

    // contains <asset id, tree item>
    var itemIndex = {};

    // contains <folder id, nodes that wait for folder id to be added>
    var waitingParent = {};

    // append item to parent in alphabetical order
    // if item is a folder also append any other items
    // that were waiting for this folder to be added
    var append = function (item, parent) {
        appendAlphabetically(item, parent);

        var id = item._assetId;
        var items = waitingParent[id];
        if (items) {
            delete waitingParent[id];

            for (var i = 0; i < items.length; i++) {
                append(items[i], item);
            }
        }
    };

    // append item to parent keeping order alphabetical
    var appendAlphabetically = function (item, parent) {
        var children = Array.prototype.slice.call(parent.element.childNodes, 1);
        if (! children.length)
            return parent.append(item);

        var text = item.text.toLowerCase();
        var low = 0;
        var hi = children.length - 1;
        var mid, node, nodeText;

        var done = false;

        while (low <= hi) {
            mid = Math.floor((low + hi) / 2);
            node = children[mid].ui;
            nodeText = node.text.toLowerCase();
            if (text === nodeText) {
                break;
            } else if (text < nodeText) {
                hi = mid - 1;
            } else if (text > nodeText) {
                low = mid + 1;
            }
        }

        if (text < nodeText) {
            parent.appendBefore(item, node);
        } else {
            parent.appendAfter(item, node);
        }
    };

    // Create tree nodes for each asset
    var addAsset = function (asset) {
        var id = asset.get('id');

        var item = new ui.TreeItem({
            text: asset.get('name'),
            allowDrop: asset.get('type') === 'folder'
        });
        item.class.add('type-' + asset.get('type'));

        editor.call('files:contextmenu:attach', item);

        item._assetId = id;

        if (itemIndex[id]) {
            itemIndex[id].destroy();
        }

        itemIndex[id] = item;

        var addItem = function (item, path) {
            var length = path.length;
            if (! length) {
                append(item, treeRoot);
            } else {
                var folder = path[length - 1];
                if (itemIndex[folder]) {
                    append(item, itemIndex[folder]);
                } else {
                    waitingParent[folder] = waitingParent[folder] || [];
                    waitingParent[folder].push(item);
                }
            }
        }

        addItem(item, asset.get('path'));

        // handle path changes
        asset.on('path:set', function (path, oldPath) {
            // remove item from old folder
            if (item.parent) {
                item.parent.remove(item);
            } else if (oldPath && oldPath.length) {
                var oldFolder = oldPath[oldPath.length - 1];
                var index = waitingParent[oldFolder] ? waitingParent[oldFolder].indexOf(item) : -1;
                if (index !== -1) {
                    waitingParent[oldFolder].splice(index, 1);
                }
            }

            // append item to new folder
            addItem(item, path);
        });

        // handle name changes (need to keep alphabetical order)
        asset.on('name:set', function (name) {
            // remove and re-insert item
            var parent = item.parent;
            if (! parent) return;

            parent.remove(item);
            item.text = name;
            appendAlphabetically(item, parent);
        });

        // rename item
        item.on('rename', function (name) {
            asset.set('name', name);
        });
    };

    // add all assets once they're all loaded
    editor.on('assets:load', function () {
        tree.hidden = false;
        var assets = editor.call('assets:list');
        assets.forEach(addAsset);

        // subscribe for new assets being added
        editor.on('assets:add', addAsset);
    });

    // Delete tree node for removed assets
    editor.on('assets:remove', function (asset) {
        var id = asset.get('id');
        if (itemIndex[id]) {
            itemIndex[id].destroy();
            delete itemIndex[id];
        }
    });

    // handle selections
    tree.on('select', function (item) {
        // open items till parent
        var parent = item.parent;
        while(parent && parent instanceof ui.TreeItem) {
            parent.open = true;
            parent = parent.parent;
        }
        // focus
        item.elementTitle.focus();

        // if we have other items selected too
        // then do nothing
        if (tree.selected.length > 1)
            return;

        // if this item has no asset return
        if (! item._assetId)
            return;

        // emit asset select event
        var asset = editor.call('assets:get', item._assetId);
        if (! asset)
            return;

        editor.call('status:log', 'Selected asset "' + asset.get('name') + '" (id: ' + item._assetId + ')');

        editor.emit('select:asset', asset);
    });

    // Select file by id
    editor.method('files:select', function (id) {
        var item = itemIndex[id];
        if (item) {
            tree.clear()
            item.selected = true;
        }
    });

    // Get selected assets
    editor.method('assets:selected', function () {
        var result = [];
        for (var i = 0, len = tree.selected.length; i < len; i++) {
            if (! tree.selected[i]._assetId) continue;
            var asset = editor.call('assets:get', tree.selected[i]._assetId);
            if (asset)
                result.push(asset);
        }
        return result;
    });

    // Get selected folder or folder that the
    // selected asset is in if no specific folder
    // is selected
    editor.method('assets:selected:folder', function () {
        var result = null;

        if (tree.selected.length) {
            // get last item selected
            var last = tree.selected.length;
            while (last--) {
                if (! tree.selected[last]._assetId) {
                    continue;
                }

                var asset = editor.call('assets:get', tree.selected[last]._assetId);
                if (! asset) {
                    continue;
                }

                if (asset.get('type') === 'folder') {
                    result = asset;
                    break;
                }

                var path = asset.get('path');
                if (path.length) {
                    result = editor.call('assets:get', path[path.length - 1]);
                }

                break;
            }
        }

        return result;
    });

    // handle reparenting
    tree.on('reparent', function (nodes) {
        if (! nodes.length) return;

        var assets = nodes.map(function (node) {
            return editor.call('assets:get', node.item._assetId);
        });

        var parent = editor.call('assets:get', nodes[0].new._assetId);

        editor.call('assets:fs:move', assets, parent);
    });


    // deselect tree item
    editor.on('documents:close', function (id) {
        var item = itemIndex[id];
        if (item)
            item.selected = false;
    });

});