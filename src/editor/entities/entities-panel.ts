import type { Observer } from '@playcanvas/observer';
import type { TreeViewItem } from '@playcanvas/pcui';

import { EntitiesTreeView } from './entities-treeview';

editor.once('load', () => {
    const panel = editor.call('layout.hierarchy');

    const treeView = new EntitiesTreeView({
        allowDrag: editor.call('permissions:write'),
        allowRenaming: editor.call('permissions:write'),
        dropManager: editor.call('editor:dropManager'),
        history: editor.api.globals.history,
        assets: editor.call('assets:raw'),
        dragScrollElement: panel.content,
        onContextMenu: function (evt: MouseEvent, item: TreeViewItem & { entity?: Observer }) {
            const open = editor.call('entities:contextmenu:open', item.entity, evt.clientX, evt.clientY);

            if (open) {
                evt.preventDefault();
                evt.stopPropagation();
            }
        }
    });
    panel.append(treeView);

    treeView.createDropTarget(panel.content);

    editor.on('permissions:writeState', (state) => {
        treeView.writePermissions = state;
    });

    // return hierarchy
    editor.method('entities:hierarchy', () => {
        return treeView;
    });

    editor.on('entities:clear', () => {
        if (treeView) {
            treeView.entities = null;
        }
    });

    // append all treeItems according to child order
    editor.on('entities:load', () => {
        treeView.entities = editor.call('entities:raw');
    });

    // get entity item
    editor.method('entities:panel:get', (resourceId) => {
        return treeView.getTreeItemForEntity(resourceId);
    });

    // highlight entity
    editor.method('entities:panel:highlight', (resourceId, highlight) => {
        if (highlight) {
            treeView.highlightEntity(resourceId);
        } else {
            treeView.unhighlightEntity(resourceId);
        }
    });

    // get a dictionary with the expanded state of an entity and its children
    editor.method('entities:panel:getExpandedState', (entity) => {
        return treeView.getExpandedState(entity);
    });

    // restore the expanded state of an entity tree item
    editor.method('entities:panel:restoreExpandedState', (state) => {
        treeView.restoreExpandedState(state);
    });
});
