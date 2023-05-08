import { Button } from '@playcanvas/pcui';

editor.once('load', function () {
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

    Tooltip.attach({
        target: button.dom,
        text: 'Publish / Download',
        align: 'left',
        root: editor.call('layout.root')
    });
});
