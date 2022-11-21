editor.once('load', function () {
    'use strict';

    const root = editor.call('layout.root');
    const menu = new ui.Menu();
    root.append(menu);

    menu.class.add('context');

    let currentTab = null;

    // Return menu
    editor.method('tabs:contextmenu', function () {
        return menu;
    });

    // show context menu for a tab
    editor.method('tabs:contextmenu:attach', function (tab) {
        const showMenu = function (e) {
            e.stopPropagation();
            e.preventDefault();

            currentTab = tab;

            menu.open = true;
            menu.position(e.clientX + 1, e.clientY);
        };

        const el = tab.tab.element;
        el.addEventListener('contextmenu', showMenu);
        tab.tab.on('destroy', function () {
            el.removeEventListener('contextmenu', showMenu);
        });
    });

    // close tab
    menu.append(menu.createItem('close', {
        title: 'Close',
        select: function () {
            editor.call('tabs:close', currentTab.id);
        }
    }));

    // close other tabs
    menu.append(menu.createItem('close-other', {
        title: 'Close Other Tabs',
        filter: function () {
            return editor.call('tabs:list').length > 1;
        },
        select: function () {
            const tabs = editor.call('tabs:list');
            let i = tabs.length;
            while (i--) {
                if (tabs[i] === currentTab)
                    continue;

                editor.call('tabs:close', tabs[i].id);
            }
        }
    }));

    // close tabs to the right
    menu.append(menu.createItem('close-right', {
        title: 'Close Tabs To The Right',
        filter: function () {
            const tabs = editor.call('tabs:list');
            const idx = tabs.indexOf(currentTab);
            return idx >= 0 && idx < tabs.length - 1;
        },
        select: function () {
            const tabs = editor.call('tabs:list');
            const idx = tabs.indexOf(currentTab);
            if (idx === -1) return;
            let i = tabs.length;
            while (i-- && i > idx) {
                editor.call('tabs:close', tabs[i].id);
            }
        }
    }));

    // close all tabs
    menu.append(menu.createItem('close-all', {
        title: 'Close All Tabs',
        select: function () {
            editor.call('tabs:batchClose:start');
            const tabs = editor.call('tabs:list');
            let i = tabs.length;
            while (i--) {
                editor.call('tabs:close', tabs[i].id);
            }
            editor.call('tabs:batchClose:end');
        }
    }));
});
