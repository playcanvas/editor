editor.once('load', function () {
    'use strict';

    var menu = editor.call('menu:edit');
    var ctrl = editor.call('hotkey:ctrl:string');
    var cm = editor.call('editor:codemirror');

    var group = menu.createItem('folding', {
        title: 'Folding'
    });
    group.class.add('folding');
    menu.append(group);

    var canFold = function () {
        return !!editor.call('documents:hasFocused');
    };

    // Fold
    var item = menu.createItem('fold', {
        title: 'Fold',
        filter: canFold,
        select: function () {
            return editor.call('editor:command:fold');
        }
    });
    item.class.add('noBorder');
    editor.call('menu:item:setShortcut', item, 'Shift+' + ctrl + '+[');
    group.append(item);

    editor.call('hotkey:register', 'fold', {
        key: 'left window key',
        ctrl: true,
        shift: true,
        callback: function () {
            editor.call('editor:command:fold');
        }
    });

    editor.method('editor:command:fold', function () {
        cm.execCommand('fold');
        cm.focus();
    });

    // Unfold
    var item = menu.createItem('unfold', {
        title: 'Unfold',
        filter: canFold,
        select: function () {
            return editor.call('editor:command:unfold');
        }
    });
    item.class.add('noBorder');
    editor.call('menu:item:setShortcut', item, 'Shift+' + ctrl + '+]');
    group.append(item);

    editor.call('hotkey:register', 'unfold', {
        key: 'right window key',
        ctrl: true,
        shift: true,
        callback: function () {
            editor.call('editor:command:unfold');
        }
    });

    editor.method('editor:command:unfold', function () {
        cm.execCommand('unfold');
        cm.focus();
    });

    // Unfold All
    var item = menu.createItem('unfold-all', {
        title: 'Unfold All',
        filter: canFold,
        select: function () {
            return editor.call('editor:command:unfoldAll');
        }
    });
    editor.call('menu:item:setShortcut', item, ctrl + '+K ' + ctrl + '+J');
    group.append(item);


    editor.method('editor:command:unfoldAll', function () {
        cm.execCommand('unfoldAll');
        cm.focus();
    });

});