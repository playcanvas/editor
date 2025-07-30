import { Button } from '@playcanvas/pcui';

import { LegacyTooltip } from '../../common/ui/tooltip.ts';

editor.once('load', () => {
    const toolbar = editor.call('layout.toolbar');

    const button = new Button({
        class: ['pc-icon', 'github', 'bottom', 'push-top'],
        icon: 'E259'
    });
    toolbar.append(button);

    button.on('click', () => {
        window.open('https://github.com/playcanvas/editor/issues', '_blank');
    });

    LegacyTooltip.attach({
        target: button.dom,
        text: 'Report Github Issues',
        align: 'left',
        root: editor.call('layout.root')
    });
});
