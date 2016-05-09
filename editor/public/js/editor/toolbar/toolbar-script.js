editor.once('load', function () {
    'use script';

    if (! editor.call('project:settings').get('use_legacy_scripts'))
        return;

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

    var newContent = '';
    var creating = false;

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
        newContent = '';
        creating = false;
        editor.emit('sourcefiles:new:close');

    });

    editor.method('sourcefiles:new', function (content) {
        newContent = content;
        overlay.hidden = false;
    });

    var onError = function (error) {
        fieldError.text = error;
        fieldError.hidden = false;
    };

    var onSubmit = function () {
        if (creating)
            return;

        creating = true;

        fieldError.hidden = true;

        if (! validateFilename(fieldName.value)) {
            creating = false;
            onError('Invalid filename');
            return;
        }

        if (!fieldName.value.toLowerCase().endsWith('.js'))
            fieldName.value = fieldName.value + '.js';

        createScript(fieldName.value, function (err, script) {
            creating = false;

            if (err) {
                onError(err);
            } else {
                // select script
                editor.call('assets:panel:currentFolder', 'scripts');
                editor.call('selector:set', 'asset', [script]);

                overlay.hidden = true;
            }
        });
    };

    // submit on enter
    fieldName.elementInput.addEventListener('keydown', function (e) {
        if (e.keyCode === 13) {
            onSubmit();
        }
    });

    // clear error on input
    fieldName.elementInput.addEventListener('input', function () {
        if (!fieldError.hidden) {
            fieldError.hidden = true;
            fieldError.text = '';
        }
    });

    var pattern = /^(?:[\w\.-]+\/)*[_\.-]*[A-Za-z][\w_\.-]*?$/i;
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
                var content = newContent || editor.call('sourcefiles:skeleton', filename);
                editor.call('sourcefiles:create', filename, content, function (err, sourcefile) {
                    callback(err, sourcefile);
                });
            }
        });
    };
});
