editor.once('load', function () {
    'use strict';

    var menu = editor.call('menu:edit');
    var el = editor.call('editor:codemirror').getWrapperElement();
    var style = window.getComputedStyle(el, null);

    var group = menu.createItem('preferences', {
        title: 'Preferences',
        select: function () {
            return editor.call('picker:settings');
        }
    });
    group.class.add('preferences');
    menu.append(group);

    // Show settings picker
    var item = menu.createItem('show-preferences', {
        title: 'Show All Preferences',
        select: function () {
            return editor.call('picker:settings');
        }
    });
    group.append(item);

    // Increase font size
    item = menu.createItem('increase-font-size', {
        title: 'Increase Font Size',
        select: function () {
            return editor.call('editor:command:increaseFontSize');
        }
    });
    item.class.add('noBorder');
    editor.call('menu:item:setShortcut', item,  'Ctrl+Alt+Page Up');
    group.append(item);

    editor.call('hotkey:register', 'increase-font-size', {
        key: 'page up',
        alt: true,
        ctrl: true,
        callback: function () {
            editor.call('editor:command:increaseFontSize');
        }
    });

    editor.method('editor:command:increaseFontSize', function () {
        var settings = editor.call('editor:settings');
        settings.set('fontSize', settings.get('fontSize') + 1);
    });

    // Decrease font size
    item = menu.createItem('decrease-font-size', {
        title: 'Decrease Font Size',
        select: function () {
            return editor.call('editor:command:decreaseFontSize');
        }
    });
    editor.call('menu:item:setShortcut', item,  'Ctrl+Alt+Page Down');
    group.append(item);

    editor.call('hotkey:register', 'decrease-font-size', {
        key: 'page down',
        alt: true,
        ctrl: true,
        callback: function () {
            editor.call('editor:command:decreaseFontSize');
        }
    });

    editor.method('editor:command:decreaseFontSize', function () {
        var settings = editor.call('editor:settings');
        var size = settings.get('fontSize');
        if (size > 1) {
            settings.set('fontSize', size - 1);
        }
    });
});
