editor.once('load', function () {
    'use strict';

    const menu = editor.call('menu:navigate');

    let item;

    // Next tab
    item = menu.createItem('next-tab', {
        title: 'Next Tab',
        filter: function () {
            return editor.call('tabs:list').length;
        },
        select: function () {
            editor.call('editor:command:nextTab');
        }
    });
    item.class.add('noBorder');
    editor.call('menu:item:setShortcut', item, 'Ctrl+Alt+.');
    menu.append(item);

    // hotkey
    editor.call('hotkey:register', 'next-tab', {
        key: 'period',
        ctrl: true,
        alt: true,
        callback: function () {
            editor.call('editor:command:nextTab');
        }
    });


    editor.method('editor:command:nextTab', function () {
        const tabs = editor.call('tabs:list');
        if (!tabs.length) return;

        const focused = editor.call('tabs:focused');
        if (!focused) return;

        const idx = tabs.indexOf(focused);
        const next = tabs[(idx + 1) % tabs.length];
        editor.call('files:select', next.id);
    });

    // Previous tab
    item = menu.createItem('previous-tab', {
        title: 'Previous Tab',
        filter: function () {
            return editor.call('tabs:list').length;
        },
        select: function () {
            editor.call('editor:command:previousTab');
        }
    });
    editor.call('menu:item:setShortcut', item, 'Ctrl+Alt+,');
    menu.append(item);

    // hotkey
    editor.call('hotkey:register', 'prev-tab', {
        key: 'comma',
        ctrl: true,
        alt: true,
        callback: function () {
            editor.call('editor:command:previousTab');
        }
    });


    editor.method('editor:command:previousTab', function () {
        const tabs = editor.call('tabs:list');
        if (!tabs.length) return;

        const focused = editor.call('tabs:focused');
        if (!focused) return;

        let idx = tabs.indexOf(focused);
        idx--;
        if (idx < 0)
            idx = tabs.length - 1;

        const next = tabs[idx];
        editor.call('files:select', next.id);
    });

    editor.method('editor:command:selectTab', function (index) {
        const tabs = editor.call('tabs:list');
        const select = tabs[index];
        if (!select) return;

        editor.call('files:select', select.id);
    });
});
