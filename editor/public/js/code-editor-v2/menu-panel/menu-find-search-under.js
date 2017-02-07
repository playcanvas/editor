editor.once('load', function () {
    'use strict';

    var menu = editor.call('menu:find');
    var codePanel = editor.call('layout.code');
    var ctrl = editor.call('hotkey:ctrl:string');
    var cm = editor.call('editor:codemirror');

    var hasFocused = function () {
        return !!editor.call('documents:getFocused');
    };

    // Find Under
    var item = menu.createItem('find-under', {
        title: 'Quick Find',
        filter: hasFocused,
        select: function () {
            return editor.call('editor:command:findUnder');
        }
    });
    item.class.add('noBorder');
    editor.call('menu:item:setShortcut', item, ctrl + '+F3');
    menu.append(item);

    editor.call('hotkey:register', 'find-under', {
        key: 'f3',
        ctrl: true,
        callback: function (e) {
            if (codePanel.element.contains(e.target))
                return;

            editor.call('editor:command:findUnder');
        }
    });

    editor.method('editor:command:findUnder', function () {
        if (hasFocused()) {
            cm.execCommand('findUnder');
            cm.focus();
        }
    });

    // Find Under Previous
    var item = menu.createItem('find-under-prev', {
        title: 'Quick Find Previous',
        filter: hasFocused,
        select: function () {
            return editor.call('editor:command:findUnderPrev');
        }
    });
    item.class.add('noBorder');
    editor.call('menu:item:setShortcut', item, 'Shift+' + ctrl + '+F3');
    menu.append(item);

    editor.call('hotkey:register', 'find-under-prev', {
        key: 'f3',
        ctrl: true,
        shift: true,
        callback: function (e) {
            if (codePanel.element.contains(e.target))
                return;

            editor.call('editor:command:findUnderPrev');
        }
    });

    editor.method('editor:command:findUnderPrev', function () {
        if (hasFocused()) {
            cm.execCommand('findUnderPrevious');
            cm.focus();
        }
    });

    // Find All Under
    var item = menu.createItem('find-all-under', {
        title: 'Quick Find All',
        filter: hasFocused,
        select: function () {
            return editor.call('editor:command:findAllUnder');
        }
    });
    item.class.add('noBorder');
    editor.call('menu:item:setShortcut', item, 'Alt+F3');
    menu.append(item);

    editor.call('hotkey:register', 'find-all-under', {
        key: 'f3',
        alt: true,
        callback: function (e) {
            if (codePanel.element.contains(e.target))
                return;

            editor.call('editor:command:findAllUnder');
        }
    });

    editor.method('editor:command:findAllUnder', function () {
        if (hasFocused()) {
            cm.execCommand('findAllUnder');
            cm.focus();
        }
    });

    // Select next occurrence
    var item = menu.createItem('find-all-under', {
        title: 'Quick Add Next',
        filter: hasFocused,
        select: function () {
            return editor.call('editor:command:selectNextOccurrence');
        }
    });
    editor.call('menu:item:setShortcut', item, ctrl + '+D');
    menu.append(item);

    editor.call('hotkey:register', 'select-next-occurrence', {
        key: 'd',
        ctrl: true,
        callback: function (e) {
            if (codePanel.element.contains(e.target))
                return;

            editor.call('editor:command:selectNextOccurrence');
        }
    });

    editor.method('editor:command:selectNextOccurrence', function () {
        if (hasFocused()) {
            cm.execCommand('selectNextOccurrence');
            cm.focus();
        }
    });

});