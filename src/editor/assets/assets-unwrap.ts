import { WorkerClient } from '@/core/worker/worker-client';

editor.once('load', () => {
    const activeWorkers = new Map();

    editor.method('assets:model:unwrap', (asset, args, callback) => {
        const assetId = asset.get('id');

        if (asset.get('type') !== 'model' || !asset.has('file.filename') || activeWorkers.has(assetId)) {
            return;
        }
        if (typeof args === 'function') {
            callback = args;
        }
        if (typeof args !== 'object') {
            args = {};
        }

        args = args || {};

        const filename = asset.get('file.filename');

        // N.B. Update to use frontend URL
        const workerClient = new WorkerClient(`${config.url.frontend}js/assets-unwrap.worker.js`);
        activeWorkers.set(assetId, workerClient);

        workerClient.once('ready', () => {
            workerClient.on('start', (data, area) => {
                // save area
                asset.set('data.area', area);

                // upload blob as dds
                editor.call('assets:uploadFile', {
                    file: new Blob([JSON.stringify(data)], { type: 'application/json' }),
                    name: filename,
                    asset: asset,
                    type: 'model'
                }, (err) => {
                    // remove from unwrapping list
                    workerClient.stop();
                    activeWorkers.delete(assetId);

                    // render
                    editor.call('viewport:render');
                    // callback
                    callback?.(err, asset);
                    // emit global event
                    editor.emit('assets:model:unwrap', asset);
                });
            });

            workerClient.on('progress', (val) => {
                editor.emit(`assets:model:unwrap:progress:${assetId}`, val);
                editor.emit('assets:model:unwrap:progress', asset, val);
            });

            workerClient.send('start', assetId, filename, args.padding || 2.0);
        });

        workerClient.on('error', (err) => {
            callback?.(err);
            workerClient.stop();
            activeWorkers.delete(assetId);
        });

        workerClient.start();
    });


    editor.method('assets:model:unwrap:cancel', (asset) => {
        const assetId = asset.get('id');
        const workerClient = activeWorkers.get(assetId);

        workerClient?.stop();
        activeWorkers.delete(assetId);
    });

    editor.method('assets:model:area', (asset, callback) => {
        const assetId = asset.get('id');
        if (asset.get('type') !== 'model' || !asset.has('file.filename')) {
            return;
        }

        const filename = asset.get('file.filename');

        const workerClient = new WorkerClient(`${config.url.frontend}js/assets-unwrap.worker.js`);
        workerClient.once('ready', () => {
            workerClient.once('area', (data, area) => {
                workerClient.stop();
                asset.set('data.area', area || null);
                callback?.(null, asset, area || null);
            });

            workerClient.send('area', assetId, filename);
        });

        workerClient.on('error', (err) => {
            workerClient.stop();
            callback?.(err);
        });

        workerClient.start();
    });
});
