editor.once('load', function () {
    'use strict';

    var menu = editor.call('menu:find');
    var codePanel = editor.call('layout.code');
    var ctrl = editor.call('hotkey:ctrl:string');
    var mac = navigator.userAgent.indexOf('Mac OS X') !== -1;
    var cm = editor.call('editor:codemirror');

    var canSearch = function () {
        if (editor.call('editor:resolveConflictMode')) return true;

        var focusedTab = editor.call('tabs:focused');
        return focusedTab && (!focusedTab.asset || !!editor.call('documents:getFocused'));
    };

    // Find Under
    var item = menu.createItem('find-under', {
        title: 'Quick Find',
        filter: canSearch,
        select: function () {
            return editor.call('editor:command:findUnder');
        }
    });
    item.class.add('noBorder');
    editor.call('menu:item:setShortcut', item, mac ? 'Alt+Cmd+G' : 'Ctrl+F3');
    menu.append(item);

    editor.call('hotkey:register', 'find-under', {
        key: mac ? 'g' : 'f3',
        alt: mac,
        ctrl: true,
        callback: function (e) {
            if (codePanel.element.contains(e.target))
                return;

            editor.call('editor:command:findUnder');
        }
    });

    editor.method('editor:command:findUnder', function () {
        if (canSearch()) {
            cm.execCommand('findUnder');
            cm.focus();
        }
    });

    // Find Under Previous
    var item = menu.createItem('find-under-prev', {
        title: 'Quick Find Previous',
        filter: canSearch,
        select: function () {
            return editor.call('editor:command:findUnderPrev');
        }
    });
    item.class.add('noBorder');
    menu.append(item);

    editor.method('editor:command:findUnderPrev', function () {
        if (canSearch()) {
            cm.execCommand('findUnderPrevious');
            cm.focus();
        }
    });

    // Find All Under
    var item = menu.createItem('find-all-under', {
        title: 'Quick Find All',
        filter: canSearch,
        select: function () {
            return editor.call('editor:command:findAllUnder');
        }
    });
    item.class.add('noBorder');
    // no shortcut for mac for now
    if (! mac) {
        editor.call('menu:item:setShortcut', item, 'Alt+F3');
    }
    menu.append(item);

    if (! mac) {
        editor.call('hotkey:register', 'find-all-under', {
            key: 'f3',
            alt: true,
            callback: function (e) {
                if (codePanel.element.contains(e.target))
                    return;

                editor.call('editor:command:findAllUnder');
            }
        });
    }

    editor.method('editor:command:findAllUnder', function () {
        if (canSearch()) {
            cm.execCommand('findAllUnder');
            cm.focus();
        }
    });

    // Select next occurrence
    var item = menu.createItem('select-next-occurrence', {
        title: 'Quick Add Next',
        filter: canSearch,
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
        if (canSearch()) {
            cm.execCommand('selectNextOccurrence');
            cm.focus();
        }
    });
});
