editor.once('load', function() {
    'use strict';

    var assetsPanel = editor.call('layout.assets');


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

    var grid = new ui.Grid();
    grid.enabled = false;
    grid.class.add('assets');
    assetsPanel.append(grid);
    editor.on('permissions:writeState', function(state) {
        grid.enabled = state;
    });

    var scriptsIndex = { };
    var assetsIndex = { };
    grid.assetsIndex = assetsIndex;


    grid.on('select', function(item) {
        if (item.asset) {
            editor.call('selector:add', 'asset', item.asset);
        } else if (item.script) {
            editor.call('selector:add', 'asset', item.script);
        }
    });

    grid.on('deselect', function(item) {
        if (item.asset) {
            editor.call('selector:remove', item.asset);
        } else if (item.script) {
            editor.call('selector:remove', item.script);
        }
    });

    // selector reflect in list
    var setSelection = function(item, type) {
        if (type !== 'asset')
            return;

        var items = editor.call('selector:items');
        for(var i = 0; i < items.length; i++) {
            if (items[i].get('type') === 'script') {
                items[i] = scriptsIndex[items[i].get('filename')];
            } else {
                items[i] = assetsIndex[items[i].get('id')];
            }
        }

        grid.selected = items;
    };
    editor.on('selector:add', setSelection);
    editor.on('selector:remove', setSelection);


    // return grid
    editor.method('assets:grid', function() {
        return grid;
    });


    // filter assets in grid
    editor.method('assets:panel:filter', function(fn) {
        grid.forEach(function(gridItem) {
            if (gridItem.asset) {
                gridItem.hidden = ! fn('asset', gridItem.asset);
            } else if (gridItem.script) {
                gridItem.hidden = ! fn('script', gridItem.script);
            } else {
                return true;
            }
        });
    });


    // get grid item by id
    editor.method('assets:panel:get', function(id) {
        return assetsIndex[id] || scriptsIndex[id];
    });


    editor.on('messenger:asset.thumbnail', function(data) {
        var gridItem = assetsIndex[parseInt(data.asset.id, 10)];

        if (! gridItem || gridItem.asset.get('source'))
            return;

        var url = '/api/assets/' + data.asset.id + '/thumbnail/medium.jpg?t=' + (gridItem.asset.get('file.hash') || data.asset.hash || '')
        gridItem.thumbnail.style.backgroundImage = 'url(' + url + ')';
        gridItem.thumbnail.classList.remove('placeholder');
    });


    editor.on('assets:add', function(asset) {
        asset._type = 'asset';

        var item = new ui.GridItem();
        item.asset = asset;
        item.class.add('type-' + asset.get('type'));
        grid.append(item);

        editor.call('drop:item', {
            element: item.element,
            type: 'asset.' + asset.get('type'),
            data: {
                id: asset.get('id')
            }
        });

        assetsIndex[asset.get('id')] = item;

        // source
        if (asset.get('source')) {
            item.class.add('source');

            if (! editor.call('assets:filter:sources'))
                item.hidden = true;
        }

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

        // update name/filename change
        var evtNameSet = asset.on('name:set', function() {
            label.textContent = this.get('name');
            if (this.get('data'))
                this.set('data.name', this.get('name'));
        });

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
            evtNameSet.unbind();
            delete assetsIndex[asset.get('id')];
        });
    });

    editor.on('assets:remove', function(asset) {
        assetsIndex[asset.get('id')].destroy();
    });

    var addSourceFile = function(file) {
        file.set('type', 'script');

        var item = new ui.GridItem();
        item.script = file;
        item.class.add('type-script');
        grid.append(item);

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
    };
    var removeSourceFile = function(file) {
        file.destroy();
    };

    editor.once('sourcefiles:load', function(files) {
        for(var i = 0; i < files.data.length; i++) {
            editor.emit('sourcefiles:add', files.data[i]);
        }
    });
    editor.on('sourcefiles:add', addSourceFile);
    editor.on('sourcefiles:remove', removeSourceFile);
});
