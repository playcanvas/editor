editor.once('load', function() {
    'use strict';

    editor.method('assets:model:unwrap', function(asset, fn) {
        if (asset.get('type') !== 'model' || ! asset.has('file.filename'))
            return;

        var filename = asset.get('file.filename');
        var worker = new Worker('/editor/scene/js/editor/assets/assets-unwrap-worker.js');

        worker.onmessage = function(evt) {
            if (evt.data.name && evt.data.name === 'finish') {
                var data = evt.data.data;

                // save area
                asset.set('data.area', evt.data.area);

                var blob = new Blob([
                    JSON.stringify(data)
                ], {
                    type: 'application/json'
                });

                // upload blob as dds
                editor.call('assets:uploadFile', {
                    file: blob,
                    name: filename,
                    asset: asset,
                    type: 'model'
                }, function (err, data) {
                    // callback
                    if (fn) fn(err, asset);
                });
            }
        };

        worker.onerror = function(err) {
            if (fn) fn(err);
        };

        worker.postMessage({
            name: 'start',
            id: asset.get('id'),
            filename: filename
        });
    });

    editor.method('assets:model:area', function(asset, fn) {
        if (asset.get('type') !== 'model' || ! asset.has('file.filename'))
            return;

        var filename = asset.get('file.filename');
        var worker = new Worker('/editor/scene/js/editor/assets/assets-unwrap-worker.js');

        worker.onmessage = function(evt) {
            if (evt.data.name && evt.data.name === 'finish') {
                // save area
                asset.set('data.area', evt.data.area || 0);
                // callback
                if (fn) fn(null, asset, evt.data.area || 0);
            }
        };

        worker.onerror = function(err) {
            if (fn) fn(err);
        };

        worker.postMessage({
            name: 'area',
            id: asset.get('id'),
            filename: filename
        });
    });
});
