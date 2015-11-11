editor.once('load', function() {
    'use strict';

    editor.method('assets:model:unwrap', function(asset) {
        if (asset.get('type') !== 'model' || ! asset.has('file.filename'))
            return;

        var filename = asset.get('file.filename');
        var worker = new Worker('/editor/scene/js/editor/assets/assets-unwrap-worker.js');

        worker.onmessage = function(evt) {
            if (evt.data.name && evt.data.name === 'finish') {
                var data = evt.data.data;

                var blob = new Blob([ JSON.stringify(data) ], { type: 'application/json' });

                // upload blob as dds
                editor.call('assets:uploadFile', {
                    file: blob,
                    name: filename,
                    asset: asset,
                    type: 'model'
                }, function (err, data) { });
            } else {
                // console.log(evt.data);
            }
        };

        worker.onerror = function(err) {
            console.error(err);
        };

        worker.postMessage({
            name: 'start',
            id: asset.get('id'),
            filename: filename
        });
    });
});
