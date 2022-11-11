editor.once('load', function () {
    'use strict';

    var toolbar = editor.call('layout.toolbar');

    var button = new ui.Button({
        text: '&#57911;'
    });
    button.class.add('pc-icon', 'publish-download');
    toolbar.append(button);

    button.on('click', function () {
        editor.call('picker:builds-publish');
    });

    editor.on('picker:builds-publish:open', function () {
        button.class.add('active');
    });

    editor.on('picker:builds-publish:close', function () {
        button.class.remove('active');
    });

    Tooltip.attach({
        target: button.element,
        text: 'Publish / Download',
        align: 'left',
        root: editor.call('layout.root')
    });
});
