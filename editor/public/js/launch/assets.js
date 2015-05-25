app.once('load', function() {
    'use strict';

    var framework = app.call('viewport');

    var assets = new ObserverList();
    assets.index = 'id';

    // list assets
    app.method('assets:list', function () {
        return assets.array();
    });

    // allow adding assets
    app.method('assets:add', function(asset) {
        assets.add(asset);
    });

    // allow removing assets
    app.method('assets:remove', function(asset) {
        assets.remove(asset);
        asset.destroy();
    });

    // get asset by id
    app.method('assets:get', function(id) {
        return assets.get(id);
    });

    // find assets by function
    app.method('assets:find', function(fn) {
        return assets.find(fn);
    });

    // find one asset by function
    app.method('assets:findOne', function(fn) {
        return assets.findOne(fn);
    });

    // publish added asset
    assets.on('add', function(asset) {
        app.emit('assets:add[' + asset.get('id') + ']', asset);
        app.emit('assets:add', asset);
    });

    // publish remove asset
    assets.on('remove', function(asset) {
        app.emit('assets:remove', asset);
    });


    // loaded all assets
    var onLoad = function(data) {
        data = data.response;

        for(var i = 0; i < data.length; i++) {
            if (data[i].source)
                continue;

            var asset = new Observer(data[i]);

            editor.call('assets:add', asset);
            assets.add(asset);

            var adata = asset.json()
            var _asset = new pc.Asset(adata.name, adata.type, adata.file, adata.data);
            _asset.id = parseInt(adata.id);
            _asset.preload = adata.preload ? adata.preload : false;
            framework.assets.add(_asset);
        }

        app.emit('assets:load');
    };

    // load assets
    Ajax.get('{{url.api}}/projects/{{project.id}}/assets?view=designer&access_token={{accessToken}}')
        .on('load', function(status, data) {
            onLoad(data);
        })
        .on('error', function(status, evt) {
            console.log(status, evt);
        });

});
