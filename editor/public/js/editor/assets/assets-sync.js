editor.once('load', function () {
    'use strict';

    var legacyScripts = editor.call('settings:project').get('useLegacyScripts');
    var syncPaths = [
        'name',
        'preload',
        'scope',
        'data',
        'meta',
        'file',
        'i18n'
    ];
    var docs = {};

    // try to detect if the browser was inactive for a while e.g.
    // if the computer went to sleep
    const IDLE_CHECK_DELAY = 2000;
    const IDLE_CHECK_SAFE_WINDOW = 10000;

    var lastIdleCheck = Date.now();
    var wasIdle = false;
    var timeoutLoad = null;
    setInterval(() => {
        var t = Date.now();
        var dt = t - lastIdleCheck;
        if (dt > IDLE_CHECK_DELAY + IDLE_CHECK_SAFE_WINDOW) {
            wasIdle = true;
            console.log('Browser was idle for about ' + (dt / 1000) + ' seconds...');
        }
        lastIdleCheck = t;
    }, IDLE_CHECK_DELAY);

    var getFileUrl = function (id, revision, filename) {
        return '/api/assets/' + id + '/file/' + encodeURIComponent(filename) + '?branchId=' + config.self.branch.id;
    };

    editor.method('loadAsset', function (asset, callback) {
        var connection = editor.call('realtime:connection');
        const uniqueId = parseInt(asset.uniqueId, 10);

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
                log.error('Could not load asset: ' + uniqueId);
                editor.call('status:error', 'Could not load asset: ' + uniqueId);
                doc.unsubscribe();
                doc.destroy();
                return callback && callback();
            }

            // notify of operations
            doc.on('op', function (ops, local) {
                if (local) return;

                for (let i = 0; i < ops.length; i++) {
                    editor.emit('realtime:op:assets', ops[i], uniqueId);
                }
            });

            // notify of asset load
            assetData.id = parseInt(assetData.item_id, 10);
            assetData.uniqueId = uniqueId;
            assetData.createdAt = asset.createdAt;

            // delete unnecessary fields
            delete assetData.item_id;
            delete assetData.branch_id;

            if (assetData.file) {
                assetData.file.url = getFileUrl(assetData.id, assetData.revision, assetData.file.filename);

                if (assetData.file.variants) {
                    for (const key in assetData.file.variants) {
                        assetData.file.variants[key].url = getFileUrl(assetData.id, assetData.revision, assetData.file.variants[key].filename);
                    }
                }
            }

            // allow duplicate values in data.frameKeys of sprite asset
            var options = null;
            if (assetData.type === 'sprite') {
                options = {
                    pathsWithDuplicates: ['data.frameKeys']
                };
            }

            var observer = new Observer(assetData, options);
            editor.call('assets:add', observer);

            if (callback)
                callback(observer);
        });

        // subscribe for realtime events
        doc.subscribe();
    });

    editor.method('assets:fs:paths:patch', function (data) {
        var connection = editor.call('realtime:connection');
        var assets = connection.collections.assets;

        for (let i = 0; i < data.length; i++) {
            if (! assets.hasOwnProperty(data[i].uniqueId))
                continue;

            // force snapshot path data
            assets[data[i].uniqueId].data.path = data[i].path;

            // sync observer
            editor.emit('realtime:op:assets', {
                p: ['path'],
                oi: data[i].path,
                od: null
            }, data[i].uniqueId);
        }
    });

    var onLoad = function (data) {
        editor.call('assets:progress', 0.5);

        var count = 0;

        var load = function (asset) {
            editor.call('loadAsset', asset, function () {
                count++;
                editor.call('assets:progress', (count / data.length) * 0.5 + 0.5);
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
                connection.startBulk();
                for (let i = startBatch; i < startBatch + batchSize && i < total; i++) {
                    load(data[i]);
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
        editor.call('assets:clear');

        if (timeoutLoad) {
            clearTimeout(timeoutLoad);
            timeoutLoad = null;
        }

        function loadAll() {
            Ajax({
                url: '{{url.api}}/projects/{{project.id}}/assets?branchId={{self.branch.id}}&view=designer',
                auth: true
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
        }

        if (wasIdle) {
            wasIdle = false;
            // if browser was idle wait for a few
            // seconds before trying to load the assets
            // because the request seems to expire in that case
            editor.call('status:job', 'asset:load', 1);
            timeoutLoad = setTimeout(() => {
                timeoutLoad = null;
                editor.call('status:job', 'asset:load');
                loadAll();
            }, 5000);
        } else {
            loadAll();
        }
    });

    editor.call('assets:progress', 0.1);

    var onAssetSelect = function (asset) {
        editor.call('selector:set', 'asset', [asset]);

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
            editor.once('selector:change', function () {
                if (evtAssetAdd) {
                    evtAssetAdd.unbind();
                    evtAssetAdd = null;
                }
            });
        }

        editor.call('assets:uploadFile', data, function (err, res) {
            if (err) {
                editor.call('status:error', err);

                // TODO
                // disk allowance error

                if (fn) fn(err);

                return;
            }

            if (! noSelect) {
                var asset = editor.call('assets:get', res.id);
                if (asset) {
                    onAssetSelect(asset);
                } else {
                    evtAssetAdd = editor.once('assets:add[' + res.id + ']', onAssetSelect);
                }
            }

            if (fn) fn(err, res.id);
        });
    });

    // delete asset
    editor.method('assets:delete', function (list) {
        if (! (list instanceof Array))
            list = [list];

        var assets = [];

        for (let i = 0; i < list.length; i++) {
            if (legacyScripts && list[i].get('type') === 'script') {
                editor.emit('sourcefiles:remove', list[i]);
                Ajax({
                    url: '{{url.api}}/projects/' + config.project.id + '/repositories/directory/sourcefiles/' + list[i].get('filename'),
                    auth: true,
                    method: 'DELETE'
                });
            } else {
                assets.push(list[i]);
            }
        }

        if (assets.length)
            editor.call('assets:fs:delete', assets);
    });

    editor.on('assets:remove', function (asset) {
        var id = asset.get('uniqueId');
        if (docs[id]) {
            docs[id].unsubscribe();
            docs[id].destroy();
            delete docs[id];
        }
    });

    var assetSetThumbnailPaths = function (asset) {
        if (asset.get('type') !== 'texture' && asset.get('type') !== 'textureatlas')
            return;

        if (asset.get('has_thumbnail')) {
            asset.set('thumbnails', {
                's': '/api/assets/' + asset.get('id') + '/thumbnail/small?branchId=' + config.self.branch.id,
                'm': '/api/assets/' + asset.get('id') + '/thumbnail/medium?branchId=' + config.self.branch.id,
                'l': '/api/assets/' + asset.get('id') + '/thumbnail/large?branchId=' + config.self.branch.id,
                'xl': '/api/assets/' + asset.get('id') + '/thumbnail/xlarge?branchId=' + config.self.branch.id
            });
        } else {
            asset.unset('thumbnails');
        }
    };

    // hook sync to new assets
    editor.on('assets:add', function (asset) {
        if (asset.sync)
            return;

        asset.sync = new ObserverSync({
            item: asset,
            paths: syncPaths
        });

        // client > server
        asset.sync.on('op', function (op) {
            editor.call('realtime:assets:op', op, asset.get('uniqueId'));
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

        asset.on('has_thumbnail:set', function (value) {
            assetSetThumbnailPaths(asset);
        });
    });

    // write asset operations
    editor.method('realtime:assets:op', function (op, uniqueId) {
        if (! editor.call('permissions:write') || !docs[uniqueId])
            return;

        // console.trace();
        // console.log('out: [ ' + Object.keys(op).filter(function(i) { return i !== 'p' }).join(', ') + ' ]', op.p.join('.'));
        // console.log(op);

        docs[uniqueId].submitOp([op]);
    });


    // server > client
    editor.on('realtime:op:assets', function (op, uniqueId) {
        var asset = editor.call('assets:getUnique', uniqueId);
        if (asset) {
            // console.log('in: ' + id + ' [ ' + Object.keys(op).filter(function(i) { return i !== 'p' }).join(', ') + ' ]', op.p.join('.'));
            // console.log(op);
            asset.sync.write(op);
        } else {
            log.error('realtime operation on missing asset: ' + op.p[1]);
        }
    });

    // handle disconnection
    editor.on('realtime:disconnected', function () {
        var app = editor.call('viewport:app');
        if (app) {
            // clear ALL asset registry events
            // TODO: This will mean that after re-connection some events
            // that were registered on the asset registry will not be re-registered.
            // That might break some stuff. E.g. currently translations in the Editor
            // will not re-appear after re-connection because they rely on the asset registry's
            // 'add' event which gets removed.
            app.assets._callbacks = { };
        }

        editor.call('assets:clear');
    });
});
