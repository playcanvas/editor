editor.once('load', function() {
    'use strict';

    // Saves specified data to server
    editor.method('project:save', function (data, success, error) {
        Ajax({
            url: '{{url.api}}/projects/{{project.id}}',
            auth: true,
            method: 'PUT',
            data: data
        })
        .on('load', function () {
            if (success)
                success();
        })
        .on('error', function () {
            if (error)
                error();
        });
    });

    editor.method('project:setPrimaryApp', function (appId, success, error) {
        var prevPrimary = config.project.primaryApp;
        config.project.primaryApp = parseInt(appId, 10);
        editor.call('project:save', {
            primary_app: config.project.primaryApp
        }, success, function (err) {
            config.project.primaryApp = prevPrimary;
            error(err);
        });
    });

    editor.on('messenger:project.primary_app', function (data) {
        var primaryApp = parseInt(data.project.primary_app, 10);
        var prev = config.project.primaryApp;

        config.project.primaryApp = primaryApp;

        editor.emit('project:primaryApp', primaryApp, prev);
    });

});
