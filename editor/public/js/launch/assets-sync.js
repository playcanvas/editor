editor.once('load', function () {
    'use strict';

    var app = editor.call('viewport:app');
    if (! app) return; // webgl not available

    var settings = editor.call('settings:project');
    var docs = { };

    var assetNames = { };

    var queryParams = (new pc.URI(window.location.href)).getQuery();
    var concatenateScripts = (queryParams.concatenateScripts === 'true');
    var concatenatedScriptsUrl = '/projects/' + config.project.id + '/concatenated-scripts/scripts.js?branchId=' + config.self.branch.id;

    var remainingBundles = 0;
    var skippedAssets = [];

    editor.method('loadAsset', function (uniqueId, callback) {
        var connection = editor.call('realtime:connection');

        var doc = connection.get('assets', '' + uniqueId);

        docs[uniqueId] = doc;

        // error
        doc.on('error', function (err) {
            if (connection.state === 'connected') {
                console.log(err);
                return;
            }

            editor.emit('realtime:assets:error', err);
        });

        // ready to sync
        doc.on('load', function () {
            var assetData = doc.data;
            if (! assetData) {
                console.error('Could not load asset: ' + uniqueId);
                doc.unsubscribe();
                doc.destroy();
                return callback && callback();
            }

            // notify of operations
            doc.on('op', function (ops, local) {
                if (local) return;

                for (var i = 0; i < ops.length; i++) {
                    editor.emit('realtime:op:assets', ops[i], uniqueId);
                }
            });

            assetData.id = parseInt(assetData.item_id, 10);
            assetData.uniqueId = parseInt(uniqueId, 10);

            // delete unecessary fields
            delete assetData.item_id;
            delete assetData.branch_id;

            if (assetData.file) {
                if (concatenateScripts && assetData.type === 'script' && assetData.preload) {
                    assetData.file.url = concatenatedScriptsUrl;
                } else {
                    assetData.file.url = getFileUrl(assetData.path, assetData.id, assetData.revision, assetData.file.filename);
                }

                if (assetData.file.variants) {
                    for (var key in assetData.file.variants) {
                        assetData.file.variants[key].url = getFileUrl(assetData.path, assetData.id, assetData.revision, assetData.file.variants[key].filename);
                    }
                }
            }

            var asset = editor.call('assets:get', assetData.id);
            // asset can exist if we are reconnecting to c3
            var assetExists = !!asset;

            if (!assetExists) {
                var options = null;

                // allow duplicate values in data.frameKeys of sprite asset
                if (assetData.type === 'sprite') {
                    options = {
                        pathsWithDuplicates: ['data.frameKeys']
                    };
                }

                asset = new Observer(assetData, options);
                editor.call('assets:add', asset);

                var _asset = asset.asset = new pc.Asset(assetData.name, assetData.type, assetData.file, assetData.data);
                _asset.id = parseInt(assetData.id, 10);
                _asset.preload = assetData.preload ? assetData.preload : false;

                // tags
                _asset.tags.add(assetData.tags);

                var addAsset = false;
                if (asset.get('type') === 'script') {
                    if (!asset.get('preload')) {
                        addAsset = true;
                    }
                } else if (asset.get('type') === 'bundle') {
                    addAsset = true;
                    remainingBundles--;
                } else {
                    if (remainingBundles === 0) {
                        addAsset = true;
                    } else {
                        skippedAssets.push(_asset);
                    }
                }

                if (addAsset) {
                    app.assets.add(_asset);
                }
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

    var onLoad = function (data) {
        editor.call('assets:progress', 0.5);

        var count = 0;
        var scripts = { };

        var legacyScripts = settings.get('useLegacyScripts');

        var loadScripts = function () {
            var order = settings.get('scripts');

            for (var i = 0; i < order.length; i++) {
                if (! scripts[order[i]])
                    continue;

                // Make sure script hasn't been added already
                // This shouldn't happen it might only happen if
                // for some reason the script order contains a non-preloaded
                // script - non-preloaded scripts have already been added to the
                // registry in `loadAsset`
                if (! app.assets.get(order[i])) {
                    app.assets.add(scripts[order[i]].asset);
                }
            }
        };

        var load = function (uniqueId) {
            editor.call('loadAsset', uniqueId, function (asset) {
                count++;
                editor.call('assets:progress', (count / data.length) * 0.5 + 0.5);

                if (! legacyScripts && asset && asset.get('type') === 'script')
                    scripts[asset.get('id')] = asset;

                if (count >= data.length) {

                    // add assets that we skipped due to waiting
                    // for bundles to be added first
                    for (var i = 0, len = skippedAssets.length; i < len; i++) {
                        app.assets.add(skippedAssets[i]);
                    }
                    skippedAssets.length = 0;

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
                connection.startBulk();
                for (var i = startBatch; i < startBatch + batchSize && i < total; i++) {
                    if (data[i].type === 'bundle') {
                        remainingBundles++;
                    }

                    assetNames[data[i].id] = data[i].name;
                    load(data[i].uniqueId);
                }
                // end bulk subscribe and send message to server
                connection.endBulk();

                startBatch += batchSize;
            }
        } else {
            editor.call('assets:progress', 1);
            editor.emit('assets:load');
        }
    };

    // load all assets
    editor.on('realtime:authenticated', function () {
        Ajax({
            url: '{{url.api}}/projects/{{project.id}}/assets?branchId={{self.branch.id}}&view=launcher',
            auth: true,
            cookies: true
        })
        .on('load', function (status, data) {
            onLoad(data);
        })
        .on('progress', function (progress) {
            editor.call('assets:progress', 0.1 + progress * 0.4);
        })
        .on('error', function (status, evt) {
            console.log(status, evt);
        });
    });

    editor.call('assets:progress', 0.1);

    editor.on('assets:remove', function (asset) {
        var id = asset.get('uniqueId');
        if (docs[id]) {
            docs[id].unsubscribe();
            docs[id].destroy();
            delete docs[id];
        }
    });

    var getFileUrl = function (folders, id, revision, filename) {
        var path = '';
        for (var i = 0; i < folders.length; i++) {
            var folder = editor.call('assets:get', folders[i]);
            if (folder) {
                path += encodeURIComponent(folder.get('name')) + '/';
            } else {
                path += (assetNames[folders[i]] || 'unknown') + '/';
            }
        }
        return '/assets/files/' + path + encodeURIComponent(filename) + '?id=' + id + '&branchId=' + config.self.branch.id;
    };

    // hook sync to new assets
    editor.on('assets:add', function (asset) {
        if (asset.sync)
            return;

        asset.sync = new ObserverSync({
            item: asset
        });

        var setting = false;

        asset.on('*:set', function (path, value) {
            if (setting || ! path.startsWith('file') || path.endsWith('.url') || ! asset.get('file'))
                return;

            setting = true;

            var parts = path.split('.');

            // NOTE: if we have concatenated scripts then this will reset the file URL to the original URL and not the
            // concatenated URL which is what we want for hot reloading
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
    editor.on('realtime:op:assets', function (op, uniqueId) {
        var asset = editor.call('assets:getUnique', uniqueId);
        if (asset) {
            asset.sync.write(op);
        } else {
            console.error('realtime operation on missing asset: ' + op.p[1]);
        }
    });
});
