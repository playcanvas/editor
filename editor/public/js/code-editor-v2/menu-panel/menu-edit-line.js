editor.once('load', function () {
    'use strict';

    var menu = editor.call('menu:edit');
    var cm = editor.call('editor:codemirror');
    var mac = navigator.userAgent.indexOf('Mac OS X') !== -1;

    var canEditLine = function () {
        return editor.call('documents:getFocused') && !cm.isReadOnly();
    };

    var group = menu.createItem('line', {
        title: 'Line'
    });
    group.class.add('line');
    menu.append(group);

    // indent
    var item = menu.createItem('indent', {
        title: 'Indent',
        filter: function () {
            return editor.call('editor:command:can:indent');
        },
        select: function () {
            return editor.call('editor:command:indent');
        }
    });
    item.class.add('noBorder');
    editor.call('menu:item:setShortcut', item, 'Tab');
    group.append(item);

    editor.method('editor:command:can:indent', canEditLine);

    editor.method('editor:command:indent', function () {
        if (! editor.call('editor:command:can:indent')) return;

        if (cm.somethingSelected()) {
            cm.indentSelection("add");
        } else {
            cm.execCommand('insertSoftTab');
        }
    });

    // unindent
    item = menu.createItem('unindent', {
        title: 'Unindent',
        filter: function () {
            return editor.call('editor:command:can:unindent');
        },
        select: function () {
            return editor.call('editor:command:unindent');
        }
    });
    item.class.add('noBorder');
    editor.call('menu:item:setShortcut', item, 'Shift+Tab');
    group.append(item);

    editor.method('editor:command:can:unindent', canEditLine);

    editor.method('editor:command:unindent', function () {
        if (! editor.call('editor:command:can:unindent')) return;

        cm.execCommand('indentLess');
    });


    // auto indent
    item = menu.createItem('auto-indent', {
        title: 'Auto Indent',
        filter: function () {
            return editor.call('editor:command:can:autoindent');
        },
        select: function () {
            return editor.call('editor:command:autoindent');
        }
    });
    editor.call('menu:item:setShortcut', item, editor.call('hotkey:ctrl:string') + '+I');
    group.append(item);

    editor.method('editor:command:can:autoindent', canEditLine);

    editor.method('editor:command:autoindent', function () {
        if (! editor.call('editor:command:can:autoindent')) return;

        cm.execCommand('indentAuto');
    });

    // swap line up
    item = menu.createItem('swap-up', {
        title: 'Swap Line Up',
        filter: function () {
            return editor.call('editor:command:can:swapUp');
        },
        select: function () {
            return editor.call('editor:command:swapUp');
        }
    });
    item.class.add('noBorder');
    editor.call('menu:item:setShortcut', item, mac ? 'Cmd+Ctrl+Up' : 'Shift+Ctrl+Up');
    group.append(item);

    editor.method('editor:command:can:swapUp', canEditLine);

    editor.method('editor:command:swapUp', function () {
        if (! editor.call('editor:command:can:swapUp')) return;

        cm.execCommand('swapLineUp');
        cm.focus();
    });

    // swap line down
    item = menu.createItem('swap-down', {
        title: 'Swap Line Down',
        filter: function () {
            return editor.call('editor:command:can:swapDown');
        },
        select: function () {
            return editor.call('editor:command:swapDown');
        }
    });
    editor.call('menu:item:setShortcut', item, mac ? 'Cmd+Ctrl+Down' : 'Shift+Ctrl+Down');
    group.append(item);

    editor.method('editor:command:can:swapDown', canEditLine);

    editor.method('editor:command:swapDown', function () {
        if (! editor.call('editor:command:can:swapDown')) return;

        cm.execCommand('swapLineDown');
        cm.focus();
    });

    // duplicate line
    item = menu.createItem('duplicate', {
        title: 'Duplicate Line',
        filter: function () {
            return editor.call('editor:command:can:duplicateLine');
        },
        select: function () {
            return editor.call('editor:command:duplicateLine');
        }
    });
    editor.call('menu:item:setShortcut', item, 'Shift+' + (mac ? 'Cmd' : 'Ctrl') + '+D');
    group.append(item);

    editor.method('editor:command:can:duplicateLine', canEditLine);

    editor.method('editor:command:duplicateLine', function () {
        if (! editor.call('editor:command:can:duplicateLine')) return;

        cm.execCommand('duplicateLine');
        cm.focus();
    });

    // delete line
    item = menu.createItem('delete-line', {
        title: 'Delete Line',
        filter: function () {
            return editor.call('editor:command:can:deleteLine');
        },
        select: function () {
            return editor.call('editor:command:deleteLine');
        }
    });
    editor.call('menu:item:setShortcut', item, 'Shift+Ctrl+K');
    group.append(item);

    editor.method('editor:command:can:deleteLine', canEditLine);

    editor.method('editor:command:deleteLine', function () {
        if (! editor.call('editor:command:can:deleteLine')) return;

        cm.execCommand('deleteLine');
        cm.focus();
    });

    // join line
    item = menu.createItem('join-line', {
        title: 'Join Lines',
        filter: function () {
            return editor.call('editor:command:can:joinLines');
        },
        select: function () {
            return editor.call('editor:command:joinLines');
        }
    });
    editor.call('menu:item:setShortcut', item, (mac ? 'Cmd' : 'Ctrl') + '+J');
    group.append(item);


    editor.method('editor:command:can:joinLines', canEditLine);

    editor.method('editor:command:joinLines', function () {
        if (! editor.call('editor:command:can:joinLines')) return;

        cm.execCommand('joinLines');
        cm.focus();
    });
});