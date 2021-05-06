editor.once('load', function () {
    'use strict';

    var icon = document.createElement('img');
    icon.classList.add('connecting');
    icon.src = 'https://playcanvas.com/static-assets/platform/images/loader_transparent.gif';
    icon.width=32;
    icon.height=32;

    var hidden = true;

    editor.on('realtime:connected', function () {
        if (!hidden) {
            document.body.removeChild(icon);
            hidden = true;
        }
    });

    editor.on('realtime:disconnected', function () {
        if (hidden) {
            document.body.appendChild(icon);
            hidden = false;
        }
    });

    editor.on('realtime:error', function (err) {
        log.error(err);
    });
});
