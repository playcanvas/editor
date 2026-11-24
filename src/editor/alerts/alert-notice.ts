import { config } from '@/editor/config';

import { showAlert } from './alert-bar';

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

    const label = showAlert('notice', {
        tone: 'info',
        text: notice.message,
        onClose: () => localStorage.setItem(LOCALSTORAGE_KEY, key)
    });

    // the message is text, never html, so the link is built rather than written into it
    if (notice.url && /^https:\/\//i.test(notice.url)) {
        const link = document.createElement('a');
        link.href = notice.url;
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = 'More info';
        label.dom.append(' ', link);
    }
});
