editor.once('load', function() {
    'use strict';

    editor.on('tools:viewport:ready', function() {

        var app = editor.call('viewport:app');
        if (! app) return; // webgl not available

        app.loader.removeHandler("scene");
        app.loader.removeHandler("hierarchy");
        app.loader.removeHandler("scenesettings");

        var loadSceneByItemId = function (itemId, callback) {
            // Get a specific scene from the server and pass result to callback
            Ajax({
                url: '{{url.api}}/scenes/' + itemId + '?branchId=' + config.self.branch.id,
                cookies: true
            })
            .on('error', function (status, data) {
                if (callback) {
                    callback(data);
                }
            })
            .on('load', function (status, data) {
                if (callback) {
                    callback(null, data);
                }
            });
        };

        var SharedSceneHandler = function (app, handler) {
            this._app = app;
            this._handler = handler;
        };

        SharedSceneHandler.prototype = {
            load: function (url, callback, settingsOnly) {
                var id = parseInt(url.replace("/api/", "").replace(".json", ""));

                if (typeof(id) === "number") {
                    // load scene from server to get its unique id
                    loadSceneByItemId(id, function (err, scene) {
                        if (err) {
                            return callback(err);
                        }

                        editor.call('loadScene', scene.uniqueId, callback, settingsOnly);
                    });
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
                    loadSceneByItemId(id, function (err, scene) {
                        if (err) {
                            return callback(err);
                        }

                        editor.call('loadScene', scene.uniqueId, function (err, scene) {
                            // do this in a timeout so that any errors raised while
                            // initializing scripts are not swallowed by the connection error handler
                            setTimeout(function () {
                                callback(err, scene);
                            });
                        }, settingsOnly);

                    });

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
                if (typeof url === 'string') {
                    url = {
                        load: url,
                        original: url
                    };
                }

                var id = parseInt(url.original.replace("/api/", "").replace(".json", ""));
                if (typeof(id) === "number") {
                    loadSceneByItemId(id, function (err, scene) {
                        if (err) {
                            return callback(err);
                        }

                        editor.call('loadScene', scene.uniqueId, function (err, scene) {
                            callback(err, scene);
                        }, true);
                    });

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
});
