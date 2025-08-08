import { Overlay, Label, Button } from '@playcanvas/pcui';

editor.once('load', () => {
    let callback = null;

    // overlay
    const overlay = new Overlay({
        class: 'picker-confirm',
        hidden: true
    });

    // label
    const label = new Label({
        class: 'text',
        text: 'Are you sure?',
        unsafe: true
    });
    overlay.append(label);

    // no
    const btnNo = new Button({
        class: 'no',
        text: 'No'
    });
    btnNo.on('click', () => {
        editor.emit('picker:confirm:no');
        overlay.hidden = true;
    });
    overlay.append(btnNo);

    // yes
    const btnYes = new Button({
        class: 'yes',
        text: 'Yes'
    });
    btnYes.on('click', () => {
        editor.emit('picker:confirm:yes');

        if (callback) {
            callback();
        }

        overlay.hidden = true;
    });
    overlay.append(btnYes);

    const root = editor.call('layout.root');
    root.append(overlay);

    const keyDown = (evt) => {
        if (overlay.hidden) {
            return;
        }

        evt.preventDefault();
        evt.stopPropagation();

        if (evt.key === 'Escape') {
            btnNo.emit('click');
        } else if (evt.key === 'Enter') { // click focused button
            if (document.activeElement === btnYes.element) {
                if (!btnYes.disabled) {
                    btnYes.emit('click');
                }
            } else if (!btnNo.disabled) {
                btnNo.emit('click');
            }
        } else if (evt.key === 'Tab') { // focus yes / no buttons
            if (document.activeElement === btnYes.element) {
                btnNo.element.focus();
            } else {
                btnYes.element.focus();
            }
        } else if (evt.key === 'ArrowRight') { // focus right button (Yes)
            btnYes.element.focus();
        } else if (evt.key === 'ArrowLeft') { // focus left button (No)
            btnNo.element.focus();
        }
    };

    overlay.on('show', () => {
        editor.emit('picker:confirm:open');
        // editor-blocking picker open
        editor.emit('picker:open', 'confirm');

        window.addEventListener('keydown', keyDown, true);
    });

    // on overlay hide
    overlay.on('hide', () => {
        editor.emit('picker:confirm:close');
        // editor-blocking picker closed
        editor.emit('picker:close', 'confirm');

        window.removeEventListener('keydown', keyDown, true);
    });

    // call picker
    editor.method('picker:confirm', (text, fn, options) => {
        label.text = text || 'Are you sure?';
        callback = fn || null;
        options = options || {};

        if (options.yesText !== undefined) {
            btnYes.text = options.yesText;
        } else {
            btnYes.text = 'Yes';
        }
        btnYes.hidden = !btnYes.text;

        if (options.noText !== undefined) {
            btnNo.text = options.noText;
        } else {
            btnNo.text = 'No';
        }
        btnNo.hidden = !btnNo.text;

        overlay.clickable = !options.noDismiss;

        // show overlay
        overlay.hidden = false;
    });

    // close picker
    editor.method('picker:confirm:close', () => {
        overlay.hidden = true;
    });
});
