editor.once('load', () => {
    let state = false;
    let inViewport = false;

    // mouse hovering state on viewport
    editor.on('viewport:hover', (hover: boolean) => {
        if (inViewport === hover) {
            return;
        }

        inViewport = hover;

        if (!inViewport) {
            state = false;

            if (!editor.call('drop:active')) {
                editor.call('cursor:set', '');
            }
        }
    });

    const checkPicked = function (node: import('playcanvas').Entity | null, picked: import('playcanvas').MeshInstance | { node: { name: string } } | null): void {
        let hover = false;

        // if mouse in viewport && entity model has an asset
        // then set cursor to 'crosshair' to indicate
        // that next click will select node in model asset
        if (inViewport && node && node.model && node.model.asset && node.model.model) {
            if (editor.call('selector:type') === 'entity' &&
                editor.call('selector:count') === 1 &&
                editor.call('selector:items')[0].entity === node) {

                hover = true;
            }
        }

        // change cursor if needed
        if (state !== hover) {
            state = hover;
            editor.call('cursor:set', state ? 'crosshair' : '');
        }
    };

    editor.on('viewport:pick:node', checkPicked);
    editor.on('viewport:pick:hover', checkPicked);
});
