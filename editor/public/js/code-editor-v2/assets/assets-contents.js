editor.once('load', function () {
    'use strict';

    // used if localStorage doesn't work
    var memoryCache = {};

    var getKey = function (asset) {
        return 'codeeditor:assets:' + asset.get('id');
    };

    var store = function (asset, contents) {
        var data = {
            hash: asset.get('file.hash'),
            contents: contents
        };

        var key = getKey(asset);

        memoryCache[key] = data;
    };

    var load = function (asset) {
        var key = getKey(asset);

        return memoryCache[key];
    };

    var loadRequests = {};

    // Load asset file contents and call callback
    editor.method('assets:loadFile', function (asset, fn) {
        if (! fn) return;

        var id = asset.get('id');
        if (! loadRequests[id]) {
            loadRequests[id] = [fn];
        } else {
            loadRequests[id].push(fn);
            return;
        }

        Ajax({
            url: '{{url.api}}/assets/' + id + '/file/' + asset.get('file.filename') + '?branchId={{self.branch.id}}',
            auth: true,
            notJson: true
        })
        .on('load', function (status, data) {
            // replace \r and \r\n with \n
            data = data.replace(/\r\n?/g, '\n');

            // store in cache
            store(asset, data);

            var requests = loadRequests[id];
            if (! requests)
                return;

            for (var i = 0, len = requests.length; i < len; i++) {
                requests[i](null, data);
            }

            delete loadRequests[id];
        })
        .on('error', function (status, err) {
            var requests = loadRequests[id];
            if (! requests)
                return;

            err = err || new Error('Status: ' + status);

            for (var i = 0, len = requests.length; i < len; i++) {
                requests[i](err);
            }

            delete loadRequests[id];
        });
    });

    // Gets the file contents of the asset - tries to use cached data if they are up to date
    editor.method('assets:contents:get', function (asset, fn) {
        var data = load(asset);
        if (data && data.hash === asset.get('file.hash')) {
            return fn(null, data.contents);
        }

        editor.call('assets:loadFile', asset, fn);
    });

});
