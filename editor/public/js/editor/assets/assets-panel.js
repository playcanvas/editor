editor.once('load', function() {
    'use strict';

    var root = editor.call('layout.root');
    var assetsPanel = editor.call('layout.assets');
    var legacyScripts = editor.call('project:settings').get('use_legacy_scripts');

    var dragging = false;
    var draggingType = '';
    var draggingData = { };
    var selector = {
        type: '',
        items: [ ],
        prev: {
            type: '',
            items: [ ]
        }
    };
    var searching = false;

    var overlay = new ui.Panel();
    overlay.class.add('overlay');
    assetsPanel.append(overlay);

    var loading = new ui.Progress();
    loading.on('progress:100', function() {
        overlay.hidden = true;
    });
    overlay.append(loading);

    editor.method('assets:progress', function(progress) {
        loading.progress = progress;
    });

    // folders panel
    var folders = new ui.Panel();
    folders.class.add('folders');
    folders.flexShrink = false;
    folders.style.width = '200px';
    folders.innerElement.style.width = '200px';
    folders.foldable = false;
    folders.horizontal = true;
    folders.scroll = true;
    folders.resizable = 'right';
    folders.resizeMin = 100;
    folders.resizeMax = 300;
    assetsPanel.append(folders);

    editor.method('assets:panel:folders', function() {
        return folders;
    });

    var currentFolder = null;
    editor.method('assets:panel:currentFolder', function(asset) {
        if (asset === undefined)
            return currentFolder;

        if (asset === currentFolder)
            return;

        // current folder style remove
        if (currentFolder && typeof(currentFolder) !== 'string' && assetsIndex[currentFolder.get('id')]) {
            assetsIndex[currentFolder.get('id')].tree.class.remove('current');
        } else {
            if (currentFolder === null) {
                treeRoot.class.remove('current');
            } else if (treeScripts && currentFolder === 'scripts') {
                treeScripts.class.remove('current');
            }
        }

        currentFolder = asset;

        // current folder style add
        if (currentFolder && typeof(currentFolder) !== 'string') {
            assetsIndex[currentFolder.get('id')].tree.class.add('current');

            // open tree up
            var path = currentFolder.get('path');
            for(var i = 0; i < path.length; i++) {
                if (! assetsIndex[path[i]] || ! assetsIndex[path[i]].tree)
                    continue;

                assetsIndex[path[i]].tree.open = true;
            }
        } else if (currentFolder === null) {
            treeRoot.class.add('current');
        } else if (treeScripts && currentFolder === 'scripts') {
            treeScripts.class.add('current');
            editor.call('assets:filter:type', 'all');
        }

        if (legacyScripts)
            gridScripts.hidden = currentFolder !== null;

        editor.emit('assets:panel:currentFolder', currentFolder);
    });

    editor.call('hotkey:register', 'assets:fs:up', {
        key: 'backspace',
        callback: function() {
            if (! currentFolder || editor.call('selector:type') !== 'asset')
                return;

            var path = typeof(currentFolder) === 'string' ? [ ] : currentFolder.get('path');
            if (path.length === 0) {
                editor.call('assets:panel:currentFolder', null);
            } else {
                editor.call('assets:panel:currentFolder', editor.call('assets:get', path[path.length - 1]));
            }
        }
    });

    editor.on('drop:active', function(state, type, data) {
        dragging = state;

        if (! dragging) {
            grid.dragOver = undefined;
            gridDropBorder.classList.remove('active');
            treeDropBorder.classList.remove('active');
        }
    });

    editor.on('drop:set', function(type, data) {
        draggingType = type;
        draggingData = data;
    });

    // tree
    var tree = new ui.Tree();
    tree.enabled = false;
    tree.draggable = false;
    tree.class.add('assets');
    folders.append(tree);

    var dropRef = editor.call('drop:target', {
        ref: folders.element,
        hole: true,
        passThrough: true,
        filter: function(type, data) {
            return type.startsWith('asset');
        },
        drop: function(type, data) {
            if (! type || grid.dragOver === undefined || ! type.startsWith('asset'))
                return;

            var items = editor.call('selector:items');
            var assets = [ ];

            var addAsset = function(id) {
                var asset = editor.call('assets:get', id);

                // deselect moved asset
                if (items.indexOf(asset) !== -1)
                    editor.call('selector:remove', asset);

                assets.push(asset);
            };

            if (data.ids) {
                for(var i = 0; i < data.ids.length; i++)
                    addAsset(data.ids[i]);
            } else {
                addAsset(data.id);
            }
            editor.call('assets:fs:move', assets, grid.dragOver);
        }
    });
    dropRef.element.classList.add('assets-drop-area');

    var treeAppendQueue = { };

    // tree root
    var treeRoot = new ui.TreeItem({
        text: '/'
    });
    tree.append(treeRoot);
    treeRoot.open = true;
    treeRoot.class.add('current');
    treeRoot.on('select', function() {
        this.selected = false;
    });

    // scripts folder
    var gridScripts;
    var treeScripts;

    treeRoot.elementTitle.addEventListener('mouseover', function() {
        if (! dragging || grid.dragOver === null || (! draggingData.id && ! draggingData.ids))
            return;

        // already in that folder
        var dragAsset = editor.call('assets:get', draggingData.id || draggingData.ids[0]);
        if (! dragAsset.get('path').length)
            return;

        gridDropBorder.classList.remove('active');

        var rect = treeRoot.elementTitle.getBoundingClientRect();
        treeDropBorder.classList.add('active');
        treeDropBorder.style.left = rect.left + 'px';
        treeDropBorder.style.top = rect.top + 'px';
        treeDropBorder.style.right = (window.innerWidth - rect.right) + 'px';
        treeDropBorder.style.bottom = (window.innerHeight - rect.bottom) + 'px';

        grid.dragOver = null;
    }, false);

    treeRoot.elementTitle.addEventListener('mouseout', function() {
        if (! dragging || grid.dragOver === undefined)
            return;

        gridDropBorder.classList.remove('active');
        treeDropBorder.classList.remove('active');

        grid.dragOver = undefined;
    }, false);

    // tree width resizing
    var resizeTree = function() {
        tree.element.style.width = '';
        tree.element.style.width = (folders.innerElement.scrollWidth - 5) + 'px';
    };
    folders.on('resize', resizeTree);
    tree.on('open', resizeTree);
    tree.on('close', resizeTree);
    setInterval(resizeTree, 500);

    var files = new ui.Panel();
    files.class.add('files');
    files.flexGrow = true;
    files.foldable = false;
    files.horizontal = true;
    files.scroll = true;
    assetsPanel.append(files);

    editor.method('assets:panel:files', function() {
        return files;
    });

    // grid
    var grid = new ui.Grid();
    grid.enabled = false;
    grid.class.add('assets');
    files.append(grid);


    var dropRef = editor.call('drop:target', {
        ref: files.element,
        hole: true,
        passThrough: true,
        filter: function(type, data) {
            return type.startsWith('asset');
        },
        drop: function(type, data) {
            if (! type || grid.dragOver === undefined || ! type.startsWith('asset'))
                return;

            var assets = [ ];
            var items = editor.call('selector:items');

            var addAsset = function(id) {
                var asset = editor.call('assets:get', id);

                // deselect moved asset
                if (items.indexOf(asset) !== -1)
                    editor.call('selector:remove', asset);

                assets.push(asset);
            };

            if (data.ids) {
                for(var i = 0; i < data.ids.length; i++)
                    addAsset(data.ids[i]);
            } else {
                addAsset(data.id);
            }

            editor.call('assets:fs:move', assets, grid.dragOver);
        }
    });
    dropRef.element.classList.add('assets-drop-area');

    editor.on('permissions:writeState', function(state) {
        tree.enabled = state;
        grid.enabled = state;
    });

    var labelNoAssets = new ui.Label();
    labelNoAssets.renderChanges = false;
    labelNoAssets.class.add('no-assets');
    labelNoAssets.hidden = true;
    files.append(labelNoAssets);

    editor.method('assets:panel:message', function (msg) {
        labelNoAssets.text = msg;
        labelNoAssets.hidden = !msg;
    });

    var scriptsIndex = { };
    var assetsIndex = { };
    var assetsChanged = false;
    grid.assetsIndex = assetsIndex;

    var gridDropBorder = document.createElement('div');
    gridDropBorder.classList.add('assets-drop-border');
    root.append(gridDropBorder);

    var treeDropBorder = document.createElement('div');
    treeDropBorder.classList.add('assets-drop-border');
    root.append(treeDropBorder);

    tree.on('select', function(item) {
        if (assetsChanged)
            return;

        if (item.asset) {
            if (! Tree._ctrl || ! Tree._ctrl()) {
                if (currentFolder !== item.asset) {
                    item.selected = false;
                } else {
                    editor.call('selector:set', 'asset', [ item.asset ]);
                }
            } else {
                editor.call('selector:add', 'asset', item.asset);
            }
        }

        if (! item.asset) {
            if (item === treeRoot) {
                editor.call('assets:filter:search', '');
                editor.call('assets:panel:currentFolder', null);
            } else if (item === treeScripts) {
                editor.call('assets:filter:search', '');
                editor.call('assets:panel:currentFolder', 'scripts');
            }
            return;
        }

        if (! Tree._ctrl || ! Tree._ctrl()) {
            editor.call('assets:filter:search', '');
            editor.call('assets:panel:currentFolder', item.asset);
        }
    });

    tree.on('deselect', function(item) {
        if (assetsChanged)
            return;

        if (item.asset)
            editor.call('selector:remove', item.asset);
    });

    grid.on('select', function(item) {
        if (assetsChanged)
            return;

        if (item.asset) {
            editor.call('selector:add', 'asset', item.asset);
        } else if (item.script) {
            editor.call('selector:add', 'asset', item.script);
        }
    });

    grid.on('deselect', function(item) {
        if (assetsChanged)
            return;

        if (item.asset) {
            editor.call('selector:remove', item.asset);
        } else if (item.script) {
            editor.call('selector:remove', item.script);
        }
    });

    editor.on('selector:change', function(type, items) {
        assetsChanged = true;

        selector.prev.type = selector.type;
        selector.prev.items = selector.items;

        selector.type = editor.call('selector:type');
        selector.items = editor.call('selector:items');

        if (type === 'asset') {
            tree.clear();
            items = items.slice(0);
            var assets = items.slice(0);

            for(var i = 0; i < items.length; i++) {
                if (legacyScripts && items[i].get('type') === 'script') {
                    assets[i] = scriptsIndex[items[i].get('filename')];
                } else {
                    assets[i] = assetsIndex[items[i].get('id')];
                    if (assets[i].tree) {
                        assets[i].tree.selected = true;

                        // open tree up
                        var path = items[i].get('path');
                        for(var n = 0; n < path.length; n++) {
                            if (! assetsIndex[path[n]] || ! assetsIndex[path[n]].tree)
                                continue;

                            assetsIndex[path[n]].tree.open = true;
                        }
                    }
                }
            }

            grid.selected = assets;
        } else {
            if ((legacyScripts && ! (gridScripts.selected && grid.selected.length === 1)) || selector.type !== 'asset')
                grid.selected = [ ];

            tree.clear();
        }

        assetsChanged = false;
    });

    // return grid
    editor.method('assets:grid', function() {
        return grid;
    });


    // filter assets in grid
    editor.method('assets:panel:filter', function(fn) {
        if (! fn)
            fn = editor.call('assets:panel:filter:default');

        labelNoAssets.hidden = true;

        grid.forEach(function(gridItem) {
            if (gridItem.asset) {
                gridItem.hidden = ! fn('asset', gridItem.asset);
            } else if (gridItem.script) {
                gridItem.hidden = ! fn('script', gridItem.script);
            }
        });

        var type = editor.call('assets:filter:type');
        var search = editor.call('assets:filter:search');

        // navigate to selected assets folder
        if (searching && ! search) {
            searching = false;

            if (selector.type === 'asset') {
                var script = selector.items[0].get('type') === 'script';
                var path = script ? [ ] : selector.items[0].get('path');
                var multiPath = false;
                for(var i = 1; i < selector.items.length; i++) {
                    var item = selector.items[i];
                    if (script !== (item.get('type') === 'script') || (! script && ! path.equals(item.get('path')))) {
                        multiPath = true;
                        break;
                    }
                }

                if (! multiPath) {
                    if (path.length) {
                        editor.call('assets:panel:currentFolder', editor.call('assets:get', path[path.length - 1]));
                        assetsIndex[selector.items[0].get('id')].element.focus();
                    } else if (script) {
                        editor.call('assets:panel:currentFolder', 'scripts');
                    } else {
                        editor.call('assets:panel:currentFolder', null);
                    }
                }
            }
        }

        if (search)
            searching = true;

        if (legacyScripts)
            gridScripts.hidden = ! fn('scripts', 'scripts');
    });


    // get grid item by id
    editor.method('assets:panel:get', function(id) {
        return assetsIndex[id] || scriptsIndex[id];
    });


    editor.on('messenger:asset.thumbnail', function(data) {
        var gridItem = assetsIndex[parseInt(data.asset.id, 10)];

        if (! gridItem || gridItem.asset.get('source'))
            return;

        var url = '/api/assets/' + data.asset.id + '/thumbnail/medium?t=' + (gridItem.asset.get('file.hash') || data.asset.hash || '')
        gridItem.thumbnail.style.backgroundImage = 'url(' + url + ')';
        gridItem.thumbnail.classList.remove('placeholder');
    });


    var appendChildFolders = function(item) {
        var queue = treeAppendQueue[item.asset.get('id')];
        if (! queue || ! queue.length)
            return;

        for(var i = 0; i < queue.length; i++) {
            var closest = treeFindClosest(item.tree, queue[i].tree);
            if (closest === -1) {
                item.tree.append(queue[i].tree);
            } else {
                item.tree.appendBefore(queue[i].tree, item.tree.child(closest).ui);
            }
            appendChildFolders(queue[i]);
        }

        delete treeAppendQueue[item.asset.get('id')];
    };

    var treeFindClosest = function(item, b, nameOld) {
        var l = Array.prototype.slice.call(item.element.childNodes, 1);
        if (item === treeRoot)
            l = l.slice(1);

        var min = 0;
        var max = l.length - 1;
        var cur;
        var a, i;
        var aN, bN;

        if (l.length === 0)
            return -1;

        if (((a === b) ? nameOld.toLowerCase() : l[0].ui.text.toLowerCase()) === bN)
            return 0;

        while (min <= max) {
            cur = Math.floor((min + max) / 2);
            a = l[cur];

            aN = (a === b) ? nameOld.toLowerCase() : a.ui.text.toLowerCase();
            bN = b.text.toLowerCase();

            if (aN > bN) {
                max = cur - 1;
            } else if (aN < bN) {
                min = cur + 1;
            } else {
                return cur;
            }
        }

        if (aN > bN)
            return cur;

        if ((cur + 1) === l.length)
            return -1;

        return cur + 1;
    };

    var createLegacyScriptFolder = function() {
        gridScripts = new ui.GridItem();
        gridScripts.class.add('type-folder', 'scripts');
        grid.append(gridScripts);

        gridScripts.tree = treeScripts = new ui.TreeItem({
            text: 'scripts'
        });
        gridScripts.tree.class.add('scripts');
        gridScripts.tree.on('select', function() {
            this.selected = false;
        });
        treeRoot.append(gridScripts.tree);

        gridScripts.on('select', function() {
            editor.call('selector:clear');

            if (! selector.type) {
                selector.prev.type = null;
                selector.prev.items = [ ];
            }
        });

        // folder open
        gridScripts.element.addEventListener('dblclick', function() {
            tree.clear();
            editor.call('assets:filter:search', '');
            editor.call('assets:panel:currentFolder', 'scripts');
            // change back selection

            if (selector.prev.type)
                editor.call('selector:set', selector.prev.type, selector.prev.items);
        }, false);

        var thumbnail = gridScripts.thumbnail = document.createElement('div');
        thumbnail.classList.add('thumbnail', 'placeholder');
        gridScripts.element.appendChild(thumbnail);

        var icon = document.createElement('div');
        icon.classList.add('icon');
        gridScripts.element.appendChild(icon);

        var label = gridScripts.labelElement = document.createElement('div');
        label.classList.add('label');
        label.textContent = 'scripts';
        gridScripts.element.appendChild(label);

        // context menu
        var menu = new ui.Menu();
        root.append(menu);

        // script
        var menuScript = new ui.MenuItem({
            text: 'New Script',
            value: 'script',
            icon: '&#57864;'
        });
        menuScript.on('select', function () {
            editor.call('sourcefiles:new');
        });
        menu.append(menuScript);

        editor.on('repositories:load', function (repositories) {
            if (repositories.get('current') !== 'directory')
                menuScript.disabled = true;
        });
        var onContextMenu = function(evt) {
            evt.stopPropagation();
            evt.preventDefault();

            if (! editor.call('permissions:write'))
                return;

            menu.position(evt.clientX + 1, evt.clientY);
            menu.open = true;
        };
        gridScripts.element.addEventListener('contextmenu', onContextMenu, false);
        treeScripts.elementTitle.addEventListener('contextmenu', onContextMenu, false);

        resizeTree();
    };
    if (legacyScripts)
        createLegacyScriptFolder();

    // select all hotkey
    // ctrl + a
    editor.call('hotkey:register', 'asset:select-all', {
        ctrl: true,
        key: 'a',
        callback: function() {
            var assets = [ ];

            if (currentFolder === 'scripts') {
                // scripts
                assets = editor.call('sourcefiles:list');

            } else if (currentFolder) {
                // in folder
                var path = currentFolder.get('path').concat([ parseInt(currentFolder.get('id'), 10) ]);
                assets = editor.call('assets:find', function(asset) {
                    return asset.get('path').equals(path);
                }).map(function(i) { return i[1]; });

            } else {
                // in root
                assets = editor.call('assets:find', function(asset) {
                    return ! asset.get('path').length;
                }).map(function(i) { return i[1]; });
            }

            if (assets && assets.length) {
                editor.call('selector:set', 'asset', assets);
            } else {
                editor.call('selector:clear');
            }
        }
    });

    editor.on('assets:add', function(asset, pos) {
        asset._type = 'asset';

        var events = [ ];
        var item = new ui.GridItem();
        item.asset = asset;
        item.class.add('type-' + asset.get('type'));

        var onDragStart = function(evt) {
            evt.preventDefault();
            evt.stopPropagation();

            if (! editor.call('permissions:write'))
                return;

            var type = 'asset.' + asset.get('type');
            var data = {
                id: asset.get('id')
            };

            var selectorType = editor.call('selector:type');
            var selectorItems = editor.call('selector:items');

            if (selectorType === 'asset' && selectorItems.length > 1) {
                var path = selectorItems[0].get('path');

                if (selectorItems.indexOf(asset) !== -1) {
                    var ids = [ ];
                    for(var i = 0; i < selectorItems.length; i++) {
                        // don't allow multi-path dragging
                        if (path.length !== selectorItems[i].get('path').length || path[path.length - 1] !== selectorItems[i].get('path')[path.length - 1])
                            return;

                        ids.push(parseInt(selectorItems[i].get('id'), 10));
                    }

                    type = 'assets';
                    data = {
                        ids: ids
                    };
                }
            }

            editor.call('drop:set', type, data);
            editor.call('drop:activate', true);
        };

        if (asset.get('type') === 'folder') {
            item.tree = new ui.TreeItem({
                text: asset.get('name')
            });
            item.tree.asset = asset;

            var appended = false;
            var path = asset.get('path');
            var parent;
            if (path.length) {
                var parentFolderId = path[path.length - 1];
                if (assetsIndex[parentFolderId]) {
                    appended = true;
                    parent = assetsIndex[parentFolderId].tree;
                } else {
                    if (! treeAppendQueue[parentFolderId])
                        treeAppendQueue[parentFolderId] = [ ];

                    treeAppendQueue[parentFolderId].push(item);
                }
            } else {
                appended = true;
                parent = treeRoot;
            }

            if (parent) {
                var closest = treeFindClosest(parent, item.tree);
                if (closest === -1) {
                    parent.append(item.tree);
                } else {
                    parent.appendBefore(item.tree, parent.child(closest).ui);
                }

                appendChildFolders(item);
            }

            // draggable
            item.tree.elementTitle.draggable = true;
            item.tree.elementTitle.addEventListener('dragstart', onDragStart, false);

            var onMouseOver = function() {
                if (! dragging || grid.dragOver === asset)
                    return;

                // don't allow to drag on it self
                if (draggingData.ids) {
                    // multi-drag
                    if (draggingData.ids.indexOf(parseInt(asset.get('id'), 10)) !== -1)
                        return;
                } else if (draggingData.id) {
                    // single-drag
                    if (parseInt(asset.get('id'), 10) === parseInt(draggingData.id, 10))
                        return;
                } else {
                    // script file drag
                    return;
                }


                // already in that folder
                var dragAsset = editor.call('assets:get', draggingData.id || draggingData.ids[0]);
                var path = dragAsset.get('path');
                if (path.length && path[path.length - 1] === parseInt(asset.get('id')))
                    return;

                // don't allow dragging into own child
                if (draggingData.ids) {
                    // multi-drag
                    var assetPath = asset.get('path');
                    for(var i = 0; i < draggingData.ids.length; i++) {
                        if (assetPath.indexOf(draggingData.ids[i]) !== -1)
                            return;
                    }
                } else {
                    // single-drag
                    if (asset.get('path').indexOf(parseInt(dragAsset.get('id'), 10)) !== -1)
                        return;
                }

                var clip = files.element.getBoundingClientRect();
                var rect = item.element.getBoundingClientRect();
                var top = Math.max(rect.top, clip.top);
                var bottom = Math.min(rect.bottom, clip.bottom);

                if ((bottom - top) > 8) {
                    gridDropBorder.classList.add('active');
                    gridDropBorder.style.left = rect.left + 'px';
                    gridDropBorder.style.top = top + 'px';
                    gridDropBorder.style.right = (window.innerWidth - rect.right) + 'px';
                    gridDropBorder.style.bottom = (window.innerHeight - bottom) + 'px';
                }

                var rect = item.tree.elementTitle.getBoundingClientRect();
                top = Math.max(rect.top, clip.top);
                bottom = Math.min(rect.bottom, clip.bottom);
                if (rect.height && (bottom - top) > 4) {
                    treeDropBorder.classList.add('active');
                    treeDropBorder.style.left = rect.left + 'px';
                    treeDropBorder.style.top = top + 'px';
                    treeDropBorder.style.right = (window.innerWidth - rect.right) + 'px';
                    treeDropBorder.style.bottom = (window.innerHeight - bottom) + 'px';
                }

                grid.dragOver = asset;
            };

            var onMouseOut = function() {
                if (! dragging || grid.dragOver !== asset)
                    return;

                gridDropBorder.classList.remove('active');
                treeDropBorder.classList.remove('active');
                grid.dragOver = undefined;
            };

            item.element.addEventListener('mouseout', onMouseOut, false);
            item.tree.elementTitle.addEventListener('mouseout', onMouseOut, false);

            item.element.addEventListener('mouseover', onMouseOver, false);
            item.tree.elementTitle.addEventListener('mouseover', onMouseOver, false);
        } else if (asset.get('type') === 'script') {
            events.push(editor.on('assets[' + asset.get('id') + ']:scripts:collide', function(script) {
                item.class.add('scripts-collide');
            }));
            events.push(editor.on('assets[' + asset.get('id') + ']:scripts:resolve', function(script) {
                item.class.remove('scripts-collide');
            }));
        }

        var updateTask = function() {
            var status = asset.get('task');
            item.class.remove('task', 'failed', 'running');
            if (status && typeof(status) === 'string' && status[0] !== '{') {
                item.class.add('task', status);
            }
        };

        // add task status
        updateTask();
        asset.on('task:set', updateTask);

        item.element.draggable = true;
        item.element.addEventListener('dragstart', onDragStart, false);

        assetsIndex[asset.get('id')] = item;

        // source
        if (asset.get('source'))
            item.class.add('source');

        if (! editor.call('assets:panel:filter:default')('asset', asset))
            item.hidden = true;

        var fileSize = asset.get('file.size');

        if (! asset.get('source')) {
            // update thumbnails change
            asset.on('thumbnails.m:set', function(value) {
                if (value.startsWith('/api'))
                    value += '?t=' + asset.get('file.hash');

                thumbnail.style.backgroundImage = 'url(' + value + ')';
                thumbnail.classList.remove('placeholder');
            });

            asset.on('thumbnails.m:unset', function() {
                thumbnail.style.backgroundImage = 'none';
                thumbnail.classList.add('placeholder');
            });
        }

        // folder open
        if (asset.get('type') === 'folder') {
            item.element.addEventListener('dblclick', function() {
                tree.clear();
                item.tree.open = true;
                editor.call('assets:filter:search', '');
                editor.call('assets:panel:currentFolder', item.asset);

                // change back selection
                if (selector.type)
                    editor.call('selector:set', selector.prev.type, selector.prev.items);
            }, false);
        }

        var thumbnail = item.thumbnail = document.createElement('div');
        thumbnail.classList.add('thumbnail');
        item.element.appendChild(thumbnail);

        if (asset.has('thumbnails') && ! asset.get('source')) {
            thumbnail.style.backgroundImage = 'url("' + config.url.home + asset.get('thumbnails.m') + '")';
        } else {
            thumbnail.classList.add('placeholder');
        }

        var icon = document.createElement('div');
        icon.classList.add('icon');
        item.element.appendChild(icon);

        var label = item.labelElement = document.createElement('div');
        label.classList.add('label');
        label.textContent = asset.get('name');
        item.element.appendChild(label);

        var users = item.users = document.createElement('div');
        users.classList.add('users');
        item.element.appendChild(users);

        // update name/filename change
        events.push(asset.on('name:set', function(name, nameOld) {
            // grid
            label.textContent = this.get('name');
            // tree
            if (item.tree) {
                item.tree.text = this.get('name');

                // resort element (move match alphabetical order)
                var parent = item.tree.parent;
                item.tree.parent.element.removeChild(item.tree.element);
                var closest = treeFindClosest(parent, item.tree, nameOld);
                if (closest === -1) {
                    parent.element.appendChild(item.tree.element);
                } else {
                    parent.element.insertBefore(item.tree.element, parent.child(closest));
                }

                resizeTree();
            }

            keepLegacyScriptsAtTop();
        }));

        events.push(asset.on('path:set', function(path, pathOld) {
            // show or hide based on filters
            item.hidden = ! editor.call('assets:panel:filter:default')('asset', this);

            if (item.tree) {
                if (! pathOld.length || ! path.length || path[path.length - 1] !== pathOld[pathOld.length - 1]) {
                    item.tree.parent.remove(item.tree);
                    var parent;

                    if (path.length) {
                        parent = assetsIndex[path[path.length - 1]].tree;
                    } else {
                        parent = treeRoot;
                    }

                    var closest = treeFindClosest(parent, item.tree);
                    if (closest === -1) {
                        parent.append(item.tree);
                    } else {
                        parent.appendBefore(item.tree, parent.child(closest).ui);
                    }
                }

                if (currentFolder === asset)
                    editor.emit('assets:panel:currentFolder', currentFolder);
            }

            keepLegacyScriptsAtTop();
        }));

        if (! asset.get('source')) {
            // used event
            var evtUnused = editor.on('assets:used:' + asset.get('id'), function(state) {
                if (state) {
                    item.class.remove('unused');
                } else {
                    item.class.add('unused');
                }
            });
            // used state
            if (! editor.call('assets:used:get', asset.get('id')))
                item.class.add('unused');

            // clean events
            item.once('destroy', function() {
                evtUnused.unbind();
            });
        }

        // clean events
        item.once('destroy', function() {
            editor.call('selector:remove', asset);

            for(var i = 0; i < events.length; i++)
                events[i].unbind();
            events = null;

            delete assetsIndex[asset.get('id')];
        });

        // append to grid
        var assets = editor.call('assets:raw');
        if (pos === -1 || ! assets.data[pos + 1]) {
            grid.append(item);
        } else {
            grid.appendBefore(item, assetsIndex[assets.data[pos + 1].get('id')]);
        }

        resizeTree();

        keepLegacyScriptsAtTop();
    });

    var keepLegacyScriptsAtTop = function() {
        if (! legacyScripts)
            return;

        // resort scripts folder in grid
        gridScripts.element.parentNode.removeChild(gridScripts.element);
        var first = grid.element.firstChild;
        if (first) {
            grid.element.insertBefore(gridScripts.element, first);
        } else {
            grid.element.appendChild(gridScripts.element);
        }

        // resort scripts folder in tree
        treeScripts.element.parentNode.removeChild(treeScripts.element);
        var next = treeRoot.elementTitle.nextSibling;
        if (next) {
            treeRoot.element.insertBefore(treeScripts.element, next);
        } else {
            treeRoot.element.appendChild(treeScripts.element);
        }
    };

    editor.on('assets:move', function(asset, pos) {
        var item = assetsIndex[asset.get('id')];
        // remove
        grid.element.removeChild(item.element);
        // append
        if (pos === -1) {
            // to end
            grid.append(item);
        } else {
            // before another element
            grid.appendBefore(item, assetsIndex[editor.call('assets:raw').data[pos + 1].get('id')]);
        }
    });

    editor.on('assets:remove', function(asset) {
        var treeItem = assetsIndex[asset.get('id')].tree;
        if (treeItem) {
            if (treeItem.parent)
                treeItem.parent.remove(treeItem);
            treeItem.destroy();
        }

        assetsIndex[asset.get('id')].destroy();

        resizeTree();

        // reselect current directory, if selected was removed
        if (currentFolder && typeof(currentFolder) !== 'string') {
            var id = parseInt(currentFolder.get('id'), 10);
            var path = asset.get('path');
            var ind = path.indexOf(id);
            if (id === parseInt(asset.get('id'), 10) || ind !== -1) {
                if (ind === -1)
                    ind = path.length - 1;

                var found = false;
                i = ind + 1;
                while(i--) {
                    if (assetsIndex[path[i]]) {
                        found = true;
                        editor.call('assets:panel:currentFolder', assetsIndex[path[i]].asset);
                        break;
                    }
                }

                if (! found)
                    editor.call('assets:panel:currentFolder', null);
            }
        }
    });

    var addSourceFile = function(file) {
        file.set('type', 'script');

        var item = new ui.GridItem();
        item.script = file;
        item.class.add('type-script');
        grid.append(item);

        if (! editor.call('assets:panel:filter:default')('script', file))
            item.hidden = true;

        scriptsIndex[file.get('filename')] = item;

        var thumbnail = document.createElement('div');
        thumbnail.classList.add('thumbnail', 'placeholder');
        item.element.appendChild(thumbnail);

        var icon = document.createElement('div');
        icon.classList.add('icon');
        item.element.appendChild(icon);

        var label = item.labelElement = document.createElement('div');
        label.classList.add('label');
        label.textContent = file.get('filename');
        item.element.appendChild(label);

        var users = item.users = document.createElement('div');
        users.classList.add('users');
        item.element.appendChild(users);

        // update name/filename change
        var evtNameSet = file.on('filename:set', function(value, valueOld) {
            label.textContent = value;
            scriptsIndex[value] = item;
            delete scriptsIndex[valueOld];
        });
        item.on('destroy', function() {
            editor.call('selector:remove', file);
            evtNameSet.unbind();
            delete scriptsIndex[file.get('filename')];
        });
        file.on('destroy', function() {
            item.destroy();
        });

        editor.call('drop:item', {
            element: item.element,
            type: 'asset.script',
            data: {
                filename: file.get('filename')
            }
        });
    };
    var removeSourceFile = function(file) {
        file.destroy();
    };

    editor.on('sourcefiles:add', addSourceFile);
    editor.on('sourcefiles:remove', removeSourceFile);
});
