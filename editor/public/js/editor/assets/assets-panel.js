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
            editor.call('selector:add', 'script', item.script);
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
    editor.on('selector:add', function(item, type) {
        if (type === 'asset') {
            assetsIndex[item.get('id')].selected = true;
        } else if (type === 'script') {
            scriptsIndex[item.get('filename')].selected = true;
        }
    });
    editor.on('selector:remove', function(item, type) {
        if (type === 'asset') {
            assetsIndex[item.get('id')].selected = false;
        } else if (type === 'script') {
            scriptsIndex[item.get('filename')].selected = false;
        }
    });


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
        return assetsIndex[id];
    });


    editor.on('assets:add', function(asset) {
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

        // update thumbnails change
        asset.on('thumbnails.m:set', function(value) {
            var url = value;
            if (value.startsWith('/api'))
                url = config.url.home + value;

            thumbnail.style.backgroundImage = 'url("' + url + '")';
            thumbnail.classList.remove('placeholder');
        });

        asset.on('thumbnails.m:unset', function() {
            thumbnail.style.backgroundImage = 'none';
            thumbnail.classList.add('placeholder');
        });

        var thumbnail = document.createElement('div');
        thumbnail.classList.add('thumbnail');
        item.element.appendChild(thumbnail);

        if (asset.has('thumbnails')) {
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
            this.set('data.name', this.get('name'));
        });
        item.on('destroy', function() {
            evtNameSet.unbind();
        });
    });

    editor.on('assets:remove', function(asset) {
        assetsIndex[asset.get('id')].destroy();
    });

    var addSourceFile = function(file) {
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
            evtNameSet.unbind();
        });
        file.on('destroy', function() {
            item.destroy();
        });
    };

    editor.once('sourcefiles:load', function(files) {
        files.forEach(addSourceFile);
    });
    editor.on('sourcefiles:add', addSourceFile);
});
