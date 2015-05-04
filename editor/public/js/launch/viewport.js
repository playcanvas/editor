app.once('load', function() {
    'use strict';

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

    var libraries = config.project.settings.libraries;
    var libraryUrls = [];
    if (libraries) {
        for (var i = 0; i < libraries.length; i++) {
            if (libraries[i] === 'physics-engine-3d') {
                libraryUrls.push(config.url.physics);
            } else {
                libraryUrls.push(libraries[i]);
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
        libraries: libraryUrls,
        scriptPrefix: scriptPrefix
    });

    if (canvas.classList) {
        canvas.classList.add('fill-mode-' + config.project.settings.fillMode);
    }

    application.setCanvasResolution(config.project.settings.resolutionMode, config.project.settings.width, config.project.settings.height);
    application.setCanvasFillMode(config.project.settings.fillMode, config.project.settings.width, config.project.settings.height);

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
            if (style) {
                style.innerHTML += css;
            } else {
                // try again
                setTimeout(appendCss, 25);
            }
        };

        appendCss();
    }

    var reflow = function () {
        var size = application.resizeCanvas(canvas.width, canvas.height);
        canvas.style.width = '';
        canvas.style.height = '';

        var fillMode = application.fillMode;

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

    // Wait for assets, hierarchy and settings to load before initializing application and starting.
    var hierarchy = false;
    var assets  = false;
    var settings = false;

    var init = function () {
        if (assets && hierarchy && settings) {
            application.loadFromToc(config.scene.id, function () {
                console.log("engine loaded resources");

                application.start();

                splash.parentElement.removeChild(splash);
            }, function (errors) {
                splash.parentElement.removeChild(splash);
                console.error(errors);
            }, function (progress) {
                setProgress(progress);
            });
        }
    };

    app.on('entities:load', function () {
        hierarchy = true;
        init();
    });

    app.on('assets:load', function () {
        assets = true;
        init();
    });

    app.on('sceneSettings:load', function () {
        settings = true;
        init();
    });

});
