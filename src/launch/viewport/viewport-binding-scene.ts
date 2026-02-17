import type { Observer } from '@playcanvas/observer';

editor.once('load', () => {
    editor.on('sceneSettings:load', (sceneSettings: Observer) => {
        const app = editor.call('viewport:app');
        if (!app) {
            return;
        } // webgl not available

        let updating;

        // apply settings
        const applySettings = function () {
            updating = false;

            app.applySceneSettings(sceneSettings.json());

            // apply sky depth write (not yet handled by engine's applySettings)
            const skyDepthWrite = sceneSettings.get('render.skyDepthWrite');
            if (skyDepthWrite !== undefined) {
                app.scene.sky.depthWrite = skyDepthWrite;
            }
        };

        // queue settings apply
        const queueApplySettings = function () {
            if (updating) {
                return;
            }

            updating = true;

            setTimeout(applySettings, 1000 / 30);
        };

        // on settings change
        sceneSettings.on('*:set', queueApplySettings);

        // initialize
        queueApplySettings();
    });

});
