editor.once('load', function () {
    'use strict';

    var menu = editor.call('menu:edit');

    var item = menu.createItem('undo', {
        title: 'Undo',
        filter: function () {
            return editor.call('editor:command:can:undo');
        },
        select: function () {
            return editor.call('editor:command:undo');
        }
    });
    item.class.add('noBorder');
    editor.call('menu:item:setShortcut', item, editor.call('hotkey:ctrl:string') + '+Z');
    menu.append(item);

});