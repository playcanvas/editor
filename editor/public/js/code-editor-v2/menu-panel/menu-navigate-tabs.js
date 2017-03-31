editor.once('load', function () {
    'use strict';

    var menu = editor.call('menu:navigate');

    // Next tab
    var item = menu.createItem('next-tab', {
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
        if (! tabs.length) return;

        var focused = editor.call('tabs:focused');
        if (! focused) return;

        var idx = tabs.indexOf(focused);
        var next = tabs[(idx + 1) % tabs.length];
        editor.call('files:select', next.id);
    });

    // Previous tab
    var item = menu.createItem('previous-tab', {
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
        if (! tabs.length) return;

        var focused = editor.call('tabs:focused');
        if (! focused) return;

        var idx = tabs.indexOf(focused);
        idx--;
        if (idx < 0)
            idx = tabs.length - 1;

        var next = tabs[idx];
        editor.call('files:select', next.id);
    });

    var createSelectTabByNumber = function (number) {
        var item = menu.createItem('goto-tab-' + number, {
            title: 'Tab ' + number,
            filter: function () {
                return editor.call('tabs:list').length >= number;
            },
            select: function () {
                editor.call('editor:command:selectTab', number-1);
            }
        });

        if (number < 10)
            item.class.add('noBorder');

        editor.call('menu:item:setShortcut', item, 'Alt+' + (number%10));
        menu.append(item);

        // hotkey
        editor.call('hotkey:register', 'goto-tab-' + number, {
            key: (number%10) + '',
            alt: true,
            callback: function () {
                editor.call('editor:command:selectTab', number-1);
            }
        });
    };

    // Number tabs
    for (var i = 1; i <= 10; i++) {
        createSelectTabByNumber(i);
    }

    editor.method('editor:command:selectTab', function (index) {
        var tabs = editor.call('tabs:list');
        var select = tabs[index];
        if (! select) return;

        editor.call('files:select', select.id);
    });

});
