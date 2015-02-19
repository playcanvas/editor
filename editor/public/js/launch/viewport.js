app.once('load', function() {
    'use strict';


    // canvas element
    var canvas = document.createElement('canvas');
    canvas.id = 'application-canvas';
    canvas.classList.add('fill-mode-FILL_WINDOW');
    document.body.appendChild(canvas);


    // playcanvas application
    var application = new pc.fw.Application(canvas, {
        mouse: new pc.input.Mouse(canvas),
        touch: !!('ontouchstart' in window) ? new pc.input.TouchDevice(canvas) : null
        // depot: this.depot,
        // keyboard: this.keyboard,
        // mouse: this.mouse,
        // touch: this.touch,
        // gamepads: this.gamepads,
        // displayLoader: this.displayLoader,
        // libraries: content.appProperties['libraries'],
        // scriptPrefix: this.scriptPrefix
    });

    // start
    application.start();


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
});
