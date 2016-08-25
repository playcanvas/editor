app.once('load', function() {
    'use strict';

    var framework = app.call('viewport');
    var settings = app.call('project:settings');
    var docs = { };

    app.method('loadAsset', function (id, callback) {
        var connection = app.call('realtime:connection');

        var doc = connection.get('assets', '' + id);

        docs[id] = doc;

        // error
        doc.on('error', function (err) {
            if (connection.state === 'connected') {
                console.log(err);
                return;
            }

            app.emit('realtime:assets:error', err);
        });

        // ready to sync
        doc.on('ready', function () {
            // notify of operations
            doc.on('after op', function (ops, local) {
                if (local) return;

                for (var i = 0; i < ops.length; i++) {
                    app.emit('realtime:op:assets', ops[i], id);
                }
            });

            // notify of asset load
            var assetData = doc.getSnapshot();
            assetData.id = id;

            if (assetData.file)
                assetData.file.url = getFileUrl(assetData.path, assetData.id, assetData.revision, assetData.file.filename);

            var asset = editor.call('assets:get', id);
            // asset can exist if we are reconnecting to c3
            var assetExists = !!asset;

            if (!assetExists) {
                asset = new Observer(assetData);
                app.call('assets:add', asset);

                var _asset = asset.asset = new pc.Asset(assetData.name, assetData.type, assetData.file, assetData.data);
                _asset.id = parseInt(assetData.id);
                _asset.preload = assetData.preload ? assetData.preload : false;

                // tags
                _asset.tags.add(assetData['tags']);

                if (asset.get('type') !== 'script')
                    framework.assets.add(_asset);
            } else {
                for (var key in assetData)
                    asset.set(key, assetData[key]);
            }

            if (callback)
                callback(asset);
        });

        // subscribe for realtime events
        doc.subscribe();
    });

    var onLoad = function(data) {
        app.call('assets:progress', .5);

        var count = 0;
        var scripts = { };

        var legacyScripts = settings.get('use_legacy_scripts');

        var loadScripts = function() {
            var order = settings.get('scripts');

            for(var i = 0; i < order.length; i++) {
                if (! scripts[order[i]])
                    continue;

                framework.assets.add(scripts[order[i]].asset);
            }
        };

        var load = function (id) {
            app.call('loadAsset', id, function (asset) {
                count++;
                app.call('assets:progress', (count / data.length) * .5 + .5);

                if (! legacyScripts && asset.get('type') === 'script')
                    scripts[asset.get('id')] = asset;

                if (count >= data.length) {
                    if (! legacyScripts)
                        loadScripts();

                    app.call('assets:progress', 1);
                    app.emit('assets:load');
                }
            });
        };

        if (data.length) {
            for(var i = 0; i < data.length; i++) {
                load(data[i].id);
            }
        } else {
            app.call('assets:progress', 1);
            app.emit('assets:load');
        }
    };

    // load all assets
    app.on('realtime:authenticated', function() {
        Ajax
        .get('{{url.api}}/projects/{{project.id}}/assets?view=launcher&access_token={{accessToken}}')
        .on('load', function(status, data) {
            onLoad(data);
        })
        .on('progress', function(progress) {
            app.call('assets:progress', .1 + progress * .4);
        })
        .on('error', function(status, evt) {
            console.log(status, evt);
        });
    });

    app.call('assets:progress', .1);

    app.on('assets:remove', function (asset) {
        var id = asset.get('id');
        if (docs[id]) {
            docs[id].destroy();
            delete docs[id];
        }
    });

    var getFileUrl = function (folders, id, revision, filename) {
        var path = '';
        for(var i = 0; i < folders.length; i++) {
            var folder = app.call('assets:get', folders[i]);
            if (folder) {
                path += encodeURIComponent(folder.get('name')) + '/';
            } else {
                path += 'unknown/';
            }
        }
        return '/assets/files/' + path + encodeURIComponent(filename) + '?id=' + id;
    };

    // hook sync to new assets
    app.on('assets:add', function(asset) {
        if (asset.sync)
            return;

        asset.sync = new ObserverSync({
            item: asset
        });

        asset.on('file:set', function(value) {
            if (! value) return;
            var state = asset.sync.enabled;
            asset.sync.enabled = false;
            asset.set('file.url', getFileUrl(asset.get('path'), asset.get('id'), asset.get('revision'), asset.get('file.filename')));
            asset.sync.enabled = state;
        });
    });

    // server > client
    app.on('realtime:op:assets', function(op, id) {
        var asset = app.call('assets:get', id);
        if (asset) {
            asset.sync.write(op);
        } else {
            console.error('realtime operation on missing asset: ' + op.p[1]);
        }
    });
});
