editor.once('load', function () {
    'use strict';

    var worker;

    var todo = 0;
    var done = 0;
    var ignored = 0;

    var lastSearchId = 0;

    var checkDone = function () {
        if (todo === done) {
            if (worker) {
                worker.terminate();
                worker = null;
            }

            editor.emit('editor:search:files:end');
        }
    };

    var searchAsset = function (asset, regex, searchId) {
        todo++;

        // get open document if it exists
        var doc = editor.call('documents:get', asset.get('id'));
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
        var currentSearchId = lastSearchId;

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

        var assets = editor.call('assets:list');

        todo = 0;
        done = 0;
        ignored = 0;

        for (var i = 0, len = assets.length; i < len; i++) {
            var asset = assets[i];
            if (asset.get('type') === 'folder') continue;

            // skip path rebuilding if there's no include or exclude regexes
            if (includeRegex != null || excludeRegex != null) {
                // rebuild full path to asset in the style 'src/com/playcanvas/script.js'
                var path = asset.get('path');
                var assetFullPath = path.map(id => editor.call('assets:get', id).get('name')).join('/') + (path.length > 0 ? '/' : '') + asset.get('name');

                // if include is present, discard asset if there's no match to the include regex
                var includeMatch = assetFullPath.match(includeRegex);
                if (includeRegex != null && !(includeMatch !== null && includeMatch.length >= 1)) {
                    ignored++;
                    continue;
                }
                // if exclude is present, discard asset if there is a match to the exclude regex
                var excludeMatch = assetFullPath.match(excludeRegex);
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
