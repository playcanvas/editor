editor.once('load', function () {
    'use strict';

    var menu = editor.call('menu:edit');
    var cm = editor.call('editor:codemirror');

    var mac = navigator.userAgent.indexOf('Mac OS X') !== -1;

    var canEditLine = function () {
        return editor.call('documents:getFocused') && !cm.isReadOnly();
    };

    var group = menu.createItem('text', {
        title: 'Text'
    });
    group.class.add('text');
    menu.append(group);

    // Insert line before
    var item = menu.createItem('insert-line-before', {
        title: 'Insert Line Before',
        filter: function () {
            return editor.call('editor:command:can:insertLineBefore');
        },
        select: function () {
            return editor.call('editor:command:insertLineBefore');
        }
    });
    item.class.add('noBorder');
    editor.call('menu:item:setShortcut', item, 'Shift+' + editor.call('hotkey:ctrl:string') + '+Enter');
    group.append(item);

    editor.method('editor:command:can:insertLineBefore', canEditLine);

    editor.method('editor:command:insertLineBefore', function () {
        if (! editor.call('editor:command:can:insertLineBefore')) return;
        cm.execCommand('insertLineBefore');
        cm.focus();
    });

    // Insert line after
    var item = menu.createItem('insert-line-after', {
        title: 'Insert Line After',
        filter: function () {
            return editor.call('editor:command:can:insertLineAfter');
        },
        select: function () {
            return editor.call('editor:command:insertLineAfter');
        }
    });
    editor.call('menu:item:setShortcut', item, editor.call('hotkey:ctrl:string') + '+Enter');
    group.append(item);

    editor.method('editor:command:can:insertLineAfter', canEditLine);

    editor.method('editor:command:insertLineAfter', function () {
        if (! editor.call('editor:command:can:insertLineAfter')) return;
        cm.execCommand('insertLineAfter');
        cm.focus();
    });

    // Delete word backward
    var item = menu.createItem('delete-word-backward', {
        title: 'Delete Word Backward',
        filter: function () {
            return editor.call('editor:command:can:deleteWordBackward');
        },
        select: function () {
            return editor.call('editor:command:deleteWordBackward');
        }
    });
    item.class.add('noBorder');
    editor.call('menu:item:setShortcut', item, mac ? 'Alt+Backspace' : 'Ctrl+Backspace');
    group.append(item);

    editor.method('editor:command:can:deleteWordBackward', canEditLine);

    editor.method('editor:command:deleteWordBackward', function () {
        if (! editor.call('editor:command:can:deleteWordBackward')) return;
        cm.execCommand('delGroupBefore');
        cm.focus();
    });

    // Delete word forward
    var item = menu.createItem('delete-word-forward', {
        title: 'Delete Word Forward',
        filter: function () {
            return editor.call('editor:command:can:deleteWordForward');
        },
        select: function () {
            return editor.call('editor:command:deleteWordForward');
        }
    });
    item.class.add('noBorder');
    editor.call('menu:item:setShortcut', item, mac ? 'Ctrl+Alt+Backspace' : 'Ctrl+Delete');
    group.append(item);

    editor.method('editor:command:can:deleteWordForward', canEditLine);

    editor.method('editor:command:deleteWordForward', function () {
        if (! editor.call('editor:command:can:deleteWordForward')) return;
        cm.execCommand('delGroupAfter');
        cm.focus();
    });

    // Delete Beginning
    var item = menu.createItem('delete-beginning', {
        title: 'Delete To Beginning',
        filter: function () {
            return editor.call('editor:command:can:deleteBeginning');
        },
        select: function () {
            return editor.call('editor:command:deleteBeginning');
        }
    });
    item.class.add('noBorder');
    editor.call('menu:item:setShortcut', item, mac ? 'Cmd+K Cmd+Backspace' : 'Ctrl+K Ctrl+Backspace');
    group.append(item);

    editor.method('editor:command:can:deleteBeginning', canEditLine);

    editor.method('editor:command:deleteBeginning', function () {
        if (! editor.call('editor:command:can:deleteBeginning')) return;
        cm.execCommand('delLineLeft');
        cm.focus();
    });

    // Delete End
    var item = menu.createItem('delete-end', {
        title: 'Delete To End',
        filter: function () {
            return editor.call('editor:command:can:deleteEnd');
        },
        select: function () {
            return editor.call('editor:command:deleteEnd');
        }
    });
    editor.call('menu:item:setShortcut', item, mac ? 'Cmd+K Cmd+K' : 'Ctrl+K Ctrl+K');
    group.append(item);

    editor.method('editor:command:can:deleteEnd', canEditLine);

    editor.method('editor:command:deleteEnd', function () {
        if (! editor.call('editor:command:can:deleteEnd')) return;
        cm.execCommand('delLineRight');
        cm.focus();
    });
});