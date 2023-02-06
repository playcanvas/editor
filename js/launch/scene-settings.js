editor.once('load', function () {
    var sceneSettings = new Observer();

    editor.once('scene:raw', function (data) {
        sceneSettings.patch(data.settings);

        editor.emit("sceneSettings:load", sceneSettings);
    });

    editor.method('sceneSettings', function () {
        return sceneSettings;
    });
});
