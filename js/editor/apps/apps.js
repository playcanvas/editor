editor.once('load', function () {
    // Fetch list of apps from the server and
    // pass them to the callback
    editor.method('apps:list', function (callback) {
        Ajax({
            url: '{{url.api}}/projects/{{project.id}}/apps?limit=0',
            auth: true
        })
        .on('load', function (status, data) {
            if (callback)
                callback(data.result);
        });
    });

    // Get a specific app from the server and pass result to callback
    editor.method('apps:get', function (appId, callback) {
        Ajax({
            url: '{{url.api}}/apps/' + appId,
            auth: true
        })
        .on('load', function (status, data) {
            if (callback)
                callback(data);
        });
    });

    // Create app and pass result to callback
    editor.method('apps:new', function (data, callback, error) {
        Ajax({
            url: '{{url.api}}/apps',
            auth: true,
            method: 'POST',
            data: data
        })
        .on('load', function (status, result) {
            if (callback)
                callback(result);
        })
        .on('error', function () {
            if (error)
                error.apply(this, arguments);
        });
    });

    // Download app
    editor.method('apps:download', function (data, callback, error) {
        Ajax({
            url: '{{url.api}}/apps/download',
            auth: true,
            method: 'POST',
            data: data
        })
        .on('load', function (status, result) {
            if (callback)
                callback(result);
        })
        .on('error', function () {
            if (error)
                error.apply(this, arguments);
        });
    });

    // Delete a app
    editor.method('apps:delete', function (appId, callback) {
        Ajax({
            url: '{{url.api}}/apps/' + appId,
            auth: true,
            method: 'DELETE'
        })
        .on('load', function (status, data) {
            if (callback)
                callback();
        });
    });

});
