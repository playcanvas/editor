editor.once('load', function () {
    'use strict';

    var projectSettings = editor.call('settings:project');
    var projectUserSettings = editor.call('settings:projectUser');

    var app = editor.call('viewport:app');

    var areaLightDataAssetId;

    var refreshAreaLightAsset = function () {
        areaLightDataAssetId = projectSettings.get('areaLightDataAsset');
        var engineAsset = app.assets.get(areaLightDataAssetId);
        if (engineAsset) {
            app.setAreaLightLuts(engineAsset);
        }
        editor.call('viewport:render');
    };

    projectSettings.on('areaLightDataAsset:set', refreshAreaLightAsset);
    projectSettings.on('areaLightDataAsset:remove', refreshAreaLightAsset);

    // initialize area lights
    var renderFrame = false;
    if (config.project.settings.areaLightDataAsset) {
        refreshAreaLightAsset();
        renderFrame = true;
    }

    if (renderFrame) {
        editor.call('viewport:render');
    }

    // make sure area light data asset is loaded
    // regardless of their preload flag
    editor.on('assets:add', function (asset) {
        var id = asset.get('id');
        if (id === areaLightDataAssetId) {
            var engineAsset = app.assets.get(id);
            if (engineAsset) {
                app.setAreaLightLuts(engineAsset);
            }
        }
    });

});
