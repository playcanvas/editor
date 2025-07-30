import { Button } from '@playcanvas/pcui';

import { LegacyTooltip } from '../../common/ui/tooltip.ts';

editor.once('load', () => {
    const toolbar = editor.call('layout.toolbar');

    // settings button
    const button = new Button({
        class: ['pc-icon', 'editor-settings', 'bottom'],
        icon: 'E134'
    });
    toolbar.append(button);

    button.on('click', () => {
        editor.call('selector:set', 'editorSettings', [editor.call('settings:projectUser')]);
    });

    editor.on('attributes:clear', () => {
        button.class.remove('active');
    });

    editor.on('attributes:inspect[editorSettings]', () => {
        editor.call('attributes.rootPanel').collapsed = false;

        button.class.add('active');
    });

    editor.on('viewport:expand', (state) => {
        button.enabled = !state;
    });

    LegacyTooltip.attach({
        target: button.dom,
        text: 'Settings',
        align: 'left',
        root: editor.call('layout.root')
    });
});
