import { Button } from '@playcanvas/pcui';

editor.once('load', function () {
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

    Tooltip.attach({
        target: button.dom,
        text: 'Settings',
        align: 'left',
        root: editor.call('layout.root')
    });
});
