editor.once('load', function () {
    'use strict';

    var menu = editor.call('menu:find');
    var codePanel = editor.call('layout.code');
    var ctrl = editor.call('hotkey:ctrl:string');
    var cm = editor.call('editor:codemirror');
    var mac = navigator.userAgent.indexOf('Mac OS X') !== -1;

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
    editor.call('menu:item:setShortcut', item, mac ? 'Cmd+G' : 'F3');
    menu.append(item);

    editor.call('hotkey:register', 'find-next', {
        key: mac ? 'g' : 'f3',
        meta: mac,
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
    editor.call('menu:item:setShortcut', item, mac ? 'Shift+Cmd+G' : 'Shift+F3');
    menu.append(item);

    editor.call('hotkey:register', 'find-previous', {
        key: mac ? 'g' : 'f3',
        shift: true,
        meta: mac,
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