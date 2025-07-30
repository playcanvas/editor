import { MenuItem } from '@playcanvas/pcui';

editor.once('load', () => {
    const menu = editor.call('menu:navigate');
    const ctrl = editor.call('hotkey:ctrl:string');

    let isFuzzyOpen = false;

    editor.on('picker:fuzzy:open', () => {
        isFuzzyOpen = true;
    });

    editor.on('picker:fuzzy:close', () => {
        isFuzzyOpen = false;
    });

    // Go to anything
    const item = new MenuItem({
        text: 'Go To File',
        onSelect: () => {
            editor.call('editor:command:goToFile');
        }
    });
    editor.call('menu:item:setShortcut', item, `${ctrl}+P`);
    menu.append(item);

    // hotkey
    if (!editor.call('editor:resolveConflictMode')) {
        editor.call('hotkey:register', 'go-to-file', {
            key: 'p',
            ctrl: true,
            callback: function () {
                editor.call('editor:command:goToFile');
            }
        });
    }

    editor.method('editor:command:goToFile', () => {
        if (!isFuzzyOpen) {
            editor.call('picker:fuzzy:open');
        } else {
            editor.call('picker:fuzzy:close');
        }
    });
});
