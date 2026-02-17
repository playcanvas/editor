import { Observer } from '@playcanvas/observer';

editor.once('load', () => {
    if (!editor.call('settings:project').get('useLegacyScripts')) {
        return;
    }

    // keep metrics on number of writeable projects
    if (metrics) {
        metrics.increment({ metricsName: `editor.script.count.by_type.legacy_script${
            editor.call('permissions:write') ? '.writable' : '.read_only'
        }.with_project_id.${config.project.id}` });
    }

    const repositories = new Observer();

    // Load repositories
    editor.once('start', () => {
        editor.api.globals.rest.projects.projectRepoList()
        .on('load', (_status: number, data: Record<string, unknown>) => {
            const response = data;
            for (const key in response) {
                if (response.hasOwnProperty(key)) {
                    repositories.set(key, response[key]);
                }
            }

            editor.emit('repositories:load', repositories);
        });
    });

    // get repositories
    editor.method('repositories', () => {
        return repositories;
    });
});
