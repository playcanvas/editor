editor.once('load', function () {
    'use strict';

    var menu = editor.call('menu:edit');
    var cm = editor.call('editor:codemirror');
    var mac = navigator.userAgent.indexOf('Mac OS X') !== -1;

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
        filter: canEditLine,
        select: function () {
            return editor.call('editor:command:toggleComment');
        }
    });
    item.class.add('noBorder');
    editor.call('menu:item:setShortcut', item, 'Ctrl+/');
    group.append(item);

    editor.method('editor:command:toggleComment', function () {
        if (! canEditLine()) return;
        cm.execCommand('toggleCommentIndented');
        cm.focus();
    });

    // toggle comment
    item = menu.createItem('toggle-comment', {
        title: 'Block Comment',
        filter: canEditLine,
        select: function () {
            return editor.call('editor:command:toggleBlockComment');
        }
    });
    editor.call('menu:item:setShortcut', item, mac ? 'Alt+Cmd+/' : 'Shift+Ctrl+/');
    group.append(item);

    editor.method('editor:command:toggleBlockComment', function () {
        if (! canEditLine()) return;
        var from = cm.getCursor('from');
        var to = cm.getCursor('to');
        cm.blockComment(from, to, {
            fullLines: CodeMirror.cmpPos(from, to) === 0
        });
        cm.focus();
    });
});
