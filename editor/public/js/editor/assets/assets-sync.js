editor.once('load', function() {
    'use strict';

    var legacyScripts = editor.call('project:settings').get('use_legacy_scripts');
    var syncPaths = [
        'name',
        'preload',
        'scope',
        'data',
        'meta',
        'file'
    ];
    var docs = {};

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
                editor.call('status:error', 'Could not load asset: ' + id);
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
                assetData.file.url = getFileUrl(assetData.id, assetData.revision, assetData.file.filename);

                if (assetData.file.variants) {
                    for(var key in assetData.file.variants) {
                        assetData.file.variants[key].url = getFileUrl(assetData.id, assetData.revision, assetData.file.variants[key].filename);
                    }
                }
            }

            var asset = new Observer(assetData);
            editor.call('assets:add', asset);

            if (callback)
                callback(asset);
        });

        // subscribe for realtime events
        doc.subscribe();
    });

    editor.method('assets:fs:paths:patch', function(data) {
        var connection = editor.call('realtime:connection');
        var assets = connection.collections.assets;

        for(var i = 0; i < data.length; i++) {
            if (! assets.hasOwnProperty(data[i].id))
                continue;

            // force snapshot path data
            assets[data[i].id].snapshot.path = data[i].path;

            // sync observer
            editor.emit('realtime:op:assets', {
                p: [ 'path' ],
                oi: data[i].path,
                od: null
            }, data[i].id);
        }
    });

    var onLoad = function(data) {
        editor.call('assets:progress', .5);

        var count = 0;

        var load = function (id) {
            editor.call('loadAsset', id, function () {
                count++;
                editor.call('assets:progress', (count / data.length) * .5 + .5);
                if (count >= data.length) {
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
        editor.call('assets:clear');

        Ajax({
            url: '{{url.api}}/projects/{{project.id}}/assets?view=designer',
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

    editor.call('assets:progress', 0.1);

    var onAssetSelect = function(asset) {
        editor.call('selector:set', 'asset', [ asset ]);

        // navigate to folder too
        var path = asset.get('path');
        if (path.length) {
            editor.call('assets:panel:currentFolder', editor.call('assets:get', path[path.length - 1]));
        } else {
            editor.call('assets:panel:currentFolder', null);
        }
    };

    // create asset
    editor.method('assets:create', function (data, fn, noSelect) {
        var evtAssetAdd;

        if (! noSelect) {
            editor.once('selector:change', function() {
                if (evtAssetAdd) {
                    evtAssetAdd.unbind();
                    evtAssetAdd = null;
                }
            });
        }

        editor.call('assets:uploadFile', data, function(err, res) {
            if (err) {
                editor.call('status:error', err);

                // TODO
                // disk allowance error

                if (fn) fn(err);

                return;
            }

            if (! noSelect) {
                var asset = editor.call('assets:get', res.asset.id);
                if (asset) {
                    onAssetSelect(asset);
                } else {
                    evtAssetAdd = editor.once('assets:add[' + res.asset.id + ']', onAssetSelect);
                }
            }

            if (fn) fn(err, res.asset.id);
        });
    });

    // delete asset
    editor.method('assets:delete', function(list) {
        if (! (list instanceof Array))
            list = [ list ];

        var assets = [ ];

        for(var i = 0; i < list.length; i++) {
            if (legacyScripts && list[i].get('type') === 'script') {
                editor.emit('sourcefiles:remove', list[i]);
                Ajax({
                    url: '{{url.api}}/projects/' + config.project.id + '/repositories/directory/sourcefiles/' + list[i].get('filename'),
                    auth: true,
                    method: 'DELETE'
                })
            } else {
                assets.push(list[i]);
            }
        }

        if (assets.length)
            editor.call('assets:fs:delete', assets);
    });

    editor.on('assets:remove', function (asset) {
        var id = asset.get('id');
        if (docs[id]) {
            docs[id].destroy();
            delete docs[id];
        }
    });

    var getFileUrl = function (id, revision, filename) {
        return '/api/assets/' + id + '/file/' + encodeURIComponent(filename);
    };

    var assetSetThumbnailPaths = function(asset) {
        if (asset.get('type') !== 'texture')
            return;

        if (asset.get('has_thumbnail')) {
            asset.set('thumbnails', {
                's': '/api/assets/' + asset.get('id') + '/thumbnail/small',
                'm': '/api/assets/' + asset.get('id') + '/thumbnail/medium',
                'l': '/api/assets/' + asset.get('id') + '/thumbnail/large',
                'xl': '/api/assets/' + asset.get('id') + '/thumbnail/xlarge'
            });
        } else {
            asset.unset('thumbnails');
        }
    };

    // hook sync to new assets
    editor.on('assets:add', function(asset) {
        if (asset.sync)
            return;

        // convert material data to flat
        if (asset.get('type') === 'material') {
            // store missing tilings / offset before we set default values
            editor.call('material:rememberMissingFields', asset);

            var assetData = asset.get('data');
            if (assetData)
                asset.set('data', editor.call('material:default', assetData));
        }

        asset.sync = new ObserverSync({
            item: asset,
            paths: syncPaths
        });

        // client > server
        asset.sync.on('op', function(op) {
            editor.call('realtime:assets:op', op, asset.get('id'));
        });

        // set thumbnails
        assetSetThumbnailPaths(asset);

        var setting = false;

        asset.on('*:set', function (path, value) {
            if (setting || ! path.startsWith('file') || path.endsWith('.url') || ! asset.get('file'))
                return;

            setting = true;

            var parts = path.split('.');

            if ((parts.length === 1 || parts.length === 2) && parts[1] !== 'variants') {
                // reset file url
                asset.set('file.url', getFileUrl(asset.get('id'), asset.get('revision'), asset.get('file.filename')));
                // set thumbnails
                assetSetThumbnailPaths(asset);
            } else if (parts.length >= 3 && parts[1] === 'variants') {
                var format = parts[2];
                asset.set('file.variants.' + format + '.url', getFileUrl(asset.get('id'), asset.get('revision'), asset.get('file.variants.' + format + '.filename')));
            }

            setting = false;
        });

        asset.on('has_thumbnail:set', function(value) {
            assetSetThumbnailPaths(asset);
        });
    });

    // write asset operations
    editor.method('realtime:assets:op', function(op, id) {
        if (! editor.call('permissions:write') || !docs[id])
            return;

        // console.trace();
        // console.log('out: [ ' + Object.keys(op).filter(function(i) { return i !== 'p' }).join(', ') + ' ]', op.p.join('.'));
        // console.log(op);

        docs[id].submitOp([ op ]);
    });


    // server > client
    editor.on('realtime:op:assets', function(op, id) {
        var asset = editor.call('assets:get', id);
        if (asset) {
            // console.log('in: ' + id + ' [ ' + Object.keys(op).filter(function(i) { return i !== 'p' }).join(', ') + ' ]', op.p.join('.'));
            // console.log(op);
            asset.sync.write(op);
        } else {
            console.error('realtime operation on missing asset: ' + op.p[1]);
        }
    });

    // handle disconnection
    editor.on('realtime:disconnected', function () {
        var viewport = editor.call('viewport:app');
        if (!viewport) return;

        // clear ALL asset registry events
        viewport.assets._callbacks = {};
    });
});
