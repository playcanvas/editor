editor.once('load', function () {
    'use strict';

    var menu = editor.call('menu:edit');
    var me = editor.call('editor:monaco');
    var ctrl = editor.call('hotkey:ctrl:string');

    var canEditLine = function () {
        return editor.call('editor:resolveConflictMode') || editor.call('documents:getFocused') && !editor.call('editor:isReadOnly');
    };

    // toggle comment
    var item = menu.createItem('toggle-comment', {
        title: 'Toggle Comment',
        filter: canEditLine,
        select: function () {
            return editor.call('editor:command:toggleComment');
        }
    });
    item.class.add('noBorder');
    editor.call('menu:item:setShortcut', item, ctrl + '+/');
    menu.append(item);

    editor.method('editor:command:toggleComment', function () {
        if (! canEditLine()) return;
        me.focus();
        me.trigger(null, 'editor.action.commentLine');
    });

    // toggle comment
    item = menu.createItem('toggle-comment', {
        title: 'Block Comment',
        filter: canEditLine,
        select: function () {
            return editor.call('editor:command:toggleBlockComment');
        }
    });
    editor.call('menu:item:setShortcut', item, 'Shift+Alt+A');
    menu.append(item);

    editor.method('editor:command:toggleBlockComment', function () {
        if (! canEditLine()) return;
        me.focus();
        me.trigger(null, 'editor.action.blockComment');
    });
});
