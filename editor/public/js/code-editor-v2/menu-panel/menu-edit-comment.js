editor.once('load', function () {
    'use strict';

    var menu = editor.call('menu:edit');
    var cm = editor.call('editor:codemirror');

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

    editor.method('editor:command:can:toggleComment', canEditLine);

    editor.method('editor:command:toggleComment', function () {
        if (! editor.call('editor:command:can:toggleComment')) return;
        cm.execCommand('toggleCommentIndented');
        cm.focus();
    });
});