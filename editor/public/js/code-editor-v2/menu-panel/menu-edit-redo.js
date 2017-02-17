editor.once('load', function () {
    'use strict';

    var menu = editor.call('menu:edit');
    var ctrl = editor.call('hotkey:ctrl:string');
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
    editor.call('menu:item:setShortcut', item, ctrl + '+Y or Shift+' + ctrl + '+Z');
    menu.append(item);

    // hotkeys
    editor.call('hotkey:register', 'redo', {
        key: 'y',
        ctrl: true,
        skipPreventDefault: true,
        callback: function (e) {
            if (codePanel.element.contains(e.target) || e.target.tagName.toLowerCase() === 'input')
                return;

            e.preventDefault();
            editor.call('editor:command:redo');
        }
    });

    editor.call('hotkey:register', 'redo-2', {
        key: 'z',
        ctrl: true,
        shift: true,
        skipPreventDefault: true,
        callback: function (e) {
            if (codePanel.element.contains(e.target) || e.target.tagName.toLowerCase() === 'input')
                return;

            e.preventDefault();
            editor.call('editor:command:redo');
        }
    });
});