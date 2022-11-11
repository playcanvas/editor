editor.once('load', function () {
    'use strict';

    var root = editor.call('layout.root');
    var panel = editor.call('layout.top');

    var menu = new ui.Menu();

    menu.position(89, 33);
    root.append(menu);

    var btn = new ui.Button({
        text: 'Selection'
    });

    panel.append(btn);

    editor.call('menu:register', 'selection', btn, menu);
});
