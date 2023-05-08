import { Button } from '@playcanvas/pcui';

editor.once('load', function () {
    const toolbar = editor.call('layout.toolbar');

    const button = new Button({
        class: ['pc-icon', 'help-howdoi', 'bottom', 'push-top'],
        icon: 'E138'
    });
    toolbar.append(button);

    button.on('click', () => {
        editor.call('help:howdoi:toggle');
    });

    editor.on('help:howdoi:open', () => {
        button.class.add('active');
    });

    editor.on('help:howdoi:close', () => {
        button.class.remove('active');
    });

    Tooltip.attach({
        target: button.dom,
        text: 'How do I...?',
        align: 'left',
        root: editor.call('layout.root')
    });
});
