editor.once('load', function () {
    'use strict';

    // Fetch list of apps from the server and
    // pass them to the callback
    editor.method('apps:list', function (callback) {
        Ajax.get('{{url.api}}/projects/{{project.id}}/apps?access_token={{accessToken}}&limit=0')
        .on('load', function (status, data) {
            if (callback)
                callback(data.result);
        });
    });

    // Get a specific app from the server and pass result to callback
    editor.method('apps:get', function (appId, callback) {
        Ajax.get('{{url.api}}/apps/' + appId + '?access_token={{accessToken}}')
        .on('load', function (status, data) {
            if (callback)
                callback(data);
        });
    });

    // Create app and pass result to callback
    editor.method('apps:new', function (data, callback, error) {
        Ajax.post('{{url.api}}/apps?access_token={{accessToken}}', data)
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
        Ajax.post('{{url.api}}/apps/download?access_token={{accessToken}}', data)
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
        Ajax.delete('{{url.api}}/apps/' + appId + '?access_token={{accessToken}}')
        .on('load', function (status, data) {
            if (callback)
                callback();
        });
    });

});