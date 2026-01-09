editor.once('load', () => {
    const canvas = editor.call('viewport:canvas');
    if (!canvas) {
        return;
    }

    // Create the selection rectangle overlay
    const rectOverlay = document.createElement('div');
    rectOverlay.style.cssText = `
        position: absolute;
        border: 1px solid rgba(255, 255, 255, 0.8);
        background-color: rgba(100, 150, 255, 0.15);
        pointer-events: none;
        display: none;
        z-index: 100;
    `;
    canvas.element.parentElement.appendChild(rectOverlay);

    const updateRect = (x1: number, y1: number, x2: number, y2: number) => {
        const minX = Math.min(x1, x2);
        const minY = Math.min(y1, y2);
        const width = Math.abs(x2 - x1);
        const height = Math.abs(y2 - y1);

        rectOverlay.style.left = `${minX}px`;
        rectOverlay.style.top = `${minY}px`;
        rectOverlay.style.width = `${width}px`;
        rectOverlay.style.height = `${height}px`;
    };

    editor.on('viewport:pick:rect:start', (x: number, y: number) => {
        updateRect(x, y, x, y);
        rectOverlay.style.display = 'block';
    });

    editor.on('viewport:pick:rect:move', (x1: number, y1: number, x2: number, y2: number) => {
        updateRect(x1, y1, x2, y2);
    });

    editor.on('viewport:pick:rect:end', () => {
        rectOverlay.style.display = 'none';
    });
});
