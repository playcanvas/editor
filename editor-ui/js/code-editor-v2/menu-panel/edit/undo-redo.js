editor.once('load', function () {
    'use strict';

    const menu = editor.call('menu:edit');
    const codePanel = editor.call('layout.code');
    const ctrl = editor.call('hotkey:ctrl:string');

    let item = menu.createItem('undo', {
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

    item = menu.createItem('redo', {
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
