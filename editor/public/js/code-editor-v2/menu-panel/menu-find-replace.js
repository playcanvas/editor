editor.once('load', function () {
    'use strict';

    var menu = editor.call('menu:find');
    var codePanel = editor.call('layout.code');
    var ctrl = editor.call('hotkey:ctrl:string');
    var cm = editor.call('editor:codemirror');

    var pickerOpen = false;

    editor.on('editor:picker:search:open', function () {
        pickerOpen = true;
    });

    editor.on('editor:picker:search:close', function () {
        pickerOpen = false;
    });

    var canReplace = function () {
        if (!!editor.call('documents:getFocused') && !cm.isReadOnly()) {
            if (editor.call('editor:picker:replace:text') || pickerOpen) {
                return true;
            }
        }

        return false;
    };

    // Replace
    var item = menu.createItem('replace', {
        title: 'Replace',
        filter: function () {
            return !!editor.call('documents:getFocused') && !cm.isReadOnly();
        },
        select: function () {
            return editor.call('editor:command:replace');
        }
    });
    item.class.add('noBorder');
    editor.call('menu:item:setShortcut', item, ctrl + '+H');
    menu.append(item);

    editor.call('hotkey:register', 'replace', {
        key: 'h',
        ctrl: true,
        callback: function (e) {
            if (codePanel.element.contains(e.target))
                return;

            editor.call('editor:command:replace');
        }
    });

    editor.method('editor:command:replace', function () {
        if (!!editor.call('documents:getFocused') && !cm.isReadOnly()) {
            editor.call('editor:picker:replace:open');
        }
    });

    // Replace Next
    var item = menu.createItem('replace-next', {
        title: 'Replace Next',
        filter: canReplace,
        select: function (e) {
            if (codePanel.element.contains(e.target))
                return;

            return editor.call('editor:command:replaceNext');
        }
    });
    item.class.add('noBorder');
    editor.call('menu:item:setShortcut', item, 'Shift+' + ctrl + '+H');
    menu.append(item);

    editor.call('hotkey:register', 'replace-next', {
        key: 'h',
        ctrl: true,
        shift: true,
        callback: function (e) {
            if (codePanel.element.contains(e.target))
                return;

            editor.call('editor:command:replaceNext');
        }
    });

    editor.method('editor:command:replaceNext', function () {
        if (canReplace()) {
            cm.execCommand('replace');
            cm.focus();
        }
    });

    // Replace Previous
    var item = menu.createItem('replace-prev', {
        title: 'Replace Previous',
        filter: canReplace,
        select: function (e) {
            return editor.call('editor:command:replacePrevious');
        }
    });
    item.class.add('noBorder');
    menu.append(item);

    editor.method('editor:command:replacePrevious', function () {
        if (canReplace()) {
            cm.execCommand('replacePrev');
            cm.focus();
        }
    });

    // Replace All
    var item = menu.createItem('replace-all', {
        title: 'Replace All',
        filter: canReplace,
        select: function (e) {
            return editor.call('editor:command:replaceAll');
        }
    });
    menu.append(item);

    editor.method('editor:command:replaceAll', function () {
        if (canReplace()) {
            cm.execCommand('replaceAll');
            cm.focus();
        }
    });

});