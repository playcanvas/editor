import { Button, Container } from '@playcanvas/pcui';

import { config } from '@/editor/config';

editor.once('load', () => {
    const LOCALSTORAGE_KEY = 'playcanvas-editor-latest-release-notes';
    const latestVersionSeen = localStorage.getItem(LOCALSTORAGE_KEY);

    if (latestVersionSeen === config.version) {
        return;
    }

    const viewport = editor.call('layout.viewport');

    const container = new Container({
        class: ['control-strip', 'bottom-right']
    });
    viewport.append(container);

    const btn = new Button({
        class: 'whats-new',
        icon: 'E259',
        text: 'What\'s New'
    });
    container.append(btn);

    const dismiss = () => {
        localStorage.setItem(LOCALSTORAGE_KEY, config.version);
        container.destroy();
    };

    btn.on('click', () => {
        dismiss();
        window.open(`https://github.com/playcanvas/editor/releases/tag/v${config.version}`);
    });

    // Dismiss icon: a real <span> inside the button DOM
    // (pseudo-elements cannot receive their own click events)
    const dismissIcon = document.createElement('span');
    dismissIcon.classList.add('dismiss-icon');
    btn.dom.appendChild(dismissIcon);
    dismissIcon.addEventListener('click', (evt: MouseEvent) => {
        evt.stopPropagation();
        dismiss();
    });
});
