import { Button } from '@playcanvas/pcui';

import { LegacyTooltip } from '@/common/ui/tooltip';

editor.once('load', () => {
    const toolbar = editor.call('layout.toolbar');

    const contact = new Button({
        class: ['pc-icon', 'forum', 'bottom'],
        icon: 'E119'
    });
    toolbar.append(contact);

    LegacyTooltip.attach({
        target: contact.dom,
        text: 'Ask for help on our Forum',
        align: 'left',
        root: editor.call('layout.root')
    });

    contact.on('click', () => {
        window.open('https://forum.playcanvas.com');
    });
});
