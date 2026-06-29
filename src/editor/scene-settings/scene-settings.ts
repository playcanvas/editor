import type { Observer } from '@playcanvas/observer';
import { GAMMA_NONE, GAMMA_SRGB, TONEMAP_LINEAR } from 'playcanvas';

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
        if (
            editor.api.globals.realtime.scenes.current.data.settings.priority_scripts === undefined &&
            settings.has('priority_scripts')
        ) {
            settings.unset('priority_scripts');
        }

        if (sync) {
            settings.sync.enabled = true;
        }

        editor.emit('sceneSettings:load', settings);
    });

    if (!editor.projectEngineV2) {
        let entitiesReady = false;
        let userReady = false;
        let migrating = false;
        const migrate = () => {
            if (!entitiesReady || !userReady || migrating) {
                return;
            }
            migrating = true;

            // defer until every entity document exists
            setTimeout(() => {
                for (const entity of editor.call('entities:list')) {
                    entity.history.enabled = false;

                    if (entity.get('components.camera')) {
                        const gamma = settings.get('render.gamma_correction');
                        const oldGamma = entity.get('components.camera.gammaCorrection');
                        entity.set('components.camera.gammaCorrection', gamma, false, false, true);
                        if (gamma !== oldGamma) {
                            editor.call(
                                'console:log:entity',
                                entity,
                                `Setting ${f.path('components.camera.gammaCorrection')} on ${f.entity(entity)} from ${f.value(oldGamma)} to ${f.value(gamma)}`,
                                true
                            );
                        }

                        const tone = settings.get('render.tonemapping') ?? TONEMAP_LINEAR;
                        const oldTone = entity.get('components.camera.toneMapping');
                        entity.set('components.camera.toneMapping', tone, false, false, true);
                        if (tone !== oldTone) {
                            editor.call(
                                'console:log:entity',
                                entity,
                                `Setting ${f.path('components.camera.toneMapping')} on ${f.entity(entity)} from ${f.value(oldTone)} to ${f.value(tone)}`,
                                true
                            );
                        }
                    }
                    entity.history.enabled = true;
                }

                editor.call('status:clear');
                if (editor.call('permissions:write')) {
                    editor.call('settings:project').set('engineV2', true);
                    window.location.reload();
                }
            });
        };

        editor.on('entities:load', () => {
            entitiesReady = true;
            migrate();
        });
        editor.on('settings:projectUser:load', () => {
            userReady = true;
            migrate();
        });
        settings.on('render.gamma_correction:set', migrate);
        settings.on('render.tonemapping:set', migrate);
    }

    editor.on('sceneSettings:load', (settings: Observer) => {
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

        const history = settings.history.enabled;
        const sync = settings.sync.enabled;
        settings.history.enabled = false;
        settings.sync.enabled = editor.call('permissions:write');

        const oldGamma = settings.get('render.gamma_correction');
        if (oldGamma !== GAMMA_NONE && oldGamma !== GAMMA_SRGB) {
            settings.set('render.gamma_correction', GAMMA_SRGB);
            editor.call(
                'console:log:settings',
                settings,
                `Setting scene setting ${f.path('render.gamma_correction')} from ${f.value(oldGamma)} to ${f.value(GAMMA_SRGB)}`
            );
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
