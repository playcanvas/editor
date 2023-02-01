editor.once('load', function () {
    'use strict';

    let worker;

    let todo = 0;
    let done = 0;
    let ignored = 0;

    let lastSearchId = 0;

    const checkDone = function () {
        if (todo === done) {
            if (worker) {
                worker.terminate();
                worker = null;
            }

            editor.emit('editor:search:files:end');
        }
    };

    const searchAsset = function (asset, regex, searchId) {
        todo++;

        // get open document if it exists
        const doc = editor.call('documents:get', asset.get('id'));
        if (doc) {
            worker.postMessage({
                id: asset.get('id'),
                text: doc.data,
                query: regex
            });
        } else {
            editor.call('assets:contents:get', asset, function (err, contents) {
                if (searchId !== lastSearchId)
                    return;

                if (err) {
                    done++;
                    return checkDone();
                }

                worker.postMessage({
                    id: asset.get('id'),
                    text: contents,
                    query: regex
                });

            });
        }
    };

    editor.method('editor:search:files', function (regex, includeRegex, excludeRegex) {
        editor.emit('editor:search:files:start');

        lastSearchId++;
        const currentSearchId = lastSearchId;

        if (worker) {
            worker.terminate();
        }

        worker = new Worker('/editor/scene/js/code-editor-v2/search/search-worker.js');

        worker.onmessage = function (evt) {
            if (currentSearchId !== lastSearchId) return;

            done++;
            editor.emit('editor:search:files:results', evt.data, done, ignored, todo);
            checkDone();
        };

        const assets = editor.call('assets:list');

        todo = 0;
        done = 0;
        ignored = 0;

        for (let i = 0, len = assets.length; i < len; i++) {
            const asset = assets[i];
            if (asset.get('type') === 'folder') continue;

            // skip path rebuilding if there's no include or exclude regexes
            if (includeRegex != null || excludeRegex != null) {
                // rebuild full path to asset in the style 'src/com/playcanvas/script.js'
                const path = asset.get('path');
                const assetFullPath = path.map(id => editor.call('assets:get', id).get('name')).join('/') + (path.length > 0 ? '/' : '') + asset.get('name');

                // if include is present, discard asset if there's no match to the include regex
                const includeMatch = assetFullPath.match(includeRegex);
                if (includeRegex != null && !(includeMatch !== null && includeMatch.length >= 1)) {
                    ignored++;
                    continue;
                }
                // if exclude is present, discard asset if there is a match to the exclude regex
                const excludeMatch = assetFullPath.match(excludeRegex);
                if (excludeRegex != null && excludeMatch !== null && excludeMatch.length >= 1) {
                    ignored++;
                    continue;
                }
            }

            searchAsset(asset, regex, currentSearchId);
        }

        checkDone();
    });

    // cancel search
    editor.method('editor:search:files:cancel', function () {
        if (worker) {
            worker.terminate();
            worker = null;
        }

        lastSearchId = null;
    });
});
