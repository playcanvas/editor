editor.once('load', function() {
    'use strict'

    var container = editor.call('layout.viewport');
    var canvas = editor.call('viewport:canvas');
    var app = editor.call('viewport:app');

    if (! app) return; // webgl not available

    if (! canvas)
        return;

    // once canvas resized
    // notify app
    canvas.on('resize', function(width, height) {
        app.resize(width, height);
        editor.call('viewport:render');
        editor.emit('viewport:resize', width, height);
    });

    // handle canvas resizing
    // 20 times a second
    // if size is already same, nothing will happen
    window.resizeInterval = setInterval(function() {
        var rect = container.dom.getBoundingClientRect();
        canvas.resize(Math.floor(rect.width), Math.floor(rect.height));
    }, 1000 / 60);
});
