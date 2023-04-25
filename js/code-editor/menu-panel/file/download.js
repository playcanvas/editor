import { MenuItem } from '@playcanvas/pcui';

editor.once('load', function () {
    const menu = editor.call('menu:file');

    const item = new MenuItem({
        text: 'Download File',
        onIsEnabled: () => {
            return !!editor.call('documents:getFocused');
        },
        onSelect: () => {
            return editor.call('editor:command:download');
        }
    });
    menu.append(item);

    const ctxMenu = editor.call('files:contextmenu');
    ctxMenu.append(new MenuItem({
        text: 'Download',
        onIsEnabled: () => {
            const selected = editor.call('files:contextmenu:selected');
            return selected.length === 1 && selected[0].get('type') !== 'folder';
        },
        onSelect: () => {
            const selected = editor.call('files:contextmenu:selected');
            if (selected.length && selected[0].get('type') !== 'folder') {
                editor.call('editor:command:download', selected[0].get('id'));
            }
        }
    }));

    // Download asset
    editor.method('editor:command:download', function (id) {
        id = id || editor.call('documents:getFocused');
        if (id) {
            window.open('/api/assets/' + id + '/download?branchId=' + config.self.branch.id);
        }
    });
});
