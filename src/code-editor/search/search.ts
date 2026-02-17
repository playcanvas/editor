import type { Observer } from '@playcanvas/observer';

import { WorkerClient } from '@/core/worker/worker-client';

editor.once('load', () => {
    const workerClient = new WorkerClient(`${config.url.frontend}js/search.worker.js`);

    let todo = 0;
    let done = 0;
    let ignored = 0;

    const checkDone = () => {
        if (todo !== done) {
            return;
        }
        workerClient.stop();
        editor.emit('editor:search:files:end');
    };

    const checkCanDiscard = (asset: Observer, includeRegex: RegExp | null, excludeRegex: RegExp | null) => {
        if (!includeRegex && !excludeRegex) {
            return false;
        }

        const path = editor.call('assets:virtualPath', asset);
        if (!path) {
            return true; // discard assets with invalid paths
        }

        // if include is present, discard asset if there's no match to the include regex
        const includeMatch = path.match(includeRegex);
        if (includeRegex != null && !(includeMatch !== null && includeMatch.length >= 1)) {
            return true;
        }

        // if exclude is present, discard asset if there is a match to the exclude regex
        const excludeMatch = path.match(excludeRegex);
        if (excludeRegex != null && excludeMatch !== null && excludeMatch.length >= 1) {
            ignored++;
            return true;
        }

        return false;
    };

    workerClient.on('search', (data) => {
        done++;
        editor.emit('editor:search:files:results', data, done, ignored, todo);
        checkDone();
    });

    editor.method('editor:search:files', (regex, includeRegex, excludeRegex) => {
        editor.emit('editor:search:files:start');

        workerClient.stop();
        workerClient.once('ready', () => {
            const assets = editor.call('assets:list');

            todo = 0;
            done = 0;
            ignored = 0;

            for (let i = 0, length = assets.length; i < length; i++) {
                const asset = assets[i];
                if (asset.get('type') === 'folder') {
                    continue;
                }

                if (checkCanDiscard(asset, includeRegex, excludeRegex)) {
                    ignored++;
                    continue;
                }

                todo++;

                // get open document if it exists
                const assetId = asset.get('id');
                const doc = editor.call('documents:get', assetId);
                if (doc) {
                    workerClient.send('search', assetId, doc.data, regex);
                    continue;
                }

                // eslint-disable-next-line no-loop-func
                editor.call('assets:contents:get', asset, (err, contents) => {
                    if (err) {
                        done++;
                        checkDone();
                        return;
                    }
                    workerClient.send('search', assetId, contents, regex);
                });
            }

            checkDone();
        });

        workerClient.start();
    });

    // cancel search
    editor.method('editor:search:files:cancel', () => {
        workerClient.stop();
    });
});
