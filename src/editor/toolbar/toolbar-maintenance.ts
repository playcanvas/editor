import { Container, Label, Button } from '@playcanvas/pcui';

editor.once('load', () => {
    const root = editor.call('layout.root');
    const container = new Container({
        class: 'toolbar-alert'
    });

    const label = new Label({
        unsafe: true,
        text: 'MAINTENANCE ALERT: The editor may be disrupted during maintenance hours on Sunday from 1 AM to 3 AM UTC.'
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
