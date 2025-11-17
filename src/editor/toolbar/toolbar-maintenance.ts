import { Container, Label, Button } from '@playcanvas/pcui';

const PREFIX = '[MAINTENANCE]';

const url = new URL('https://api.github.com/repos/playcanvas/editor/issues');
url.searchParams.set('state', 'open');
url.searchParams.set('creator', 'playcanvas-bot[bot]');
url.searchParams.set('sort', 'updated');
url.searchParams.set('direction', 'desc');
const ISSUES_URL = url.toString();

editor.once('load', async () => {
    const res = await fetch(ISSUES_URL);
    const issues = await res.json() as { title: string, html_url: string }[];
    const maintenance = issues.find(issue => issue.title.startsWith(PREFIX));
    if (!maintenance) {
        return;
    }
    const title = maintenance.title.replace(PREFIX, '').trim();
    const html_url = maintenance.html_url;

    const root = editor.call('layout.root');
    const container = new Container({
        class: 'toolbar-alert'
    });

    const label = new Label({
        unsafe: true,
        text: `<a href='${html_url}' target='_blank'>MAINTENANCE ALERT</a>: ${title}`
    });
    container.append(label);

    const btnClose = new Button({
        class: 'close',
        icon: 'E132'
    });
    container.append(btnClose);
    btnClose.on('click', () => {
        container.hidden = true;
    });
    root.prepend(container);
});
