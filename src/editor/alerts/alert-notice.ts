import { Button, Container, Label } from '@playcanvas/pcui';

import { config } from '@/editor/config';

const LOCALSTORAGE_KEY = 'playcanvas-editor-notice';

editor.once('load', () => {
    const notice = config.notice;
    if (!notice?.message) {
        return;
    }

    // dismissing hides this notice only; a new one shows again
    const key = `${notice.message}\n${notice.url ?? ''}`;
    if (localStorage.getItem(LOCALSTORAGE_KEY) === key) {
        return;
    }

    const container = new Container({
        class: 'toolbar-alert'
    });

    // the message is text, never html, so the link is built rather than written into it
    const label = new Label({
        text: notice.message
    });
    if (notice.url && /^https:\/\//i.test(notice.url)) {
        const link = document.createElement('a');
        link.href = notice.url;
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = 'More info';
        label.dom.append(' ', link);
    }
    container.append(label);

    const btnClose = new Button({
        class: 'close',
        icon: 'E132'
    });
    container.append(btnClose);
    btnClose.on('click', () => {
        localStorage.setItem(LOCALSTORAGE_KEY, key);
        container.hidden = true;
    });
    editor.call('layout.root').prepend(container);
});
