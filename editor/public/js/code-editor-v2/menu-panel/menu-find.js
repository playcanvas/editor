editor.once('load', function () {
    'use strict';

    var root = editor.call('layout.root');
    var panel = editor.call('layout.top');

    var menuFind = new ui.Menu();
    menuFind.class.add('top');
    menuFind.class.add('find');

    menuFind.position(89, 33);
    root.append(menuFind);

    var btnFind = new ui.Button({
        text: 'Find'
    });

    panel.append(btnFind);

    btnFind.on('click', function () {
        menuFind.open = true;
    });

    menuFind.on('open', function (open) {
        if (open) {
            btnFind.class.add('open');
        } else {
            btnFind.class.remove('open');
        }
    });

    editor.method('menu:find', function () { return menuFind; });

});