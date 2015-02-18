app.once('load', function() {
    'use strict';

    // var canvas = document.createElement('canvas');
    // canvas.style.width = '100%';

    // // create designer framework
    // // var framework = new pc.designer.Designer(canvas, {
    // //     mouse: new pc.input.Mouse(canvas),
    // //     touch: !!('ontouchstart' in window) ? new pc.input.TouchDevice(canvas) : null
    // //     // designerSettings: settings
    // // });

    // document.body.appendChild(canvas);

    var canvas = document.createElement('canvas');
    var canvas.setAttribute('id', 'application-canvas');
    // var canvas.setAttribute('tabindex', 0);
    // var canvas.style.visibility = 'hidden';

    var application = new pc.fw.Application(canvas, {
        content: content,
        // depot: this.depot,
        // keyboard: this.keyboard,
        // mouse: this.mouse,
        // touch: this.touch,
        // gamepads: this.gamepads,
        // displayLoader: this.displayLoader,
        // libraries: content.appProperties['libraries'],
        // scriptPrefix: this.scriptPrefix
    });
});
