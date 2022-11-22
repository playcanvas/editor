editor.once('load', function () {
    'use strict';

    const root = editor.call('layout.root');
    const panel = editor.call('layout.top');

    const menuHelp = new pcui.Menu();
    menuHelp.position(310, 33);
    root.append(menuHelp);

    const btnHelp = new pcui.Button({
        text: 'Help'
    });

    panel.append(btnHelp);

    editor.call('menu:register', 'help', btnHelp, menuHelp);
});
