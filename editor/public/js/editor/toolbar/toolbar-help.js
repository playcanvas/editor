editor.once('load', function() {
    'use strict';

    var toolbar = editor.call('layout.toolbar');

    var button = new ui.Button({
        text: '&#57656;'
    });
    button.class.add('pc-icon', 'help-howdoi');
    button.style.fontSize = '21px';
    toolbar.append(button);

    button.on('click', function() {
        editor.call('help:howdoi:toggle');
    });

    editor.on('help:howdoi:open', function () {
        button.class.add('active');
    });

    editor.on('help:howdoi:close', function () {
        button.class.remove('active');
    });

    Tooltip.attach({
        target: button.element,
        text: 'How do I...?',
        align: 'left',
        root: editor.call('layout.root')
    });
});
