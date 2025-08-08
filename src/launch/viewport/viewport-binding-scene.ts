editor.once('load', () => {
    editor.on('sceneSettings:load', (sceneSettings) => {
        const app = editor.call('viewport:app');
        if (!app) {
            return;
        } // webgl not available

        let updating;

        // apply settings
        const applySettings = function () {
            updating = false;

            app.applySceneSettings(sceneSettings.json());
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
