editor.once('load', function () {
    'use strict';

    var callback = null;
    var filenameValid = /^([^0-9.#<>$+%!`&='{}@\\/:*?"<>|\n])([^#<>$+%!`&='{}@\\/:*?"<>|\n])*$/i;

    // overlay
    var overlay = new ui.Overlay();
    overlay.class.add('picker-script-create');
    overlay.hidden = true;

    // label
    var label = new ui.Label();
    label.text = 'Enter script filename:';
    label.class.add('text');
    overlay.append(label);

    var input = new ui.TextField();
    input.blurOnEnter = false;
    input.renderChanges = false;
    overlay.append(input);

    var validate = new ui.Label();
    validate.text = 'Invalid filename';
    validate.class.add('validate');
    overlay.append(validate);

    input.element.addEventListener('keydown', function (evt) {
        if (overlay.hidden) return;

        if (evt.keyCode === 13) {
            // enter
            var filename = input.value.trim();
            if (!filename || !filenameValid.test(filename)) {
                validate.hidden = false;
            } else {
                validate.hidden = true;

                if (!filename.endsWith('.js'))
                    filename += '.js';

                if (callback)
                    callback(filename);

                overlay.hidden = true;
            }
        } else if (evt.keyCode === 27) {
            // esc
            evt.stopPropagation();
            overlay.hidden = true;
        }
    }, false);

    var root = editor.call('layout.root');
    root.append(overlay);


    // on overlay hide
    overlay.on('hide', function () {
        editor.emit('picker:script-create:close');
    });

    editor.method('picker:script-create:validate', function (filename) {
        if (!filename || !filenameValid.test(filename)) {
            return false;
        }

        if (!filename.endsWith('.js'))
            filename += '.js';

        return filename;
    });

    // call picker
    editor.method('picker:script-create', function (fn, string) {
        callback = fn || null;

        // show overlay
        overlay.hidden = false;
        validate.hidden = true;
        input.value = string || '';

        setTimeout(function () {
            input.elementInput.focus();
        }, 100);
    });

    // close picker
    editor.method('picker:script-create:close', function () {
        overlay.hidden = true;
    });
});
