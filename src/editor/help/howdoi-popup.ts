import { LegacyButton } from '../../common/ui/button.ts';
import { LegacyLabel } from '../../common/ui/label.ts';
import { LegacyOverlay } from '../../common/ui/overlay.ts';
import { LegacyPanel } from '../../common/ui/panel.ts';

editor.once('load', () => {
    const root = editor.call('layout.root');
    const overlay = new LegacyOverlay();
    overlay.class.add('help-howdoi');
    overlay.hidden = true;
    overlay.clickable = true;
    root.append(overlay);

    const panel = new LegacyPanel();
    overlay.append(panel);

    const content = new LegacyLabel({
        unsafe: true
    });
    content.renderChanges = false;
    panel.append(content);

    const docs = new LegacyButton({
        text: 'View Docs'
    });
    docs.class.add('docs');
    panel.append(docs);
    docs.hidden = true;

    const key = function (e) {
        // close on esc
        if (e.keyCode === 27) {
            overlay.hidden = true;
        }
    };

    overlay.on('show', () => {
        editor.emit('help:howdoi:popup:open');
        window.addEventListener('keydown', key);
    });

    overlay.on('hide', () => {
        window.removeEventListener('keydown', key);
        editor.emit('help:howdoi:popup:close');
    });


    editor.method('help:howdoi:popup', (data) => {
        overlay.hidden = false;
        content.text = data.text;

        setTimeout(() => {
            const closeButton = panel.innerElement.querySelector('.close');
            if (closeButton) {
                closeButton.addEventListener('click', () => {
                    overlay.hidden = true;
                });
            }
        });
    });

});
