import { Menu, Button } from '@playcanvas/pcui';

editor.once('load', function () {
    const root = editor.call('layout.root');
    const panel = editor.call('layout.top');

    const menu = new Menu();

    menu.position(89, 33);
    root.append(menu);

    const btn = new Button({
        text: 'Selection'
    });

    panel.append(btn);

    editor.call('menu:register', 'selection', btn, menu);
});
