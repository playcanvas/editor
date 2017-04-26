editor.once('load', function() {
    'use strict';

    if (! editor.call('settings:project').get('useLegacyScripts'))
        return;

    var repositories = new Observer();

    // Load repositories
    editor.once('start', function() {
        Ajax({
            url: '{{url.api}}/projects/{{project.id}}/repositories',
            auth: true
        })
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
