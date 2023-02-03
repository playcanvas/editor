import { MenuItem } from '@playcanvas/pcui';

editor.once('load', function () {
    'use strict';

    const menu = editor.call('menu:help');

    // API ref
    let item = new MenuItem({
        class: 'no-bottom-border',
        text: 'API Reference',
        onSelect: () => {
            return editor.call('editor:command:openApiReference');
        }
    });
    menu.append(item);

    editor.method('editor:command:openApiReference', function () {
        window.open('http://developer.playcanvas.com/en/api/');
    });

    // User Manual
    item = new MenuItem({
        class: 'no-bottom-border',
        text: 'User Manual',
        onSelect: () => {
            return editor.call('editor:command:openUserManual');
        }
    });
    menu.append(item);

    editor.method('editor:command:openUserManual', function () {
        window.open('http://developer.playcanvas.com/en/user-manual/');
    });

    // Tutorials
    item = new MenuItem({
        class: 'no-bottom-border',
        text: 'Tutorials',
        onSelect: () => {
            return editor.call('editor:command:openTutorials');
        }
    });
    menu.append(item);

    editor.method('editor:command:openTutorials', function () {
        window.open('http://developer.playcanvas.com/en/tutorials/');
    });

    // Forum
    item = new MenuItem({
        text: 'Forum',
        onSelect: () => {
            return editor.call('editor:command:openForum');
        }
    });
    menu.append(item);

    editor.method('editor:command:openForum', function () {
        window.open('http://forum.playcanvas.com/');
    });
});
