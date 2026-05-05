import type { EventHandle, Observer } from '@playcanvas/observer';
import { Progress, TextInput, TreeView, TreeViewItem, Panel } from '@playcanvas/pcui';

const TEXT_TYPES = new Set(['css', 'html', 'json', 'script', 'shader', 'text']);
const RENAME_CLASS = 'pcui-treeview-item-rename';
const POPUP_GAP = 4;

type FileTreeItem = TreeViewItem & {
    _assetId: string;
};

editor.once('load', () => {
    const icons: Map<string, string> = new Map();
    icons.set('css', 'E206');
    icons.set('folder', 'E139');
    icons.set('html', 'E205');
    icons.set('json', 'E207');
    icons.set('script', 'E392');
    icons.set('shader', 'E219');
    icons.set('text', 'E209');

    const panel: Panel = editor.call('layout.left');

    const tree = new TreeView({
        allowDrag: true,
        allowRenaming: false, // Disable double-click renaming (although renaming is available via the context menu)
        allowReordering: true,
        hidden: true
    });
    panel.append(tree);

    const root = editor.call('layout.root');
    const renamePopup = document.createElement('div');
    renamePopup.className = 'files-rename-error-popup';
    renamePopup.hidden = true;
    root.dom.appendChild(renamePopup);

    let activeRename: (() => void) | null = null;
    let suspendRename = false;

    const hideRenameError = () => {
        renamePopup.hidden = true;
        renamePopup.textContent = '';
    };

    const positionRenameError = (input: TextInput) => {
        const rootRect = root.dom.getBoundingClientRect();
        const inputRect = input.dom.getBoundingClientRect();
        const popupRect = renamePopup.getBoundingClientRect();
        const x = Math.max(4, Math.min(rootRect.width - popupRect.width - 4, inputRect.left - rootRect.left));
        const y = Math.max(4, Math.min(rootRect.height - popupRect.height - 4, inputRect.bottom - rootRect.top + POPUP_GAP));

        renamePopup.style.left = `${x}px`;
        renamePopup.style.top = `${y}px`;
    };

    const showRenameError = (input: TextInput, text: string) => {
        renamePopup.textContent = text;
        renamePopup.hidden = false;
        requestAnimationFrame(() => positionRenameError(input));
    };

    const getParent = (asset: Observer) => {
        const path = asset.get('path');
        return path && path.length ? path[path.length - 1] : null;
    };

    const getRenameError = (asset: Observer, name: string) => {
        const type = asset.get('type');
        if (!TEXT_TYPES.has(type) && type !== 'folder') {
            return null;
        }

        const id = asset.get('id');
        const parent = getParent(asset);
        const target = name.toLowerCase();
        const collision = (editor.call('assets:list') || []).some((item: Observer) => {
            if (item.get('id') === id) {
                return false;
            }

            return getParent(item) === parent && item.get('name').toLowerCase() === target;
        });

        return collision ? `An asset named "${name}" already exists in this folder. Please choose a different name.` : null;
    };

    const getItemAsset = (item: TreeViewItem) => {
        return editor.call('assets:get', (item as FileTreeItem)._assetId);
    };

    // Handle tree item renaming via the context menu
    tree.on('rename', (item: TreeViewItem, name: string) => {
        if (suspendRename) {
            return;
        }

        const asset = getItemAsset(item);
        const error = editor.call('assets:rename', asset, name);
        if (error) {
            item.text = asset.get('name');
        }
    });

    // Loading progress bar (doesn't actually work since the UI never get a chance to update)
    const progressBar = new Progress();
    panel.append(progressBar);

    editor.on('assets:load:progress', (progress: number) => {
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

    editor.method('files:rename:start', (item: TreeViewItem) => {
        if (!editor.call('permissions:write')) {
            return;
        }

        const asset = getItemAsset(item);
        if (!asset) {
            return;
        }

        if (activeRename) {
            activeRename();
        }

        const contents = item.dom.childNodes[0] as HTMLElement & { ui: { append: (element: TextInput) => void } };
        const input = new TextInput({
            blurOnEnter: false,
            blurOnEscape: false,
            class: 'files-rename-input',
            renderChanges: false,
            value: asset.get('name')
        });

        let closing = false;
        let destroyed = false;
        let destroyEvt: EventHandle | null = null;

        const close = () => {
            if (closing) {
                return;
            }

            closing = true;
            if (activeRename === close) {
                activeRename = null;
            }

            hideRenameError();
            destroyEvt?.unbind();
            if (!destroyed) {
                input.input.removeEventListener('input', clearError);
                item.class.remove(RENAME_CLASS);
                input.destroy();
                item.focus();
            }
        };

        const fail = (text: string) => {
            input.error = true;
            showRenameError(input, text);
            requestAnimationFrame(() => {
                if (!closing) {
                    input.focus();
                }
            });
        };

        const commit = () => {
            const name = input.value.trim();
            if (!name || name === asset.get('name')) {
                close();
                return true;
            }

            const error = getRenameError(asset, name) || editor.call('assets:rename', asset, name);
            if (error) {
                fail(error);
                return false;
            }

            suspendRename = true;
            item.text = name;
            suspendRename = false;
            close();
            return true;
        };

        function clearError() {
            input.error = false;
            hideRenameError();
        }

        input.on('keydown', (evt: KeyboardEvent) => {
            if (evt.key === 'Enter') {
                evt.preventDefault();
                evt.stopPropagation();
                commit();
            } else if (evt.key === 'Escape') {
                evt.preventDefault();
                evt.stopPropagation();
                close();
            }
        });

        input.on('blur', () => {
            if (!closing && !commit()) {
                requestAnimationFrame(() => {
                    if (!closing) {
                        input.focus();
                    }
                });
            }
        });

        input.input.addEventListener('input', clearError);
        destroyEvt = item.once('destroy', () => {
            destroyed = true;
            closing = true;
            if (activeRename === close) {
                activeRename = null;
            }
            hideRenameError();
        });
        activeRename = close;

        item.class.add(RENAME_CLASS);
        contents.ui.append(input);
        input.focus(true);
    });

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
     */
    const idToItem: Map<string, TreeViewItem> = new Map();

    // contains <folder id, nodes that wait for folder id to be added>
    const waitingParent = {};

    /**
     * Override TreeViewItem's default click handler and modify its behavior to not deselect
     * the item if it's already selected or if there's more than one item selected.
     *
     * @param evt - Mouse event.
     */
    const onItemClick = function (evt: MouseEvent) {
        const item: TreeViewItem = this.ui.parent;

        if (!item.allowSelect || evt.button !== 0) {
            return;
        }

        const element = evt.target;
        if (element.tagName === 'INPUT') {
            return;
        }

        evt.stopPropagation();

        const rect = this.getBoundingClientRect();
        if (item.numChildren > 0 && evt.clientX - rect.left < 0) {
            item.open = !item.open;
            if (evt.altKey) {
                // apply to all children as well
                const open = item.open;
                item._dfs((item: TreeViewItem) => {
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
     * @param evt - Mouse event.
     */
    const onItemDblClick = function (evt: MouseEvent) {
        const item: TreeViewItem = this.ui.parent;

        if (evt.button !== 0) {
            return;
        }

        const rect = this.getBoundingClientRect();

        if (!item.numChildren || (evt.clientX - rect.left) >= 0) {
            const asset = editor.call('assets:get', item._assetId);
            if (!asset || asset.get('type') === 'folder') {
                return;
            }

            evt.stopPropagation();
            editor.call('tabs:temp:stick');
        }
    };

    /**
     * Append item to parent keeping order alphabetical. Puts folders first.
     *
     * @param item - Item to append.
     * @param parent - Parent item.
     */
    const appendAlphabetically = (item: TreeViewItem, parent: TreeViewItem) => {
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
     * @param item - Item to append.
     * @param parent - Parent item.
     */
    const append = (item: TreeViewItem, parent: TreeViewItem) => {
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
    const addAsset = function (asset: Observer) {
        const id: string = asset.get('id');
        const name: string = asset.get('name');
        const path: number[] = asset.get('path');
        const type: string = asset.get('type');

        if (id === '524644') {
            console.log('adding', path.join(','), name);
        }

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
         * @param item - Item to add.
         * @param path - Path to item.
         */
        const addItem = (item: TreeViewItem, path: number[]) => {
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
        asset.on('path:set', (path: string[], oldPath?: string[]) => {
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
        asset.on('name:set', (name: string) => {
            const parent: TreeViewItem = item.parent;
            if (!parent) {
                return;
            }

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
    editor.on('assets:remove', (asset: Observer) => {
        const id: string = asset.get('id');
        const item = idToItem.get(id);
        if (item) {
            item.destroy();
            idToItem.delete(id);
        }
    });

    // handle selections
    tree.on('select', (item: TreeViewItem) => {
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
        if (tree.selected.length > 1) {
            return;
        }

        // if this item has no asset return
        if (!item._assetId) {
            return;
        }

        // emit asset select event
        const asset = editor.call('assets:get', item._assetId);
        if (!asset) {
            return;
        }

        editor.call('status:log', `Selected asset "${asset.get('name')}" (id: ${item._assetId})`);

        editor.emit('select:asset', asset);
    });

    editor.method('files:getTreeItem', (id: string) => {
        return idToItem.get(id);
    });

    // show dirty assets
    editor.on('documents:dirty', (id: string, dirty: boolean) => {
        const item = idToItem.get(id);
        if (item) {
            if (dirty) {
                item.class.add('dirty');
            } else {
                item.class.remove('dirty');
            }
        }
    });

    // Select file by id (which can be passed as a string or number)
    editor.method('files:select', (id: number|string) => {
        const item = idToItem.get(String(id));
        if (item && !item.destroyed) {
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
            if (!item._assetId) {
                return null;
            }
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
    tree.on('reparent', (reparented: Array<{ item: { _assetId: string }; newParent: { _assetId: string } }>) => {
        if (!reparented.length) {
            return;
        }

        const assets = reparented.map((node: { item: { _assetId: string }; newParent: { _assetId: string } }) => {
            return editor.call('assets:get', node.item._assetId);
        });

        const parent = editor.call('assets:get', reparented[0].newParent._assetId);

        editor.call('assets:fs:move', assets, parent);
    });

    // deselect tree item
    editor.on('documents:close', (id: string) => {
        const item = idToItem.get(id);
        if (item && !item.destroyed) {
            item.selected = false;
            item.class.remove('dirty');
        }
    });
});
