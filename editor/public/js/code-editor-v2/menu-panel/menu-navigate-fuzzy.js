editor.once('load', function () {
    'use strict';

    var menu = editor.call('menu:navigate');
    var ctrl = editor.call('hotkey:ctrl:string');
    var cm = editor.call('editor:codemirror');
    var isFuzzyOpen = false;

    editor.on('picker:fuzzy:open', function () {
        isFuzzyOpen = true;
    });

    editor.on('picker:fuzzy:close', function () {
        isFuzzyOpen = false;
    });

    // Go to anything
    var item = menu.createItem('go-to-anything', {
        title: 'Go To Anything',
        select: function () {
            editor.call('editor:command:goToAnything');
        }
    });
    editor.call('menu:item:setShortcut', item, ctrl + '+P');
    menu.append(item);

    // hotkey
    if (! editor.call('editor:resolveConflictMode')) {
        editor.call('hotkey:register', 'go-to-anything', {
            key: 'p',
            ctrl: true,
            callback: function () {
                editor.call('editor:command:goToAnything');
            }
        });
    }

    editor.method('editor:command:goToAnything', function () {
        if (! isFuzzyOpen) {
            editor.call('picker:fuzzy:open');
        } else {
            editor.call('picker:fuzzy:close');
            if (editor.call('documents:getFocused'))
                cm.focus();
        }
    });
});
