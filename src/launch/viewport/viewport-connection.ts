editor.once('load', () => {
    const icon = document.createElement('img');
    icon.classList.add('connecting');
    icon.src = 'https://playcanvas.com/static-assets/platform/images/loader_transparent.gif';
    icon.width = 32;
    icon.height = 32;

    let hidden = true;

    editor.on('realtime:connected', () => {
        if (!hidden) {
            document.body.removeChild(icon);
            hidden = true;
        }
    });

    editor.on('realtime:disconnected', () => {
        if (hidden) {
            document.body.appendChild(icon);
            hidden = false;
        }
    });

    editor.on('realtime:error', (err) => {
        log.error(err);
    });
});
