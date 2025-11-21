import { LegacyOverlay } from '../../common/ui/overlay';

editor.once('load', () => {
    let timeout;
    let viewportError = false;

    // overlay
    const overlay = new LegacyOverlay();
    overlay.class.add('connection-overlay');
    overlay.center = false;
    overlay.transparent = false;
    overlay.clickable = false;
    overlay.hidden = true;

    const root = editor.call('layout.root');
    root.append(overlay);

    // icon
    const icon = document.createElement('div');
    icon.classList.add('connection-icon');
    icon.classList.add('error');
    overlay.innerElement.appendChild(icon);

    // content
    const content = document.createElement('div');
    content.classList.add('connection-content');
    overlay.innerElement.appendChild(content);

    editor.on('realtime:connected', () => {
        if (viewportError) {
            return;
        }

        overlay.hidden = true;
    });

    editor.on('realtime:disconnected', () => {
        content.innerHTML = 'You have been disconnected from the server.';
        overlay.hidden = false;
    });

    editor.on('realtime:nextAttempt', (time) => {
        function setText(remaining) {
            content.innerHTML = `Disconnected. Reconnecting in ${remaining} seconds...`;
        }

        let before = new Date();

        function renderTime() {
            const now = new Date();
            const elapsed = now.getTime() - before.getTime();
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

    editor.on('realtime:connecting', (attempt) => {
        if (viewportError) {
            return;
        }

        overlay.hidden = true;
        clearTimeout(timeout);
    });

    editor.on('realtime:cannotConnect', () => {
        overlay.hidden = false;
        clearTimeout(timeout);
        content.innerHTML = 'Cannot connect to the server. Please try again later.';
    });

    const onError = function (err) {
        console.log(err);
        console.trace();
        content.innerHTML = 'Error while saving changes. Please refresh the editor.';
        overlay.hidden = false;
    };

    editor.on('viewport:error', (err) => {
        viewportError = true;
        log.error(err);
        console.trace();
        content.innerHTML = 'Failed creating WebGL Context.<br />Please check <a href="http://webglreport.com/" target="_blank">WebGL Report</a> and report to <a href="http://forum.playcanvas.com/" target="_blank">Forum</a>.';
        overlay.hidden = false;
    });

    editor.on('realtime:error', onError);
    editor.on('realtime:scene:error', (err) => {
        // this should be ok...
        if (/Exceeded max submit retries/.test(err)) {
            console.info(err);
        } else {
            onError(err);
        }
    });
    editor.on('realtime:userdata:error', (err) => {
        log.error(err);
    });
    editor.on('realtime:assets:error', onError);

    editor.on('messenger:scene.delete', (data) => {
        if (data.scene.branchId !== config.self.branch.id) {
            return;
        }

        if (config.scene.id && data.scene.id === parseInt(config.scene.id, 10)) {
            content.innerHTML = 'This scene has been deleted.';
            overlay.hidden = false;
        }
    });

    editor.on('scene:unload', () => {
        if (viewportError) {
            return;
        }

        overlay.hidden = true;
    });
});
