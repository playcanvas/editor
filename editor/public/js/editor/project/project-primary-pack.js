editor.once('load', function() {
    'use strict';

    // Saves specified data to server
    editor.method('project:save', function (data, success, error) {
        Ajax.put('{{url.api}}/projects/{{project.id}}?access_token={{accessToken}}', data)
        .on('load', function () {
            if (success)
                success();
        })
        .on('error', function () {
            if (error)
                error();
        });
    });

    editor.method('project:setPrimaryScene', function (sceneId, callback) {
        var prevPrimary = config.project.primaryScene;
        config.project.primaryScene = parseInt(sceneId, 10);
        editor.call('project:save', {
            primary_pack: config.project.primaryScene
        }, callback, function (err) {
            config.project.primaryScene = prevPrimary;
        });
    });

    editor.on('messenger:project.primary_pack', function (data) {
        var primaryScene = parseInt(data.project.primary_pack, 10);
        var prev = config.project.primaryScene;

        config.project.primaryScene = primaryScene;

        editor.emit('project:primaryScene', primaryScene, prev);
    });
});
