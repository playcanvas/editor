editor.once('load', function() {
    'use strict';

    // Wait for assets, hierarchy and settings to load before initializing application and starting.
    var done = false;
    var hierarchy = false;
    var assets  = false;
    var settings = false;
    var sourcefiles = false;
    var libraries = false;
    var sceneData = null;
    var sceneSettings = null;
    var loadingScreen = false;
    var scriptList = [];
    var legacyScripts = editor.call('settings:project').get('useLegacyScripts');

    var layerIndex = {};

    // update progress bar
    var setProgress = function (value) {
        var bar = document.getElementById('progress-bar');
        value = Math.min(1, Math.max(0, value));
        bar.style.width = value * 100 + '%';
    };

    // respond to resize window
    var reflow = function () {
        var size = app.resizeCanvas(canvas.width, canvas.height);
        canvas.style.width = '';
        canvas.style.height = '';

        var fillMode = app._fillMode;

        if (fillMode == pc.fw.FillMode.NONE || fillMode == pc.fw.FillMode.KEEP_ASPECT) {
            if ((fillMode == pc.fw.FillMode.NONE && canvas.clientHeight < window.innerHeight) || (canvas.clientWidth / canvas.clientHeight >= window.innerWidth / window.innerHeight)) {
                canvas.style.marginTop = Math.floor((window.innerHeight - canvas.clientHeight) / 2) + 'px';
            } else {
                canvas.style.marginTop = '';
            }
        }
    };


    // try to start preload and initialization of application after load event
    var init = function () {
        if (!done && assets && hierarchy && settings && (! legacyScripts || sourcefiles) && libraries && loadingScreen) {
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
                    if (err) console.error(err);

                    // create scene
                    app.scene = app.loader.open("scene", sceneData);
                    app.root.addChild(app.scene.root);

                    // update scene settings now that scene is loaded
                    app.applySceneSettings(sceneSettings);

                    // clear stored loading data
                    sceneData = null;
                    sceneSettings = null;
                    scriptList = null;

                    if (err) console.error(err);

                    app.start();
                });
            });
        }
    };

    var createCanvas = function () {
        var canvas = document.createElement('canvas');
        canvas.setAttribute('id', 'application-canvas');
        canvas.setAttribute('tabindex', 0);
        // canvas.style.visibility = 'hidden';

        // Disable I-bar cursor on click+drag
        canvas.onselectstart = function () { return false; };

        document.body.appendChild(canvas);

        return canvas;
    };

    var showSplash = function () {
        // splash
        var splash = document.createElement('div');
        splash.id = 'application-splash';
        document.body.appendChild(splash);

        // img
        var img = document.createElement('img');
        img.src = 'https://s3-eu-west-1.amazonaws.com/static.playcanvas.com/images/logo/PLAY_FLAT_ORANGE3.png'
        splash.appendChild(img);

        // progress bar
        var container = document.createElement('div');
        container.id = 'progress-container';
        splash.appendChild(container);

        var bar = document.createElement('div');
        bar.id = 'progress-bar';
        container.appendChild(bar);
    };

    var hideSplash = function () {
        var splash = document.getElementById('application-splash');
        splash.parentElement.removeChild(splash);
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

            loadingScript.onload = function() {
                loadingScreen = true;
                init();
            };

            loadingScript.onerror = function () {
                console.error("Could not load loading screen script: " + config.project.settings.loadingScreenScript);
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

    var canvas = createCanvas();

    // convert library properties into URLs
    var libraryUrls = [];
    if (config.project.settings.use3dPhysics) {
        libraryUrls.push(config.url.physics);
    }

    var queryParams = (new pc.URI(window.location.href)).getQuery();

    if (config.project.settings.vr && (utils.isMobile() || !pc.VrManager.isSupported)) {
        if (queryParams.vrpolyfill) {
            libraryUrls.push(queryParams.vrpolyfill);
        } else {
            libraryUrls.push(config.url.webvr);
        }
    }


    var scriptPrefix = config.project.scriptPrefix;

    // queryParams.local can be true or it can be a URL
    if (queryParams.local)
        scriptPrefix = queryParams.local === 'true' ? 'http://localhost:51000' : queryParams.local;

    // WebGL 1.0 enforced?
    var preferWebGl2 = config.project.settings.preferWebGl2;
    if (queryParams.hasOwnProperty('webgl1')) {
        try {
            preferWebGl2 = queryParams.webgl1 === undefined ? false : ! JSON.parse(queryParams.webgl1);
        } catch (ex) { }
    }

    // listen for project setting changes
    var projectSettings = editor.call('settings:project');

    // legacy scripts
    pc.script.legacy = projectSettings.get('useLegacyScripts');

    // playcanvas app
    var app = new pc.Application(canvas, {
        elementInput: new pc.ElementInput(canvas),
        mouse: new pc.input.Mouse(canvas),
        touch: !!('ontouchstart' in window) ? new pc.input.TouchDevice(canvas) : null,
        keyboard: new pc.input.Keyboard(window),
        gamepads: new pc.input.GamePads(),
        scriptPrefix: scriptPrefix,
        scriptsOrder: projectSettings.get('scripts') || [ ],
        assetPrefix: '/api',
        graphicsDeviceOptions: {
            preferWebGl2: preferWebGl2,
            antialias: config.project.settings.antiAlias === false ? false : true,
            alpha: config.project.settings.transparentCanvas === false ? false : true,
            preserveDrawingBuffer: !!config.project.settings.preserveDrawingBuffer
        }
    });

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
        for (var id in batchGroups) {
            var grp = batchGroups[id];
            app.batcher.addGroup(grp.name, grp.dynamic, grp.maxAabbSize, grp.id, grp.layers);
        }
    }

    // layers
    if (config.project.settings.layers && config.project.settings.layerOrder) {
        var composition = new pc.LayerComposition();

        for (var key in config.project.settings.layers) {
            layerIndex[key] = createLayer(key, config.project.settings.layers[key]);
        }

        for (var i = 0, len = config.project.settings.layerOrder.length; i<len; i++) {
            var sublayer = config.project.settings.layerOrder[i];
            var layer = layerIndex[sublayer.layer];
            if (! layer) continue;

            if (sublayer.transparent) {
                composition.pushTransparent(layer);
            } else {
                composition.pushOpaque(layer);
            }

            composition.subLayerEnabled[i] = sublayer.enabled;
        }

        app.scene.layers = composition;
    }

    app._loadLibraries(libraryUrls, function (err) {
        app._onVrChange(config.project.settings.vr);
        libraries = true;
        if (err) console.error(err);
        init();
    });

    var style = document.head.querySelector ? document.head.querySelector('style') : null;

    // append css to style
    var createCss = function () {
        if (! document.head.querySelector)
            return;

        if (! style)
            style = document.head.querySelector('style');

        // css media query for aspect ratio changes
        var css  = "@media screen and (min-aspect-ratio: " + config.project.settings.width + "/" + config.project.settings.height + ") {";
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
        reflow();
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

    projectSettings.on('*:set', function (path, value) {
        var parts;

        if (path.startsWith('batchGroups')) {
            parts = path.split('.');
            if (parts.length < 2) return;
            var groupId = parseInt(parts[1], 10);
            var groupSettings = projectSettings.get('batchGroups.' + groupId);
            if (! app.batcher._batchGroups[groupId]) {
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
            if (parts.length === 2) {
                var layer = createLayer(parts[1], value);
                layerIndex[layer.id] = layer;
                var existing = app.scene.layers.getLayerById(layer.id);
                if (existing) {
                    app.scene.layers.remove(existing);
                }
            }
            // change layer property
            else if (parts.length === 3) {
                var layer = layerIndex[parts[1]];
                if (layer) {
                    layer[parts[2]] = value;
                }
            }
          } else if (path.startsWith('layerOrder.')) {
              parts = path.split('.');

              if (parts.length === 3) {
                  if (parts[2] === 'enabled') {
                      var subLayerId = parseInt(parts[1]);
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
        if (! layer) return;

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
        if (! layer) return;

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
        if (! layer) return;

        var transparent = value.get('transparent');
        if (transparent) {
            app.scene.layers.removeTransparent(layer);
            app.scene.layers.insertTransparent(layer, indNew);
        } else {
            app.scene.layers.removeOpaque(layer);
            app.scene.layers.insertOpaque(layer, indNew);
        }
    });

    window.addEventListener('resize', reflow, false);
    window.addEventListener('orientationchange', reflow, false);

    reflow();

    // get application
    editor.method('viewport:app', function() {
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
            scriptList = scripts;
            sourcefiles = true;
            init();
        });
    }

    createLoadingScreen();
});
