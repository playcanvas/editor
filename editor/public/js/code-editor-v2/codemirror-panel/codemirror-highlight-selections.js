editor.once('load', function () {
    'use strict';

    var cm = editor.call('editor:codemirror');
    var delay = 0;
    var timeout = null;
    var overlay = null;
    var className = 'highlighted';
    var previousSelection = '';

    var isWord = function (from, to) {
        const str = cm.getRange(from, to);
        if (str.match(/^\w+$/) !== null) {
            if (from.ch > 0) {
                const pos = { line: from.line, ch: from.ch - 1 };
                const chr = cm.getRange(pos, from);
                if (chr.match(/\W/) === null) return false;
            }
            if (to.ch < cm.getLine(from.line).length) {
                const pos = { line: to.line, ch: to.ch + 1 };
                const chr = cm.getRange(to, pos);
                if (chr.match(/\W/) === null) return false;
            }

            return true;
        }

        return false;
    };

    var unhighlight = function () {
        if (overlay) {
            cm.removeOverlay(overlay);
            overlay = null;
        }
    };

    var highlight = function () {
        cm.operation(function () {
            var from = cm.getCursor('from');
            var to = cm.getCursor('to');

            if (from.line !== to.line) return unhighlight();
            if (!isWord(from, to)) return unhighlight();

            var selection = cm.getRange(from, to);
            if (selection !== previousSelection || ! overlay) {
                previousSelection = selection;
                unhighlight();

                overlay = editor.call('editor:codemirror:overlay', new RegExp('\\b' + selection + '\\b', 'g'), className);
                cm.addOverlay(overlay);
            } else {
                unhighlight();
            }
        });
    };

    var scheduleHighlight = function () {
        if (timeout)
            clearTimeout(timeout);

        timeout = setTimeout(highlight, delay);
    };

    // highlight words when our cursor changes
    cm.on('cursorActivity', scheduleHighlight);

    var enableHighlighting = function () {
        cm.on('cursorActivity', scheduleHighlight);
    };

    var disableHighlighting = function () {
        cm.off('cursorActivity', scheduleHighlight);

        // remove our highlights
        // and let the search picker take over
        if (overlay) {
            cm.removeOverlay(overlay);
        }
    };

    // do not highlight while the search overlay is on
    editor.on('editor:search:overlay:open', disableHighlighting);

    // enable highlighting when the search overlay is closed
    editor.on('editor:search:overlay:close', enableHighlighting);
});
