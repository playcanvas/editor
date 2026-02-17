import { Button, Menu } from '@playcanvas/pcui';

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


        button.on('click', (e: MouseEvent) => {
            e.stopPropagation();
            menu.hidden = !menu.hidden;
        });

        editor.method(`menu:${name}`, () => {
            return menu;
        });
    });

    // close menus when we click on the background
    panel.on('click', (e: MouseEvent) => {
        for (const key in menus) {
            menus[key].hidden = true;
        }
    });
});
