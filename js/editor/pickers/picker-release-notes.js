import { Container, Label, Button } from '@playcanvas/pcui';

editor.once('load', () => {
    const LOCALSTORAGE_KEY = 'playcanvas-editor-latest-release-notes';
    const latestVersionSeen = localStorage.getItem(LOCALSTORAGE_KEY);
    if (latestVersionSeen === config.version) return;

    const popup = new Container({
        class: 'popup-release-notes',
        flex: true,
        flexDirection: 'row'
    });
    const label = new Label({
        text: 'WHAT\'S NEW'
    });
    popup.append(label);

    function dismiss() {
        localStorage.setItem(LOCALSTORAGE_KEY, config.version);
        popup.destroy();
    }

    popup.on('click', () => {
        dismiss();
        window.open("https://github.com/playcanvas/editor/releases/tag/v" + config.version);
    });

    const btnDismiss = new Button({
        icon: 'E132'
    });
    popup.append(btnDismiss);
    btnDismiss.on('click', (evt) => {
        evt.stopPropagation();
        dismiss();
    });

    editor.call('layout.viewport').append(popup);
});
