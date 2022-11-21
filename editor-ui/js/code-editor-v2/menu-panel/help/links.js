editor.once('load', function () {
    'use strict';

    const menu = editor.call('menu:help');

    // API ref
    let item = menu.createItem('open-api-ref', {
        title: 'API Reference',
        select: function () {
            return editor.call('editor:command:openApiReference');
        }
    });
    item.class.add('noBorder');
    menu.append(item);

    editor.method('editor:command:openApiReference', function () {
        menu.open = false;
        window.open('http://developer.playcanvas.com/en/api/');
    });

    // User Manual
    item = menu.createItem('open-user-manual', {
        title: 'User Manual',
        select: function () {
            return editor.call('editor:command:openUserManual');
        }
    });
    item.class.add('noBorder');
    menu.append(item);

    editor.method('editor:command:openUserManual', function () {
        menu.open = false;
        window.open('http://developer.playcanvas.com/en/user-manual/');
    });

    // Tutorials
    item = menu.createItem('open-tutorials', {
        title: 'Tutorials',
        select: function () {
            return editor.call('editor:command:openTutorials');
        }
    });
    item.class.add('noBorder');
    menu.append(item);

    editor.method('editor:command:openTutorials', function () {
        menu.open = false;
        window.open('http://developer.playcanvas.com/en/tutorials/');
    });

    // Forum
    item = menu.createItem('open-forum', {
        title: 'Forum',
        select: function () {
            return editor.call('editor:command:openForum');
        }
    });
    menu.append(item);

    editor.method('editor:command:openForum', function () {
        menu.open = false;
        window.open('http://forum.playcanvas.com/');
    });
});
