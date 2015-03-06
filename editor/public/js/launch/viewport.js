app.once('load', function() {
    'use strict';


    // canvas element
    var canvas = document.createElement('canvas');
    canvas.id = 'application-canvas';
    document.body.appendChild(canvas);

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

    // playcanvas application
    var application = new pc.fw.Application(canvas, {
        mouse: new pc.input.Mouse(canvas),
        touch: !!('ontouchstart' in window) ? new pc.input.TouchDevice(canvas) : null,
        keyboard: new pc.input.Keyboard(window),
        // gamepads: this.gamepads,
        // displayLoader: this.displayLoader,
        libraries: libraryUrls,
        scriptPrefix: config.project.repository_url
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
        document.head.querySelector('style').innerHTML += css;
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
