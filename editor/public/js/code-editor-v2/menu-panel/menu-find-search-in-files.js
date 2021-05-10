editor.once('load', function () {
    'use strict';

    var menu = editor.call('menu:find');
    var codePanel = editor.call('layout.code');
    var ctrl = editor.call('hotkey:ctrl:string');

    // Find in files
    var item = menu.createItem('find-in-files', {
        title: 'Find in Files',
        select: function () {
            return editor.call('editor:command:findInFiles');
        }
    });
    editor.call('menu:item:setShortcut', item, 'Shift+' + ctrl + '+F');
    menu.append(item);

    editor.call('hotkey:register', 'find-in-files', {
        key: 'f',
        ctrl: true,
        shift: true,
        callback: function (e) {
            if (codePanel.element.contains(e.target))
                return;

            editor.call('editor:command:findInFiles');
        }
    });

    editor.method('editor:command:findInFiles', function () {
        editor.call('picker:search:files:open');
    });
});
