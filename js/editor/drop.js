editor.once('load', function () {
    const dropManager = new pcui.DropManager();
    editor.call('layout.root').append(dropManager);

    const attributesPanel = editor.call('layout.attributes');

    // Handle scrolling on the attributes panel while drop targets are active.
    // In this case the wheel/scroll events will not pass through to the attributes panel
    // so do manual scrolling with javascript
    dropManager.dom.addEventListener('wheel', (e) => {
        if (attributesPanel.hidden || attributesPanel.collapsed) return;

        const rect = attributesPanel.dom.getBoundingClientRect();
        // if mouse on top of attributes panel...
        if (e.x >= rect.left && e.x <= rect.right && e.y >= rect.top && e.y <= rect.bottom) {
            // scroll attributes panel
            const oldTop = attributesPanel.content.dom.scrollTop;
            attributesPanel.content.dom.scrollTop += e.deltaY;
            const diff = attributesPanel.content.dom.scrollTop - oldTop;

            // scroll all drop targets that are targeting attribute panel children
            dropManager.domContent.childNodes.forEach((child) => {
                if (child.ui && !child.ui.hidden && child.ui._domTargetElement && attributesPanel.dom.contains(child.ui._domTargetElement)) {
                    let top = child.style.top;
                    if (top.endsWith('px')) {
                        top = parseFloat(top.substring(0, top.length - 2));
                    } else {
                        top = 0;
                    }

                    top -= diff;
                    child.style.top = top + 'px';
                }
            });
        }
    });

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

    editor.method('drop:activate', (active) => {
        dropManager.active = active;
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
