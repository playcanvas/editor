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

        assetsIndex[asset.get('id')].selected = true;
    });
    editor.on('selector:remove', function(asset, type) {
        if (type !== 'asset')
            return;

        assetsIndex[asset.get('id')].selected = false;
    });


    // return grid
    editor.method('assets:grid', function() {
        return grid;
    });


    // filter assets in grid
    editor.method('assets:panel:filter', function(fn) {
        grid.forEach(function(gridItem) {
            if (! gridItem.asset)
                return true;

            gridItem.hidden = ! fn(gridItem.asset);
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

        var label = document.createElement('div');
        label.classList.add('label');
        label.textContent = asset.get('name');
        item.element.appendChild(label);

        // update name/filename change
        asset.on('name:set', function() {
            label.textContent = this.get('name');
            this.set('data.name', this.get('name'));
        });
    });

    editor.on('assets:remove', function(asset) {
        assetsIndex[asset.get('id')].destroy();
    });
});
