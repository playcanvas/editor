import { Menu, Button } from '@playcanvas/pcui';

editor.once('load', function () {
    const root = editor.call('layout.root');
    const panel = editor.call('layout.top');

    const menuNavigate = new Menu();
    menuNavigate.position(168, 33);
    root.append(menuNavigate);

    const btnNavigate = new Button({
        text: 'Navigate'
    });

    panel.append(btnNavigate);

    editor.call('menu:register', 'navigate', btnNavigate, menuNavigate);
});
