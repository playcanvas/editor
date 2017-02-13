editor.once('load', function () {
    'use strict';

    var root = editor.call('layout.root');
    var panel = editor.call('layout.top');

    var menuEdit = new ui.Menu();

    menuEdit.position(44, 33);
    root.append(menuEdit);

    var btnEdit = new ui.Button({
        text: 'Edit'
    });

    panel.append(btnEdit);

    editor.call('menu:register', 'edit', btnEdit, menuEdit);
});