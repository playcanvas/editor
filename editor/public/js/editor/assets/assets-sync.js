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
    editor.method('assets:create', function (data) {
        var evtAssetAdd = editor.once('assets:add', function(asset) {
            evtAssetAdd = null;
            editor.call('selector:set', 'asset', [ asset ]);
        });

        editor.once('selector:change', function() {
            if (evtAssetAdd)
                evtAssetAdd.unbind();
        });

        Ajax
        .post('{{url.api}}/assets?access_token={{accessToken}}', data)
        .on('error', function(status, evt) {
            if (evtAssetAdd)
                evtAssetAdd.unbind();

            console.log(status, evt);
        });
    });

    // delete asset
    editor.method('assets:delete', function(asset) {
        if (asset.get('type') === 'script') {
            editor.emit('sourcefiles:remove', asset);

            Ajax
            .delete('{{url.api}}/projects/' + config.project.id + '/repositories/directory/sourcefiles/' + asset.get('filename') + '?access_token={{accessToken}}');
        } else {
            editor.call('assets:remove', asset);

            Ajax
            .delete('{{url.api}}/assets/' + asset.get('id') + '?access_token={{accessToken}}')
            .on('error', function(status, evt) {
                console.log(status, evt);
            });
        }
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

    var mappingMaps = [
        'diffuse',
        'specular',
        'emissive',
        'normal',
        'metalness',
        'gloss',
        'opacity',
        'height',
        'ao',
        'light'
    ];

    // hook sync to new assets
    editor.on('assets:add', function(asset) {
        if (asset.sync)
            return;

        // convert material data to flat
        if (asset.get('type') === 'material')
            asset.set('data', editor.call('material:default', asset.get('data')));

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
            if (setting || ! value || ! path.startsWith('file')) return;
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
            asset.sync.write(op);
        } else {
            console.error('realtime operation on missing asset: ' + op.p[1]);
        }
    });
});
