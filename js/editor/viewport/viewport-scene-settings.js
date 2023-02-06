editor.once('load', function () {
    const sceneSettings = editor.call('sceneSettings');
    const app = editor.call('viewport:app');
    if (!app) return; // webgl not available

    let assetsLoaded = false;
    let sceneSettingsLoaded = false;
    let updating;

    // apply settings
    const applySettings = function () {
        if (!app) return;

        updating = false;

        // apply scene settings
        app.applySceneSettings(sceneSettings.json());

        // need to update all materials on scene settings change
        app.assets.filter((asset) => {
            return asset.type === 'material' && asset.resource;
        }).forEach((asset) => {
            asset.resource.update();
        });

        editor.call('viewport:render');
    };

    // queue settings apply
    const queueApplySettings = function () {
        if (!sceneSettingsLoaded || updating || !assetsLoaded)
            return;

        updating = true;

        editor.call('viewport:render');
        editor.once('viewport:update', applySettings);
    };

    // on settings change
    sceneSettings.on('*:set', queueApplySettings);

    editor.on('assets:load', function () {
        assetsLoaded = true;
        queueApplySettings();
    });

    editor.on('sceneSettings:load', function () {
        sceneSettingsLoaded = true;
        queueApplySettings();
    });
});
