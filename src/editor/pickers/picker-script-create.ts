import { LegacyLabel } from '../../common/ui/label.ts';
import { LegacyOverlay } from '../../common/ui/overlay.ts';
import { LegacyTextField } from '../../common/ui/text-field.ts';

editor.once('load', () => {
    let callback = null;
    const filenameValid = /^[^0-9.#<>$+%!`&='{}@\\/:*?"|\n][^#<>$+%!`&='{}@\\/:*?"|\n]*$/;

    // overlay
    const overlay = new LegacyOverlay();
    overlay.class.add('picker-script-create');
    overlay.hidden = true;

    // label
    const label = new LegacyLabel();
    label.text = 'Enter script filename:';
    label.class.add('text');
    overlay.append(label);

    const input = new LegacyTextField();
    input.blurOnEnter = false;
    input.renderChanges = false;
    overlay.append(input);

    const validate = new LegacyLabel();
    validate.text = 'Invalid filename';
    validate.class.add('validate');
    overlay.append(validate);

    input.element.addEventListener('keydown', (evt) => {
        if (overlay.hidden) return;

        if (evt.keyCode === 13) {
            // enter
            let filename = input.value.trim();
            if (!filename || !filenameValid.test(filename)) {
                validate.hidden = false;
            } else {
                validate.hidden = true;

                if (!filename.endsWith('.js') && !filename.endsWith('.mjs')) {
                    filename += '.js';
                }

                if (callback) {
                    callback(filename);
                }

                overlay.hidden = true;
            }
        } else if (evt.keyCode === 27) {
            // esc
            overlay.hidden = true;
        }
    }, false);

    const root = editor.call('layout.root');
    root.append(overlay);


    // on overlay hide
    overlay.on('hide', () => {
        editor.emit('picker:script-create:close');
    });

    editor.method('picker:script-create:validate', (filename) => {
        if (!filename || !filenameValid.test(filename)) {
            return false;
        }
        if (!filename.endsWith('.js') && !filename.endsWith('.mjs')) {
            filename += '.js';
        }

        return filename;

    });

    // call picker
    editor.method('picker:script-create', (fn, string) => {
        callback = fn || null;

        // show overlay
        overlay.hidden = false;
        validate.hidden = true;
        input.value = string || '';

        setTimeout(() => {
            input.elementInput.focus();
        }, 100);
    });

    // close picker
    editor.method('picker:script-create:close', () => {
        overlay.hidden = true;
    });
});
