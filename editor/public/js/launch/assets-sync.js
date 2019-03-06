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
    var useBundles = (queryParams.useBundles !== 'false');

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

                if (asset.get('type') !== 'script' || ! asset.get('preload')) {
                    // app.assets.add(_asset);
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

    var createEngineAsset = function (asset) {
        // if engine asset already exists return
        if (app.assets.get(asset.get('id'))) return;

        // handle bundle assets
        if (useBundles && asset.get('type') === 'bundle') {
            var sync = asset.sync.enabled;
            asset.sync.enabled = false;

            // get the assets in this bundle
            // that have a file
            var assetsInBundle = asset.get('data.assets').map(function (id) {
                return editor.call('assets:get', id);
            }).filter(function (asset) {
                return asset && asset.has('file.filename');
            });

            if (assetsInBundle.length) {
                // set the main filename and url for the bundle asset
                asset.set('file', {});
                asset.set('file.filename', asset.get('name') + '.tar');
                asset.set('file.url', getFileUrl(asset.get('path'), asset.get('id'), asset.get('revision'), asset.get('file.filename')));

                // find assets with variants
                var assetsWithVariants = assetsInBundle.filter(function (asset) {
                    return asset.has('file.variants');
                });

                ['dxt', 'etc1', 'etc2', 'pvr'].forEach(function (variant) {
                    // search for assets with the specified variants and if some
                    // exist then generate the variant file
                    for (var i = 0, len = assetsWithVariants.length; i < len; i++) {
                        if (assetsWithVariants[i].has('file.variants.' + variant)) {
                            if (! asset.has('file.variants')) {
                                asset.set('file.variants', {});
                            }

                            var filename = asset.get('name') + '-' + variant + '.tar';
                            asset.set('file.variants.' + variant, {
                                filename: filename,
                                url: getFileUrl(asset.get('path'), asset.get('id'), asset.get('revision'), filename)

                            });
                            return;
                        }
                    }
                });
            }

            asset.sync.enabled = sync;
        }

        if (useBundles && asset.get('type') !== 'bundle') {
            // if the asset is in a bundle then replace its url with the url that it's supposed to have in the bundle
            if (editor.call('assets:bundles:containAsset', asset.get('id'))) {
                var file = asset.get('file');
                if (file) {
                    var sync = asset.sync.enabled;
                    asset.sync.enabled = false;

                    asset.set('file.url', getFileUrl(asset.get('path'), asset.get('id'), asset.get('revision'), file.filename, true));
                    if (file.variants) {
                        for (var key in file.variants) {
                            asset.set('file.variants.' + key + '.url', getFileUrl(asset.get('path'), asset.get('id'), asset.get('revision'), file.variants[key].filename, true));
                        }
                    }

                    asset.sync.enabled = sync;
                }
            }
        }

        // create the engine asset
        var assetData = asset.json();
        var engineAsset = asset.asset = new pc.Asset(assetData.name, assetData.type, assetData.file, assetData.data);
        engineAsset.id = parseInt(assetData.id, 10);
        engineAsset.preload = assetData.preload ? assetData.preload : false;

        // tags
        engineAsset.tags.add(assetData.tags);

        // add to the asset registry
        app.assets.add(engineAsset);
    };

    var onLoad = function (data) {
        editor.call('assets:progress', 0.5);

        var total = data.length;
        if (!total) {
            editor.call('assets:progress', 1);
            editor.emit('assets:load');
        }

        var count = 0;
        var scripts = { };

        var legacyScripts = settings.get('useLegacyScripts');

        var loadScripts = function () {
            var order = settings.get('scripts');

            for (var i = 0; i < order.length; i++) {
                if (! scripts[order[i]])
                    continue;

                var asset = editor.call('assets:get', order[i]);
                if (asset) {
                    createEngineAsset(asset);
                }
            }
        };

        var load = function (uniqueId) {
            editor.call('loadAsset', uniqueId, function (asset) {
                count++;
                editor.call('assets:progress', (count / total) * 0.5 + 0.5);

                if (! legacyScripts && asset && asset.get('type') === 'script')
                    scripts[asset.get('id')] = asset;

                if (count === total) {
                    if (! legacyScripts)
                        loadScripts();

                    // sort assets by script first and then by bundle
                    var assets = editor.call('assets:list');
                    assets.sort(function (a, b) {
                        var typeA = a.get('type');
                        var typeB = b.get('type');
                        if (typeA === 'script' && typeB !== 'script') {
                            return -1;
                        }
                        if (typeB === 'script' && typeA !== 'script') {
                            return 1;
                        }
                        if (typeA === 'bundle' && typeB !== 'bundle') {
                            return -1;
                        }
                        if (typeB === 'bundle' && typeA !== 'bundle') {
                            return 1;
                        }
                        return 0;
                    });

                    // create runtime asset for every asset observer
                    assets.forEach(createEngineAsset);

                    editor.call('assets:progress', 1);
                    editor.emit('assets:load');
                }
            });
        };

        var connection = editor.call('realtime:connection');

        // do bulk subsribe in batches of 'batchSize' assets
        var batchSize = 256;
        var startBatch = 0;

        while (startBatch < total) {
            // start bulk subscribe
            connection.startBulk();
            for (var i = startBatch; i < startBatch + batchSize && i < total; i++) {
                assetNames[data[i].id] = data[i].name;
                load(data[i].uniqueId);
            }
            // end bulk subscribe and send message to server
            connection.endBulk();

            startBatch += batchSize;
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

    var getFileUrl = function (folders, id, revision, filename, useBundles) {
        if (useBundles) {
            // if we are using bundles then this URL should be the URL
            // in the tar archive
            return ['files/assets', id, revision, filename].join('/');
        }

        var path = '';
        for (var i = 0; i < folders.length; i++) {
            var folder = editor.call('assets:get', folders[i]);
            if (folder) {
                path += encodeURIComponent(folder.get('name')) + '/';
            } else {
                path += (assetNames[folders[i]] || 'unknown') + '/';
            }
        }
        return 'assets/files/' + path + encodeURIComponent(filename) + '?id=' + id + '&branchId=' + config.self.branch.id;
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
