editor.once('load', () => {
    let last = null;
    let timeout = null;

    const onClear = function () {
        last = null;

        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
    };

    window.addEventListener('focus', onClear, true);

    window.addEventListener('blur', (evt) => {
        if (!evt.target || !evt.target.ui || !evt.target.ui.focus || !evt.target.ui.refocusable) {
            onClear();
        } else {
            timeout = setTimeout(() => {
                last = evt.target.ui;
            }, 0);
        }
    }, true);

    window.addEventListener('keydown', (evt) => {
        if (!last) {
            return;
        }

        if (evt.keyCode === 13) {
            last.focus(true);
        } else {
            onClear();
        }
    }, false);

    window.addEventListener('mousedown', () => {
        if (last) onClear();
    }, false);
});
