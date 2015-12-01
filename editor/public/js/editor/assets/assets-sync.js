editor.once('load', function() {
    'use strict';

    var syncPaths = [
        'name',
        'preload',
        'scope',
        'data',
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
            // notify of operations
            doc.on('after op', function (ops, local) {
                if (local) return;

                for (var i = 0; i < ops.length; i++) {
                    editor.emit('realtime:op:assets', ops[i], id);
                }
            });

            // notify of asset load
            var assetData = doc.getSnapshot();
            assetData.id = id;

            if (assetData.file)
                assetData.file.url = getFileUrl(assetData.id, assetData.revision, assetData.file.filename);

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

        data = data.response;

        var count = 0;

        var load = function (id) {
            editor.call('loadAsset', id, function (asset) {
                count++;
                editor.call('assets:progress', (count / data.length) * .5 + .5);
                if (count >= data.length) {
                    editor.call('assets:progress', 1);
                    editor.emit('assets:load');
                }
            });
        };

        if (data.length) {
            for(var i = 0; i < data.length; i++) {
                load(data[i].id);
            }
        } else {
            editor.call('assets:progress', 1);
            editor.emit('assets:load');
        }
    };

    // load all assets
    editor.on('realtime:authenticated', function() {
        editor.call('assets:clear');

        Ajax
        .get('{{url.api}}/projects/{{project.id}}/assets?view=designer&access_token={{accessToken}}')
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

    // create asset
    editor.method('assets:create', function (data, fn) {
        var assetId = null;
        var evtAssetAdd = editor.once('assets:add', function(asset) {
            if (! evtAssetAdd && assetId !== parseInt(asset.get('id'), 10))
                return;

            evtAssetAdd = null;
            editor.call('selector:set', 'asset', [ asset ]);
            // navigate to folder too
            var path = asset.get('path');
            if (path.length) {
                editor.call('assets:panel:currentFolder', editor.call('assets:get', path[path.length - 1]));
            } else {
                editor.call('assets:panel:currentFolder', null);
            }
        });

        editor.once('selector:change', function() {
            if (evtAssetAdd) {
                evtAssetAdd.unbind();
                evtAssetAdd = null;
            }
        });

        editor.call('assets:uploadFile', data, function(err, res) {
            if (evtAssetAdd)
                evtAssetAdd = null;

            if (err) {
                editor.call('status:error', err);

                // TODO
                // disk allowance error

                fn(err);

                return;
            }

            assetId = res.asset.id;

            if (fn)
                fn(err, assetId);
        });
    });

    // delete asset
    editor.method('assets:delete', function(list) {
        if (! (list instanceof Array))
            list = [ list ];

        var assets = [ ];

        for(var i = 0; i < list.length; i++) {
            if (list[i].get('type') === 'script') {
                editor.emit('sourcefiles:remove', list[i]);
                Ajax.delete('{{url.api}}/projects/' + config.project.id + '/repositories/directory/sourcefiles/' + list[i].get('filename') + '?access_token={{accessToken}}');
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
        return '/api/files/assets/' + id + '/' + revision + '/' + filename;
    };

    var assetSetThumbnailPaths = function(asset) {
        if (asset.get('type') !== 'texture')
            return;

        if (asset.get('has_thumbnail')) {
            asset.set('thumbnails', {
                's': '/api/assets/' + asset.get('id') + '/thumbnail/small.jpg',
                'm': '/api/assets/' + asset.get('id') + '/thumbnail/medium.jpg',
                'l': '/api/assets/' + asset.get('id') + '/thumbnail/large.jpg',
                'xl': '/api/assets/' + asset.get('id') + '/thumbnail/xlarge.jpg'
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

            asset.set('data', editor.call('material:default', asset.get('data')));
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
            if (setting || (! (path.startsWith('file') && value) && ! (path === 'has_thumbnail' && value && asset.get('file.url'))))
                return;

            setting = true;

            // reset file url
            asset.set('file.url', getFileUrl(asset.get('id'), asset.get('revision'), asset.get('file.filename')));
            // set thumbnails
            assetSetThumbnailPaths(asset);

            setting = false;
        });
    });

    // write asset operations
    editor.method('realtime:assets:op', function(op, id) {
        if (! editor.call('permissions:write') || !docs[id])
            return;

        // console.trace();
        // console.log('out: [ ' + Object.keys(op).filter(function(i) { return i !== 'p' }).join(', ') + ' ]', op.p.join('.'));
        // console.log(op)

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
        var viewport = editor.call('viewport:framework');
        if (!viewport) return;

        // clear ALL asset registry events
        viewport.assets._callbacks = {};
    });
});
