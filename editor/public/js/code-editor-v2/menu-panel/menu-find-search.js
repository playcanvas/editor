editor.once('load', function () {
    'use strict';

    var menu = editor.call('menu:find');
    var codePanel = editor.call('layout.code');
    var ctrl = editor.call('hotkey:ctrl:string');
    var cm = editor.call('editor:codemirror');

    var hasFocused = function () {
        return !!editor.call('documents:getFocused');
    };

    // Find
    var item = menu.createItem('find', {
        title: 'Find',
        filter: hasFocused,
        select: function () {
            return editor.call('editor:command:find');
        }
    });
    item.class.add('noBorder');
    editor.call('menu:item:setShortcut', item, ctrl + '+F');
    menu.append(item);

    editor.call('hotkey:register', 'find', {
        key: 'f',
        ctrl: true,
        callback: function (e) {
            if (codePanel.element.contains(e.target))
                return;

            editor.call('editor:command:find');
        }
    });

    editor.method('editor:command:find', function () {
        if (hasFocused()) {
            editor.call('editor:picker:search:open');
        }
    });

    // Find Next
    var item = menu.createItem('find-next', {
        title: 'Find Next',
        filter: hasFocused,
        select: function (e) {
            return editor.call('editor:command:findNext');
        }
    });
    item.class.add('noBorder');
    editor.call('menu:item:setShortcut', item, 'F3');
    menu.append(item);

    editor.call('hotkey:register', 'find-next', {
        key: 'f3',
        callback: function (e) {
            if (codePanel.element.contains(e.target))
                return;

            editor.call('editor:command:findNext');
        }
    });

    editor.method('editor:command:findNext', function () {
        if (hasFocused()) {
            cm.execCommand('findNext');
        }
    });

    // Find Previous
    var item = menu.createItem('find-previous', {
        title: 'Find Previous',
        filter: hasFocused,
        select: function () {
            return editor.call('editor:command:findPrevious');
        }
    });
    editor.call('menu:item:setShortcut', item, 'Shift+F3');
    menu.append(item);

    editor.call('hotkey:register', 'find-previous', {
        key: 'f3',
        shift: true,
        callback: function (e) {
            if (codePanel.element.contains(e.target))
                return;

            editor.call('editor:command:findPrevious');
        }
    });

    editor.method('editor:command:findPrevious', function () {
        if (hasFocused()) {
            cm.execCommand('findPrev');
        }
    });

});