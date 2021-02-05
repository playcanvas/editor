editor.once('load', function () {
    'use strict';

    var cursorType = '';

    editor.method('cursor:set', function (type) {
        if (cursorType === type)
            return;

        cursorType = type;
        document.body.style.setProperty('cursor', type, 'important');
        document.body.style.setProperty('cursor', '-moz-' + type, 'important');
        document.body.style.setProperty('cursor', '-webkit-' + type, 'important');
    });

    editor.method('cursor:clear', function () {
        if (! cursorType)
            return;

        cursorType = '';
        document.body.style.cursor = '';
    });

    var hiddenTime = 0;
    var tooltip = new ui.Label({
        unsafe: true
    });
    tooltip.class.add('cursor-tooltip');
    tooltip.renderChanges = false;
    tooltip.hidden = true;
    editor.call('layout.root').append(tooltip);

    var lastX = 0;
    var lastY = 0;

    // move tooltip
    var onMove = function (evt) {
        lastX = evt.clientX;
        lastY = evt.clientY;

        if (tooltip.hidden && (Date.now() - hiddenTime) > 100)
            return;

        tooltip.style.transform = 'translate(' + evt.clientX + 'px,' + evt.clientY + 'px)';
    };
    window.addEventListener('mousemove', onMove, false);
    window.addEventListener('dragover', onMove, false);

    // set tooltip text
    editor.method('cursor:text', function (text) {
        if (text) tooltip.text = text;
        tooltip.hidden = ! text;

        tooltip.style.transform = 'translate(' + lastX + 'px,' + lastY + 'px)';

        if (! text)
            hiddenTime = Date.now();
    });
});
