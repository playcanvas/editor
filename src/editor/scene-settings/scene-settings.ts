import { ObserverSync } from '../../common/observer-sync.ts';
import { formatter as f } from '../../common/utils.ts';
import { GAMMA_NONE, GAMMA_SRGB } from '../../core/constants.ts';

import type { Observer } from '@playcanvas/observer'

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

    // migrate camera settings
    let entitiesLoaded = false;
    let projectUserSettingsLoaded = false;
    let migrateEntityHandle = null;
    const migrateCameraSettings = () => {
        if (!entitiesLoaded || !projectUserSettingsLoaded) {
            return;
        }

        // migrate entities
        // NOTE: Defaults are set so we need to force the update
        const migrateEntity = (entity) => {
            // Defeer the migration to the next frame to ensure entity document has been created
            setTimeout(() => {
                entity.history.enabled = false;

                if (entity.get('components.camera')) {
                    // gamma correction
                    const gammaCorrection = settings.get('render.gamma_correction');
                    const oldGammaCorrection = entity.get('components.camera.gammaCorrection');
                    entity.set('components.camera.gammaCorrection', gammaCorrection, false, false, true);
                    if (gammaCorrection !== oldGammaCorrection) {
                        const msg = [
                            `Setting ${f.path('components.camera.gammaCorrection')} on ${f.entity(entity)} from`,
                            `${f.value(oldGammaCorrection)}`,
                            `to ${f.value(gammaCorrection)}`
                        ].join(' ');
                        editor.call('console:log:entity', entity, msg, true);
                    }

                    // tonemapping
                    const tonemapping = settings.get('render.tonemapping');
                    const oldTonemapping = entity.get('components.camera.toneMapping');
                    entity.set('components.camera.toneMapping', tonemapping, false, false, true);
                    if (tonemapping !== oldTonemapping) {
                        const msg = [
                            `Setting ${f.path('components.camera.toneMapping')} on ${f.entity(entity)} from`,
                            `${f.value(oldTonemapping)}`,
                            `to ${f.value(tonemapping)}`
                        ].join(' ');
                        editor.call('console:log:entity', entity, msg, true);
                    }
                }
                entity.history.enabled = true;
            });
        };
        editor.call('entities:list').forEach(migrateEntity);

        // remove existing handle if found
        if (migrateEntityHandle) {
            migrateEntityHandle.unbind();
        }
        migrateEntityHandle = editor.on('entities:add', migrateEntity);

        editor.call('status:clear');
    };
    if (!editor.projectEngineV2) {
        editor.on('entities:load', () => {
            entitiesLoaded = true;
            migrateCameraSettings();
        });
        editor.on('settings:projectUser:load', () => {
            projectUserSettingsLoaded = true;
            migrateCameraSettings();
        });
        settings.on('render.gamma_correction:set', migrateCameraSettings);
        settings.on('render.tonemapping:set', migrateCameraSettings);
    }

    editor.on('sceneSettings:load', (settings) => {
        // sync scene settings
        if (!settings.sync) {
            settings.sync = new ObserverSync({
                item: settings,
                prefix: ['settings']
            });

            // client > server
            settings.sync.on('op', (op) => {
                editor.call('realtime:scene:op', op);
            });

            // server > client
            editor.on('realtime:scene:op:settings', (op) => {
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
