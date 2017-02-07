editor.once('load', function () {
    'use strict';

    // Add shortcut label to a menu item
    editor.method('menu:item:setShortcut', function (item, shortcut) {
        var shortcut = new ui.Label({
            text: shortcut
        });
        shortcut.renderChanges = false;
        shortcut.class.add('shortcut');
        item.elementTitle.appendChild(shortcut.element)
    });
});