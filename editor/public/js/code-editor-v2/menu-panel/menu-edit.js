editor.once('load', function () {
    'use strict';

    var root = editor.call('layout.root');
    var panel = editor.call('layout.top');

    var menuEdit = ui.Menu.fromData({
        'undo': {
            title: 'Undo',
            filter: function () {
                return editor.call('permissions:write');
            },
            select: function () {

            }
        },
        'redo': {
            title: 'Redo',
            filter: function () {
                return editor.call('permissions:write')
            },
            select: function () {

            }
        },
        'cut': {
            title: 'Cut',
            filter: function () {
                return editor.call('permissions:write')
            },
            select: function () {

            }
        },
        'copy': {
            title: 'Copy',
            filter: function () {
                return editor.call('permissions:write')
            },
            select: function () {

            }
        },
        'paste': {
            title: 'Paste',
            filter: function () {
                return editor.call('permissions:write')
            },
            select: function () {

            }
        }
    });

    menuEdit.position(44, 33);
    root.append(menuEdit);

    var btnEdit = new ui.Button({
        text: 'Edit'
    });

    panel.append(btnEdit);

    menuEdit.on('open', function (open) {
        if (open) {
            btnEdit.class.add('open');
        } else {
            btnEdit.class.remove('open');
        }
    });

    btnEdit.on('click', function () {
        menuEdit.open = true;
    });

});