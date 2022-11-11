editor.once('load', function () {
    'use strict';

    const menu = editor.call('menu:selection');
    const me = editor.call('editor:monaco');
    const ctrl = editor.call('hotkey:ctrl:string');

    let item = menu.createItem('next-occurrence', {
        title: 'Add Next Occurrence',
        select: function () {
            me.focus();
            me.trigger(null, 'editor.action.addSelectionToNextFindMatch');
        }
    });
    item.class.add('noBorder');
    editor.call('menu:item:setShortcut', item, ctrl + '+D');
    menu.append(item);

    item = menu.createItem('all-occurrences', {
        title: 'Select All Occurrences',
        select: function () {
            me.focus();
            me.trigger(null, 'editor.action.selectHighlights');
        }
    });
    editor.call('menu:item:setShortcut', item, ctrl + '+Shift+L');
    menu.append(item);
});
