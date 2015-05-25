app.once('load', function() {
    'use strict';

    var framework = app.call('viewport');
    framework.loader.removeHandler("scene");
    framework.loader.removeHandler("hierarchy");
    framework.loader.removeHandler("scenesettings");

    var SharedSceneHandler = function (app, handler) {
        this._app = app;
        this._handler = handler;
    };

    SharedSceneHandler.prototype = {
        load: function (url, callback, settingsOnly) {
            var id = parseInt(url.replace(".json", ""));

            if (typeof(id) === "number") {
                app.call('loadScene', id, function (err, scene) {
                    callback(err, scene);
                }, settingsOnly);
            } else {
                this._handler.load(url, callback);
            }
        },

        open: function (url, data) {
            return this._handler.open(url, data);
        },

        patch: function (asset, assets) {
            return this._handler.patch(asset, assets);
        }
    };
    framework.loader.addHandler("scene", new SharedSceneHandler(framework, new pc.SceneHandler(framework)));


    var SharedHierarchyHandler = function (app, handler) {
        this._app = app;
        this._handler = handler;
    };

    SharedHierarchyHandler.prototype = {
        load: function (url, callback, settingsOnly) {
            var id = parseInt(url.replace(".json", ""));
            if (typeof(id) === "number") {
                app.call('loadScene', id, function (err, scene) {
                    callback(err, scene);
                }, settingsOnly);
            } else {
                // callback("Invalid URL: can't extract scene id.")
                this._handler.load(url, callback);
            }
        },

        open: function (url, data) {
            return this._handler.open(url, data);
        },

        patch: function (asset, assets) {
            return this._handler.patch(asset, assets);
        }
    };
    framework.loader.addHandler("hierarchy", new SharedHierarchyHandler(framework, new pc.HierarchyHandler(framework)));

    var SharedSceneSettingsHandler = function (app, handler) {
        this._app = app;
        this._handler = handler;
    };

    SharedSceneSettingsHandler.prototype = {
        load: function (url, callback) {
            var id = parseInt(url.replace(".json", ""));
            if (typeof(id) === "number") {
                app.call('loadScene', id, function (err, scene) {
                    callback(err, scene);
                }, true);
            } else {
                // callback("Invalid URL: can't extract scene id.")
                this._handler.load(url, callback);
            }
        },

        open: function (url, data) {
            return this._handler.open(url, data);
        },

        patch: function (asset, assets) {
            return this._handler.patch(asset, assets);
        }
    };
    framework.loader.addHandler("scenesettings", new SharedSceneSettingsHandler(framework, new pc.SceneSettingsHandler(framework)));

});
