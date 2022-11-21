editor.once('load', function () {
    'use strict';

    const root = editor.call('layout.root');
    const panel = editor.call('layout.top');

    const menu = new ui.Menu();

    menu.position(89, 33);
    root.append(menu);

    const btn = new ui.Button({
        text: 'Selection'
    });

    panel.append(btn);

    editor.call('menu:register', 'selection', btn, menu);
});
