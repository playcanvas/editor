app.once('load', function() {
    'use strict';

    var framework = app.call('viewport');
    framework.loader.removeHandler("scene");

    var handler = new pc.SceneHandler(framework);

    var SharedSceneHandler = function (app) {
        this._app = app;
    };

    SharedSceneHandler.prototype = {
        load: function (url, callback, settingsOnly) {
            var id = parseInt(url.replace(".json", ""));

            pc.editor.loadScene(id, function (err, scene) {
                callback(err, scene);
            }, settingsOnly);
        },

        open: function (url, data) {
            return handler.open(url, data);
        },

        patch: function (asset, assets) {
            return handler.patch(asset, assets);
        }
    };

    framework.loader.addHandler("scene", new SharedSceneHandler(framework));
});
