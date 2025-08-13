import { LAYERID_DEPTH } from '../../core/constants.ts';

editor.once('load', () => {
    // Wait for assets, hierarchy and settings to load before initializing application and starting.
    let done = false;
    let hierarchy = false;
    let assets = false;
    let gfxCreated = false;
    let settings = false;
    let sourcefiles = false;
    let libraries = false;
    let sceneData = null;
    let sceneSettings = null;
    let loadingScreen = false;
    let scriptList = []; // eslint-disable-line no-unused-vars
    const legacyScripts = editor.call('settings:project').get('useLegacyScripts');
    var canvas;
    var app;
    var scriptPrefix;

    const layerIndex = {};

    // try to start preload and initialization of application after load event
    const init = function () {

        if (!done && gfxCreated && assets && hierarchy && settings && (!legacyScripts || sourcefiles) && libraries && loadingScreen) {
            // prevent multiple init calls during scene loading
            done = true;

            // Skip parseScenes if using pre-1.4.0 engine or invalid config
            if (app._parseScenes) {
                app._parseScenes(config.scenes);
            }

            // load assets that are in the preload set
            app.preload((err) => {
                // load scripts that are in the scene data
                app._preloadScripts(sceneData, (err) => {
                    if (err) {
                        log.error(err);
                    }

                    // create scene
                    app.scene = app.loader.open('scene', sceneData);
                    app.root.addChild(app.scene.root);

                    // update scene settings now that scene is loaded
                    app.applySceneSettings(sceneSettings);

                    // clear stored loading data
                    sceneData = null;
                    sceneSettings = null;
                    scriptList = null;

                    if (err) {
                        log.error(err);
                    }

                    app.start();
                });
            });
        }
    };

    const createLoadingScreen = function () {

        const defaultLoadingScreen = function () {
            editor.call('viewport:loadingScreen');
            loadingScreen = true;
            init();
        };

        // if the project has a loading screen script then
        // download it and execute it
        if (config.project.settings.loadingScreenScript) {
            const loadingScript = document.createElement('script');
            if (config.project.settings.useLegacyScripts) {
                loadingScript.src = `${scriptPrefix}/${config.project.settings.loadingScreenScript}`;
            } else {
                loadingScript.src = `/api/assets/${config.project.settings.loadingScreenScript}/download?branchId=${config.self.branch.id}`;
            }

            loadingScript.onload = function () {
                loadingScreen = true;
                init();
            };

            loadingScript.onerror = function () {
                log.error(`Could not load loading screen script: ${config.project.settings.loadingScreenScript}`);
                defaultLoadingScreen();
            };

            const head = document.getElementsByTagName('head')[0];
            head.insertBefore(loadingScript, head.firstChild);
        } else {
            // no loading screen script so just use default splash screen
            defaultLoadingScreen();
        }
    };

    const createLayer = function (key, data) {
        const id = parseInt(key, 10);
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
    const libraryUrls = [];
    if (config.project.settings.use3dPhysics) {
        libraryUrls.push(config.url.physics);
    }

    const queryParams = (new pc.URI(window.location.href)).getQuery();

    scriptPrefix = config.project.scriptPrefix;

    // device types
    const { enableWebGpu, enableWebGl2 } = editor.call('settings:project').json();
    let deviceTypes = [
        enableWebGpu && pc.DEVICETYPE_WEBGPU,
        enableWebGl2 && pc.DEVICETYPE_WEBGL2,
        pc.DEVICETYPE_WEBGL1
    ].filter(Boolean);

    // device type override
    switch (queryParams.device) {
        case 'webgpu':
            deviceTypes = [pc.DEVICETYPE_WEBGPU];
            break;
        case 'webgl2':
            deviceTypes = [pc.DEVICETYPE_WEBGL2];
            break;
        case 'webgl1':
            deviceTypes = [pc.DEVICETYPE_WEBGL1];
            break;
    }

    const powerPreference = config.project.settings.powerPreference;

    // listen for project setting changes
    const projectSettings = editor.call('settings:project');
    const projectUserSettings = editor.call('settings:projectUser');

    // legacy scripts
    pc.script.legacy = projectSettings.get('useLegacyScripts');

    // playcanvas app
    const useMouse = projectSettings.has('useMouse') ? projectSettings.get('useMouse') : true;
    const useKeyboard = projectSettings.has('useKeyboard') ? projectSettings.get('useKeyboard') : true;
    const useTouch = projectSettings.has('useTouch') ? projectSettings.get('useTouch') : true;
    const useGamepads = projectSettings.has('useGamepads') ? projectSettings.get('useGamepads') : !!projectSettings.get('vr');

    const gfxOptions = {
        deviceTypes: deviceTypes,
        glslangUrl: '/editor/scene/js/webgpu/glslang.js',
        twgslUrl: '/editor/scene/js/webgpu/twgsl.js',
        powerPreference: powerPreference,
        antialias: config.project.settings.antiAlias !== false,
        alpha: config.project.settings.transparentCanvas !== false,
        preserveDrawingBuffer: !!config.project.settings.preserveDrawingBuffer
    };

    app = new pc.AppBase(canvas);

    pc.createGraphicsDevice(canvas, gfxOptions).then((device) => {
        const createOptions = new pc.AppOptions();
        createOptions.graphicsDevice = device;

        createOptions.componentSystems = [
            pc.RigidBodyComponentSystem,
            pc.CollisionComponentSystem,
            pc.JointComponentSystem,
            pc.AnimationComponentSystem,
            pc.AnimComponentSystem,
            pc.ModelComponentSystem,
            pc.RenderComponentSystem,
            pc.CameraComponentSystem,
            pc.LightComponentSystem,
            pc.script.legacy ? pc.ScriptLegacyComponentSystem : pc.ScriptComponentSystem,
            pc.AudioSourceComponentSystem,
            pc.SoundComponentSystem,
            pc.AudioListenerComponentSystem,
            pc.ParticleSystemComponentSystem,
            pc.ScreenComponentSystem,
            pc.ElementComponentSystem,
            pc.ButtonComponentSystem,
            pc.ScrollViewComponentSystem,
            pc.ScrollbarComponentSystem,
            pc.SpriteComponentSystem,
            pc.LayoutGroupComponentSystem,
            pc.LayoutChildComponentSystem,
            pc.ZoneComponentSystem,
            pc.GSplatComponentSystem
        ].filter(Boolean);

        createOptions.resourceHandlers = [
            pc.RenderHandler,
            pc.AnimationHandler,
            pc.AnimClipHandler,
            pc.AnimStateGraphHandler,
            pc.ModelHandler,
            pc.MaterialHandler,
            pc.TextureHandler,
            pc.TextHandler,
            pc.JsonHandler,
            pc.AudioHandler,
            pc.ScriptHandler,
            pc.SceneHandler,
            pc.CubemapHandler,
            pc.HtmlHandler,
            pc.CssHandler,
            pc.ShaderHandler,
            pc.HierarchyHandler,
            pc.FolderHandler,
            pc.FontHandler,
            pc.BinaryHandler,
            pc.TextureAtlasHandler,
            pc.SpriteHandler,
            pc.TemplateHandler,
            pc.ContainerHandler,
            pc.GSplatHandler
        ].filter(Boolean);

        const options = {
            elementInput: new pc.ElementInput(canvas, {
                useMouse: useMouse,
                useTouch: useTouch
            }),
            keyboard: useKeyboard ? new pc.Keyboard(window) : null,
            mouse: useMouse ? new pc.Mouse(canvas) : null,
            gamepads: useGamepads ? new pc.GamePads() : null,
            touch: useTouch && pc.platform.touch ? new pc.TouchDevice(canvas) : null,
            assetPrefix: '/api/',
            scriptPrefix: scriptPrefix,
            scriptsOrder: projectSettings.get('scripts') || []
        };

        createOptions.elementInput = options.elementInput;
        createOptions.keyboard = options.keyboard;
        createOptions.mouse = options.mouse;
        createOptions.touch = options.touch;
        createOptions.gamepads = options.gamepads;

        createOptions.scriptPrefix = options.scriptPrefix;
        createOptions.assetPrefix = options.assetPrefix;
        createOptions.scriptsOrder = options.scriptsOrder;

        createOptions.soundManager = new pc.SoundManager();
        createOptions.lightmapper = pc.Lightmapper;
        createOptions.batchManager = pc.BatchManager;
        createOptions.xr = pc.XrManager;

        app.init(createOptions);
        gfxCreated = true;

        // when app is initialized (which is async), emit event to allow dependencies to load
        editor.emit('launcher:device:ready', app);

        init();

        if (projectSettings.get('maxAssetRetries')) {
            app.loader.enableRetry(projectSettings.get('maxAssetRetries'));
        }

        if (queryParams.useBundles === 'false') {
            app.enableBundles = false;
        }

        if (canvas.classList) {
            canvas.classList.add(`fill-mode-${config.project.settings.fillMode}`);
        }

        if (config.project.settings.useDevicePixelRatio) {
            app.graphicsDevice.maxPixelRatio = window.devicePixelRatio;
        }

        app.setCanvasResolution(config.project.settings.resolutionMode, config.project.settings.width, config.project.settings.height);
        app.setCanvasFillMode(config.project.settings.fillMode, config.project.settings.width, config.project.settings.height);

        // batch groups
        const batchGroups = config.project.settings.batchGroups;
        if (batchGroups) {
            for (const batchGroupId in batchGroups) {
                const grp = batchGroups[batchGroupId];
                app.batcher.addGroup(grp.name, grp.dynamic, grp.maxAabbSize, grp.id, grp.layers);
            }
        }

        // layers
        if (config.project.settings.layers && config.project.settings.layerOrder) {
            const composition = new pc.LayerComposition('viewport');

            for (const key in config.project.settings.layers) {
                layerIndex[key] = createLayer(key, config.project.settings.layers[key]);
            }

            for (let i = 0, len = config.project.settings.layerOrder.length; i < len; i++) {
                const sublayer = config.project.settings.layerOrder[i];
                const layer = layerIndex[sublayer.layer];
                if (!layer) {
                    continue;
                }

                if (sublayer.transparent) {
                    composition.pushTransparent(layer);
                } else {
                    composition.pushOpaque(layer);
                }

                composition.subLayerEnabled[i] = sublayer.enabled;
            }

            app.scene.layers = composition;
        }

        if (queryParams.ministats) {
            // eslint-disable-next-line no-unused-vars
            const miniStats = new (pc.MiniStats ? pc.MiniStats : pcx.MiniStats)(app);
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

        editor.call('wasm:load', config.wasmModules, '', () => {
            app._loadLibraries(libraryUrls, (err) => {
                libraries = true;
                if (err) {
                    log.error(err);
                }
                // now that modules are loaded, start the realtime connection
                // we use setTimeout here to ensure load.js has a chance to
                // register its 'realtime:connect' method.
                setTimeout(() => {
                    editor.call('realtime:connect');
                    init();
                });
            });
        });

        let style = document.head.querySelector ? document.head.querySelector('style') : null;

        // append css to style
        const createCss = function () {
            if (!document.head.querySelector) {
                return;
            }

            if (!style) {
                style = document.head.querySelector('style');
            }

            // css media query for aspect ratio changes
            let css = `@media screen and (min-aspect-ratio: ${config.project.settings.width}/${config.project.settings.height}) {`;
            css += '    #application-canvas.fill-mode-KEEP_ASPECT {';
            css += '        width: auto;';
            css += '        height: 100%;';
            css += '        margin: 0 auto;';
            css += '    }';
            css += '}';

            style.innerHTML = css;
        };

        createCss();

        const refreshResolutionProperties = function () {
            app.setCanvasResolution(config.project.settings.resolutionMode, config.project.settings.width, config.project.settings.height);
            app.setCanvasFillMode(config.project.settings.fillMode, config.project.settings.width, config.project.settings.height);
            pcBootstrap.resizeCanvas(app, canvas);
        };

        projectSettings.on('width:set', (value) => {
            config.project.settings.width = value;
            createCss();
            refreshResolutionProperties();
        });
        projectSettings.on('height:set', (value) => {
            config.project.settings.height = value;
            createCss();
            refreshResolutionProperties();
        });

        projectSettings.on('fillMode:set', (value, oldValue) => {
            config.project.settings.fillMode = value;
            if (canvas.classList) {
                if (oldValue) {
                    canvas.classList.remove(`fill-mode-${oldValue}`);
                }

                canvas.classList.add(`fill-mode-${value}`);
            }

            refreshResolutionProperties();
        });

        projectSettings.on('resolutionMode:set', (value) => {
            config.project.settings.resolutionMode = value;
            refreshResolutionProperties();
        });

        projectSettings.on('useDevicePixelRatio:set', (value) => {
            config.project.settings.useDevicePixelRatio = value;
            app.graphicsDevice.maxPixelRatio = value ? window.devicePixelRatio : 1;
        });

        projectSettings.on('deviceTypes:set', (value) => {
            config.project.settings.deviceTypes = value;
        });

        projectSettings.on('powerPreference:set', (value) => {
            config.project.settings.powerPreference = value;
        });

        projectSettings.on('i18nAssets:set', (value) => {
            app.i18n.assets = value;
        });

        projectSettings.on('i18nAssets:insert', (value) => {
            app.i18n.assets = projectSettings.get('i18nAssets');
        });

        projectSettings.on('i18nAssets:remove', (value) => {
            app.i18n.assets = projectSettings.get('i18nAssets');
        });

        projectSettings.on('maxAssetRetries:set', (value) => {
            if (value > 0) {
                app.loader.enableRetry(value);
            } else {
                app.loader.disableRetry();
            }
        });

        // locale change
        projectUserSettings.on('editor.locale:set', (value) => {
            if (value) {
                app.i18n.locale = value;
            }
        });

        projectSettings.on('*:set', (path, value) => {
            let parts;

            if (path.startsWith('batchGroups')) {
                parts = path.split('.');
                if (parts.length < 2) {
                    return;
                }
                const groupId = parseInt(parts[1], 10);
                const groupSettings = projectSettings.get(`batchGroups.${groupId}`);
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
                let layer;
                if (parts.length === 2) {
                    layer = createLayer(parts[1], value);
                    layerIndex[layer.id] = layer;
                    const existing = app.scene.layers.getLayerById(layer.id);
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
                        const subLayerId = parseInt(parts[1], 10);
                        // Unlike Editor, DON'T add 2 to subLayerId here
                        app.scene.layers.subLayerEnabled[subLayerId] = value;
                        editor.call('viewport:render');
                    }
                }
            }
        });

        projectSettings.on('*:unset', (path, value) => {
            if (path.startsWith('batchGroups')) {
                const propNameParts = path.split('.')[1];
                if (propNameParts.length === 2) {
                    const id = propNameParts[1];
                    app.batcher.removeGroup(id);
                }
            } else if (path.startsWith('layers.')) {
                const parts = path.split('.');

                // remove layer
                const layer = layerIndex[parts[1]];
                if (layer) {
                    app.scene.layers.remove(layer);
                    delete layerIndex[parts[1]];
                }
            }
        });

        projectSettings.on('layerOrder:insert', (value, index) => {
            const id = value.get('layer');
            const layer = layerIndex[id];
            if (!layer) {
                return;
            }

            const transparent = value.get('transparent');

            if (transparent) {
                app.scene.layers.insertTransparent(layer, index);
            } else {
                app.scene.layers.insertOpaque(layer, index);
            }
        });

        projectSettings.on('layerOrder:remove', (value) => {
            const id = value.get('layer');
            const layer = layerIndex[id];
            if (!layer) {
                return;
            }

            const transparent = value.get('transparent');

            if (transparent) {
                app.scene.layers.removeTransparent(layer);
            } else {
                app.scene.layers.removeOpaque(layer);
            }
        });

        projectSettings.on('layerOrder:move', (value, indNew, indOld) => {
            const id = value.get('layer');
            const layer = layerIndex[id];
            if (!layer) {
                return;
            }

            const transparent = value.get('transparent');
            if (transparent) {
                app.scene.layers.removeTransparent(layer);
                app.scene.layers.insertTransparent(layer, indNew);
            } else {
                app.scene.layers.removeOpaque(layer);
                app.scene.layers.insertOpaque(layer, indNew);
            }
        });

        pcBootstrap.reflow(app, canvas);
        pcBootstrap.reflowHandler = function () {
            pcBootstrap.reflow(app, canvas);
        };

        window.addEventListener('resize', pcBootstrap.reflowHandler, false);
        window.addEventListener('orientationchange', pcBootstrap.reflowHandler, false);

    });

    // get application
    editor.method('viewport:app', () => {
        return app;
    });

    editor.on('entities:load', (data) => {
        hierarchy = true;
        sceneData = data;
        init();
    });

    editor.on('assets:load', () => {
        assets = true;
        init();
    });

    editor.on('sceneSettings:load', (data) => {
        settings = true;
        sceneSettings = data.json();
        init();
    });

    if (legacyScripts) {
        editor.on('sourcefiles:load', (scripts) => {

            scriptList = scripts;
            sourcefiles = true;
            init();
        });
    }

    createLoadingScreen();
});
