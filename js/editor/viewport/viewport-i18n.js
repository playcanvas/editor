editor.once('load', function () {
    var projectSettings = editor.call('settings:project');
    var projectUserSettings = editor.call('settings:projectUser');

    var app = editor.call('viewport:app');

    var assetIndex = {};

    var refreshI18nAssets = function () {
        assetIndex = {};
        var assets = projectSettings.get('i18nAssets') || [];
        assets.forEach(function (id) {
            assetIndex[id] = true;

            var engineAsset = app.assets.get(id);
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

    projectUserSettings.on('editor.locale:set', function (value) {
        if (value) {
            app.i18n.locale = value;
            editor.call('viewport:render');
        }
    });

    // initialize localization
    var renderFrame = false;
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
    editor.on('assets:add', function (asset) {
        var id = asset.get('id');
        if (assetIndex[id]) {
            var engineAsset = app.assets.get(id);
            if (engineAsset) {
                app.assets.load(engineAsset);
            }
        }
    });

});
