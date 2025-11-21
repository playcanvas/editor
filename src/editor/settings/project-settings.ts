import { ObserverHistory } from '@playcanvas/observer';

import { deepCopy, formatter as f, insert, remove, set, unset } from '@/common/utils';
import { LAYERID_WORLD, LAYERID_DEPTH, LAYERID_SKYBOX, LAYERID_IMMEDIATE, LAYERID_UI } from '../../core/constants';


editor.once('load', () => {
    const schema = editor.api.globals.schema;
    const projectSettings = Object.assign(schema.settings.getDefaultProjectSettings(), config.project.settings);

    const settings = editor.call('settings:create', {
        name: 'project',
        id: config.project.settings.id,
        data: projectSettings
    });

    pc.script.legacy = !!settings.get('useLegacyScripts');

    // add history
    settings.history = new ObserverHistory({
        item: settings,
        history: editor.api.globals.history
    });

    // sync settings with config
    settings.on('*:set', (path, value) => {
        set(config.project.settings, path, typeof value === 'object' ? deepCopy(value) : value);
    });
    settings.on('*:unset', (path) => {
        unset(config.project.settings, path);
    });
    settings.on('*:insert', (path, value, index) => {
        insert(config.project.settings, path, value, index);
    });
    settings.on('*:remove', (path, _value, index) => {
        remove(config.project.settings, path, index);
    });

    // migrations
    editor.on('settings:project:load', () => {
        const history = settings.history.enabled;
        const sync = settings.sync.enabled;

        settings.history.enabled = false;
        settings.sync.enabled = editor.call('permissions:write');

        if (!config.project.settings.hasOwnProperty('engineV2')) {
            settings.set('engineV2', false);
        }

        if (config.project.settings.hasOwnProperty('useLegacyScripts')) {
            if (settings.get('useLegacyScripts')) {
                settings.set('useLegacyScripts', false);
                const msg = `The ${f.path('useLegacyScripts')} project setting has been removed`;
                editor.call('console:log:settings', settings, msg);
            }
        } else {
            // N.B. Need to force setting to false to allow for scripts to be added to loading order
            // Have to force since observer defaults to false
            settings.set('useLegacyScripts', false, undefined, undefined, true);
        }

        if (settings.has('preferWebGl2')) {
            const enableWebGl2 = settings.get('preferWebGl2');
            const oldEnableWebGl2 = settings.get('enableWebGl2');
            settings.set('enableWebGl2', enableWebGl2);
            settings.unset('preferWebGl2');
            let msg = `The ${f.path('preferWebGl2')} project setting has been removed`;
            if (oldEnableWebGl2 !== enableWebGl2) {
                msg += `. Setting project setting ${f.path('enableWebGl2')} from ${f.value(oldEnableWebGl2)} to ${f.value(enableWebGl2)}`;
            }
            editor.call('console:log:settings', settings, msg);
        }
        if (settings.has('deviceTypes')) {
            const deviceTypes = settings.get('deviceTypes');
            settings.unset('deviceTypes');
            let msg = `The ${f.path('deviceTypes')} project setting has been removed`;

            if (deviceTypes.length) {
                const enableWebGpu = deviceTypes[0] === pc.DEVICETYPE_WEBGPU;
                const oldEnableWebGpu = settings.get('enableWebGpu');
                settings.set('enableWebGpu', enableWebGpu);
                if (oldEnableWebGpu !== enableWebGpu) {
                    msg += `. Setting project setting ${f.path('enableWebGpu')} from ${f.value(oldEnableWebGpu)} to ${f.value(enableWebGpu)}`;
                }

                const enableWebGl2 = deviceTypes[0] === pc.DEVICETYPE_WEBGL2;
                const oldEnableWebGl2 = settings.get('enableWebGl2');
                settings.set('enableWebGl2', enableWebGl2);
                if (oldEnableWebGl2 !== enableWebGl2) {
                    msg += `. Setting project setting ${f.path('enableWebGl2')} from ${f.value(oldEnableWebGl2)} to ${f.value(enableWebGl2)}`;
                }
            }

            editor.call('console:log:settings', settings, msg);
        }

        if (!settings.get('batchGroups')) {
            settings.set('batchGroups', {});
        }
        if (!settings.get('layers')) {
            settings.set('layers', {
                0: {
                    name: 'World',
                    opaqueSortMode: 2,
                    transparentSortMode: 3
                },
                1: {
                    name: 'Depth',
                    opaqueSortMode: 2,
                    transparentSortMode: 3
                },
                2: {
                    name: 'Skybox',
                    opaqueSortMode: 0,
                    transparentSortMode: 3
                },
                3: {
                    name: 'Immediate',
                    opaqueSortMode: 0,
                    transparentSortMode: 3
                },
                4: {
                    name: 'UI',
                    opaqueSortMode: 1,
                    transparentSortMode: 1
                }
            });
            settings.set('layerOrder', []);
            settings.insert('layerOrder', {
                layer: LAYERID_WORLD,
                transparent: false,
                enabled: true
            });
            settings.insert('layerOrder', {
                layer: LAYERID_DEPTH,
                transparent: false,
                enabled: true
            });
            settings.insert('layerOrder', {
                layer: LAYERID_SKYBOX,
                transparent: false,
                enabled: true
            });
            settings.insert('layerOrder', {
                layer: LAYERID_WORLD,
                transparent: true,
                enabled: true
            });
            settings.insert('layerOrder', {
                layer: LAYERID_IMMEDIATE,
                transparent: false,
                enabled: true
            });
            settings.insert('layerOrder', {
                layer: LAYERID_IMMEDIATE,
                transparent: true,
                enabled: true
            });
            settings.insert('layerOrder', {
                layer: LAYERID_UI,
                transparent: true,
                enabled: true
            });
        }
        if (settings.get('useKeyboard') === null) {
            settings.set('useKeyboard', true);
        }
        if (settings.get('useMouse') === null) {
            settings.set('useMouse', true);
        }
        if (settings.get('useTouch') === null) {
            settings.set('useTouch', true);
        }
        if (settings.get('useGamepads') === null) {
            settings.set('useGamepads', !!settings.get('vr'));
        }

        if (!settings.get('i18nAssets')) {
            settings.set('i18nAssets', []);
        }
        if (!settings.get('externalScripts')) {
            settings.set('externalScripts', []);
        }
        if (settings.get('powerPreference') === null) {
            settings.set('powerPreference', 'high-performance');
        }
        if (settings.get('maxAssetRetries') === null) {
            settings.set('maxAssetRetries', 0);
        }
        if (!settings.get('enableSharedArrayBuffer')) {
            settings.set('enableSharedArrayBuffer', false);
        }
        if (settings.has('useLegacyAudio')) {
            const useLegacyAudio = settings.get('useLegacyAudio');
            settings.unset('useLegacyAudio');
            if (useLegacyAudio) {
                const msg = `The ${f.path('useLegacyAudio')} project setting has been removed`;
                editor.call('console:log:settings', settings, msg);
            }
        }

        settings.history.enabled = history;
        settings.sync.enabled = sync;
    });
});
