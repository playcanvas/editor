app.once('load', function() {
    'use strict';

    // Wait for assets, hierarchy and settings to load before initializing application and starting.
    var hierarchy = false;
    var assets  = false;
    var settings = false;
    var sourcefiles = false;
    var libraries = false;
    var sceneData = null;
    var sceneSettings = null;

    // canvas element
    var canvas = document.createElement('canvas');
    canvas.id = 'application-canvas';
    document.body.appendChild(canvas);

    // splash
    var splash = document.createElement('div');
    splash.id = 'application-splash';
    document.body.appendChild(splash);

    var logoLink = document.createElement('a');
    logoLink.href = 'https://games.playcanvas.com';
    logoLink.target = '_blank';
    splash.appendChild(logoLink);

    var logo = document.createElement('img');
    logo.src = 'https://s3-eu-west-1.amazonaws.com/static.playcanvas.com/images/logo/PLAY_FLAT_ORANGE3.png';
    logoLink.appendChild(logo);

    // progress bar
    var container = document.createElement('div');
    container.id = 'progress-container';
    splash.appendChild(container);

    var bar = document.createElement('div');
    bar.id = 'progress-bar';
    container.appendChild(bar);

    var setProgress = function (value) {
        value = Math.min(1, Math.max(0, value));
        bar.style.width = value * 100 + '%';
    }

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

    var scriptPrefix = config.project.repository_url;

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
        scriptPrefix: queryParams.local ? 'http://localhost:51000' : config.project.scriptPrefix
    });

    if (canvas.classList) {
        canvas.classList.add('fill-mode-' + config.project.settings.fillMode);
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

    window.addEventListener('resize', reflow, false);
    window.addEventListener('orientationchange', reflow, false);

    reflow();

    // get application
    app.method('viewport', function() {
        return application;
    });

    var init = function () {
        if (assets && hierarchy && settings && sourcefiles && libraries) {
            application.on("preload:progress", setProgress);

            // load assets that are in the preload set
            application.preload(function (err) {
                application.off("preload:progress", setProgress);

                // create scene
                application.scene = application.loader.open("scene", sceneData);
                // update scene settings now that scene is loaded
                application.updateSceneSettings(sceneSettings)

                // clear stored loading data
                sceneData = null;
                sceneSettings = null;

                app.call('entities:')
                if (err) {
                    console.error(err);
                }

                application.start();
                splash.parentElement.removeChild(splash);
            });
        }
    };

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
        application.scripts = scripts;
        sourcefiles = true;
        init();
    })
});
