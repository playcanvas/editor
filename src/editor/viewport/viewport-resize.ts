editor.once('viewport:load', () => {
    const container = editor.call('layout.viewport');
    const canvas = editor.call('viewport:canvas');

    canvas.on('resize', (width: number, height: number) => {
        editor.call('viewport:render');
        editor.emit('viewport:resize', width, height);
    });

    // handle canvas resizing 60 times a second
    // if size is already same, nothing will happen
    setInterval(() => {
        const rect = container.dom.getBoundingClientRect();
        canvas.resize(Math.floor(rect.width), Math.floor(rect.height));
    }, 1000 / 60);
});
