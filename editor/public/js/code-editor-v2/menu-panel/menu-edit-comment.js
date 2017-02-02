editor.once('load', function () {
    'use strict';

    var menu = editor.call('menu:edit');
    var cm = editor.call('editor:codemirror');
    var codePanel = editor.call('layout.code');

    var canEditLine = function () {
        return editor.call('documents:getFocused') && !cm.isReadOnly();
    };

    var group = menu.createItem('command', {
        title: 'Comment'
    });
    menu.append(group);

    // toggle comment
    var item = menu.createItem('toggle-comment', {
        title: 'Toggle Comment',
        filter: function () {
            return editor.call('editor:command:can:toggleComment');
        },
        select: function () {
            return editor.call('editor:command:toggleComment');
        }
    });
    editor.call('menu:item:setShortcut', item, editor.call('hotkey:ctrl:string') + '+/');
    group.append(item);

    // hotkeys
    editor.call('hotkey:register', 'indent', {
        key: 'forward slash',
        ctrl: true,
        callback: function (e) {
            if (! codePanel.element.contains(e.target))
                editor.call('editor:command:toggleComment');
        }
    });

    editor.method('editor:command:can:toggleComment', canEditLine);

    editor.method('editor:command:toggleComment', function () {
        if (! editor.call('editor:command:can:toggleComment')) return;
        cm.execCommand('toggleCommentIndented');
        cm.focus();
    });
});