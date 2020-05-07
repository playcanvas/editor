editor.once('load', function() {
    'use strict'

    var panel = editor.call('layout.hierarchy');

    const treeView = new pcui.EntitiesTreeView({
        allowDrag: editor.call('permissions:write'),
        allowRenaming: editor.call('permissions:write'),
        dropManager: editor.call('editor:dropManager'),
        history: editor.call('editor:history'),
        assets: editor.call('assets:raw'),
        onContextMenu: function (evt, item) {
            const open = editor.call('entities:contextmenu:open', item.entity, evt.clientX, evt.clientY);

            if (open) {
                evt.preventDefault();
                evt.stopPropagation();
            }
        }
    });
    panel.append(treeView);

    treeView.createDropTarget(panel.content);

    editor.on('permissions:writeState', function(state) {
        treeView.writePermissions = state;
    });

    // return hirarchy
    editor.method('entities:hierarchy', function () {
        return treeView;
    });

    editor.on('entities:clear', function () {
        if (treeView) {
            treeView.entities = null;
        }
    });

    // append all treeItems according to child order
    editor.on('entities:load', function() {
        treeView.entities = editor.call('entities:raw');
    });

    // get entity item
    editor.method('entities:panel:get', function (resourceId) {
        return treeView.getTreeItemForEntity(resourceId);
    });

    // highlight entity
    editor.method('entities:panel:highlight', function (resourceId, highlight) {
        if (highlight) {
            treeView.highlightEntity(resourceId);
        } else {
            treeView.unhighlightEntity(resourceId);
        }
    });

    // get a dictionary with the expanded state of an entity and its children
    editor.method('entities:panel:getExpandedState', function (entity) {
        return treeView.getExpandedState(entity);
    });

    // restore the expanded state of an entity tree item
    editor.method('entities:panel:restoreExpandedState', function (state) {
        treeView.restoreExpandedState(state);
    });
});
