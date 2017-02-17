editor.once('load', function () {
    'use strict';

    var menu = editor.call('menu:edit');
    var codePanel = editor.call('layout.code');

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


    // hotkeys
    editor.call('hotkey:register', 'undo', {
        key: 'z',
        ctrl: true,
        skipPreventDefault: true,
        callback: function (e) {
            if (codePanel.element.contains(e.target) || e.target.tagName.toLowerCase() === 'input')
                return;

            e.preventDefault();
            editor.call('editor:command:undo');
        }
    });

});