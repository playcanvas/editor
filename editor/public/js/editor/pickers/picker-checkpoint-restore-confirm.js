editor.once('load', function() {
    'use strict';

    var callback;

    var confirmOverlay = addOverlayToRoot();

    var confirmPanel = addPanel(confirmOverlay);

    var msgFirstLine = makeAndAddDiv('ch-confirm-first-line', confirmPanel.innerElement);

    addSecondLine(confirmPanel.innerElement);

    addCancelBtn(confirmPanel);

    addYesBtn(confirmPanel);

    editor.method('picker:checkpointRestoreConfirm', function(data, cb) {
        callback = cb;

        setFirstLineText(data, msgFirstLine);

        confirmOverlay.hidden = false;
    });

    function addOverlayToRoot() {
        var overlay = new ui.Overlay();
        overlay.class.add('checkpoint-restore-confirm');
        overlay.hidden = true;

        var root = editor.call('layout.root');
        root.append(overlay);

        return overlay;
    }

    function addPanel(dst) {
        var panel = new ui.Panel();

        panel.header = 'RESTORE CHECKPOINT';

        dst.append(panel);

        return panel;
    }

    function addCancelBtn(dst) {
        var btn = addButton('CANCEL', 'button-cancel', dst);

        btn.on('click', hideOverlay);
    }

    function addYesBtn(dst) {
        var btn = addButton('RESTORE CHECKPOINT', 'button-yes', dst);

        btn.on('click', function() {
            callback();

            hideOverlay();
        });
    }

    function addButton(text, klass, dst) {
        var btn = new ui.Button( { text: text });

        btn.class.add(klass);

        dst.append(btn);

        return btn;
    }

    function hideOverlay() {
        confirmOverlay.hidden = true;
    }

    function addSecondLine(dst) {
        var div = makeAndAddDiv('ch-confirm-second-line', dst);

        div.innerHTML = 'By restoring you will lose all of ' +
            'your un-checkpointed progress and ' +
            'your project will become the same as when the ' +
            'checkpoint was created.';
    }

    function setFirstLineText(data, dst) {
        var msg = 'Restore checkpoint ' + data.checkpoint_prefix + '?';

        dst.innerHTML = msg;
    }

    function makeAndAddDiv(klass, dstElt) {
        var div = document.createElement('div');

        div.classList.add(klass);

        dstElt.appendChild(div);

        return div;
    }
});
