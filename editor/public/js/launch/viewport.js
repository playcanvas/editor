app.once('load', function() {
    'use strict';


    // canvas element
    var canvas = document.createElement('canvas');
    canvas.id = 'application-canvas';
    canvas.classList.add('fill-mode-FILL_WINDOW');
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


    // resolution mode
    application.setCanvasFillMode(config.project.settings.fillMode, config.project.settings.width, config.project.settings.height);
    application.setCanvasResolution(config.project.settings.resolutionMode, config.project.settings.width, config.project.settings.height);


    // resize
    setInterval(function() {
        var rect = canvas.getBoundingClientRect();
        var width = Math.floor(rect.width);
        var height = Math.floor(rect.height);

        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
        }
    }, 1000 / 60);


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
