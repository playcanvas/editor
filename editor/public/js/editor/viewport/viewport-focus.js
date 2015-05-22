editor.once('load', function() {
    'use strict';

    var framework = editor.call('viewport:framework');

    editor.method('viewport:focus', function() {
        if (editor.call('selector:type') !== 'entity')
            return;

        var items = editor.call('selector:items');

        framework.activeCamera.script.designer_camera.frameSelection(items[0].entity);
        editor.call('viewport:render');
    });
});
