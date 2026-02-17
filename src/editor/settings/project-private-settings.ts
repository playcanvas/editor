import { ObserverHistory } from '@playcanvas/observer';

import { config } from '@/editor/config';

editor.once('load', () => {
    // this used to have facebook settings
    // but we removed those so leaving this here in case
    // it is needed in the future
    const projectPrivateSettings = {};

    let isConnected = false;

    const settings = editor.call('settings:create', {
        name: 'projectPrivate',
        id: `project-private_${config.project.id}`,
        deferLoad: true,
        data: projectPrivateSettings
    });


    // add history
    settings.history = new ObserverHistory({
        item: settings,
        history: editor.api.globals.history
    });

    const reload = function () {
        if (!isConnected) {
            return;
        }

        if (config.project.hasPrivateSettings && editor.call('permissions:write')) {
            settings.reload(settings.scopeId);
        }

        if (!config.project.hasPrivateSettings) {
            let pendingChanges = {};

            const evtOnSet = settings.on('*:set', (path, value, valueOld) => {
                // store pending changes until we load document from C3 in order to send
                // them to the server
                if (!settings.sync) {
                    pendingChanges[path] = value;
                }

                if (!config.project.hasPrivateSettings) {
                    config.project.hasPrivateSettings = true;
                    settings.reload(settings.scopeId);
                }
            });

            // when settings are created and loaded from the server sync any pending changes
            editor.once('settings:projectPrivate:load', () => {
                evtOnSet.unbind();

                const history = settings.history.enabled;
                settings.history.enabled = false;
                for (const key in pendingChanges) {
                    settings.set(key, pendingChanges[key]);
                }
                settings.history.enabled = history;

                pendingChanges = null;
            });
        }
    };

    // handle permission changes
    editor.on(`permissions:set:${config.self.id}`, (accesslevel) => {
        if (accesslevel !== 'admin' && accesslevel !== 'write') {
            // unset private settings
            settings.disconnect();
            settings.history.enabled = false;
            for (const key in projectPrivateSettings) {
                settings.unset(key);
            }
        } else {
            // reload settings
            settings.history.enabled = true;
            reload();
        }
    });

    editor.on('realtime:authenticated', () => {
        isConnected = true;
        reload();
    });

    editor.on('realtime:disconnected', () => {
        isConnected = false;
    });

    if (!config.project.hasPrivateSettings) {
        editor.on('messenger:settings.create', (msg) => {
            if (config.project.hasPrivateSettings) {
                return;
            } // skip if we've already created the settings locally

            if (msg.settings.name === 'project-private') {
                config.project.hasPrivateSettings = true;
                reload();
            }
        });
    }

});
