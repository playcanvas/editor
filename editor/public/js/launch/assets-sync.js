editor.once('load', function() {
    'use strict';

    var app = editor.call('viewport:app');
    var settings = editor.call('project:settings');
    var docs = { };

    editor.method('loadAsset', function (id, callback) {
        var connection = editor.call('realtime:connection');

        var doc = connection.get('assets', '' + id);

        docs[id] = doc;

        // error
        doc.on('error', function (err) {
            if (connection.state === 'connected') {
                console.log(err);
                return;
            }

            editor.emit('realtime:assets:error', err);
        });

        // ready to sync
        doc.on('ready', function () {
            var assetData = doc.getSnapshot();
            if (! assetData) {
                console.error('Could not load asset: ' + id);
                doc.destroy();
                return callback && callback();
            }

            // notify of operations
            doc.on('after op', function (ops, local) {
                if (local) return;

                for (var i = 0; i < ops.length; i++) {
                    editor.emit('realtime:op:assets', ops[i], id);
                }
            });

            // notify of asset load
            assetData.id = id;

            if (assetData.file) {
                assetData.file.url = getFileUrl(assetData.path, assetData.id, assetData.revision, assetData.file.filename);

                if (assetData.file.variants) {
                    for(var key in assetData.file.variants) {
                        assetData.file.variants[key].url = getFileUrl(assetData.path, assetData.id, assetData.revision, assetData.file.variants[key].filename);
                    }
                }
            }

            var asset = editor.call('assets:get', id);
            // asset can exist if we are reconnecting to c3
            var assetExists = !!asset;

            if (!assetExists) {
                asset = new Observer(assetData);
                editor.call('assets:add', asset);

                var _asset = asset.asset = new pc.Asset(assetData.name, assetData.type, assetData.file, assetData.data);
                _asset.id = parseInt(assetData.id);
                _asset.preload = assetData.preload ? assetData.preload : false;

                // tags
                _asset.tags.add(assetData['tags']);

                if (asset.get('type') !== 'script')
                    app.assets.add(_asset);
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
        editor.call('assets:progress', .5);

        var count = 0;
        var scripts = { };

        var legacyScripts = settings.get('use_legacy_scripts');

        var loadScripts = function() {
            var order = settings.get('scripts');

            for(var i = 0; i < order.length; i++) {
                if (! scripts[order[i]])
                    continue;

                app.assets.add(scripts[order[i]].asset);
            }
        };

        var load = function (id) {
            editor.call('loadAsset', id, function (asset) {
                count++;
                editor.call('assets:progress', (count / data.length) * .5 + .5);

                if (! legacyScripts && asset && asset.get('type') === 'script')
                    scripts[asset.get('id')] = asset;

                if (count >= data.length) {
                    if (! legacyScripts)
                        loadScripts();

                    editor.call('assets:progress', 1);
                    editor.emit('assets:load');
                }
            });
        };

        if (data.length) {

            var connection = editor.call('realtime:connection');

            // do bulk subsribe in batches of 'batchSize' assets
            var batchSize = 256;
            var startBatch = 0;
            var total = data.length;

            while (startBatch < total) {
                // start bulk subscribe
                connection.bsStart();
                for(var i = startBatch; i < startBatch + batchSize && i < total; i++) {
                    load(data[i].id);
                }
                // end bulk subscribe and send message to server
                connection.bsEnd();

                startBatch += batchSize;
            }
        } else {
            editor.call('assets:progress', 1);
            editor.emit('assets:load');
        }
    };

    // load all assets
    editor.on('realtime:authenticated', function() {
        Ajax({
            url: '{{url.api}}/projects/{{project.id}}/assets?view=launcher',
            auth: true
        })
        .on('load', function(status, data) {
            onLoad(data);
        })
        .on('progress', function(progress) {
            editor.call('assets:progress', .1 + progress * .4);
        })
        .on('error', function(status, evt) {
            console.log(status, evt);
        });
    });

    editor.call('assets:progress', .1);

    editor.on('assets:remove', function (asset) {
        var id = asset.get('id');
        if (docs[id]) {
            docs[id].destroy();
            delete docs[id];
        }
    });

    var getFileUrl = function (folders, id, revision, filename) {
        var path = '';
        for(var i = 0; i < folders.length; i++) {
            var folder = editor.call('assets:get', folders[i]);
            if (folder) {
                path += encodeURIComponent(folder.get('name')) + '/';
            } else {
                path += 'unknown/';
            }
        }
        return '/assets/files/' + path + encodeURIComponent(filename) + '?id=' + id;
    };

    // hook sync to new assets
    editor.on('assets:add', function(asset) {
        if (asset.sync)
            return;

        asset.sync = new ObserverSync({
            item: asset
        });

        var setting = false;

        asset.on('*:set', function(path, value) {
            if (setting || ! path.startsWith('file') || path.endsWith('.url') || ! asset.get('file'))
                return;

            setting = true;

            var parts = path.split('.');

            if ((parts.length === 1 || parts.length === 2) && parts[1] !== 'variants') {
                asset.set('file.url', getFileUrl(asset.get('path'), asset.get('id'), asset.get('revision'), asset.get('file.filename')));
            } else if (parts.length >= 3 && parts[1] === 'variants') {
                var format = parts[2];
                asset.set('file.variants.' + format + '.url', getFileUrl(asset.get('path'), asset.get('id'), asset.get('revision'), asset.get('file.variants.' + format + '.filename')));
            }

            setting = false;
        });
    });

    // server > client
    editor.on('realtime:op:assets', function(op, id) {
        var asset = editor.call('assets:get', id);
        if (asset) {
            asset.sync.write(op);
        } else {
            console.error('realtime operation on missing asset: ' + op.p[1]);
        }
    });
});
