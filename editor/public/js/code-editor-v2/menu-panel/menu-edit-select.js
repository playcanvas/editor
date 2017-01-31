editor.once('load', function () {
    'use strict';

    var menu = editor.call('menu:edit');
    var codePanel = editor.call('layout.code');
    var mac = navigator.userAgent.indexOf('Mac OS X') !== -1;

    var group = menu.createItem('selection', {
        title: 'Selection'
    });
    group.class.add('selection');
    menu.append(group);

    // select all
    var item = menu.createItem('select-all', {
        title: 'Select All',
        filter: function () {
            return editor.call('editor:command:can:selectAll');
        },
        select: function () {
            return editor.call('editor:command:selectAll');
        }
    });
    item.class.add('noBorder');
    editor.call('menu:item:setShortcut', item, editor.call('hotkey:ctrl:string') + '+A');
    group.append(item);

    // select line
    item = menu.createItem('select-line', {
        title: 'Select Line',
        filter: function () {
            return editor.call('editor:command:can:selectLine');
        },
        select: function () {
            return editor.call('editor:command:selectLine');
        }
    });
    item.class.add('noBorder');
    editor.call('menu:item:setShortcut', item, editor.call('hotkey:ctrl:string') + '+L');
    group.append(item);

    // select scope
    item = menu.createItem('select-scope', {
        title: 'Select Scope',
        filter: function () {
            return editor.call('editor:command:can:selectScope');
        },
        select: function () {
            return editor.call('editor:command:selectScope');
        }
    });
    item.class.add('noBorder');
    editor.call('menu:item:setShortcut', item, 'Shift+'+editor.call('hotkey:ctrl:string') + '+Space');
    group.append(item);

    // select between brackets
    item = menu.createItem('select-brackets', {
        title: 'Select Between Brackets',
        filter: function () {
            return editor.call('editor:command:can:selectBrackets');
        },
        select: function () {
            return editor.call('editor:command:selectBrackets');
        }
    });
    editor.call('menu:item:setShortcut', item, 'Shift+'+editor.call('hotkey:ctrl:string') + '+M');
    group.append(item);

    // select lines upward
    item = menu.createItem('select-lines-up', {
        title: 'Add Previous Line',
        filter: function () {
            return editor.call('editor:command:can:selectLinesUp');
        },
        select: function () {
            return editor.call('editor:command:selectLinesUp');
        }
    });
    item.class.add('noBorder');
    editor.call('menu:item:setShortcut', item, (mac ? 'Ctrl+Shift' : 'Ctrl+Alt') + '+Up');
    group.append(item);

    // select lines downward
    item = menu.createItem('select-lines-down', {
        title: 'Add Next Line',
        filter: function () {
            return editor.call('editor:command:can:selectLinesDown');
        },
        select: function () {
            return editor.call('editor:command:selectLinesDown');
        }
    });
    item.class.add('noBorder');
    editor.call('menu:item:setShortcut', item, (mac ? 'Ctrl+Shift' : 'Ctrl+Alt') + '+Down');
    group.append(item);

    // single selection
    item = menu.createItem('select-single', {
        title: 'Single Selection',
        filter: function () {
            return editor.call('editor:command:can:selectSingle');
        },
        select: function () {
            return editor.call('editor:command:selectSingle');
        }
    });
    editor.call('menu:item:setShortcut', item, 'Esc');
    group.append(item);

    // hotkeys
    editor.call('hotkey:register', 'select-all', {
        key: 'a',
        ctrl: true,
        callback: function (e) {
            if (! codePanel.element.contains(e.target)) {
                e.preventDefault();
                e.stopPropagation();
            } else {
                return;
            }

            editor.call('editor:command:selectAll');
        }
    });

    editor.call('hotkey:register', 'select-line', {
        key: 'l',
        ctrl: true,
        callback: function (e) {
            if (codePanel.element.contains(e.target))
                return;

            editor.call('editor:command:selectLine');
        }
    });

    editor.call('hotkey:register', 'select-scope', {
        key: 'space',
        shift: true,
        ctrl: true,
        callback: function (e) {
            if (codePanel.element.contains(e.target))
                return;

            editor.call('editor:command:selectScope');
        }
    });

    editor.call('hotkey:register', 'select-brackets', {
        key: 'm',
        shift: true,
        ctrl: true,
        callback: function (e) {
            if (codePanel.element.contains(e.target))
                return;

            editor.call('editor:command:selectBrackets');
        }
    });

    editor.call('hotkey:register', 'select-lines-up', {
        key: 'up arrow',
        shift: mac,
        alt: !mac,
        ctrl: true,
        callback: function (e) {
            if (codePanel.element.contains(e.target))
                return;

            editor.call('editor:command:selectLinesUp');
        }
    });

    editor.call('hotkey:register', 'select-lines-down', {
        key: 'down arrow',
        shift: mac,
        alt: !mac,
        ctrl: true,
        callback: function (e) {
            if (codePanel.element.contains(e.target))
                return;

            editor.call('editor:command:selectLinesDown');
        }
    });

    // select all
    editor.method('editor:command:can:selectAll', function () {
        return !!editor.call('documents:getFocused');
    });

    editor.method('editor:command:selectAll', function () {
        var cm = editor.call('editor:codemirror');
        cm.execCommand('selectAll');
        cm.focus();
    });

    // select line
    editor.method('editor:command:can:selectLine', function () {
        return !!editor.call('documents:getFocused');
    });

    editor.method('editor:command:selectLine', function () {
        var cm = editor.call('editor:codemirror');
        cm.execCommand('selectLine');
        cm.focus();
    });

    // select scope
    editor.method('editor:command:can:selectScope', function () {
        return !!editor.call('documents:getFocused');
    });

    editor.method('editor:command:selectScope', function () {
        var cm = editor.call('editor:codemirror');
        cm.execCommand('selectScope');
        cm.focus();
    });

    // select between brackets
    editor.method('editor:command:can:selectBrackets', function () {
        return !!editor.call('documents:getFocused');
    });

    editor.method('editor:command:selectBrackets', function () {
        var cm = editor.call('editor:codemirror');
        cm.execCommand('selectBetweenBrackets');
        cm.focus();
    });

    // select lines up
    editor.method('editor:command:can:selectLinesUp', function () {
        return !!editor.call('documents:getFocused');
    });

    editor.method('editor:command:selectLinesUp', function () {
        var cm = editor.call('editor:codemirror');
        cm.execCommand('selectLinesUpward');
        cm.focus();
    });

    // select lines down
    editor.method('editor:command:can:selectLinesDown', function () {
        return !!editor.call('documents:getFocused');
    });

    editor.method('editor:command:selectLinesDown', function () {
        var cm = editor.call('editor:codemirror');
        cm.execCommand('selectLinesDownward');
        cm.focus();
    });

    // single selection
    editor.method('editor:command:can:selectSingle', function () {
        var cm = editor.call('editor:codemirror');
        return cm.getSelections().length > 1;
    });

    editor.method('editor:command:selectSingle', function () {
        var cm = editor.call('editor:codemirror');
        cm.execCommand('singleSelection');
        cm.focus();
    });

});