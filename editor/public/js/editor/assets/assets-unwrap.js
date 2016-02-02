editor.once('load', function() {
    'use strict';

    var unwrapping = { };

    editor.method('assets:model:unwrap', function(asset, args, fn) {
        if (asset.get('type') !== 'model' || ! asset.has('file.filename') || unwrapping[asset.get('id')])
            return;

        if (typeof(args) === 'function')
            fn = args;

        if (typeof(args) !== 'object')
            args = { };

        args = args || { };

        var filename = asset.get('file.filename');
        var worker = new Worker('/editor/scene/js/editor/assets/assets-unwrap-worker.js');
        worker.asset = asset;
        worker.progress = 0;

        unwrapping[asset.get('id')] = worker;

        worker.onmessage = function(evt) {
            if (! evt.data.name)
                return;

            switch(evt.data.name) {
                case 'finish':
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
                        // remove from unwrapping list
                        delete unwrapping[asset.get('id')];
                        // render
                        editor.call('viewport:render');
                        // callback
                        if (fn) fn(err, asset);
                        // emit global event
                        editor.emit('assets:model:unwrap', asset);
                    });
                    break;

                case 'progress':
                    worker.progress = evt.data.progress;
                    editor.emit('assets:model:unwrap:progress:' + asset.get('id'), evt.data.progress);
                    editor.emit('assets:model:unwrap:progress', asset, evt.data.progress);
                    break;
            }
        };

        worker.onerror = function(err) {
            if (fn) fn(err);
            // remove from unwrapping list
            delete unwrapping[asset.get('id')];
        };

        worker.postMessage({
            name: 'start',
            id: asset.get('id'),
            filename: filename,
            padding: args.padding || 2.0
        });
    });


    editor.method('assets:model:unwrap:cancel', function(asset) {
        var worker = unwrapping[asset.get('id')];
        if (! worker)
            return;

        worker.terminate();
        delete unwrapping[asset.get('id')];
    });


    editor.method('assets:model:unwrapping', function(asset) {
        if (asset) {
            return unwrapping[asset.get('id')] || null;
        } else {
            var list = [ ];
            for(var key in unwrapping) {
                if (! unwrapping.hasOwnProperty(key))
                    continue;

                list.push(unwrapping[key]);
            }
            return list.length ? list : null;
        }
    });


    editor.method('assets:model:area', function(asset, fn) {
        if (asset.get('type') !== 'model' || ! asset.has('file.filename'))
            return;

        var filename = asset.get('file.filename');
        var worker = new Worker('/editor/scene/js/editor/assets/assets-unwrap-worker.js');

        worker.onmessage = function(evt) {
            if (evt.data.name && evt.data.name === 'finish') {
                // save area
                asset.set('data.area', evt.data.area || null);
                // callback
                if (fn) fn(null, asset, evt.data.area || null);
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
