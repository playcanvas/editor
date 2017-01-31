editor.once('load', function () {
    'use strict';

    var menu = editor.call('menu:edit');
    var codePanel = editor.call('layout.code');

    var item = menu.createItem('redo', {
        title: 'Redo',
        filter: function () {
            return editor.call('editor:command:can:redo');
        },
        select: function () {
            return editor.call('editor:command:redo');
        }
    });
    editor.call('menu:item:setShortcut', item, editor.call('hotkey:ctrl:string') + '+Y or Shift+' + editor.call('hotkey:ctrl:string') + '+Z');
    menu.append(item);

    // hotkeys
    editor.call('hotkey:register', 'redo', {
        key: 'y',
        ctrl: true,
        callback: function (e) {
            if (codePanel.element.contains(e.target))
                return;

            editor.call('editor:command:redo');
        }
    });

    editor.call('hotkey:register', 'redo', {
        key: 'z',
        ctrl: true,
        shift: true,
        callback: function (e) {
            if (codePanel.element.contains(e.target))
                return;

            editor.call('editor:command:redo');
        }
    });

});