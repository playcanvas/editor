editor.once('load', function () {
    'use strict';

    const root = editor.call('layout.root');
    const panel = editor.call('layout.top');

    const menuEdit = new ui.Menu();

    menuEdit.position(44, 33);
    root.append(menuEdit);

    const btnEdit = new ui.Button({
        text: 'Edit'
    });

    panel.append(btnEdit);

    editor.call('menu:register', 'edit', btnEdit, menuEdit);
});
