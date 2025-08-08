import { MenuItem } from '@playcanvas/pcui';

editor.once('load', () => {
    const menu = editor.call('menu:file');
    const leftPanel = editor.call('layout.left');

    menu.append(new MenuItem({
        text: 'Delete Selected Files',
        onIsEnabled: () => {
            return editor.call('editor:command:can:deleteSelected');
        },
        onSelect: () => {
            return editor.call('editor:command:deleteSelected');
        }
    }));

    const ctxMenu = editor.call('files:contextmenu');
    ctxMenu.append(new MenuItem({
        text: 'Delete',
        onIsEnabled: () => {
            return editor.call('permissions:write') &&
                   editor.call('files:contextmenu:selected').length &&
                   !editor.call('errors:hasRealtime');
        },
        onSelect: () => {
            editor.call('assets:delete:picker', editor.call('files:contextmenu:selected'));
        }
    }));

    // hotkeys
    editor.call('hotkey:register', 'delete-files', {
        key: 'Delete',
        skipPreventDefault: true,
        callback: function (e) {
            if (leftPanel.dom.contains(e.target) && e.target.tagName.toLowerCase() !== 'input') {
                e.preventDefault();
                editor.call('editor:command:deleteSelected');
            }
        }
    });

    editor.call('hotkey:register', 'delete-files-2', {
        key: 'Backspace',
        ctrl: true,
        skipPreventDefault: true,
        callback: function (e) {
            if (leftPanel.dom.contains(e.target) && e.target.tagName.toLowerCase() !== 'input') {
                e.preventDefault();
                editor.call('editor:command:deleteSelected');
            }
        }
    });

    // True if you can delete selected files
    editor.method('editor:command:can:deleteSelected', () => {
        return editor.call('permissions:write') &&
               editor.call('assets:selected').length &&
               !editor.call('errors:hasRealtime');
    });

    // Delete selected files
    editor.method('editor:command:deleteSelected', () => {
        if (!editor.call('permissions:write')) {
            return;
        }

        const selected = editor.call('assets:selected');
        if (selected.length) {
            editor.call('assets:delete:picker', selected);
        }
    });
});
