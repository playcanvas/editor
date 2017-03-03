editor.once('load', function () {
    'use strict';

    var menu = editor.call('menu:file');

    var item = menu.createItem('download', {
        title: 'Download File',
        filter: function () {
            return !!editor.call('documents:getFocused');
        },
        select: function () {
            return editor.call('editor:command:download');
        }
    });
    menu.append(item);

    var ctxMenu = editor.call('files:contextmenu');
    ctxMenu.append(ctxMenu.createItem('download', {
        title: 'Download',
        filter: function () {
            var selected = editor.call('files:contextmenu:selected');
            return selected.length === 1 && selected[0].get('type') !== 'folder';
        },
        select: function () {
            var selected = editor.call('files:contextmenu:selected');
            if (selected.length && selected[0].get('type') !== 'folder') {
                editor.call('editor:command:download', selected[0].get('id'));
            }
        }
    }));

    // Download asset
    editor.method('editor:command:download', function (id) {
        id = id || editor.call('documents:getFocused');
        if (id) {
            window.open('/api/assets/' + id + '/download');
        }
    });

});