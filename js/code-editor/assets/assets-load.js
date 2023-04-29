import { Observer } from '@playcanvas/observer';
import { Ajax } from '../../common/ajax.js';
import { ObserverSync } from '../../common/observer-sync.js';

editor.once('load', function () {
    const syncPaths = [
        'name',
        'file',
        'data'
    ];

    let totalAssets = 0;
    let loadedAssets = 0;

    const docIndex = {};

    // Load asset from C3 and call callback
    editor.method('assets:loadOne', function (uniqueId, callback) {
        uniqueId = uniqueId.toString(); // ensure id is string
        const connection = editor.call('realtime:connection');
        const assetDoc = connection.get('assets', uniqueId);
        docIndex[uniqueId] = assetDoc;

        let asset;

        // handle errors
        assetDoc.on('error', function (err) {
            log.error(err);
            editor.emit('assets:error', err);
            editor.call('status:error', 'Realtime error for asset "' + (asset ? asset.get('name') : uniqueId) + '": ' + err);
        });

        // mark asset as done
        assetDoc.on('load', function () {
            const data = assetDoc.data;
            data.id = data.item_id.toString();
            data.uniqueId = uniqueId;

            delete data.item_id;
            delete data.branch_id;

            asset = new Observer(data);

            // create observer sync
            asset.sync = new ObserverSync({
                item: asset,
                paths: syncPaths
            });

            // client -> server
            asset.sync.on('op', function (op) {
                if (!editor.call('permissions:write'))
                    return;

                assetDoc.submitOp([op]);
            });

            // server -> client
            assetDoc.on('op', function (ops, local) {
                if (local) return;

                for (let i = 0; i < ops.length; i++) {
                    let dirty = true;

                    // When the file changes this means that the
                    // save operation has finished
                    if (ops[i].p.length === 1 && ops[i].p[0] === 'file') {
                        if (ops[i].oi && ops[i].oi.hash !== asset.get('file.hash')) {
                            dirty = false;
                        }
                    }

                    asset.sync.write(ops[i]);

                    if (!dirty) {
                        editor.emit('documents:dirty', data.id, false);
                    }
                }
            });

            editor.call('assets:add', asset);

            if (callback)
                callback(asset);
        });

        assetDoc.subscribe();
    });


    // Handle asset path changes
    editor.method('assets:fs:paths:patch', function (data) {
        const connection = editor.call('realtime:connection');
        const assets = connection.collections.assets;

        for (let i = 0; i < data.length; i++) {
            if (!assets.hasOwnProperty(data[i].uniqueId))
                continue;

            // force snapshot path data
            assets[data[i].uniqueId].data.path = data[i].path;

            // sync observer
            const observer = editor.call('assets:get', data[i].id);
            if (observer) {
                observer.sync.write({
                    p: ['path'],
                    oi: data[i].path,
                    od: null
                });
            }
        }
    });

    // destroy documents if assets are deleted
    editor.on('assets:remove', function (asset) {
        const doc = docIndex[asset.get('uniqueId')];
        if (doc) {
            doc.unsubscribe();
            doc.destroy();
            delete docIndex[asset.get('uniqueId')];
        }
    });

    const loadEditableAssets = function () {
        editor.call('assets:load:progress', 0);

        Ajax({
            url: '{{url.api}}/projects/{{project.id}}/assets?branchId={{self.branch.id}}&view=codeeditor',
            auth: true
        })
        .on('load', function (status, res) {
            if (!res.length) {
                editor.emit('assets:load');
                editor.call('status:clear');
                return;
            }

            totalAssets = res.length;
            loadedAssets = 0;

            // do bulk subscribe in batches of 'batchSize' assets
            const batchSize = 256;
            let startBatch = 0;
            const connection = editor.call('realtime:connection');

            const onLoad = function () {
                loadedAssets++;
                editor.emit('assets:load:progress', loadedAssets / totalAssets);
                if (totalAssets === loadedAssets) {
                    editor.emit('assets:load');
                    editor.call('status:clear');
                }
            };

            while (startBatch < totalAssets) {
                // start bulk subscribe
                connection.startBulk();
                for (let i = startBatch; i < startBatch + batchSize && i < totalAssets; i++) {
                    editor.call('assets:loadOne', res[i].uniqueId, onLoad);
                }
                // end bulk subscribe and send message to server
                connection.endBulk();

                startBatch += batchSize;
            }
        })
        .on('error', function (status, error) {
            if (error) {
                editor.call('status:error', 'Error: ' + error + '(Status: ' + status + ')');
            } else {
                editor.call('status:error', 'Error - Status ' + status);
            }
        });
    };

    // this is for reconnections
    editor.on('realtime:authenticated', function () {
        for (const id in docIndex) {
            const assetDoc = docIndex[id];

            // check if we are no longer subscribed
            // to the document and re-subscribe
            if (!assetDoc.subscribed) {
                assetDoc.subscribe();
            }

            assetDoc.resume();
        }
    });

    // of first connection load assets
    editor.once('realtime:authenticated', loadEditableAssets);

    // pause any asset operations while we are disconnected
    // and resume when we reauthenticate
    editor.on('realtime:disconnected', function () {
        for (const id in docIndex) {
            docIndex[id].pause();
        }
    });
});
