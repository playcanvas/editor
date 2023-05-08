import { Button } from '@playcanvas/pcui';

editor.once('load', function () {
    const toolbar = editor.call('layout.toolbar');

    const contact = new Button({
        class: ['pc-icon', 'contact', 'bottom'],
        icon: 'E119'
    });
    toolbar.append(contact);

    Tooltip.attach({
        target: contact.dom,
        text: 'Feedback',
        align: 'left',
        root: editor.call('layout.root')
    });

    contact.on('click', () => {
        window.open('https://forum.playcanvas.com/t/playcanvas-editor-feedback/616');
    });
});
