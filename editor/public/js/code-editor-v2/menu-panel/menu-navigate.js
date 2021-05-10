editor.once('load', function () {
    'use strict';

    var root = editor.call('layout.root');
    var panel = editor.call('layout.top');

    var menuNavigate = new ui.Menu();
    menuNavigate.position(138, 33);
    root.append(menuNavigate);

    var btnNavigate = new ui.Button({
        text: 'Navigate'
    });

    panel.append(btnNavigate);

    editor.call('menu:register', 'navigate', btnNavigate, menuNavigate);
});
