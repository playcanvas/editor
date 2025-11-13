import { Container, Label, Button } from '@playcanvas/pcui';

editor.once('load', async () => {
    const res = await fetch('https://api.github.com/repos/playcanvas/editor/issues?state=open&labels=alert');
    const issues = await res.json() as { title: string, html_url: string }[];
    if (issues.length === 0) {
        return;
    }
    const [issue] = issues;
    console.error('MAINTENANCE ALERT:', issue.title, issue.html_url);

    const root = editor.call('layout.root');
    const container = new Container({
        class: 'toolbar-alert'
    });

    const label = new Label({
        unsafe: true,
        text: `<a href='${issue.html_url}'>MAINTENANCE ALERT</a>: ${issue.title}`
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
