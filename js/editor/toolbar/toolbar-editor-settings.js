import { Button } from '@playcanvas/pcui';

editor.once('load', function () {
    const toolbar = editor.call('layout.toolbar');

    // settings button
    const button = new Button({
        icon: 'E134'
    });
    button.class.add('pc-icon', 'editor-settings', 'bottom');
    toolbar.append(button);

    button.on('click', function () {
        editor.call('selector:set', 'editorSettings', [editor.call('settings:projectUser')]);
    });

    editor.on('attributes:clear', function () {
        button.class.remove('active');
    });

    editor.on('attributes:inspect[editorSettings]', function () {
        editor.call('attributes.rootPanel').collapsed = false;

        button.class.add('active');
    });

    editor.on('viewport:expand', function (state) {
        button.disabled = state;
    });

    Tooltip.attach({
        target: button.element,
        text: 'Settings',
        align: 'left',
        root: editor.call('layout.root')
    });
});
