editor.once('load', function () {
    const panel = editor.call('layout.left');

    const isTreeEditable = function () {
        return editor.call('permissions:write') &&
                editor.call('realtime:isConnected') &&
                !editor.call('errors:hasRealtime');
    };

    // files tree
    const tree = new ui.Tree();
    tree.allowRenaming = true;
    tree.draggable = false;
    tree.reordering = false;
    tree.class.add('files');
    tree.hidden = true;
    panel.append(tree);

    // loading progress bar
    const progressBar = new ui.Progress();
    panel.append(progressBar);

    editor.on('assets:load:progress', function (progress) {
        progressBar.hidden = progress >= 1;
        progressBar.progress = progress;
    });

    const refreshTreePermissions = function () {
        tree.draggable = isTreeEditable();
    };

    refreshTreePermissions();

    editor.on('permissions:writeState', refreshTreePermissions);
    editor.on('realtime:authenticated', refreshTreePermissions);
    editor.on('realtime:disconnected', refreshTreePermissions);

    let resizeQueued = false;
    const resizeTree = function () {
        resizeQueued = false;
        tree.element.style.width = '';
        tree.element.style.width = (panel.innerElement.scrollWidth - 5) + 'px';
    };
    const resizeQueue = function () {
        if (resizeQueued) return;
        resizeQueued = true;
        requestAnimationFrame(resizeTree);
    };
    panel.on('resize', resizeQueue);
    tree.on('open', resizeQueue);
    tree.on('close', resizeQueue);
    setInterval(resizeQueue, 1000);

    // tree root
    const treeRoot = new ui.TreeItem({
        text: '/'
    });
    // do not allow double click renaming
    treeRoot.elementTitle.removeEventListener('dblclick', treeRoot._onDblClick);
    treeRoot.class.add('type-folder');
    tree.append(treeRoot);
    treeRoot.open = true;
    treeRoot.on('select', function () {
        this.selected = false;
    });
    editor.call('files:contextmenu:attach', treeRoot);

    // contains <asset id, tree item>
    const itemIndex = {};

    // contains <folder id, nodes that wait for folder id to be added>
    const waitingParent = {};

    // assets to be selected once everything is loaded
    const toBeSelected = [];

    // Select item or expand children
    // but only de-select if there are multiple items selected.
    // This is to avoid having no selected files in the tree view
    const onItemClick = function (evt) {
        if (evt.button !== 0 || !this.ui.selectable)
            return;

        const rect = this.getBoundingClientRect();

        if (this.ui._children && (evt.clientX - rect.left) < 0) {
            this.ui.open = !this.ui.open;
        } else if (!this.ui.selected || this.ui.tree._selected.length > 1) {
            this.ui.tree._onItemClick(this.ui);
            evt.stopPropagation();
        } else {
            evt.stopPropagation();

        }
    };

    // On double click make this tab stay open
    // and subsequent file selections will open a new tab
    const onItemDblClick = function (evt) {
        if (evt.button !== 0 || !this.ui.selectable)
            return;

        const rect = this.getBoundingClientRect();

        if (!this.ui._children || (evt.clientX - rect.left) >= 0) {
            const asset = editor.call('assets:get', this.ui._assetId);
            if (!asset || asset.get('type') === 'folder')
                return;

            evt.stopPropagation();
            editor.call('tabs:temp:stick');
        }
    };

    // Append item to parent keeping order alphabetical.
    // Puts folders first.
    const appendAlphabetically = function (item, parent) {
        const children = Array.prototype.slice.call(parent.element.childNodes, 1);
        if (!children.length)
            return parent.append(item);

        const text = item.text.toLowerCase();
        const folder  = item._folder;
        let low = 0;
        let hi = children.length - 1;
        let mid, node, nodeText, nodeFolder;

        while (low <= hi) {
            mid = Math.floor((low + hi) / 2);
            node = children[mid].ui;
            nodeText = node.text.toLowerCase();
            nodeFolder = node._folder;

            if (folder === nodeFolder) {
                if (text === nodeText) {
                    break;
                } else if (text < nodeText) {
                    hi = mid - 1;
                } else if (text > nodeText) {
                    low = mid + 1;
                }

            } else {
                if (folder) {
                    hi = mid - 1;
                } else {
                    low = mid + 1;
                }

            }
        }

        if (folder === nodeFolder) {
            if (text < nodeText) {
                parent.appendBefore(item, node);
            } else {
                parent.appendAfter(item, node);
            }
        } else {
            if (folder) {
                parent.appendBefore(item, node);
            } else {
                parent.appendAfter(item, node);
            }
        }
    };

    // append item to parent in alphabetical order
    // if item is a folder also append any other items
    // that were waiting for this folder to be added
    const append = function (item, parent) {
        appendAlphabetically(item, parent);

        const id = item._assetId;
        const items = waitingParent[id];
        if (items) {
            delete waitingParent[id];

            for (let i = 0; i < items.length; i++) {
                append(items[i], item);
            }
        }
    };

    // Create tree nodes for each asset
    const addAsset = function (asset) {
        const id = asset.get('id');

        const item = new ui.TreeItem({
            text: asset.get('name'),
            allowDrop: asset.get('type') === 'folder'
        });
        // do not allow double click renaming
        item.elementTitle.removeEventListener('dblclick', item._onDblClick);
        item.class.add('type-' + asset.get('type'));

        // let users = document.createElement('span');
        // users.classList.add('users');
        // item.elementTitle.appendChild(users);
        // item.elementUsers = users;

        editor.call('files:contextmenu:attach', item);

        item._assetId = id;

        if (asset.get('type') === 'folder')
            item._folder = true;

        if (itemIndex[id]) {
            itemIndex[id].destroy();
        }

        itemIndex[id] = item;

        // Override click / double click
        item.elementTitle.removeEventListener('click', item._onClick);
        item.elementTitle.addEventListener('click', onItemClick);
        item.elementTitle.addEventListener('dblclick', onItemDblClick);
        item.on('destroy', function () {
            item.elementTitle.removeEventListener('click', onItemClick);
            item.elementTitle.removeEventListener('dblclick', onItemDblClick);
        });

        const addItem = function (item, path) {
            const length = path.length;
            if (!length) {
                append(item, treeRoot);
            } else {
                const folder = path[length - 1];
                if (itemIndex[folder]) {
                    append(item, itemIndex[folder]);
                } else {
                    waitingParent[folder] = waitingParent[folder] || [];
                    waitingParent[folder].push(item);
                }
            }
        };

        addItem(item, asset.get('path'));

        // handle path changes
        asset.on('path:set', function (path, oldPath) {
            // remove item from old folder
            if (item.parent) {
                item.parent.remove(item);
            } else if (oldPath && oldPath.length) {
                const oldFolder = oldPath[oldPath.length - 1];
                const index = waitingParent[oldFolder] ? waitingParent[oldFolder].indexOf(item) : -1;
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
            const parent = item.parent;
            if (!parent) return;

            parent.remove(item);
            item.text = name;
            appendAlphabetically(item, parent);
        });

        // rename item
        item.on('rename', function (name) {
            editor.call('assets:rename', asset, name);
        });
    };

    // add all assets once they're all loaded
    editor.on('assets:load', function () {
        tree.hidden = false;
        const assets = editor.call('assets:list');
        assets.forEach(addAsset);

        // subscribe for new assets being added
        editor.on('assets:add', addAsset);

        // tree done
        editor.emit('files:load');

        // select any assets requested to be selected
        // before assets were loaded
        for (let i = 0, len = toBeSelected.length; i < len; i++) {
            editor.call('files:select', toBeSelected[i]);
        }
    });

    // Delete tree node for removed assets
    editor.on('assets:remove', function (asset) {
        const id = asset.get('id');
        if (itemIndex[id]) {
            itemIndex[id].destroy();
            delete itemIndex[id];
        }
    });

    // handle selections
    tree.on('select', function (item) {
        // open items till parent
        let parent = item.parent;
        while (parent && parent instanceof ui.TreeItem) {
            parent.open = true;
            parent = parent.parent;
        }
        // focus
        item.elementTitle.focus();

        // if we have other items selected too
        // then do nothing
        if (tree._selected.length > 1)
            return;

        // if this item has no asset return
        if (!item._assetId)
            return;

        // emit asset select event
        const asset = editor.call('assets:get', item._assetId);
        if (!asset)
            return;

        editor.call('status:log', 'Selected asset "' + asset.get('name') + '" (id: ' + item._assetId + ')');

        editor.emit('select:asset', asset);
    });

    editor.method('files:getTreeItem', function (id) {
        return itemIndex[id];
    });

    // show dirty assets
    editor.on('documents:dirty', function (id, dirty) {
        const item = itemIndex[id];
        if (item) {
            if (dirty) {
                item.class.add('dirty');
            } else {
                item.class.remove('dirty');
            }
        }
    });

    // Select file by id
    editor.method('files:select', function (id) {
        const item = itemIndex[id];
        if (item) {
            tree.clear();
            item.selected = true;
        }
    });

    // deselect all
    editor.method('files:deselectAll', function () {
        let i = tree._selected.length;
        while (i--) {
            tree._selected[i].selected = false;
        }
    });

    // Get selected assets
    editor.method('assets:selected', function () {
        const result = [];
        for (let i = 0, len = tree._selected.length; i < len; i++) {
            if (!tree._selected[i]._assetId) continue;
            const asset = editor.call('assets:get', tree._selected[i]._assetId);
            if (asset)
                result.push(asset);
        }
        return result;
    });

    // Get selected folder or folder that the
    // selected asset is in if no specific folder
    // is selected
    editor.method('assets:selected:folder', function () {
        let result = null;

        if (tree._selected.length) {
            // get last item selected
            let last = tree._selected.length;
            while (last--) {
                if (!tree._selected[last]._assetId) {
                    continue;
                }

                const asset = editor.call('assets:get', tree._selected[last]._assetId);
                if (!asset) {
                    continue;
                }

                if (asset.get('type') === 'folder') {
                    result = asset;
                    break;
                }

                const path = asset.get('path');
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
        if (!nodes.length) return;

        const assets = nodes.map(function (node) {
            return editor.call('assets:get', node.item._assetId);
        });

        const parent = editor.call('assets:get', nodes[0].new._assetId);

        editor.call('assets:fs:move', assets, parent);
    });


    // deselect tree item
    editor.on('documents:close', function (id) {
        const item = itemIndex[id];
        if (item) {
            item.selected = false;
            item.class.remove('dirty');
        }
    });
});
