editor.once('load', function() {
    'use strict';

    var timeout;

    var icon = document.createElement('img');
    icon.classList.add('connecting');
    icon.src = 'https://s3-eu-west-1.amazonaws.com/static.playcanvas.com/platform/images/loader_transparent.gif';
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
});
