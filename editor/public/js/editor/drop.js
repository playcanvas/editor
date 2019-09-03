editor.once('load', function () {
    'use strict';

    const dropManager = new pcui.DropManager();
    editor.call('layout.root').append(dropManager);

    editor.method('drop:target', function (obj) {
        const dropTarget = new pcui.DropTarget(obj.ref, {
            dropType: obj.type,
            hole: obj.hole,
            passThrough: obj.passThrough,
            onFilter: (type, data) => {
                if (obj.filter) {
                    return obj.filter(type, data);
                }

                return true;
            },
            onDrop: (type, data) => {
                if (obj.drop) {
                    return obj.drop(type, data);
                }
            },
            onDragEnter: (type, data) => {
                if (obj.over) {
                    return obj.over(type, data);
                }
            },
            onDragLeave: () => {
                if (obj.leave) {
                    return obj.leave();
                }
            }

        });

        dropManager.append(dropTarget);
        return dropTarget;
    });


    editor.method('drop:item', function (args) {
        args.element.draggable = true;

        args.element.addEventListener('mousedown', function (evt) {
            evt.stopPropagation();
        }, false);

        args.element.addEventListener('dragstart', function (evt) {
            evt.preventDefault();
            evt.stopPropagation();

            if (!editor.call('permissions:write'))
                return;


            editor.call('drop:set', args.type, args.data);
            editor.call('drop:activate');
        }, false);
    });


    editor.method('drop:set', function (type, data) {
        dropManager.dropType = type;
        dropManager.dropData = data;
    });

    editor.method('editor:dropManager', () => {
        return dropManager;
    });

    editor.method('drop:activate', () => {
        dropManager.active = true;
    });
    editor.method('drop:active', function () {
        return dropManager.active;
    });

    dropManager.on('activate', () => {
        editor.emit('drop:active', true);
    });

    dropManager.on('deactivate', () => {
        editor.emit('drop:active', false);
    });

    dropManager.on('dropData', (dropData) => {
        editor.emit('drop:set', dropManager.dropType, dropManager.dropData || {});
    });
});
