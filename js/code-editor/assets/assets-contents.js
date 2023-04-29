import { Ajax } from '../../common/ajax.js';

editor.once('load', function () {
    // used if localStorage doesn't work
    const memoryCache = {};

    const getKey = function (asset) {
        return 'codeeditor:assets:' + asset.get('id');
    };

    const store = function (asset, contents) {
        const data = {
            hash: asset.get('file.hash'),
            contents: contents
        };

        const key = getKey(asset);

        memoryCache[key] = data;
    };

    const load = function (asset) {
        const key = getKey(asset);

        return memoryCache[key];
    };

    const loadRequests = {};

    // Load asset file contents and call callback
    editor.method('assets:loadFile', function (asset, fn) {
        if (!fn) return;

        const id = asset.get('id');
        if (!loadRequests[id]) {
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

            const requests = loadRequests[id];
            if (!requests)
                return;

            for (let i = 0, len = requests.length; i < len; i++) {
                requests[i](null, data);
            }

            delete loadRequests[id];
        })
        .on('error', function (status, err) {
            const requests = loadRequests[id];
            if (!requests)
                return;

            err = err || new Error('Status: ' + status);

            for (let i = 0, len = requests.length; i < len; i++) {
                requests[i](err);
            }

            delete loadRequests[id];
        });
    });

    // Gets the file contents of the asset - tries to use cached data if they are up to date
    editor.method('assets:contents:get', function (asset, fn) {
        const data = load(asset);
        if (data && data.hash === asset.get('file.hash')) {
            return fn(null, data.contents);
        }

        editor.call('assets:loadFile', asset, fn);
    });

});
