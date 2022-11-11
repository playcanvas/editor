editor.once('load', function () {
    'use strict';

    var last = null;
    var timeout = null;

    var onClear = function () {
        last = null;

        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
    };

    window.addEventListener('focus', onClear, true);

    window.addEventListener('blur', function (evt) {
        if (!evt.target || !evt.target.ui || !evt.target.ui.focus || !evt.target.ui.refocusable) {
            onClear();
        } else {
            timeout = setTimeout(function () {
                last = evt.target.ui;
            }, 0);
        }
    }, true);

    window.addEventListener('keydown', function (evt) {
        if (!last)
            return;

        if (evt.keyCode === 13) {
            last.focus(true);
        } else {
            onClear();
        }
    }, false);

    window.addEventListener('mousedown', function () {
        if (last) onClear();
    }, false);
});
