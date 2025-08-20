import * as SVG from '../../../common/svg.ts';
import { LegacyLabel } from '../../../common/ui/label.ts';
import { LegacyPanel } from '../../../common/ui/panel.ts';

editor.once('load', () => {
    // this is true if ANY progress widget is currently
    // showing a spinner. This is so that we don't show
    // version control overlays on top of these windows if any widget here is showing a spinner
    // because it looks bad.
    let showingProgress = false;
    let showingError = false;

    editor.method('picker:versioncontrol:isProgressWidgetVisible', () => {
        return showingProgress;
    });

    editor.method('picker:versioncontrol:isErrorWidgetVisible', () => {
        return showingError;
    });

    editor.method('picker:versioncontrol:createProgressWidget', (args) => {
        const panel = new LegacyPanel();
        panel.class.add('progress-widget');

        // message
        const labelMessage = new LegacyLabel({
            text: args.progressText
        });
        labelMessage.renderChanges = false;
        panel.append(labelMessage);

        // note
        const labelNote = new LegacyLabel();
        labelNote.class.add('note');
        labelNote.renderChanges = false;
        panel.append(labelNote);

        // spinner svg
        const spinner = SVG.spinner(65);
        panel.innerElement.appendChild(spinner);

        // completed svg
        const completed = SVG.completed(65);
        panel.innerElement.appendChild(completed);
        completed.classList.add('hidden');

        // error svg
        const error = SVG.error(65);
        panel.innerElement.appendChild(error);
        error.classList.add('hidden');

        // Call this when the asynchronous action is finished
        panel.finish = function (err) {
            if (err) {
                panel.setMessage(args.errorText);
                panel.setNote(err);
                error.classList.remove('hidden');
                showingError = true;
            } else {
                panel.setMessage(args.finishText);
                panel.setNote('');
                completed.classList.remove('hidden');
                showingError = false;
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

        panel.on('show', () => {
            showingProgress = true;
            panel.parent.class.add('align-center');
        });

        // restore panel contents when the panel is hidden
        panel.on('hide', () => {
            if (panel.parent) {
                panel.parent.class.remove('align-center');
            }

            labelMessage.text = args.progressText;
            labelNote.hidden = true;
            completed.classList.add('hidden');
            error.classList.add('hidden');
            spinner.classList.remove('hidden');
            showingProgress = false;
            showingError = false;
        });

        return panel;
    });
});
