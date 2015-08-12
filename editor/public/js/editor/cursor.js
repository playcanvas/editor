editor.once('load', function() {
    'use strict';

    var cursorType = '';

    editor.method('cursor:set', function(type) {
        if (cursorType === type)
            return;

        cursorType = type;
        document.body.style.cursor = type;
        document.body.style.mozCursor = '-moz-' + type;
        document.body.style.webkitCursor = '-webkit-' + type;
    });

    editor.method('cursor:clear', function() {
        if (! cursorType)
            return;

        cursorType = '';
        document.body.style.cursor = '';
        document.body.style.mozCursor = '';
        document.body.style.webkitCursor = '';
    });

    var hiddenTime = 0;
    var tooltip = new ui.Label();
    tooltip.class.add('cursor-tooltip');
    tooltip.renderChanges = false;
    tooltip.hidden = true;
    editor.call('layout.root').append(tooltip);

    var lastX = 0;
    var lastY = 0;

    // move tooltip
    var onMove = function(evt) {
        lastX = evt.clientX;
        lastY = evt.clientY;

        if (tooltip.hidden && (Date.now() - hiddenTime) > 100)
            return;

        tooltip.style.transform = 'translate(' + evt.clientX + 'px,' + evt.clientY + 'px)';
    };
    window.addEventListener('mousemove', onMove, false);
    window.addEventListener('dragover', onMove, false);

    // set tooltip text
    editor.method('cursor:text', function(text) {
        if (text) tooltip.text = text;
        tooltip.hidden = ! text;

        tooltip.style.transform = 'translate(' + lastX + 'px,' + lastY + 'px)';

        if (! text)
            hiddenTime = Date.now();
    });
});
