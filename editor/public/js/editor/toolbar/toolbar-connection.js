editor.once('load', function() {
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
    overlay.innerElement.appendChild(icon);

    // content
    var content = document.createElement('div');
    content.classList.add('connection-content');
    overlay.innerElement.appendChild(content);

    editor.on('realtime:connected', function () {
        if (viewportError) return;

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

        var before = new Date();

        function renderTime () {
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
        setIconClass('error');
        content.innerHTML = 'Cannot connect to the server. Please try again later.';
    });

    var onError = function (err) {
        console.log(err);
        console.trace();
        setIconClass('error');
        content.innerHTML = 'Error while saving changes. Please refresh the editor.';
        overlay.hidden = false;
    };

    editor.on('viewport:error', function(err) {
        viewportError = true;
        console.error(err);
        console.trace();
        setIconClass('error');
        content.innerHTML = 'Failed creating WebGL Context.<br />Please check <a href="http://webglreport.com/" target="_blank">WebGL Report</a> and report to <a href="http://forum.playcanvas.com/" target="_blank">Forum</a>.';
        overlay.hidden = false;
    });

    editor.on('realtime:error', onError);
    editor.on('realtime:scene:error', onError);
    editor.on('realtime:userdata:error', function (err) {
        console.error(err);
    });
    editor.on('realtime:assets:error', onError);

    editor.on('messenger:scene.delete', function (data) {
        if (data.scene.branchId !== config.self.branch.id) return;

        if (config.scene.id && data.scene.id === parseInt(config.scene.id, 10)) {
            setIconClass('error');
            content.innerHTML = 'This scene has been deleted.';
            overlay.hidden = false;
        }
    });

    editor.on('scene:unload', function () {
        if (viewportError) return;

        overlay.hidden = true;
    });

    var clearIconClass = function () {
        icon.classList.remove('error');
    };

    var setIconClass = function (cls) {
        clearIconClass();
        icon.classList.add(cls);
    };
});
