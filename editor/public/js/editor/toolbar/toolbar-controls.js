editor.once('load', function() {
    'use strict';

    var toolbar = editor.call('layout.toolbar');

    var button = new ui.Button({
        text: '&#57654;'
    });
    button.class.add('pc-icon', 'help-controls', 'bottom');
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
