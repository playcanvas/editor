import { Button } from '@playcanvas/pcui';

import { LegacyTooltip } from '../../common/ui/tooltip.ts';

editor.once('load', () => {
    const toolbar = editor.call('layout.toolbar');

    const button = new Button({
        class: ['pc-icon', 'publish-download'],
        icon: 'E237'
    });
    toolbar.append(button);

    button.on('click', () => {
        editor.call('picker:builds-publish');
    });

    editor.on('picker:builds-publish:open', () => {
        button.class.add('active');
    });

    editor.on('picker:builds-publish:close', () => {
        button.class.remove('active');
    });

    LegacyTooltip.attach({
        target: button.dom,
        text: 'Publish / Download',
        align: 'left',
        root: editor.call('layout.root')
    });
});
