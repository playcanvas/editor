editor.once('load', function () {
    'use strict';

    // Fetch list of scenes from the server and
    // pass them to the callback
    editor.method('scenes:list', function (callback) {
        Ajax({
            url: '{{url.api}}/projects/{{project.id}}/scenes',
            auth: true
        })
        .on('load', function (status, data) {
            if (callback)
                callback(data.result);
        });
    });

    // Get a specific scene from the server and pass result to callback
    editor.method('scenes:get', function (sceneId, callback) {
        Ajax({
            url: '{{url.api}}/scenes/' + sceneId,
            auth: true
        })
        .on('load', function (status, data) {
            if (callback)
                callback(data);
        });
    });

    // Create a scene and pass result to callback
    editor.method('scenes:new', function (name, callback) {
        var data = {
            project_id: config.project.id
        };

        if (name) data.name = name;

        Ajax({
            url: '{{url.api}}/scenes',
            auth: true,
            method: 'POST',
            data: data
        })
        .on('load', function (status, data) {
            if (callback)
                callback(data);
        });
    });

    // Duplicate scene and pass result to callback
    editor.method('scenes:duplicate', function (sceneId, newName, callback) {
        Ajax({
            url: '{{url.api}}/scenes',
            auth: true,
            method: 'POST',
            data: {
                project_id: config.project.id,
                duplicate_from: sceneId,
                name: newName
            }
        })
        .on('load', function (status, data) {
            if (callback)
                callback(data);
        });
    });


    // Delete a scene
    editor.method('scenes:delete', function (sceneId, callback) {
        Ajax({
            url: '{{url.api}}/scenes/' + sceneId,
            auth: true,
            method: 'DELETE'
        })
        .on('load', function (status, data) {
            if (callback)
                callback();
        });
    });

});