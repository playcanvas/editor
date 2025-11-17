import { Container, Label, Button } from '@playcanvas/pcui';

const PREFIX = '[MAINTENANCE]';
const LOCALSTORAGE_KEY = 'playcanvas-editor-maintenance-notice';

const url = new URL('https://api.github.com/repos/playcanvas/editor/issues');
url.searchParams.set('state', 'open');
url.searchParams.set('creator', 'playcanvas-bot[bot]');
url.searchParams.set('sort', 'updated');
url.searchParams.set('direction', 'desc');
const ISSUES_URL = url.toString();
const RATE_LIMIT_URL = 'https://api.github.com/rate_limit';

editor.once('load', async () => {
    // FIXME: non authenticated requests to GitHub API are rate limited to 60 per hour per IP
    const res1 = await fetch(RATE_LIMIT_URL);
    if (!res1.ok) {
        return;
    }
    const rate = await res1.json() as { rate: { remaining: number } };
    if (rate.rate.remaining === 0) {
        return;
    }

    const res2 = await fetch(ISSUES_URL);
    if (!res2.ok) {
        return;
    }
    const issues = await res2.json() as { title: string, html_url: string }[];
    const maintenance = issues.find(issue => issue.title.startsWith(PREFIX));
    if (!maintenance) {
        return;
    }
    const title = maintenance.title.replace(PREFIX, '').trim();
    const html_url = maintenance.html_url;

    const lastNotice = localStorage.getItem(LOCALSTORAGE_KEY);
    if (lastNotice === title) {
        return;
    }

    const root = editor.call('layout.root');
    const container = new Container({
        class: 'toolbar-alert'
    });

    const label = new Label({
        unsafe: true,
        text: `${title}. Click <a href="${html_url}" target="_blank" rel="noopener">here</a> for more info.`
    });
    container.append(label);

    const btnClose = new Button({
        class: 'close',
        icon: 'E132'
    });
    container.append(btnClose);
    btnClose.on('click', () => {
        localStorage.setItem(LOCALSTORAGE_KEY, title);
        container.hidden = true;
    });
    root.prepend(container);
});
