editor.once('load', function() {
    'use strict';

    var app = editor.call('viewport:app');
    app.loader.removeHandler("scene");
    app.loader.removeHandler("hierarchy");
    app.loader.removeHandler("scenesettings");

    var SharedSceneHandler = function (app, handler) {
        this._app = app;
        this._handler = handler;
    };

    SharedSceneHandler.prototype = {
        load: function (url, callback, settingsOnly) {
            var id = parseInt(url.replace("/api/", "").replace(".json", ""));

            if (typeof(id) === "number") {
                editor.call('loadScene', id, function (err, scene) {
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
    app.loader.addHandler("scene", new SharedSceneHandler(app, new pc.SceneHandler(app)));


    var SharedHierarchyHandler = function (app, handler) {
        this._app = app;
        this._handler = handler;
    };

    SharedHierarchyHandler.prototype = {
        load: function (url, callback, settingsOnly) {
            var id = parseInt(url.replace("/api/", "").replace(".json", ""));
            if (typeof(id) === "number") {
                editor.call('loadScene', id, function (err, scene) {
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
    app.loader.addHandler("hierarchy", new SharedHierarchyHandler(app, new pc.HierarchyHandler(app)));

    var SharedSceneSettingsHandler = function (app, handler) {
        this._app = app;
        this._handler = handler;
    };

    SharedSceneSettingsHandler.prototype = {
        load: function (url, callback) {
            var id = parseInt(url.replace("/api/", "").replace(".json", ""));
            if (typeof(id) === "number") {
                editor.call('loadScene', id, function (err, scene) {
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
    app.loader.addHandler("scenesettings", new SharedSceneSettingsHandler(app, new pc.SceneSettingsHandler(app)));
});
