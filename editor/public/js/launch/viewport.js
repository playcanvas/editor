editor.once('load', function () {
    'use strict';

    // Wait for assets, hierarchy and settings to load before initializing application and starting.
    var done = false;
    var hierarchy = false;
    var assets = false;
    var settings = false;
    var sourcefiles = false;
    var libraries = false;
    var sceneData = null;
    var sceneSettings = null;
    var loadingScreen = false;
    var scriptList = [];
    var legacyScripts = editor.call('settings:project').get('useLegacyScripts');
    var canvas;
    var app;
    var scriptPrefix;

    var layerIndex = {};

    // try to start preload and initialization of application after load event
    var init = function () {
        if (!done && assets && hierarchy && settings && (!legacyScripts || sourcefiles) && libraries && loadingScreen) {
            // prevent multiple init calls during scene loading
            done = true;

            // Skip parseScenes if using pre-1.4.0 engine or invalid config
            if (app._parseScenes) {
                app._parseScenes(config.scenes);
            }

            // load assets that are in the preload set
            app.preload(function (err) {
                // load scripts that are in the scene data
                app._preloadScripts(sceneData, function (err) {
                    if (err) log.error(err);

                    // create scene
                    app.scene = app.loader.open("scene", sceneData);
                    app.root.addChild(app.scene.root);

                    // update scene settings now that scene is loaded
                    app.applySceneSettings(sceneSettings);

                    // clear stored loading data
                    sceneData = null;
                    sceneSettings = null;
                    scriptList = null;

                    if (err) log.error(err);

                    app.start();
                });
            });
        }
    };

    var createLoadingScreen = function () {

        var defaultLoadingScreen = function () {
            editor.call('viewport:loadingScreen');
            loadingScreen = true;
            init();
        };

        // if the project has a loading screen script then
        // download it and execute it
        if (config.project.settings.loadingScreenScript) {
            var loadingScript = document.createElement('script');
            if (config.project.settings.useLegacyScripts) {
                loadingScript.src = scriptPrefix + '/' + config.project.settings.loadingScreenScript;
            } else {
                loadingScript.src = '/api/assets/' + config.project.settings.loadingScreenScript + '/download?branchId=' + config.self.branch.id;
            }

            loadingScript.onload = function () {
                loadingScreen = true;
                init();
            };

            loadingScript.onerror = function () {
                log.error("Could not load loading screen script: " + config.project.settings.loadingScreenScript);
                defaultLoadingScreen();
            };

            var head = document.getElementsByTagName('head')[0];
            head.insertBefore(loadingScript, head.firstChild);
        } else {
            // no loading screen script so just use default splash screen
            defaultLoadingScreen();
        }
    };

    var createLayer = function (key, data) {
        var id = parseInt(key, 10);
        return new pc.Layer({
            id: id,
            enabled: id !== LAYERID_DEPTH, // disable depth layer - it will be enabled by the engine when needed
            name: data.name,
            opaqueSortMode: data.opaqueSortMode,
            transparentSortMode: data.transparentSortMode
        });
    };

    canvas = pcBootstrap.createCanvas();

    // convert library properties into URLs
    var libraryUrls = [];
    if (config.project.settings.use3dPhysics) {
        libraryUrls.push(config.url.physics);
    }

    var queryParams = (new pc.URI(window.location.href)).getQuery();

    scriptPrefix = config.project.scriptPrefix;

    // queryParams.local can be true or it can be a URL
    if (queryParams.local)
        scriptPrefix = queryParams.local === 'true' ? 'http://localhost:51000' : queryParams.local;

    // WebGL 1.0 enforced?
    var preferWebGl2 = config.project.settings.preferWebGl2;
    if (queryParams.hasOwnProperty('webgl1')) {
        try {
            preferWebGl2 = queryParams.webgl1 === undefined ? false : !JSON.parse(queryParams.webgl1);
        } catch (ex) { }
    }

    var powerPreference = config.project.settings.powerPreference;

    // listen for project setting changes
    var projectSettings = editor.call('settings:project');
    var projectUserSettings = editor.call('settings:projectUser');

    // legacy scripts
    pc.script.legacy = projectSettings.get('useLegacyScripts');

    // playcanvas app
    var useMouse = projectSettings.has('useMouse') ? projectSettings.get('useMouse') : true;
    var useKeyboard = projectSettings.has('useKeyboard') ? projectSettings.get('useKeyboard') : true;
    var useTouch = projectSettings.has('useTouch') ? projectSettings.get('useTouch') : true;
    var useGamepads = projectSettings.has('useGamepads') ? projectSettings.get('useGamepads') : !!projectSettings.get('vr');

    app = new pc.Application(canvas, {
        elementInput: new pc.ElementInput(canvas, {
            useMouse: useMouse,
            useTouch: useTouch
        }),
        mouse: useMouse ? new pc.Mouse(canvas) : null,
        touch: useTouch && pc.platform.touch ? new pc.TouchDevice(canvas) : null,
        keyboard: useKeyboard ? new pc.Keyboard(window) : null,
        gamepads: useGamepads ? new pc.GamePads() : null,
        scriptPrefix: scriptPrefix,
        scriptsOrder: projectSettings.get('scripts') || [],
        assetPrefix: '/api/',
        graphicsDeviceOptions: {
            preferWebGl2: preferWebGl2,
            powerPreference: powerPreference,
            antialias: config.project.settings.antiAlias !== false,
            alpha: config.project.settings.transparentCanvas !== false,
            preserveDrawingBuffer: !!config.project.settings.preserveDrawingBuffer
        }
    });

    if (projectSettings.get('maxAssetRetries')) {
        app.loader.enableRetry(projectSettings.get('maxAssetRetries'));
    }

    if (queryParams.useBundles === 'false') {
        app.enableBundles = false;
    }

    if (queryParams.ministats) {
        // eslint-disable-next-line no-unused-vars
        var miniStats = new pcx.MiniStats(app);
    }

    if (canvas.classList) {
        canvas.classList.add('fill-mode-' + config.project.settings.fillMode);
    }

    if (config.project.settings.useDevicePixelRatio) {
        app.graphicsDevice.maxPixelRatio = window.devicePixelRatio;
    }

    app.setCanvasResolution(config.project.settings.resolutionMode, config.project.settings.width, config.project.settings.height);
    app.setCanvasFillMode(config.project.settings.fillMode, config.project.settings.width, config.project.settings.height);

    // batch groups
    var batchGroups = config.project.settings.batchGroups;
    if (batchGroups) {
        for (var batchGroupId in batchGroups) {
            var grp = batchGroups[batchGroupId];
            app.batcher.addGroup(grp.name, grp.dynamic, grp.maxAabbSize, grp.id, grp.layers);
        }
    }

    // layers
    if (config.project.settings.layers && config.project.settings.layerOrder) {
        var composition = new pc.LayerComposition("viewport");

        for (var key in config.project.settings.layers) {
            layerIndex[key] = createLayer(key, config.project.settings.layers[key]);
        }

        for (var i = 0, len = config.project.settings.layerOrder.length; i < len; i++) {
            var sublayer = config.project.settings.layerOrder[i];
            var layer = layerIndex[sublayer.layer];
            if (!layer) continue;

            if (sublayer.transparent) {
                composition.pushTransparent(layer);
            } else {
                composition.pushOpaque(layer);
            }

            composition.subLayerEnabled[i] = sublayer.enabled;
        }

        app.scene.layers = composition;
    }

    // localization
    if (app.i18n) { // make it backwards compatible ...
        if (config.self.locale) {
            app.i18n.locale = config.self.locale;
        }

        if (config.project.settings.i18nAssets) {
            app.i18n.assets = config.project.settings.i18nAssets;
        }
    }

    if (config.project.settings.areaLightDataAsset) {
        var id = config.project.settings.areaLightDataAsset;
        var engineAsset = app.assets.get(id);
        if (engineAsset) {
            app.setAreaLightLuts(engineAsset);
        } else {
            app.assets.on('add:' + id, function () {
                var engineAsset = app.assets.get(id);
                app.setAreaLightLuts(engineAsset);
            });
        }
    }

    editor.call('editor:loadModules', config.wasmModules, "", function () {
        app._loadLibraries(libraryUrls, function (err) {
            libraries = true;
            if (err) log.error(err);
            init();
        });
    });

    var style = document.head.querySelector ? document.head.querySelector('style') : null;

    // append css to style
    var createCss = function () {
        if (!document.head.querySelector)
            return;

        if (!style)
            style = document.head.querySelector('style');

        // css media query for aspect ratio changes
        var css = "@media screen and (min-aspect-ratio: " + config.project.settings.width + "/" + config.project.settings.height + ") {";
        css += "    #application-canvas.fill-mode-KEEP_ASPECT {";
        css += "        width: auto;";
        css += "        height: 100%;";
        css += "        margin: 0 auto;";
        css += "    }";
        css += "}";

        style.innerHTML = css;
    };

    createCss();

    var refreshResolutionProperties = function () {
        app.setCanvasResolution(config.project.settings.resolutionMode, config.project.settings.width, config.project.settings.height);
        app.setCanvasFillMode(config.project.settings.fillMode, config.project.settings.width, config.project.settings.height);
        pcBootstrap.resizeCanvas(app, canvas);
    };

    projectSettings.on('width:set', function (value) {
        config.project.settings.width = value;
        createCss();
        refreshResolutionProperties();
    });
    projectSettings.on('height:set', function (value) {
        config.project.settings.height = value;
        createCss();
        refreshResolutionProperties();
    });

    projectSettings.on('fillMode:set', function (value, oldValue) {
        config.project.settings.fillMode = value;
        if (canvas.classList) {
            if (oldValue)
                canvas.classList.remove('fill-mode-' + oldValue);

            canvas.classList.add('fill-mode-' + value);
        }

        refreshResolutionProperties();
    });

    projectSettings.on('resolutionMode:set', function (value) {
        config.project.settings.resolutionMode = value;
        refreshResolutionProperties();
    });

    projectSettings.on('useDevicePixelRatio:set', function (value) {
        config.project.settings.useDevicePixelRatio = value;
        app.graphicsDevice.maxPixelRatio = value ? window.devicePixelRatio : 1;
    });

    projectSettings.on('preferWebGl2:set', function (value) {
        config.project.settings.preferWebGl2 = value;
    });

    projectSettings.on('powerPreference:set', function (value) {
        config.project.settings.powerPreference = value;
    });

    projectSettings.on('i18nAssets:set', function (value) {
        app.i18n.assets = value;
    });

    projectSettings.on('areaLightDataAsset:set', function (value) {
        var id = value;
        var engineAsset = app.assets.get(id);
        if (engineAsset) {
            app.setAreaLightLuts(engineAsset);
        } else {
            app.assets.on('add:' + id, function () {
                var engineAsset = app.assets.get(id);
                app.setAreaLightLuts(engineAsset);
            });
        }
    });

    projectSettings.on('i18nAssets:insert', function (value) {
        app.i18n.assets = projectSettings.get('i18nAssets');
    });

    projectSettings.on('i18nAssets:remove', function (value) {
        app.i18n.assets = projectSettings.get('i18nAssets');
    });

    projectSettings.on('maxAssetRetries:set', function (value) {
        if (value > 0) {
            app.loader.enableRetry(value);
        } else {
            app.loader.disableRetry();
        }
    });

    // locale change
    projectUserSettings.on('editor.locale:set', function (value) {
        if (value) {
            app.i18n.locale = value;
        }
    });

    projectSettings.on('*:set', function (path, value) {
        var parts;

        if (path.startsWith('batchGroups')) {
            parts = path.split('.');
            if (parts.length < 2) return;
            var groupId = parseInt(parts[1], 10);
            var groupSettings = projectSettings.get('batchGroups.' + groupId);
            if (!app.batcher._batchGroups[groupId]) {
                app.batcher.addGroup(
                    groupSettings.name,
                    groupSettings.dynamic,
                    groupSettings.maxAabbSize,
                    groupId,
                    groupSettings.layers
                );

                app.batcher.generate();
            } else {
                app.batcher._batchGroups[groupId].name = groupSettings.name;
                app.batcher._batchGroups[groupId].dynamic = groupSettings.dynamic;
                app.batcher._batchGroups[groupId].maxAabbSize = groupSettings.maxAabbSize;

                app.batcher.generate([groupId]);
            }
        } else if (path.startsWith('layers')) {
            parts = path.split('.');
            // create layer
            var layer;
            if (parts.length === 2) {
                layer = createLayer(parts[1], value);
                layerIndex[layer.id] = layer;
                var existing = app.scene.layers.getLayerById(layer.id);
                if (existing) {
                    app.scene.layers.remove(existing);
                }
            } else if (parts.length === 3) { // change layer property
                layer = layerIndex[parts[1]];
                if (layer) {
                    layer[parts[2]] = value;
                }
            }
        } else if (path.startsWith('layerOrder.')) {
            parts = path.split('.');

            if (parts.length === 3) {
                if (parts[2] === 'enabled') {
                    var subLayerId = parseInt(parts[1], 10);
                    // Unlike Editor, DON'T add 2 to subLayerId here
                    app.scene.layers.subLayerEnabled[subLayerId] = value;
                    editor.call('viewport:render');
                }
            }
        }
    });

    projectSettings.on('*:unset', function (path, value) {
        if (path.startsWith('batchGroups')) {
            var propNameParts = path.split('.')[1];
            if (propNameParts.length === 2) {
                var id = propNameParts[1];
                app.batcher.removeGroup(id);
            }
        } else if (path.startsWith('layers.')) {
            var parts = path.split('.');

            // remove layer
            var layer = layerIndex[parts[1]];
            if (layer) {
                app.scene.layers.remove(layer);
                delete layerIndex[parts[1]];
            }
        }
    });

    projectSettings.on('layerOrder:insert', function (value, index) {
        var id = value.get('layer');
        var layer = layerIndex[id];
        if (!layer) return;

        var transparent = value.get('transparent');

        if (transparent) {
            app.scene.layers.insertTransparent(layer, index);
        } else {
            app.scene.layers.insertOpaque(layer, index);
        }
    });

    projectSettings.on('layerOrder:remove', function (value) {
        var id = value.get('layer');
        var layer = layerIndex[id];
        if (!layer) return;

        var transparent = value.get('transparent');

        if (transparent) {
            app.scene.layers.removeTransparent(layer);
        } else {
            app.scene.layers.removeOpaque(layer);
        }
    });

    projectSettings.on('layerOrder:move', function (value, indNew, indOld) {
        var id = value.get('layer');
        var layer = layerIndex[id];
        if (!layer) return;

        var transparent = value.get('transparent');
        if (transparent) {
            app.scene.layers.removeTransparent(layer);
            app.scene.layers.insertTransparent(layer, indNew);
        } else {
            app.scene.layers.removeOpaque(layer);
            app.scene.layers.insertOpaque(layer, indNew);
        }
    });

    pcBootstrap.reflow(app, canvas);
    pcBootstrap.reflowHandler = function () { pcBootstrap.reflow(app, canvas); };

    window.addEventListener('resize', pcBootstrap.reflowHandler, false);
    window.addEventListener('orientationchange', pcBootstrap.reflowHandler, false);

    // get application
    editor.method('viewport:app', function () {
        return app;
    });

    editor.on('entities:load', function (data) {
        hierarchy = true;
        sceneData = data;
        init();
    });

    editor.on('assets:load', function () {
        assets = true;
        init();
    });

    editor.on('sceneSettings:load', function (data) {
        settings = true;
        sceneSettings = data.json();
        init();
    });

    if (legacyScripts) {
        editor.on('sourcefiles:load', function (scripts) {
            // eslint-disable-next-line no-unused-vars
            scriptList = scripts;
            sourcefiles = true;
            init();
        });
    }

    createLoadingScreen();
});
