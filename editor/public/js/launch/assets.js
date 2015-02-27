app.once('load', function() {
    'use strict';

    var framework = app.call('viewport');


    var assets = new ObserverList();
    assets.on('add', function (asset) {
        // framework.assets.createAndAdd(asset._id, asset);
    });

    // loaded all assets
    var onLoad = function(data) {
        data = data.response;

        var toc = {
            assets: {}
        };
        for(var i = 0; i < data.length; i++) {
            if (data[i].source)
                continue;

            // TODO
            // this is workaround to convert from array to key-value material properties
            // if (data[i].type == 'material') {
            //     data[i].data = editor.call('material:listToMap', data[i].data);
            // }

            var asset = new Observer(data[i]);
            assets.add(asset);

            toc.assets[asset.get("id")] = asset.json();
        }

        framework.assets.addGroup(config.scene.id, toc);

        var assetList = framework.assets.list(config.scene.id);
        framework.assets.load(assetList).then(function () {
            app.emit('assets:load');
        });



        // editor.call('assets:progress', 1);
        // editor.emit('assets:load');
    };

    // load assets
    Ajax.get('{{url.api}}/projects/{{project.id}}/assets?view=designer&access_token={{accessToken}}')
        .on('load', function(status, data) {
            onLoad(data);
        })
        .on('progress', function(progress) {
            // editor.call('assets:progress', .1 + progress * .4);
        })
        .on('error', function(status, evt) {
            console.log(status, evt);
        });
});
