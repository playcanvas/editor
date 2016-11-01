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
    var legacyScripts = editor.call('project:settings').get('use_legacy_scripts');

    // update progress bar
    var setProgress = function (value) {
        var bar = document.getElementById('progress-bar');
        value = Math.min(1, Math.max(0, value));
        bar.style.width = value * 100 + '%';
    };

    // respond to resize window
    var reflow = function () {
        var size = application.resizeCanvas(canvas.width, canvas.height);
        canvas.style.width = '';
        canvas.style.height = '';

        var fillMode = application._fillMode;

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

            // load assets that are in the preload set
            application.preload(function (err) {
                // load scripts that are in the scene data
                application._preloadScripts(sceneData, function (err) {
                    if (err) {
                        console.error(err);
                    }

                    // create scene
                    application.scene = application.loader.open("scene", sceneData);
                    application.root.addChild(application.scene.root);

                    // update scene settings now that scene is loaded
                    application.applySceneSettings(sceneSettings);

                    // clear stored loading data
                    sceneData = null;
                    sceneSettings = null;
                    scriptList = null;

                    editor.call('entities:')
                    if (err) {
                        console.error(err);
                    }

                    application.start();
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
        if (config.project.settings.loading_screen_script) {
            var loadingScript = document.createElement('script');
            if (config.project.settings.use_legacy_scripts) {
                loadingScript.src = scriptPrefix + '/' + config.project.settings.loading_screen_script;
            } else {
                loadingScript.src = '/api/assets/' + config.project.settings.loading_screen_script + '/download';
            }

            loadingScript.onload = function() {
                loadingScreen = true;
                init();
            };

            loadingScript.onerror = function () {
                console.error("Could not load loading screen script: " + config.project.settings.loading_screen_script);
                defaultLoadingScreen();
            };

            var head = document.getElementsByTagName('head')[0];
            head.insertBefore(loadingScript, head.firstChild);
         }
         // no loading screen script so just use default splash screen
         else {
            defaultLoadingScreen();
         }
    };

    var canvas = createCanvas();

    // convert library properties into URLs
    var libraryUrls = [];
    if (config.project.settings.libraries) {
        for (var i = 0; i < config.project.settings.libraries.length; i++) {
            if (config.project.settings.libraries[i] === 'physics-engine-3d') {
                libraryUrls.push(config.url.physics);
            } else {
                libraryUrls.push(config.project.settings.libraries[i]);
            }
        }
    }

    if (config.project.settings.vr && !pc.VrManager.hasWebVr()) {
        libraryUrls.push(config.url.webvr);
    }

    var queryParams = (new pc.URI(window.location.href)).getQuery();

    var scriptPrefix = config.project.scriptPrefix;

    // queryParams.local can be true or it can be a URL
    if (queryParams.local) {
        scriptPrefix = queryParams.local === 'true' ? 'http://localhost:51000' : queryParams.local;
    }

    // listen for project setting changes
    var projectSettings = editor.call('project:settings');

    // legacy scripts
    pc.script.legacy = projectSettings.get('use_legacy_scripts');

    // playcanvas application
    var application = new pc.Application(canvas, {
        mouse: new pc.input.Mouse(canvas),
        touch: !!('ontouchstart' in window) ? new pc.input.TouchDevice(canvas) : null,
        keyboard: new pc.input.Keyboard(window),
        gamepads: new pc.input.GamePads(),
        scriptPrefix: scriptPrefix,
        scriptsOrder: projectSettings.get('scripts') || [ ],
        assetPrefix: '/api',
        graphicsDeviceOptions: {
            alpha: config.project.settings.transparent_canvas === false ? false : true,
            preserveDrawingBuffer: !!config.project.settings.preserve_drawing_buffer
        }
    });

    if (canvas.classList) {
        canvas.classList.add('fill-mode-' + config.project.settings.fill_mode);
    }

    if (config.project.settings.use_device_pixel_ratio) {
        application.graphicsDevice.maxPixelRatio = window.devicePixelRatio;
    }

    application.setCanvasResolution(config.project.settings.resolution_mode, config.project.settings.width, config.project.settings.height);
    application.setCanvasFillMode(config.project.settings.fill_mode, config.project.settings.width, config.project.settings.height);

    application._loadLibraries(libraryUrls, function (err) {
        application._onVrChange(config.project.settings.vr);
        libraries = true;
        if (err) {
            console.error(err);
        }
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
        application.setCanvasResolution(config.project.settings.resolution_mode, config.project.settings.width, config.project.settings.height);
        application.setCanvasFillMode(config.project.settings.fill_mode, config.project.settings.width, config.project.settings.height);
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

    projectSettings.on('fill_mode:set', function (value, oldValue) {
        config.project.settings.fill_mode = value;
        if (canvas.classList) {
            if (oldValue)
                canvas.classList.remove('fill-mode-' + oldValue);

            canvas.classList.add('fill-mode-' + value);
        }

        refreshResolutionProperties();
    });

    projectSettings.on('resolution_mode:set', function (value) {
        config.project.settings.resolution_mode = value;
        refreshResolutionProperties();
    });

    projectSettings.on('use_device_pixel_ratio:set', function (value) {
        config.project.settings.use_device_pixel_ratio = value;
        application.graphicsDevice.maxPixelRatio = value ? window.devicePixelRatio : 1;
    });

    window.addEventListener('resize', reflow, false);
    window.addEventListener('orientationchange', reflow, false);

    reflow();

    // get application
    editor.method('viewport', function() {
        return application;
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
