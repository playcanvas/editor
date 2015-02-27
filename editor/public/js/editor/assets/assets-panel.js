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


    editor.on('assets:add', function(asset) {
        var item = new ui.GridItem();
        item.asset = asset;
        item.class.add('type-' + asset.get('type'));
        grid.append(item);

        assetsIndex[asset.get('id')] = item;

        if (asset.has('thumbnails')) {
            item.style.backgroundImage = 'url("' + config.url.home + asset.get('thumbnails.m') + '")';
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
        label.textContent = asset.get('file.filename') || asset.get('name');
        item.element.appendChild(label);

        // update name/filename change
        asset.on('name:set', function() {
            label.textContent = this.get('file.filename') || this.get('name');
            this.set('data.name', this.get('name'));
        });
        asset.on('file.filename:set', function() {
            label.textContent = this.get('file.filename') || this.get('name');
        });
    });


    editor.on('assets:remove', function(asset) {
        assetsIndex[asset.get('id')].destroy();
    });


    // filters
    var panelFilters = new ui.Panel();
    panelFilters.class.add('filters');
    assetsPanel.headerAppend(panelFilters);

    // label
    var filterLabel = new ui.Label({
        text: 'Filter:'
    });
    filterLabel.class.add('label');
    panelFilters.append(filterLabel);

    // options
    var filterField = new ui.SelectField({
        options: {
            all: 'All',
            animation: 'Animation',
            audio: 'Audio',
            cubemap: 'Cubemap',
            json: 'Json',
            material: 'Material',
            model: 'Model',
            text: 'Text',
            texture: 'Texture'
        }
    });
    filterField.class.add('options');
    filterField.value = 'all';
    filterField.renderChanges = false;
    panelFilters.append(filterField);

    // search
    var search = new ui.TextField({
        placeholder: 'Search'
    });
    search.class.add('search');
    search.renderChanges = false;
    panelFilters.append(search);
});
