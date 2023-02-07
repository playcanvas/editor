editor.once('load', function () {
    const root = editor.call('layout.root');
    const panel = editor.call('layout.top');

    const menu = new pcui.Menu();

    menu.position(89, 33);
    root.append(menu);

    const btn = new pcui.Button({
        text: 'Selection'
    });

    panel.append(btn);

    editor.call('menu:register', 'selection', btn, menu);
});
