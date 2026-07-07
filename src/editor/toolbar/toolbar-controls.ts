import { Button } from '@playcanvas/pcui';

import { TooltipHandle } from '@/common/tooltips';

editor.once('load', () => {
    const toolbar = editor.call('layout.toolbar');

    const button = new Button({
        class: ['pc-icon', 'help-controls', 'bottom'],
        icon: 'E136'
    });
    toolbar.append(button);

    button.on('click', () => {
        editor.call('help:controls');
    });

    editor.on('help:controls:open', () => {
        button.class.add('active');
    });

    editor.on('help:controls:close', () => {
        button.class.remove('active');
    });

    TooltipHandle.attach({
        target: button.dom,
        text: 'Controls',
        align: 'left',
        root: editor.call('layout.root')
    });
});
