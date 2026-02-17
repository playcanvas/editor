editor.once('load', () => {
    const app = editor.call('viewport:app');
    if (!app) {
        return;
    } // webgl not available

    editor.once('launcher:device:ready', () => {

        app.loader.removeHandler('scene');
        app.loader.removeHandler('hierarchy');
        app.loader.removeHandler('scenesettings');

        const loadSceneByItemId = function (itemId: number, callback: (err: unknown, scene?: { uniqueId: number }) => void) {
            // Get a specific scene from the server and pass result to callback
            editor.api.globals.rest.scenes.sceneGet(itemId, true)
            .on('error', (_status: number, data: unknown) => {
                if (callback) {
                    callback(data);
                }
            })
            .on('load', (_status: number, data: unknown) => {
                if (callback) {
                    callback(null, data);
                }
            });
        };

        const SharedSceneHandler = function (app: pc.AppBase, handler: pc.SceneHandler) {
            this._app = app;
            this._handler = handler;
        };

        SharedSceneHandler.prototype = {
            load: function (url: string, callback: (err: Error | null, scene?: unknown) => void, settingsOnly?: boolean) {
                const id = parseInt(url.replace('/api/', '').replace('.json', ''), 10);

                if (typeof id === 'number' && !isNaN(id)) {
                    // load scene from server to get its unique id
                    loadSceneByItemId(id, (err: unknown, scene?: { uniqueId: number }) => {
                        if (err) {
                            return callback(err as Error);
                        }

                        editor.call('loadScene', scene!.uniqueId, callback, settingsOnly);
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
        app.loader.addHandler('scene', new SharedSceneHandler(app, new pc.SceneHandler(app)));


        const SharedHierarchyHandler = function (app: pc.AppBase, handler: pc.HierarchyHandler) {
            this._app = app;
            this._handler = handler;
        };

        SharedHierarchyHandler.prototype = {
            load: function (url: string, callback: (err: Error | null, scene?: unknown) => void, settingsOnly?: boolean) {
                const id = parseInt(url.replace('/api/', '').replace('.json', ''), 10);
                if (typeof id === 'number' && !isNaN(id)) {
                    loadSceneByItemId(id, (err: unknown, scene?: { uniqueId: number }) => {
                        if (err) {
                            return callback(err as Error);
                        }

                        editor.call('loadScene', scene!.uniqueId, (err: Error | null, scene: unknown) => {
                            // do this in a timeout so that any errors raised while
                            // initializing scripts are not swallowed by the connection error handler
                            setTimeout(() => {
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
        app.loader.addHandler('hierarchy', new SharedHierarchyHandler(app, new pc.HierarchyHandler(app)));

        const SharedSceneSettingsHandler = function (app, handler) {
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

                const id = parseInt(url.original.replace('/api/', '').replace('.json', ''), 10);
                if (typeof id === 'number') {
                    loadSceneByItemId(id, (err: unknown, scene?: { uniqueId: number }) => {
                        if (err) {
                            return callback(err as Error);
                        }

                        editor.call('loadScene', scene!.uniqueId, (err: Error | null, scene: unknown) => {
                            callback(err, scene);
                        }, true);
                    });

                } else {
                    // callback("Invalid URL: can't extract scene id.")
                    this._handler.load(url, callback);
                }
            },

            open: function (url: string, data: unknown) {
                return this._handler.open(url, data);
            },

            patch: function (asset: unknown, assets: unknown) {
                return this._handler.patch(asset, assets);
            }
        };
        app.loader.addHandler('scenesettings', new SharedSceneSettingsHandler(app, new pc.SceneSettingsHandler(app)));
    });
});
