editor.once('load', function() {
    'use strict'

    var container = editor.call('layout.viewport');
    var canvas = editor.call('viewport:canvas');
    var framework = editor.call('viewport:framework');


    // once canvas resized
    // notify framework
    canvas.on('resize', function(width, height) {
        framework.resize(width, height);
        editor.call('viewport:render');
    });

    // handle canvas resizing
    // 20 times a second
    // if size is already same, nothing will happen
    setInterval(function() {
        var rect = container.element.getBoundingClientRect();
        canvas.resize(Math.floor(rect.width), Math.floor(rect.height));
    }, 1000 / 60);
});
