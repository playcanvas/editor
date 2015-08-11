editor.once('load', function() {
    'use strict';

    editor.method('cursor:set', function(type) {
        document.body.style.cursor = type;
    });

    editor.method('cursor:clear', function() {
        document.body.style.cursor = '';
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
    window.addEventListener('mousemove', function(evt) {
        lastX = evt.clientX;
        lastY = evt.clientY;

        if (tooltip.hidden && (Date.now() - hiddenTime) > 100)
            return;

        tooltip.style.transform = 'translate(' + evt.clientX + 'px,' + evt.clientY + 'px)';
    }, false);

    // set tooltip text
    editor.method('cursor:text', function(text) {
        if (text) tooltip.text = text;
        tooltip.hidden = ! text;

        tooltip.style.transform = 'translate(' + lastX + 'px,' + lastY + 'px)';

        if (! text)
            hiddenTime = Date.now();
    });
});
