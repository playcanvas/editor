editor.once('load', function () {
    'use strict';

    var timeout;
    var viewportError = false;

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
    icon.classList.add('error');
    overlay.innerElement.appendChild(icon);

    // content
    var content = document.createElement('div');
    content.classList.add('connection-content');
    overlay.innerElement.appendChild(content);

    editor.on('realtime:connected', function () {
        if (viewportError) return;

        overlay.hidden = true;
    });

    editor.on('realtime:disconnected', function () {
        content.innerHTML = 'You have been disconnected from the server.';
        overlay.hidden = false;
    });

    editor.on('realtime:nextAttempt', function (time) {
        function setText(remaining) {
            content.innerHTML = 'Disconnected. Reconnecting in ' + remaining + ' seconds...';
        }

        var before = new Date();

        function renderTime() {
            var now = new Date();
            var elapsed = now.getTime() - before.getTime();
            before = now;
            time -= Math.round(elapsed / 1000);
            if (time < 0) {
                time = 0;
            } else {
                timeout = setTimeout(renderTime, 1000);
            }

            setText(time);
        }

        setText(time);

        timeout = setTimeout(renderTime, 1000);
    });

    editor.on('realtime:connecting', function (attempt) {
        if (viewportError) return;

        overlay.hidden = true;
        clearTimeout(timeout);
    });

    editor.on('realtime:cannotConnect', function () {
        overlay.hidden = false;
        clearTimeout(timeout);
        content.innerHTML = 'Cannot connect to the server. Please try again later.';
    });

    var onError = function (err) {
        console.log(err);
        console.trace();
        content.innerHTML = 'Error while saving changes. Please refresh the editor.';
        overlay.hidden = false;
    };

    editor.on('viewport:error', function (err) {
        viewportError = true;
        log.error(err);
        console.trace();
        content.innerHTML = 'Failed creating WebGL Context.<br />Please check <a href="http://webglreport.com/" target="_blank">WebGL Report</a> and report to <a href="http://forum.playcanvas.com/" target="_blank">Forum</a>.';
        overlay.hidden = false;
    });

    editor.on('realtime:error', onError);
    editor.on('realtime:scene:error', err => {
        // this should be ok...
        if (/Exceeded max submit retries/.test(err)) {
            console.info(err);
        } else {
            onError(err);
        }
    });
    editor.on('realtime:userdata:error', function (err) {
        log.error(err);
    });
    editor.on('realtime:assets:error', onError);

    editor.on('messenger:scene.delete', function (data) {
        if (data.scene.branchId !== config.self.branch.id) return;

        if (config.scene.id && data.scene.id === parseInt(config.scene.id, 10)) {
            content.innerHTML = 'This scene has been deleted.';
            overlay.hidden = false;
        }
    });

    editor.on('scene:unload', function () {
        if (viewportError) return;

        overlay.hidden = true;
    });
});
