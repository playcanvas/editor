editor.once('load', function () {
    'use strict';

    // Fetch list of scenes from the server and
    // pass them to the callback
    editor.method('scenes:list', function (callback) {
        Ajax({
            url: '{{url.api}}/projects/{{project.id}}/scenes?branchId=' + config.self.branch.id,
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
            url: '{{url.api}}/scenes/' + sceneId + '?branchId=' + config.self.branch.id,
            auth: true
        })
        .on('error', function (status, data) {
            if (callback) {
                callback(data);
            }
        })
        .on('load', function (status, data) {
            if (callback) {
                callback(null, data);
            }
        });
    });

    // Create a scene and pass result to callback
    editor.method('scenes:new', function (name, callback) {
        var data = {
            projectId: config.project.id,
            branchId: config.self.branch.id
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
                projectId: config.project.id,
                duplicateFrom: parseInt(sceneId, 10),
                branchId: config.self.branch.id,
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
            url: '{{url.api}}/scenes/' + sceneId + '?branchId=' + config.self.branch.id,
            auth: true,
            method: 'DELETE'
        })
        .on('load', function (status, data) {
            if (callback)
                callback();
        });
    });

});
