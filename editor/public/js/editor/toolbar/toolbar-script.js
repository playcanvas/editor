editor.once('load', function () {
    'use script';

    var root = editor.call('layout.root');
    var overlay = new ui.Overlay();
    overlay.class.add('new-script');
    overlay.clickable = true;
    overlay.hidden = true;
    root.append(overlay);

    var panel = new ui.Panel();
    overlay.append(panel);

    var label = new ui.Label({
        text: 'Enter script name and press Enter:'
    });
    label.class.add('action');
    panel.append(label);

    var fieldName = new ui.TextField();
    fieldName.renderChanges = false;
    panel.append(fieldName);

    var fieldError = new ui.Label();
    fieldError.renderChanges = false;
    fieldError.class.add('error');
    panel.append(fieldError);
    fieldError.hidden = true;

    var btnOk = new ui.Button({
        text: 'OK'
    });

    panel.append(btnOk);

    // close overlay on esc
    var onKey = function (e) {
        if (e.keyCode === 27) {
            overlay.hidden = true;
        }
    };

    overlay.on('show', function () {
        editor.emit('sourcefiles:new:open');
        window.addEventListener('keydown', onKey);
        setTimeout(function () {
            fieldName.elementInput.focus();
        }, 100);
    });

    overlay.on('hide', function () {
        window.removeEventListener('keydown', onKey);
        fieldName.value = '';
        fieldError.hidden = true;
        fieldError.text = '';
        editor.emit('sourcefiles:new:close');

    });

    editor.method('sourcefiles:new', function () {
        overlay.hidden = false;
    });

    var onError = function (error) {
        fieldError.text = error;
        fieldError.hidden = false;
    };

    var onOk = function () {
        fieldError.hidden = true;

        if (! validateFilename(fieldName.value)) {
            onError('Invalid filename');
            return;
        }

        if (!fieldName.value.toLowerCase().endsWith('.js'))
            fieldName.value = fieldName.value + '.js';

        createScript(fieldName.value, function (err, script) {
            if (err) {
                onError(err);
            } else {
                overlay.hidden = true;
            }
        });
    };

    // submit on ok
    btnOk.on('click', onOk);

    // submit on enter
    fieldName.elementInput.addEventListener('keydown', function (e) {
        if (e.keyCode === 13) {
            onOk();
        }
    });

    // clear error on input
    fieldName.elementInput.addEventListener('input', function () {
        if (!fieldError.hidden) {
            fieldError.hidden = true;
            fieldError.text = '';
        }
    });

    var pattern = new RegExp("^(?:[\\w\\d\\.-]+\\\/)*[\\w\\d\\.-]+(?:\\.js)?$", 'i');
    var validateFilename = function (filename) {
        return pattern.test(filename);
    };

    var createScript = function (filename, callback) {
        // try to get the file first and create it only if it doesn't exist
        // TODO: don't do that when scripts are assets
        editor.call('sourcefiles:content', filename, function (err) {
            if (! err) {
                // already exists
                callback('Script with that name already exists.');
            } else {
                // create script
                editor.call('sourcefiles:create', filename, function (err, sourcefile) {
                    callback(err, sourcefile);
                });
            }
        });
    };
});