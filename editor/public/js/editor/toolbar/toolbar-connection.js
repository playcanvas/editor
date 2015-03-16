editor.once('load', function() {
    'use strict';

    var interval;

    // overlay
    var overlay = new ui.Overlay();
    overlay.class.add('connection-overlay');
    overlay.center = false;
    overlay.transparent = false;
    overlay.clickable = false;
    overlay.hidden = true;

    var root = editor.call('layout.root');
    root.append(overlay);

    // icon
    var icon = document.createElement('div');
    icon.classList.add('connection-icon');
    overlay.innerElement.appendChild(icon);

    // content
    var content = document.createElement('div');
    content.classList.add('connection-content');
    overlay.innerElement.appendChild(content);

    editor.on('realtime:connected', function () {
        overlay.hidden = true;
        clearIconClass();
    });

    editor.on('realtime:disconnected', function () {
        setIconClass('error');
        content.innerHTML = 'You have been disconnected from the server.';
        overlay.hidden = false;
    });

    editor.on('realtime:nextAttempt', function (time) {

        setIconClass('error');

        function setText (remaining) {
            content.innerHTML = 'Disconnected. Reconnecting in ' + remaining + ' seconds...';
        }

        setText(time);

        interval = setInterval(function () {
            time -= 1;
            setText(time);
            if (time <= 0) {
                clearInterval(interval);
            }
        }, 1000);
    });

    editor.on('realtime:connecting', function (attempt) {
        overlay.hidden = true;
    });

    editor.on('realtime:cannotConnect', function () {
        overlay.hidden = false;
        clearInterval(interval);
        setIconClass('error');
        content.innerHTML = 'Cannot connect to the server. Please try again later.';
    });

    var onError = function (error) {
        console.log('Realtime error: ' + error);
        setIconClass('error');
        content.innerHTML = 'Error while saving changes. Please refresh the editor.';
        overlay.hidden = false;
    }

    editor.on('realtime:error', onError);
    editor.on('realtime:scene:error', onError);

    var clearIconClass = function () {
        icon.classList.remove('error');
    };

    var setIconClass = function (cls) {
        clearIconClass();
        icon.classList.add(cls);
    };
});
