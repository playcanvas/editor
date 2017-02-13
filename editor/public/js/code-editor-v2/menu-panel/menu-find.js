editor.once('load', function () {
    'use strict';

    var root = editor.call('layout.root');
    var panel = editor.call('layout.top');

    var menuFind = new ui.Menu();
    menuFind.position(89, 33);
    root.append(menuFind);

    var btnFind = new ui.Button({
        text: 'Find'
    });

    panel.append(btnFind);

    editor.call('menu:register', 'find', btnFind, menuFind);

});