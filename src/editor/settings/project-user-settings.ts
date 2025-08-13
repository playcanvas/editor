import { ObserverHistory } from '@playcanvas/observer';

editor.once('load', () => {
    let isConnected = false;

    const schema = editor.api.globals.schema;
    const projectUserSettings = {
        ...schema.settings.getDefaultProjectUserSettings(),
        branch: config.self.branch.id,
        favoriteBranches: config.project.masterBranch ? [config.project.masterBranch] : []
    };

    const settings = editor.call('settings:create', {
        name: 'projectUser',
        id: `project_${config.project.id}_${config.self.id}`,
        deferLoad: true,
        data: projectUserSettings,
        userId: config.self.id
    });

    // add history
    settings.history = new ObserverHistory({
        item: settings,
        history: editor.api.globals.history
    });

    const reload = function () {
        // config.project.hasReadAccess is only for the launch page
        if (isConnected && (editor.call('permissions:read') || config.project.hasReadAccess)) {
            settings.reload(settings.scopeId);
        }
    };

    // handle permission changes
    editor.on(`permissions:set:${config.self.id}`, (accesslevel) => {
        if (editor.call('permissions:read')) {
            // reload settings
            if (!settings.sync) {
                settings.history.enabled = true;
                reload();
            }
        } else {
            // unset private settings
            if (settings.sync) {
                settings.disconnect();
                settings.history.enabled = false;
            }
        }
    });

    editor.on('realtime:authenticated', () => {
        isConnected = true;
        reload();
    });

    editor.on('realtime:disconnected', () => {
        isConnected = false;
    });
});
