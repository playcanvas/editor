import { Progress, TreeView, TreeViewItem } from "@playcanvas/pcui";

editor.once('load', function () {
    /** @type {Map<string, string>} */
    const icons = new Map();
    icons.set('css', 'E206');
    icons.set('folder', 'E139');
    icons.set('html', 'E205');
    icons.set('json', 'E207');
    icons.set('script', 'E392');
    icons.set('shader', 'E219');
    icons.set('text', 'E209');

    /** @type {import('@playcanvas/pcui').Panel} */
    const panel = editor.call('layout.left');

    const tree = new TreeView({
        allowDrag: true,
        allowRenaming: false, // Disable double-click renaming (although renaming is available via the context menu)
        allowReordering: true,
        hidden: true
    });
    panel.append(tree);

    // Handle tree item renaming via the context menu
    tree.on('rename', (/** @type {TreeViewItem} */ item, /** @type {string} */ name) => {
        const asset = editor.call('assets:get', item._assetId);
        editor.call('assets:rename', asset, name);
    });

    // Loading progress bar (doesn't actually work since the UI never get a chance to update)
    const progressBar = new Progress();
    panel.append(progressBar);

    editor.on('assets:load:progress', (progress) => {
        progressBar.hidden = progress >= 1;
        progressBar.value = progress * 100;
    });

    const isTreeEditable = () => {
        return editor.call('permissions:write') &&
               editor.call('realtime:isConnected') &&
               !editor.call('errors:hasRealtime');
    };

    const refreshTreePermissions = () => {
        tree.allowDrag = isTreeEditable();
    };

    refreshTreePermissions();

    editor.on('permissions:writeState', refreshTreePermissions);
    editor.on('realtime:authenticated', refreshTreePermissions);
    editor.on('realtime:disconnected', refreshTreePermissions);

    const treeRoot = new TreeViewItem({
        allowSelect: false,
        icon: icons.get('folder'),
        open: true,
        text: '/'
    });
    tree.append(treeRoot);

    editor.call('files:contextmenu:attach', treeRoot);

    /**
     * Map asset id to tree view item.
     *
     * @type {Map<string, TreeViewItem>}
     */
    const idToItem = new Map();

    // contains <folder id, nodes that wait for folder id to be added>
    const waitingParent = {};

    /**
     * Override TreeViewItem's default click handler and modify its behavior to not deselect
     * the item if it's already selected or if there's more than one item selected.
     *
     * @param {MouseEvent} evt - Mouse event.
     */
    const onItemClick = function (evt) {
        /** @type {TreeViewItem} */
        const item = this.ui.parent;

        if (!item.allowSelect || evt.button !== 0) return;

        const element = evt.target;
        if (element.tagName === 'INPUT') return;

        evt.stopPropagation();

        const rect = this.getBoundingClientRect();
        if (item.numChildren > 0 && evt.clientX - rect.left < 0) {
            item.open = !item.open;
            if (evt.altKey) {
                // apply to all children as well
                const open = item.open;
                item._dfs((item) => {
                    item.open = open;
                });
            }
            item.focus();
        } else if (!item.selected || tree.selected.length > 1) {
            tree._onChildClick(evt, item);
        }
    };

    /**
     * On double click make this tab stay open and subsequent file selections will open a new tab.
     *
     * @param {MouseEvent} evt - Mouse event.
     */
    const onItemDblClick = function (evt) {
        /** @type {TreeViewItem} */
        const item = this.ui.parent;

        if (evt.button !== 0)
            return;

        const rect = this.getBoundingClientRect();

        if (!item.numChildren || (evt.clientX - rect.left) >= 0) {
            const asset = editor.call('assets:get', item._assetId);
            if (!asset || asset.get('type') === 'folder')
                return;

            evt.stopPropagation();
            editor.call('tabs:temp:stick');
        }
    };

    /**
     * Append item to parent keeping order alphabetical. Puts folders first.
     *
     * @param {TreeViewItem} item - Item to append.
     * @param {TreeViewItem} parent - Parent item.
     */
    const appendAlphabetically = (item, parent) => {
        const children = Array.from(parent.dom.childNodes).slice(1);
        if (!children.length) {
            parent.append(item);
            return;
        }

        const text = item.text.toLowerCase();
        const folder  = item.icon === icons.get('folder');
        let low = 0;
        let hi = children.length - 1;
        let mid, node, nodeText, nodeFolder;

        while (low <= hi) {
            mid = Math.floor((low + hi) / 2);
            node = children[mid].ui;
            nodeText = node.text.toLowerCase();
            nodeFolder = node.icon === icons.get('folder');

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

    /**
     * Append item to parent in alphabetical order. If item is a folder also append any other items
     * that were waiting for this folder to be added.
     *
     * @param {TreeViewItem} item - Item to append.
     * @param {TreeViewItem} parent - Parent item.
     */
    const append = (item, parent) => {
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
        /** @type {string} */
        const id = asset.get('id');
        /** @type {string} */
        const name = asset.get('name');
        /** @type {number[]} */
        const path = asset.get('path');
        /** @type {string} */
        const type = asset.get('type');

        const item = new TreeViewItem({
            allowDrop: type === 'folder',
            icon: icons.get(type),
            text: name
        });

        editor.call('files:contextmenu:attach', item);

        item._assetId = id;

        const existingItem = idToItem.get(id);
        if (existingItem) {
            existingItem.destroy();
        }

        idToItem.set(id, item);

        // Override click / double click
        const dom = item.dom.childNodes[0]; // this is item._containerContent
        dom.removeEventListener('click', item._onContentClick);
        dom.addEventListener('click', onItemClick);
        dom.addEventListener('dblclick', onItemDblClick);
        item.on('destroy', () => {
            dom.removeEventListener('click', onItemClick);
            dom.removeEventListener('dblclick', onItemDblClick);
        });

        /**
         * @param {TreeViewItem} item - Item to add.
         * @param {number[]} path - Path to item.
         */
        const addItem = (item, path) => {
            const length = path.length;
            if (!length) {
                append(item, treeRoot);
            } else {
                const folder = path[length - 1];
                const parent = idToItem.get(String(folder));
                if (parent) {
                    append(item, parent);
                } else {
                    waitingParent[folder] = waitingParent[folder] || [];
                    waitingParent[folder].push(item);
                }
            }
        };

        addItem(item, path);

        // handle path changes
        asset.on('path:set', (path, oldPath) => {
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
        asset.on('name:set', (/** @type {string} */ name) => {
            /** @type {TreeViewItem} */
            const parent = item.parent;
            if (!parent) return;

            // remove and re-insert item
            parent.remove(item);
            item.text = name;
            appendAlphabetically(item, parent);
        });
    };

    // add all assets once they're all loaded
    editor.on('assets:load', () => {
        tree.hidden = false;

        const assets = editor.call('assets:list');
        assets.forEach(addAsset);

        // subscribe for new assets being added
        editor.on('assets:add', addAsset);

        // tree done
        editor.emit('files:load');
    });

    // Delete tree node for removed assets
    editor.on('assets:remove', (asset) => {
        /** @type {string} */
        const id = asset.get('id');
        const item = idToItem.get(id);
        if (item) {
            item.destroy();
            idToItem.delete(id);
        }
    });

    // handle selections
    tree.on('select', (/** @type {TreeViewItem} */ item) => {
        // open items till parent
        let parent = item.parent;
        while (parent && parent instanceof TreeViewItem) {
            parent.open = true;
            parent = parent.parent;
        }
        // focus
        item.focus();

        // if we have other items selected too
        // then do nothing
        if (tree.selected.length > 1)
            return;

        // if this item has no asset return
        if (!item._assetId)
            return;

        // emit asset select event
        const asset = editor.call('assets:get', item._assetId);
        if (!asset)
            return;

        editor.call('status:log', `Selected asset "${asset.get('name')}" (id: ${item._assetId})`);

        editor.emit('select:asset', asset);
    });

    editor.method('files:getTreeItem', (/** @type {string} */ id) => {
        return idToItem.get(id);
    });

    // show dirty assets
    editor.on('documents:dirty', (/** @type {string} */ id, /** @type {boolean} */ dirty) => {
        const item = idToItem.get(id);
        if (item) {
            if (dirty) {
                item.class.add('dirty');
            } else {
                item.class.remove('dirty');
            }
        }
    });

    // Select file by id
    editor.method('files:select', (/** @type {string} */ id) => {
        const item = idToItem.get(id);
        if (item) {
            tree.deselect();
            item.selected = true;
        }
    });

    // deselect all
    editor.method('files:deselectAll', () => {
        tree.deselect();
    });

    // Get selected assets
    editor.method('assets:selected', () => {
        return tree.selected.map((item) => {
            if (!item._assetId) return null;
            return editor.call('assets:get', item._assetId);
        }).filter(asset => !!asset);
    });

    // Get selected folder or folder that the selected asset is in if no specific folder is selected
    editor.method('assets:selected:folder', () => {
        let result = null;

        if (tree.selected.length) {
            // get last item selected
            let last = tree.selected.length;
            while (last--) {
                if (!tree.selected[last]._assetId) {
                    continue;
                }

                const asset = editor.call('assets:get', tree.selected[last]._assetId);
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
    tree.on('reparent', (reparented) => {
        if (!reparented.length) return;

        const assets = reparented.map((node) => {
            return editor.call('assets:get', node.item._assetId);
        });

        const parent = editor.call('assets:get', reparented[0].newParent._assetId);

        editor.call('assets:fs:move', assets, parent);
    });

    // deselect tree item
    editor.on('documents:close', (/** @type {string} */ id) => {
        const item = idToItem.get(id);
        if (item) {
            item.selected = false;
            item.class.remove('dirty');
        }
    });
});
