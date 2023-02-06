editor.once('load', function () {
    var state = false;
    var inViewport = false;

    // mouse hovering state on viewport
    editor.on('viewport:hover', function (hover) {
        if (inViewport === hover)
            return;

        inViewport = hover;

        if (!inViewport) {
            state = false;

            if (!editor.call('drop:active'))
                editor.call('cursor:set', '');
        }
    });

    var checkPicked = function (node, picked) {
        var hover = false;

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
