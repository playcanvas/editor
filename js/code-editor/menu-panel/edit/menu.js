import { Menu, Button } from '@playcanvas/pcui';

editor.once('load', function () {
    const root = editor.call('layout.root');
    const panel = editor.call('layout.top');

    const menuEdit = new Menu();

    menuEdit.position(44, 33);
    root.append(menuEdit);

    const btnEdit = new Button({
        text: 'Edit'
    });

    panel.append(btnEdit);

    editor.call('menu:register', 'edit', btnEdit, menuEdit);
});
