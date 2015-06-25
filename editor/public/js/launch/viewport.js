app.once('load', function() {
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
    var scriptList = []

    // update progress bar
    var setProgress = function (value) {
        var bar = document.getElementById('progress-bar');
        value = Math.min(1, Math.max(0, value));
        bar.style.width = value * 100 + '%';
    }

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
        if (!done && assets && hierarchy && settings && sourcefiles && libraries) {
            // prevent multiple init calls during scene loading
            done = true;

            application.on("preload:progress", setProgress);

            // load assets that are in the preload set
            application.preload(function (err) {
                application.off("preload:progress", setProgress);

                // load scripts that are in the scene data
                application._preloadScripts(sceneData, function (err) {
                    if (err) {
                        console.error(err);
                    }

                    // create scene
                    application.scene = application.loader.open("scene", sceneData);
                    application.root.addChild(application.scene.root);

                    // update scene settings now that scene is loaded
                    application.updateSceneSettings(sceneSettings);

                    // clear stored loading data
                    sceneData = null;
                    sceneSettings = null;
                    scriptList = null;

                    app.call('entities:')
                    if (err) {
                        console.error(err);
                    }

                    hideSplash();
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
    }

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

    var canvas = createCanvas();
    showSplash();

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

    var queryParams = (new pc.URI(window.location.href)).getQuery();

    var scriptPrefix = config.project.scriptPrefix;

    // queryParams.local can be true or it can be a URL
    if (queryParams.local) {
        scriptPrefix = queryParams.local === 'true' ? 'http://localhost:51000' : queryParams.local;
    }

    // playcanvas application
    var application = new pc.Application(canvas, {
        mouse: new pc.input.Mouse(canvas),
        touch: !!('ontouchstart' in window) ? new pc.input.TouchDevice(canvas) : null,
        keyboard: new pc.input.Keyboard(window),
        gamepads: new pc.input.GamePads(),
        scriptPrefix: scriptPrefix
    });

    if (canvas.classList) {
        canvas.classList.add('fill-mode-' + config.project.settings.fillMode);
    }

    if (config.project.settings.useDevicePixelRatio) {
        application.graphicsDevice.maxPixelRatio = window.devicePixelRatio;
    }

    application.setCanvasResolution(config.project.settings.resolutionMode, config.project.settings.width, config.project.settings.height);
    application.setCanvasFillMode(config.project.settings.fillMode, config.project.settings.width, config.project.settings.height);

    application._loadLibraries(libraryUrls, function (err) {
        libraries = true;
        if (err) {
            console.error(err);
        }
        init();
    });

    // css media query for aspect ratio changes
    var css  = "@media screen and (min-aspect-ratio: " + config.project.settings.width + "/" + config.project.settings.height + ") {";
        css += "    #application-canvas.fill-mode-KEEP_ASPECT {";
        css += "        width: auto;";
        css += "        height: 100%;";
        css += "        margin: 0 auto;";
        css += "    }";
        css += "}";

    // append css to style
    if (document.head.querySelector) {
        var appendCss = function () {
            var style = document.head.querySelector('style');
            style.innerHTML += css;
        };

        appendCss();
    }



    window.addEventListener('resize', reflow, false);
    window.addEventListener('orientationchange', reflow, false);

    reflow();

    // get application
    app.method('viewport', function() {
        return application;
    });



    app.on('entities:load', function (data) {
        hierarchy = true;
        sceneData = data;
        init();
    });

    app.on('assets:load', function () {
        assets = true;
        init();
    });

    app.on('sceneSettings:load', function (data) {
        settings = true;
        sceneSettings = data.json();
        init();
    });

    app.on('sourcefiles:load', function (scripts) {
        scriptList = scripts;
        sourcefiles = true;
        init();
    })
});
