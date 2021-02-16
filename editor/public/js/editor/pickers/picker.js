editor.once('load', function () {
    'use strict';

    var openPickers = {};

    // the number of open pickers that block the main Editor
    var editorBlockingPickers = 0;

    // This event is fired by pickers that
    // block the main Editor view
    editor.on('picker:open', function (name) {
        if (openPickers[name]) {
            console.warn('picker:open fired for already open picker ' + name);
            return;
        }

        openPickers[name] = true;
        editorBlockingPickers++;
    });

    editor.on('picker:close', function (name) {
        if (! openPickers[name]) {
            console.warn('picker:close fired for already closed picker ' + name);
            return;
        }

        editorBlockingPickers--;
        if (editorBlockingPickers < 0) {
            editorBlockingPickers = 0;
        }

        delete openPickers[name];
    });

    // If true then a picker that blocks the main Editor is open
    // If the name is specified then only returns true if that picker is open
    editor.method('picker:isOpen', function (name) {
        if (! name) {
            return editorBlockingPickers > 0;
        }

        return openPickers[name];
    });

    // Returns true if any picker is open other than the pickers with the
    // specified names
    editor.method('picker:isOpen:otherThan', function (names) {
        if (typeof names === 'string') {
            names = [names];
        }

        for (const key in openPickers) {
            if (names.indexOf(key) === -1) {
                return true;
            }
        }

        return false;
    });

});
