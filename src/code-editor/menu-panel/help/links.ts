import { MenuItem } from '@playcanvas/pcui';

editor.once('load', () => {
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

    editor.method('editor:command:openApiReference', () => {
        window.open('https://api.playcanvas.com/');
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

    editor.method('editor:command:openUserManual', () => {
        window.open('https://developer.playcanvas.com/user-manual/');
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

    editor.method('editor:command:openTutorials', () => {
        window.open('https://developer.playcanvas.com/tutorials/');
    });

    // Forum
    item = new MenuItem({
        text: 'Forum',
        onSelect: () => {
            return editor.call('editor:command:openForum');
        }
    });
    menu.append(item);

    editor.method('editor:command:openForum', () => {
        window.open('https://forum.playcanvas.com/');
    });

    // VSCode extension
    item = new MenuItem({
        text: 'VS Code Extension',
        onSelect: () => {
            return editor.call('editor:command:openVSCodeExtensionHelp');
        }
    });
    menu.append(item);

    editor.method('editor:command:openVSCodeExtensionHelp', () => {
        window.open('https://developer.playcanvas.com/user-manual/scripting/vscode-extension/');
    });
});
