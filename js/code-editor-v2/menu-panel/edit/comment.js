import { MenuItem } from '@playcanvas/pcui';

editor.once('load', function () {
    const menu = editor.call('menu:edit');
    const me = editor.call('editor:monaco');
    const ctrl = editor.call('hotkey:ctrl:string');

    const canEditLine = function () {
        return editor.call('editor:resolveConflictMode') || editor.call('documents:getFocused') && !editor.call('editor:isReadOnly');
    };

    // toggle comment
    let item = new MenuItem({
        class: 'no-bottom-border',
        text: 'Toggle Comment',
        onIsEnabled: canEditLine,
        onSelect: () => {
            return editor.call('editor:command:toggleComment');
        }
    });
    editor.call('menu:item:setShortcut', item, ctrl + '+/');
    menu.append(item);

    editor.method('editor:command:toggleComment', function () {
        if (!canEditLine()) return;
        me.focus();
        me.trigger(null, 'editor.action.commentLine');
    });

    // toggle comment
    item = new MenuItem({
        text: 'Block Comment',
        onIsEnabled: canEditLine,
        onSelect: () => {
            return editor.call('editor:command:toggleBlockComment');
        }
    });
    editor.call('menu:item:setShortcut', item, 'Shift+Alt+A');
    menu.append(item);

    editor.method('editor:command:toggleBlockComment', function () {
        if (!canEditLine()) return;
        me.focus();
        me.trigger(null, 'editor.action.blockComment');
    });
});
