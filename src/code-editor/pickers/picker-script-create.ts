import { Overlay, Label, TextInput } from '@playcanvas/pcui';
import { normalizeScriptName } from "../../common/script-names.ts";

editor.once('load', () => {
    let callback = null;

    // overlay
    const overlay = new Overlay({
        class: 'picker-script-create',
        clickable: true,
        hidden: true
    });

    // label
    const label = new Label({
        text: 'Enter script filename:'
    });
    overlay.append(label);

    const validate = new Label({
        class: 'validate',
        text: 'Invalid filename'
    });
    overlay.append(validate);

    const input = new TextInput({
        blurOnEnter: false,
        renderChanges: false
    });
    overlay.append(input);

    input.dom.addEventListener('keydown', (evt) => {
        if (overlay.hidden) {
            return;
        }

        if (evt.keyCode === 13) {
            // enter
            const normalizedScriptName = normalizeScriptName(input.value);
            const scriptNameValid = normalizedScriptName !== null;

            if (!scriptNameValid) {
                validate.hidden = false;
            } else {
                validate.hidden = true;

                if (callback) {
                    callback(normalizedScriptName);
                }

                overlay.hidden = true;
            }
        } else if (evt.keyCode === 27) {
            // esc
            evt.stopPropagation();
            overlay.hidden = true;
        }
    }, false);

    const root = editor.call('layout.root');
    root.append(overlay);


    // on overlay hide
    overlay.on('hide', () => {
        editor.emit('picker:script-create:close');
    });

    editor.method('picker:script-create:validate', normalizeScriptName);

    // call picker
    editor.method('picker:script-create', (fn, string) => {
        callback = fn || null;

        // show overlay
        overlay.hidden = false;
        validate.hidden = true;
        input.value = string || '';

        input.focus(true);
    });

    // close picker
    editor.method('picker:script-create:close', () => {
        overlay.hidden = true;
    });
});
