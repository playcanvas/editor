import { Button, Menu, MenuItem } from '@playcanvas/pcui';

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

    // Format a shortcut string for display (replace modifiers with symbols)
    const formatShortcut = (shortcut: string): string => {
        if (editor.call('editor:mac')) {
            shortcut = shortcut.replace(/Ctrl/g, '⌃');
        }

        return shortcut
            .replace(/\+/g, ' ')
            .replace(/Shift/g, '⇧')
            .replace(/Alt/g, '⌥')
            .replace(/Cmd/g, '⌘')
            .replace(/Right Arrow/g, '→')
            .replace(/Left Arrow/g, '←')
            .replace(/Up Arrow/g, '↑')
            .replace(/Down Arrow/g, '↓');
    };

    // Add shortcut label to a menu item using native PCUI support
    editor.method('menu:item:setShortcut', (item: MenuItem, shortcut: string) => {
        item.shortcut = formatShortcut(shortcut);
    });

    // Expose formatShortcut for use by other modules
    editor.method('menu:formatShortcut', formatShortcut);
});
