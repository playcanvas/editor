import { Label } from '@playcanvas/pcui';
import type { Button, Menu, MenuItem } from '@playcanvas/pcui';

editor.once('load', () => {
    const panel = editor.call('layout.top');

    const menus = {};
    let openMenus = 0;

    editor.method('menu:register', (name: string, button: Button, menu: Menu) => {
        menus[name] = menu;

        menu.class.add('top');
        menu.class.add(name);

        menu.on('show', () => {
            openMenus++;

            // close other menus
            for (const key in menus) {
                if (menus[key] !== menu) {
                    menus[key].hidden = true;
                }
            }
        });

        menu.on('hide', () => {
            openMenus--;
        });

        button.dom.addEventListener('mouseover', () => {
            if (openMenus) {
                menu.hidden = false;
            }
        });


        button.on('click', (e) => {
            e.stopPropagation();
            menu.hidden = !menu.hidden;
        });

        editor.method(`menu:${name}`, () => {
            return menu;
        });
    });

    // close menus when we click on the background
    panel.on('click', (e) => {
        for (const key in menus) {
            menus[key].hidden = true;
        }
    });

    // Add shortcut label to a menu item
    editor.method('menu:item:setShortcut', (item: MenuItem, shortcut: string) => {
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
        item._containerContent.dom.appendChild(label.dom);
    });
});
