editor.once('load', function () {
    'use strict';

    const root = editor.call('layout.root');
    const panel = editor.call('layout.top');

    const menuNavigate = new ui.Menu();
    menuNavigate.position(168, 33);
    root.append(menuNavigate);

    const btnNavigate = new ui.Button({
        text: 'Navigate'
    });

    panel.append(btnNavigate);

    editor.call('menu:register', 'navigate', btnNavigate, menuNavigate);
});
