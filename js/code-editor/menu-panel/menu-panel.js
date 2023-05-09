import { Label } from '@playcanvas/pcui';

editor.once('load', function () {
    const panel = editor.call('layout.top');

    const menus = {};
    let openMenus = 0;

    editor.method('menu:register', function (name, button, menu) {
        menus[name] = menu;

        menu.class.add('top');
        menu.class.add(name);

        menu.on('show', function () {
            openMenus++;

            // close other menus
            for (const key in menus) {
                if (menus[key] !== menu) {
                    menus[key].hidden = true;
                }
            }
        });

        menu.on('hide', function () {
            openMenus--;
        });

        button.element.addEventListener('mouseover', function () {
            if (openMenus) {
                menu.hidden = false;
            }
        });


        button.on('click', function (e) {
            e.stopPropagation();
            menu.hidden = !menu.hidden;
        });

        editor.method('menu:' + name, function () {
            return menu;
        });
    });

    // close menus when we click on the background
    panel.on('click', function (e) {
        for (const key in menus) {
            menus[key].hidden = true;
        }
    });

    // Add shortcut label to a menu item
    editor.method('menu:item:setShortcut', function (item, shortcut) {
        // replace common things with icons
        if (editor.call('editor:mac')) {
            shortcut = shortcut.replace(/Ctrl/g, '⌃');
        }

        shortcut = shortcut
        .replace(/\+/g, ' ')
        .replace(/Shift/g, '⇧')
        .replace(/Alt/g, '⌥')
        .replace(/Cmd/g, '⌘')
        .replace(/Right Arrow/g, '→')
        .replace(/Left Arrow/g, '←')
        .replace(/Up Arrow/g, '↑')
        .replace(/Down Arrow/g, '↓');

        const label = new Label({
            class: 'shortcut',
            text: shortcut
        });

        // HACK: there is no way to access the elements of a menu item
        // so manipulate the DOM directly
        item._containerContent.element.appendChild(label.element);
    });
});
