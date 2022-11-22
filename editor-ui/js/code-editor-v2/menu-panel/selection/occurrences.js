editor.once('load', function () {
    'use strict';

    const menu = editor.call('menu:selection');
    const me = editor.call('editor:monaco');
    const ctrl = editor.call('hotkey:ctrl:string');

    let item = new pcui.MenuItem({
        class: 'no-bottom-border',
        text: 'Add Next Occurrence',
        onSelect: () => {
            me.focus();
            me.trigger(null, 'editor.action.addSelectionToNextFindMatch');
        }
    });
    editor.call('menu:item:setShortcut', item, ctrl + '+D');
    menu.append(item);

    item = new pcui.MenuItem({
        text: 'Select All Occurrences',
        onSelect: () => {
            me.focus();
            me.trigger(null, 'editor.action.selectHighlights');
        }
    });
    editor.call('menu:item:setShortcut', item, ctrl + '+Shift+L');
    menu.append(item);
});
