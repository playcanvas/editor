import { TextInput, LabelGroup, Button, Panel, Overlay } from '@playcanvas/pcui';

editor.once('load', function () {
    'use strict';

    const entry = new TextInput({ });
    const label = new LabelGroup({ field: entry });
    const button = new Button({ });

    const panel = new Panel({ flex: true });
    panel.append(label);
    panel.append(button);

    const overlay = new Overlay({ clickable: true });
    overlay.append(panel);
    overlay.hidden = true;

    editor.call('layout.root').append(overlay);

    var callback = null;
    button.on('click', () => {
        if (!callback || callback(entry.value)) {
            overlay.hidden = true;
        } else {
            entry.focus();
        }
    });

    const keydownHandler = function (evt) {
        if (overlay.hidden) return;

        // enter -> submit
        if (evt.keyCode === 13) {
            evt.preventDefault();
            evt.stopPropagation();
            button.emit('click');
        }

        // escape -> cancel
        if (evt.keyCode === 27) {
            overlay.hidden = true;
        }
    };

    overlay.on('show', function () { window.addEventListener('keydown', keydownHandler); });
    overlay.on('hide', function () { window.removeEventListener('keydown', keydownHandler); });

    // display the picker
    editor.method('picker:text-input', function (callback_, options) {
        panel.headerText = (options ? options.headerText : null) || 'Please enter value';
        label.text = (options ? options.labelText : null) || 'Value';
        entry.value = (options ? options.defaultValue : null) || '';
        button.text = (options ? options.buttonText : null) || "Submit";
        callback = callback_;

        // show overlay
        overlay.hidden = false;

        // focus the entry
        entry.focus();
    });
});
