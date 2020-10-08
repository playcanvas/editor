editor.once('load', function() {
    'use strict';

    if (! editor.call('settings:project').get('useLegacyScripts')){
        return;
    }

    // keep metrics on number of writeable projects 
    metrics.increment({ metricsName: 'editor.script.count.by_type.legacy_script' +
                                        (editor.call('editor:isReadonly') ? '.read_only' : '.writable') +
                                        '.with_project_id.' + config.project.id });

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
