editor.once('load', function () {
    'use strict';

    var root = editor.call('layout.root');
    var panel = editor.call('layout.top');

    var menuHelp = new ui.Menu();
    menuHelp.position(310, 33);
    root.append(menuHelp);

    var btnHelp = new ui.Button({
        text: 'Help'
    });

    panel.append(btnHelp);

    editor.call('menu:register', 'help', btnHelp, menuHelp);
});
