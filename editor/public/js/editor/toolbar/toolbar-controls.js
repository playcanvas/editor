editor.once('load', function() {
    'use strict';

    var toolbar = editor.call('layout.toolbar');

    var button = new ui.Button({
        text: '&#57976;'
    });
    button.class.add('icon', 'help-controls');
    toolbar.append(button);

    button.on('click', function() {
        editor.call('help:controls');
    });

    editor.on('help:controls:open', function () {
        button.class.add('active');
    });

    editor.on('help:controls:close', function () {
        button.class.remove('active');
    });

    Tooltip.attach({
        target: button.element,
        text: 'Controls',
        align: 'left',
        root: editor.call('layout.root')
    });
});
