import { Button } from '@playcanvas/pcui';

editor.once('load', function () {
    'use strict';

    const toolbar = editor.call('layout.toolbar');

    const contact = new Button({
        icon: 'E119'
    });
    contact.class.add('pc-icon', 'contact', 'bottom');
    toolbar.append(contact);

    Tooltip.attach({
        target: contact.element,
        text: 'Feedback',
        align: 'left',
        root: editor.call('layout.root')
    });

    contact.on('click', function () {
        window.open('https://forum.playcanvas.com/t/playcanvas-editor-feedback/616');
    });
});
