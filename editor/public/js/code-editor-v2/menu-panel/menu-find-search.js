editor.once('load', function () {
    'use strict';

    var menu = editor.call('menu:find');
    var codePanel = editor.call('layout.code');
    var ctrl = editor.call('hotkey:ctrl:string');
    var cm = editor.call('editor:codemirror');
    var mac = navigator.userAgent.indexOf('Mac OS X') !== -1;

    var canFind = function () {
        if (editor.call('editor:resolveConflictMode')) return true;

        var focusedTab = editor.call('tabs:focused');
        return focusedTab && (!focusedTab.asset || !!editor.call('documents:getFocused'));
    };

    var item;

    // Find
    item = menu.createItem('find', {
        title: 'Find',
        filter: canFind,
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
        if (canFind()) {
            editor.call('picker:search:open');
        }
    });

    // Find Next
    item = menu.createItem('find-next', {
        title: 'Find Next',
        filter: canFind,
        select: function (e) {
            return editor.call('editor:command:findNext');
        }
    });
    item.class.add('noBorder');
    editor.call('menu:item:setShortcut', item, mac ? 'Cmd+G' : 'F3');
    menu.append(item);

    editor.call('hotkey:register', 'find-next', {
        key: mac ? 'g' : 'f3',
        ctrl: mac,
        callback: function (e) {
            if (codePanel.element.contains(e.target))
                return;

            editor.call('editor:command:findNext');
        }
    });

    editor.method('editor:command:findNext', function () {
        if (canFind()) {
            cm.execCommand('findNext');
        }
    });

    // Find Previous
    item = menu.createItem('find-previous', {
        title: 'Find Previous',
        filter: canFind,
        select: function () {
            return editor.call('editor:command:findPrevious');
        }
    });
    editor.call('menu:item:setShortcut', item, mac ? 'Shift+Cmd+G' : 'Shift+F3');
    menu.append(item);

    editor.call('hotkey:register', 'find-previous', {
        key: mac ? 'g' : 'f3',
        shift: true,
        ctrl: mac,
        callback: function (e) {
            if (codePanel.element.contains(e.target))
                return;

            editor.call('editor:command:findPrevious');
        }
    });

    editor.method('editor:command:findPrevious', function () {
        if (canFind()) {
            cm.execCommand('findPrev');
        }
    });
});
