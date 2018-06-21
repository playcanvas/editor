editor.once('load', function () {
    'use strict';

    editor.method('picker:versioncontrol:createProgressWidget', function (args) {
        var panel = new ui.Panel();
        panel.class.add('progress-widget');

        // message
        var labelMessage = new ui.Label({
            text: args.progressText
        });
        labelMessage.renderChanges = false;
        panel.append(labelMessage);

        // note
        var labelNote = new ui.Label();
        labelNote.class.add('note');
        labelNote.renderChanges = false;
        panel.append(labelNote);

        // spinner svg
        var spinner = editor.call('picker:versioncontrol:svg:spinner', 65);
        panel.innerElement.appendChild(spinner);

        // completed svg
        var completed = editor.call('picker:versioncontrol:svg:completed', 65);
        panel.innerElement.appendChild(completed);
        completed.classList.add('hidden');

        // error svg
        var error = editor.call('picker:versioncontrol:svg:error', 65);
        panel.innerElement.appendChild(error);
        error.classList.add('hidden');

        // Call this when the asynchronous action is finished
        panel.finish = function (err) {
            if (err) {
                panel.setMessage(args.errorText);
                panel.setNote(err);
                error.classList.remove('hidden');
            } else {
                panel.setMessage(args.finishText);
                panel.setNote('');
                completed.classList.remove('hidden');
            }
            spinner.classList.add('hidden');
        };

        panel.setMessage = function (text) {
            labelMessage.text = text;
        };

        panel.setNote = function (text) {
            labelNote.text = text;
            labelNote.hidden = !text;
        };

        // restore panel contents when the panel is hidden
        panel.on('hide', function () {
            labelMessage.text = args.progressText;
            labelNote.hidden = true;
            completed.classList.add('hidden');
            error.classList.add('hidden');
            spinner.classList.remove('hidden');
        });

        return panel;
    });
});
