import { Observer } from '@playcanvas/observer';
import { Ajax } from '../../common/ajax.js';

editor.once('load', function () {
    if (!editor.call('settings:project').get('useLegacyScripts')) {
        return;
    }

    // keep metrics on number of writeable projects
    if (metrics) {
        metrics.increment({ metricsName: 'editor.script.count.by_type.legacy_script' +
                                            (editor.call('permissions:write') ? '.writable' : '.read_only') +
                                            '.with_project_id.' + config.project.id });
    }

    var repositories = new Observer();

    // Load repositories
    editor.once('start', function () {
        Ajax({
            url: '{{url.api}}/projects/{{project.id}}/repositories',
            auth: true
        })
        .on('load', function (status, data) {
            var response = data;
            for (const key in response) {
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
