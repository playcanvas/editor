editor.once('load', function () {
    'use strict';

    var panel = editor.call('layout.left');

    var tree = new ui.Tree();
    tree.allowRenaming = editor.call('permissions:write');
    tree.class.add('files');
    panel.append(tree);

    editor.on('permissions:writeState', function(state) {
        tree.allowRenaming = state;
    });

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

    tree.on('select', function(item) {
        // open items till parent
        var parent = item.parent;
        while(parent && parent instanceof ui.TreeItem) {
            parent.open = true;
            parent = parent.parent;
        }
        // focus
        item.elementTitle.focus();

        if (! item._assetId)
            return;

        var asset = editor.call('assets:get', item._assetId);
        if (! asset)
            return;

        editor.call('status:log', 'Selected asset "' + asset.get('name') + '" (id: ' + item._assetId + ')');

        // load document
        editor.call('document:load', asset);
    });

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
    editor.on('assets:add', function (asset) {
        var id = asset.get('id');

        var item = new ui.TreeItem({
            text: asset.get('name')
        })
        item.class.add('type-' + asset.get('type'));

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
    });

    // Delete tree node for removed assets
    editor.on('assets:remove', function (asset) {
        var id = asset.get('id');
        if (itemIndex[id]) {
            itemIndex[id].destroy();
            delete itemIndex[id];
        }
    });

    // Return tree node by asset id
    editor.method('files:tree:get', function (id) {
        return itemIndex[id];
    })

});