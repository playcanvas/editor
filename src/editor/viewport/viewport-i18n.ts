editor.once('load', () => {
    const projectSettings = editor.call('settings:project');
    const projectUserSettings = editor.call('settings:projectUser');

    const app = editor.call('viewport:app');

    let assetIndex = {};

    const refreshI18nAssets = function () {
        assetIndex = {};
        const assets = projectSettings.get('i18nAssets') || [];
        assets.forEach((id: number) => {
            assetIndex[id] = true;

            const engineAsset = app.assets.get(id);
            if (engineAsset && !engineAsset.resource) {
                app.assets.load(engineAsset);
            }
        });
        app.i18n.assets = assets;
        editor.call('viewport:render');
    };

    projectSettings.on('i18nAssets:set', refreshI18nAssets);
    projectSettings.on('i18nAssets:insert', refreshI18nAssets);
    projectSettings.on('i18nAssets:remove', refreshI18nAssets);

    projectUserSettings.on('editor.locale:set', (value: string) => {
        if (value) {
            app.i18n.locale = value;
            editor.call('viewport:render');
        }
    });

    // initialize localization
    let renderFrame = false;
    if (config.project.settings.i18nAssets) {
        refreshI18nAssets();
        renderFrame = true;
    }
    if (config.self.locale) {
        app.i18n.locale = config.self.locale;
        renderFrame = true;
    }

    if (renderFrame) {
        editor.call('viewport:render');
    }

    // make sure all localization assets are loaded
    // regardless of their preload flag
    editor.on('assets:add', (asset: import('@playcanvas/observer').Observer) => {
        const id = asset.get('id');
        if (assetIndex[id]) {
            const engineAsset = app.assets.get(id);
            if (engineAsset) {
                app.assets.load(engineAsset);
            }
        }
    });

});
