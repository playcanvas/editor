editor.once('load', function () {
    'use strict';

    const root = editor.call('layout.root');
    const panel = editor.call('layout.top');

    const menuFile = new ui.Menu();
    menuFile.position(0, 33);
    root.append(menuFile);

    const btnFile = new ui.Button({
        text: 'File'
    });

    panel.append(btnFile);

    editor.call('menu:register', 'file', btnFile, menuFile);
});
