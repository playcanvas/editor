import { Container, Label } from '@playcanvas/pcui';

const ICONS = {
    loading: 'spinner',
    success: 'check',
    error: 'cross'
};

const makeIcon = (state: keyof typeof ICONS) => {
    const icon = document.createElement('span');
    icon.classList.add('vc-progress-icon', state);
    icon.setAttribute('aria-hidden', 'true');
    icon.appendChild(document.createElement('span')).classList.add(ICONS[state]);
    return icon;
};

editor.once('load', () => {
    let showingProgress = false;
    let showingError = false;

    editor.method('picker:versioncontrol:isProgressWidgetVisible', () => {
        return showingProgress;
    });

    editor.method('picker:versioncontrol:isErrorWidgetVisible', () => {
        return showingError;
    });

    editor.method('picker:versioncontrol:createProgressWidget', (args) => {
        const panel = new Container({ class: 'progress-widget' });

        const header = new Container({ class: 'vc-progress-header' });
        panel.append(header);

        header.append(
            new Label({
                class: 'vc-heading',
                text: 'Resolve conflicts'
            })
        );

        const card = new Container({ class: 'status-card' });
        panel.append(card);

        const row = new Container({ class: 'status-row' });
        card.append(row);

        const iconCell = new Container({ class: 'icon-cell' });
        row.append(iconCell);

        const icons = {
            loading: makeIcon('loading'),
            success: makeIcon('success'),
            error: makeIcon('error')
        };
        iconCell.domContent.append(icons.loading, icons.success, icons.error);

        const copy = new Container({ class: 'copy' });
        const labelMessage = new Label({ class: 'title', text: args.progressText });
        const labelNote = new Label({ class: 'note', text: 'This may take a few seconds.' });
        copy.append(labelMessage);
        copy.append(labelNote);
        row.append(copy);

        const setState = (state: 'loading' | 'success' | 'error') => {
            panel.class.remove('loading', 'success', 'error');
            panel.class.add(state);
            icons.loading.classList.toggle('hidden', state !== 'loading');
            icons.success.classList.toggle('hidden', state !== 'success');
            icons.error.classList.toggle('hidden', state !== 'error');
        };

        panel.finish = function (err: string | null) {
            if (err) {
                panel.setMessage(args.errorText);
                panel.setNote(err);
                setState('error');
                showingError = true;
            } else {
                panel.setMessage(args.finishText);
                panel.setNote('');
                setState('success');
                showingError = false;
            }
        };

        panel.setMessage = function (text: string) {
            labelMessage.text = text;
        };

        panel.setNote = function (text: string) {
            labelNote.text = text;
            labelNote.hidden = !text;
        };

        panel.on('show', () => {
            showingProgress = true;
            panel.parent?.class.add('align-center');
        });

        panel.on('hide', () => {
            if (panel.parent) {
                panel.parent.class.remove('align-center');
            }

            labelMessage.text = args.progressText;
            labelNote.text = 'This may take a few seconds.';
            labelNote.hidden = false;
            setState('loading');
            showingProgress = false;
            showingError = false;
        });

        setState('loading');
        return panel;
    });
});
