editor.once('load', function () {
    'use strict';

    var root = editor.call('layout.root');
    var panel = editor.call('layout.top');

    var menuNavigate = new ui.Menu();
    menuNavigate.class.add('top');
    menuNavigate.class.add('navigate');

    menuNavigate.position(138, 33);
    root.append(menuNavigate);

    var btnNavigate = new ui.Button({
        text: 'Navigate'
    });

    panel.append(btnNavigate);

    btnNavigate.on('click', function () {
        menuNavigate.open = true;
    });

    menuNavigate.on('open', function (open) {
        if (open) {
            btnNavigate.class.add('open');
        } else {
            btnNavigate.class.remove('open');
        }
    });

    editor.method('menu:navigate', function () { return menuNavigate; });

});