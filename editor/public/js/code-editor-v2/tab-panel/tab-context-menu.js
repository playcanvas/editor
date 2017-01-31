editor.once('load', function () {
    'use strict';

    var root = editor.call('layout.root');
    var menu = new ui.Menu();
    root.append(menu);

    menu.class.add('context');

    var currentTab = null;

    // Return menu
    editor.method('tabs:contextmenu', function () {
        return menu;
    });

    // show context menu for a tab
    editor.method('tabs:contextmenu:attach', function (tab) {
        var showMenu = function (e) {
            e.stopPropagation();
            e.preventDefault();

            currentTab = tab;

            menu.open = true;
            menu.position(e.clientX + 1, e.clientY);
        };

        var el = tab.tab.element;
        el.addEventListener('contextmenu', showMenu);
        tab.tab.on('destroy', function () {
            el.removeEventListener('contextmenu', showMenu);
        });
    });

    // close tab
    menu.append(menu.createItem('close', {
        title: 'Close',
        select: function () {
            editor.emit('documents:close', currentTab.asset.get('id'));
        }
    }))

    // close other tabs
    menu.append(menu.createItem('close-other', {
        title: 'Close Other Tabs',
        filter: function () {
            return editor.call('tabs:list').length > 1;
        },
        select: function () {
            var tabs = editor.call('tabs:list');
            var i = tabs.length;
            while (i--) {
                if (tabs[i] === currentTab)
                    continue;

                editor.emit('documents:close', tabs[i].asset.get('id'));
            }
        }
    }));

    // close tabs to the right
    menu.append(menu.createItem('close-right', {
        title: 'Close Tabs To The Right',
        filter: function () {
            var tabs = editor.call('tabs:list');
            var idx = tabs.indexOf(currentTab);
            return idx >= 0 && idx < tabs.length - 1;
        },
        select: function () {
            var tabs = editor.call('tabs:list');
            var idx = tabs.indexOf(currentTab);
            if (idx === -1) return;
            var i = tabs.length;
            while (i-- && i > idx) {
                editor.emit('documents:close', tabs[i].asset.get('id'));
            }
        }
    }));

    // close all tabs
    menu.append(menu.createItem('close-all', {
        title: 'Close All Tabs',
        select: function () {
            var tabs = editor.call('tabs:list');
            var i = tabs.length;
            while (i--) {
                editor.emit('documents:close', tabs[i].asset.get('id'));
            }
        }
    }));
});