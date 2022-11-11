editor.once('load', function () {
    'use strict';

    var menus = {};
    var panel = editor.call('layout.top');

    var openMenus = 0;

    editor.method('menu:register', function (name, button, menu) {
        menus[name] = menu;

        menu.class.add('top');
        menu.class.add(name);

        menu.on('open', function (open) {
            if (open) {
                openMenus++;

                // close other menus
                for (var key in menus) {
                    if (menus[key] !== menu) {
                        menus[key].open = false;
                    }
                }

                button.class.add('open');
            } else {
                button.class.remove('open');
                openMenus--;
            }
        });

        button.on('hover', function () {
            if (openMenus) {
                menu.open = true;
            }
        });


        button.on('click', function (e) {
            e.stopPropagation();
            menu.open = !menu.open;
        });

        editor.method('menu:' + name, function () { return menu; });
    });


    // close menus when we click on the background
    panel.on('click', function (e) {
        for (var key in menus) {
            menus[key].open = false;
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

        var label = new ui.Label({
            text: shortcut
        });
        label.renderChanges = false;
        label.class.add('shortcut');
        item.elementTitle.appendChild(label.element);
    });
});
