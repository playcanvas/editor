editor.once('3d:start', function() {
    'use strict'

    var container = editor.call('layout.viewport');
    var canvas = editor.call('3d:canvas');
    var framework = editor.call('3d:framework');


    // once canvas resized
    // notify framework
    canvas.on('resize', function(width, height) {
        framework.resize(width, height);
        editor.call('3d:render');
    });


    // handle canvas resizing
    // 20 times a second
    // if size is already same, nothing will happen
    setInterval(function() {
        var rect = container.element.getBoundingClientRect();
        canvas.resize(rect.width, rect.height);
    }, 1000 / 20);
});
