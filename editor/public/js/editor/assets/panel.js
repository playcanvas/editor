(function() {
    'use strict';

    // var overlay = new ui.Panel();
    // overlay.class.add('overlay');
    // assetsPanel.append(overlay);

    // var loading = new ui.Progress();
    // loading.on('progress:100', function() {
    //     overlay.hidden = true;
    // });
    // overlay.append(loading);

    var grid = new ui.Grid();
    grid.class.add('assets');
    assetsPanel.append(grid);

    var assetsIndex = { };


    grid.on('select', function(item) {
        msg.call('selector:add', 'asset', item.asset);
    });

    grid.on('deselect', function(item) {
        msg.call('selector:remove', item.asset);
    });


    // selector reflect in list
    msg.on('selector:add', function(asset, type) {
        if (type !== 'asset')
            return;

        assetsIndex[asset.id].selected = true;
    });
    msg.on('selector:remove', function(asset, type) {
        if (type !== 'asset')
            return;

        assetsIndex[asset.id].selected = false;
    });


    msg.on('assets:add', function(asset) {
        var item = new ui.GridItem();
        item.asset = asset;
        item.class.add('type-' + asset.type);
        grid.append(item);

        assetsIndex[asset.id] = item;

        if (asset.file && asset.type == 'texture') {
            item.style.backgroundImage = 'url("http://playcanvas.dev/api/' + asset.file.url + '")';
        }

        var icon = document.createElement('div');
        icon.classList.add('icon');
        item.element.appendChild(icon);
    });

    msg.on('assets:remove', function(asset) {
        assetsIndex[asset.id].destroy();
    });
})();







