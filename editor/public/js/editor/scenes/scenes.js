editor.once('load', function () {
    'use strict';

    // Fetch list of scenes from the server and
    // pass them to the callback
    editor.method('scenes:list', function (callback) {
        Ajax.get('{{url.api}}/projects/{{project.id}}/scenes?access_token={{accessToken}}')
        .on('load', function (status, data) {
            if (callback)
                callback(data.result);
        });
    });

    // Get a specific scene from the server and pass result to callback
    editor.method('scenes:get', function (sceneId, callback) {
        Ajax.get('{{url.api}}/scenes/' + sceneId + '?access_token={{accessToken}}')
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

        Ajax.post('{{url.api}}/scenes?access_token={{accessToken}}', data)
        .on('load', function (status, data) {
            if (callback)
                callback(data);
        });
    });

    // Duplicate scene and pass result to callback
    editor.method('scenes:duplicate', function (sceneId, newName, callback) {
        Ajax.post('{{url.api}}/scenes?access_token={{accessToken}}', {
            project_id: config.project.id,
            duplicate_from: sceneId,
            name: newName
        })
        .on('load', function (status, data) {
            if (callback)
                callback(data);
        });
    });


    // Delete a scene
    editor.method('scenes:delete', function (sceneId, callback) {
        Ajax.delete('{{url.api}}/scenes/' + sceneId + '?access_token={{accessToken}}')
        .on('load', function (status, data) {
            if (callback)
                callback();
        });
    });

});