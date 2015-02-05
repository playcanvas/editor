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
    grid.class.add('assets');
    assetsPanel.append(grid);

    var assetsIndex = { };
    grid.assetsIndex = assetsIndex;


    grid.on('select', function(item) {
        editor.call('selector:add', 'asset', item.asset);
    });

    grid.on('deselect', function(item) {
        editor.call('selector:remove', item.asset);
    });


    // selector reflect in list
    editor.on('selector:add', function(asset, type) {
        if (type !== 'asset')
            return;

        assetsIndex[asset.id].selected = true;
    });
    editor.on('selector:remove', function(asset, type) {
        if (type !== 'asset')
            return;

        assetsIndex[asset.id].selected = false;
    });


    // return grid
    editor.method('assets:grid', function() {
        return grid;
    });


    // filter assets in grid
    editor.method('assets:panel:filter', function(fn) {
        grid.forEach(function(gridItem) {
            if (! gridItem.asset)
                return;

            gridItem.enabled = fn(gridItem.asset);
        });
    });


    editor.on('assets:add', function(asset) {
        var item = new ui.GridItem();
        item.asset = asset;
        item.class.add('type-' + asset.type);
        grid.append(item);

        assetsIndex[asset.id] = item;

        if (asset.thumbnails) {
            item.style.backgroundImage = 'url("' + config.url.home + asset.thumbnails.m + '")';
        }

        // update thumbnails change
        asset.on('thumbnails.m:set', function(value) {
            item.style.backgroundImage = 'url("' + config.url.home + value + '")';
        });

        var icon = document.createElement('div');
        icon.classList.add('icon');
        item.element.appendChild(icon);

        var label = document.createElement('div');
        label.classList.add('label');
        label.textContent = (asset.file && asset.file.filename) || asset.name;
        item.element.appendChild(label);

        // update name/filename change
        asset.on('name:set', function() {
            label.textContent = (this.file && this.file.filename) || this.name;
            this.set('data.name', this.name);
        });
        asset.on('file.filename:set', function() {
            label.textContent = (this.file && this.file.filename) || this.name;
        });
    });


    editor.on('assets:remove', function(asset) {
        assetsIndex[asset.id].destroy();
    });
});
