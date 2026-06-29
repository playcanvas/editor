import { GAMMA_NONE, GAMMA_SRGB } from 'playcanvas';

import { ObserverSync } from '@/common/observer-sync';
import { formatter as f } from '@/common/utils';


editor.once('load', () => {
    const schema = editor.api.globals.schema;
    const sceneSettings = {
        physics: schema.scene.getDefaultPhysicsSettings(),
        render: schema.scene.getDefaultRenderSettings()
    };

    const settings = editor.api.globals.settings.scene.observer;

    // get scene settings
    editor.method('sceneSettings', () => {
        return settings;
    });

    // when settings are loaded...
    editor.api.globals.settings.scene.on('load', () => {
        const sync = settings.sync && settings.sync.enabled;
        if (sync) {
            settings.sync.enabled = false;
        }

        // remove priority_scripts
        if (editor.api.globals.realtime.scenes.current.data.settings.priority_scripts === undefined &&
            settings.has('priority_scripts')) {
            settings.unset('priority_scripts');
        }

        if (sync) {
            settings.sync.enabled = true;
        }

        editor.emit('sceneSettings:load', settings);
    });

    editor.on('sceneSettings:load', (settings: import('@playcanvas/observer').Observer) => {
        // sync scene settings
        if (!settings.sync) {
            settings.sync = new ObserverSync({
                item: settings,
                prefix: ['settings']
            });

            // client > server
            settings.sync.on('op', (op: unknown) => {
                editor.call('realtime:scene:op', op);
            });

            // server > client
            editor.on('realtime:scene:op:settings', (op: unknown) => {
                settings.sync.write(op);
            });
        }

        // set default scene settings
        for (const type in sceneSettings) {
            for (const key in sceneSettings[type]) {
                const path = `${type}.${key}`;
                if (!settings.has(path)) {
                    settings.set(path, sceneSettings[type][key]);
                }
            }
        }

        // migrations
        const history = settings.history.enabled;
        const sync = settings.sync.enabled;

        settings.history.enabled = false;
        settings.sync.enabled = editor.call('permissions:write');

        // gamma correction migration
        const oldGammaCorrection = settings.get('render.gamma_correction');
        if (oldGammaCorrection !== GAMMA_NONE && oldGammaCorrection !== GAMMA_SRGB) {
            const gammaCorrection = GAMMA_SRGB;
            settings.set('render.gamma_correction', gammaCorrection);
            const msg = [
                `Setting scene setting ${f.path('render.gamma_correction')} from`,
                `${f.value(oldGammaCorrection)}`,
                `to ${f.value(gammaCorrection)}`
            ].join(' ');
            editor.call('console:log:settings', settings, msg);
        }

        settings.history.enabled = history;
        settings.sync.enabled = sync;
    });

    const onUnload = () => {
        if (settings.history) {
            settings.history.enabled = false;
        }
        if (settings.sync) {
            settings.sync.enabled = false;
        }

        settings.set('render.skybox', null);

        if (settings.history) {
            settings.history.enabled = true;
        }
        if (settings.sync) {
            settings.sync.enabled = true;
        }
    };

    editor.on('realtime:disconnected', onUnload);
    editor.on('scene:unload', onUnload);
});
