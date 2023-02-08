import { Menu, Button } from '@playcanvas/pcui';

editor.once('load', function () {
    const root = editor.call('layout.root');
    const panel = editor.call('layout.top');

    const menuHelp = new Menu();
    menuHelp.position(310, 33);
    root.append(menuHelp);

    const btnHelp = new Button({
        text: 'Help'
    });

    panel.append(btnHelp);

    editor.call('menu:register', 'help', btnHelp, menuHelp);
});
