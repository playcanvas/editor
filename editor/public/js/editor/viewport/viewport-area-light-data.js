editor.once('load', function () {
    'use strict';

    var projectSettings = editor.call('settings:project');
    var projectUserSettings = editor.call('settings:projectUser');

    var app = editor.call('viewport:app');

    var areaLightDataAssetId;

    var refreshAreaLightAsset = function () {
        areaLightDataAssetId = projectSettings.get('areaLightData');
        var engineAsset = app.assets.get(areaLightDataAssetId);
        if (engineAsset) {
            app.setAreaLightData(engineAsset);
        }
        editor.call('viewport:render');
    };

    projectSettings.on('areaLightData:set', refreshAreaLightAsset);
    projectSettings.on('areaLightData:remove', refreshAreaLightAsset);

    // initialize area lights
    var renderFrame = false;
    if (config.project.settings.areaLightData) {
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
                app.setAreaLightData(engineAsset);
            }
        }
    });

});
