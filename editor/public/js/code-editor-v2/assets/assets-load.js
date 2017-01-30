editor.once('load', function () {
    'use strict';

    var syncPaths = [
        'name',
        'file',
        'data'
    ];

    var totalAssets = 0;
    var loadedAssets = 0;

    // Load asset from C3 and call callback
    editor.method('assets:loadOne', function (id, callback) {
        var connection = editor.call('realtime:connection');
        var assetDoc = connection.get('assets', id);

        var asset;

        // handle errors
        assetDoc.on('error', function (err) {
            console.error(err);
            editor.emit('assets:error', err);
            editor.call('status:error', 'Realtime error for asset "' + (asset ? asset.get('name') : id) + '": ' + err);
        });

        // mark asset as done
        assetDoc.whenReady(function () {
            var data = assetDoc.getSnapshot();
            data.id = id;
            asset = new Observer(data);

            // create observer sync
            asset.sync = new ObserverSync({
                item: asset,
                paths: syncPaths
            });

            // client -> server
            asset.sync.on('op', function (op) {
                if (! editor.call('permissions:write'))
                    return;

                assetDoc.submitOp([op]);
            });

            // server -> client
            assetDoc.on('after op', function (ops, local) {
                if (local) return;

                for (var i = 0; i < ops.length; i++) {
                    asset.sync.write(ops[i]);

                    // When the file changes this means that the
                    // save operation has finished
                    if (ops[i].p.length === 1 && ops[i].p[0] === 'file') {
                        editor.emit('documents:dirty', id, false);
                    }
                }
            });

            editor.call('assets:add', asset);

            if (callback)
                callback(asset);


        });

        // Every time the 'subscribe' event is fired on the asset document
        // reload the asset content and check if it's different than the document content in
        // order to activate the REVERT button
        assetDoc.on('subscribe', function () {
            assetDoc.whenReady(function () {
                if (asset && asset.get('type') !== 'folder' && asset.get('file.filename')) {
                    // load asset file to check if it has different contents
                    // than the sharejs document
                    editor.call('assets:loadFile', asset);
                }
            });
        });

        assetDoc.subscribe();
    });


    // Load asset file contents and call callback
    editor.method('assets:loadFile', function (asset, fn) {
        Ajax({
            url: '{{url.api}}/assets/' + asset.get('id') + '/file/' + asset.get('file.filename'),
            auth: true,
            notJson: true
        })
        .on('load', function(status, data) {
            asset.set('content', data);

            if (fn)
                fn(null, data);
        })
        .on('error', function (err) {
            if (fn)
                fn(err);
        });
    });

    // Handle asset path changes
    editor.method('assets:fs:paths:patch', function (data) {
        var connection = editor.call('realtime:connection');
        var assets = connection.collections.assets;

        for(var i = 0; i < data.length; i++) {
            if (! assets.hasOwnProperty(data[i].id))
                continue;

            // force snapshot path data
            assets[data[i].id].snapshot.path = data[i].path;

            // sync observer
            var observer = editor.call('assets:get', data[i].id) ;
            if (observer) {
                observer.sync.write({
                    p: [ 'path' ],
                    oi: data[i].path,
                    od: null
                });
            }
        }
    });

    // destroy documents if assets are deleted
    editor.on('assets:remove', function (asset) {
        var connection = editor.call('realtime:connection');
        var doc = connection.getExisting(asset.get('id'));
        if (doc) {
            doc.destroy();
        }
    });

    var loadEditableAssets = function () {
        editor.call('assets:load:progress', 0);

        Ajax({
            url: '{{url.api}}/projects/{{project.id}}/assets?view=codeeditor',
            auth: true
        })
        .on('load', function (status, res) {
            if (! res.length) {
                editor.emit('assets:load');
                editor.call('status:clear');
                return;
            }

            totalAssets = res.length;
            loadedAssets = 0;

            var onLoad = function () {
                loadedAssets++;
                editor.emit('assets:load:progress', loadedAssets / totalAssets);
                if (totalAssets === loadedAssets) {
                    editor.emit('assets:load');
                    editor.call('status:clear');
                }
            };

            res.forEach(function (raw) {
                editor.call('assets:loadOne', raw.id, onLoad);
            });

        })
        .on('error', function (status, error) {
            if (error) {
                editor.call('status:error', 'Error: ' + error + '(Status: ' + status + ')');
            } else {
                editor.call('status:error', 'Error - Status ' + status);
            }
        });
    };

    editor.once('realtime:authenticated', loadEditableAssets);
});