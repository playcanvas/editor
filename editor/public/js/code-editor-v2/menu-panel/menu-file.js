editor.once('load', function () {
    'use strict';

    var root = editor.call('layout.root');
    var panel = editor.call('layout.top');

    var menuFile = new ui.Menu();

    menuFile.position(0, 33);
    root.append(menuFile);

    var btnFile = new ui.Button({
        text: 'File'
    });

    panel.append(btnFile);

    btnFile.on('click', function () {
        menuFile.open = true;
    });

    menuFile.on('open', function (open) {
        if (open) {
            btnFile.class.add('open');
        } else {
            btnFile.class.remove('open');
        }
    });

    editor.method('menu:file', function () { return menuFile; });

});