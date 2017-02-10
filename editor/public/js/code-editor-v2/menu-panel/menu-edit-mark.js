editor.once('load', function () {
    'use strict';

    var menu = editor.call('menu:edit');
    var ctrl = 'Ctrl';
    var cm = editor.call('editor:codemirror');

    var canEditLine = function () {
        return editor.call('documents:getFocused') && !cm.isReadOnly();
    };

    var group = menu.createItem('mark', {
        title: 'Mark'
    });
    group.class.add('mark');
    menu.append(group);

    // Set Mark
    var item = menu.createItem('set-mark', {
        title: 'Set Mark',
        filter: canEditLine,
        select: function () {
            return editor.call('editor:command:setMark');
        }
    });
    item.class.add('noBorder');
    editor.call('menu:item:setShortcut', item, ctrl + '+K ' + ctrl + '+Space' );
    group.append(item);

    editor.method('editor:command:setMark', function () {
        if (! canEditLine()) return;
        cm.execCommand('setSublimeMark');
        cm.focus();
    });

    // Select To Mark
    item = menu.createItem('select-to-mark', {
        title: 'Select To Mark',
        filter: canEditLine,
        select: function () {
            return editor.call('editor:command:selectToMark');
        }
    });
    item.class.add('noBorder');
    editor.call('menu:item:setShortcut', item, ctrl + '+K ' + ctrl + '+A' );
    group.append(item);

    editor.method('editor:command:selectToMark', function () {
        if (! canEditLine()) return;
        cm.execCommand('selectToSublimeMark');
        cm.focus();
    });

    // Delete To Mark
    item = menu.createItem('delete-to-mark', {
        title: 'Delete To Mark',
        filter: canEditLine,
        select: function () {
            return editor.call('editor:command:deleteToMark');
        }
    });
    item.class.add('noBorder');
    editor.call('menu:item:setShortcut', item, ctrl + '+K ' + ctrl + '+Backspace' );
    group.append(item);

    editor.method('editor:command:deleteToMark', function () {
        if (! canEditLine()) return;
        cm.execCommand('deleteToSublimeMark');
        cm.focus();
    });

    // Swap  Mark
    item = menu.createItem('swap-mark', {
        title: 'Swap Mark',
        filter: canEditLine,
        select: function () {
            return editor.call('editor:command:swapMark');
        }
    });
    item.class.add('noBorder');
    editor.call('menu:item:setShortcut', item, ctrl + '+K ' + ctrl + '+X' );
    group.append(item);

    editor.method('editor:command:swapMark', function () {
        if (! canEditLine()) return;
        cm.execCommand('swapWithSublimeMark');
        cm.focus();
    });

    // Clear Mark
    item = menu.createItem('clear-mark', {
        title: 'Clear Mark',
        filter: canEditLine,
        select: function () {
            return editor.call('editor:command:clearMark');
        }
    });
    editor.call('menu:item:setShortcut', item, ctrl + '+K ' + ctrl + '+G' );
    group.append(item);

    editor.method('editor:command:clearMark', function () {
        if (! canEditLine()) return;
        cm.execCommand('clearBookmarks');
        cm.focus();
    });

    // Yank (this pastes text deleted with Delete To Mark)
    item = menu.createItem('yank', {
        title: 'Yank',
        filter: function () {
            return canEditLine() && cm.state.sublimeKilled;
        },
        select: function () {
            return editor.call('editor:command:yank');
        }
    });
    editor.call('menu:item:setShortcut', item, ctrl + '+K ' + ctrl + '+Y' );
    group.append(item);

    editor.method('editor:command:yank', function () {
        if (! canEditLine() || !cm.state.sublimeKilled) return;
        cm.execCommand('sublimeYank');
        cm.focus();
    });
});