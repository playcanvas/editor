editor.once('load', function () {
    'use strict';

    var root = editor.call('layout.root');
    var panel = editor.call('layout.top');

    var menuEdit = new ui.Menu();
    menuEdit.class.add('top');
    menuEdit.class.add('edit');

    menuEdit.position(44, 33);
    root.append(menuEdit);

    var btnEdit = new ui.Button({
        text: 'Edit'
    });

    panel.append(btnEdit);

    btnEdit.on('click', function () {
        menuEdit.open = true;
    });

    menuEdit.on('open', function (open) {
        if (open) {
            btnEdit.class.add('open');
        } else {
            btnEdit.class.remove('open');
        }
    });

    editor.method('menu:edit', function () { return menuEdit; });

});