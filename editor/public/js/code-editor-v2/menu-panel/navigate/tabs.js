editor.once('load', function () {
    'use strict';

    var menu = editor.call('menu:navigate');

    var item;

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
        var tabs = editor.call('tabs:list');
        if (!tabs.length) return;

        var focused = editor.call('tabs:focused');
        if (!focused) return;

        var idx = tabs.indexOf(focused);
        var next = tabs[(idx + 1) % tabs.length];
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
        var tabs = editor.call('tabs:list');
        if (!tabs.length) return;

        var focused = editor.call('tabs:focused');
        if (!focused) return;

        var idx = tabs.indexOf(focused);
        idx--;
        if (idx < 0)
            idx = tabs.length - 1;

        var next = tabs[idx];
        editor.call('files:select', next.id);
    });

    editor.method('editor:command:selectTab', function (index) {
        var tabs = editor.call('tabs:list');
        var select = tabs[index];
        if (!select) return;

        editor.call('files:select', select.id);
    });
});
