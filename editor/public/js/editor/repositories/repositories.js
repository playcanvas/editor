editor.once('load', function() {
    'use strict';

    if (! editor.call('project:settings').get('use_legacy_scripts'))
        return;

    var repositories = new Observer();

    // Load repositories
    editor.once('start', function() {
        Ajax
        .get('{{url.api}}/projects/{{project.id}}/repositories?access_token={{accessToken}}')
        .on('load', function(status, data) {
            var response = data;
            for (var key in response) {
                if (response.hasOwnProperty(key)) {
                    repositories.set(key, response[key]);
                }
            }

            editor.emit('repositories:load', repositories);
        });
    });

    // get repositories
    editor.method('repositories', function () {
        return repositories;
    });
});
