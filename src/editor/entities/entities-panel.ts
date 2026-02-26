import type { Observer } from '@playcanvas/observer';
import { Button, Container, TreeViewItem } from '@playcanvas/pcui';

import { LegacyTooltip } from '@/common/ui/tooltip';

import { EntitiesTreeView } from './entities-treeview';

const CLASS_VISIBILITY_TOGGLE = 'entities-treeview-visibility-toggle';
const CLASS_VISIBILITY_HIDDEN = 'entities-treeview-visibility-hidden';
const CLASS_ROW_HOVERED = 'entities-treeview-row-hovered';

interface EyeEntry {
    button: Button;
    tooltip: LegacyTooltip;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    contentsRow: HTMLElement;
}

editor.once('load', () => {
    const panel = editor.call('layout.hierarchy');

    // The wrapper is the sole scroll container (both axes). The tree and the
    // visibility column are direct children. The column uses position: sticky
    // to stay at the right edge during horizontal scroll while scrolling
    // vertically in sync with the tree.
    const wrapper = new Container({
        class: 'hierarchy-content-wrapper',
        flex: true,
        flexDirection: 'row'
    });

    const visibilityColumn = new Container({
        class: 'hierarchy-visibility-column'
    });

    wrapper.append(visibilityColumn);
    panel.append(wrapper);

    const treeView = new EntitiesTreeView({
        allowDrag: editor.call('permissions:write'),
        allowRenaming: editor.call('permissions:write'),
        dropManager: editor.call('editor:dropManager'),
        history: editor.api.globals.history,
        assets: editor.call('assets:raw'),
        dragScrollElement: wrapper,
        onContextMenu: function (evt: MouseEvent, item: TreeViewItem & { entity?: Observer }) {
            const open = editor.call('entities:contextmenu:open', item.entity, evt.clientX, evt.clientY);

            if (open) {
                evt.preventDefault();
                evt.stopPropagation();
            }
        }
    });
    wrapper.prepend(treeView);
    treeView.createDropTarget(wrapper);

    // Eye icon management
    const eyeEntries: Map<string, EyeEntry> = new Map();

    const createEyeIcon = (resourceId: string, contentsRow: HTMLElement): EyeEntry => {
        const button = new Button({
            icon: 'E117',
            class: CLASS_VISIBILITY_TOGGLE,
            ignoreParent: true
        });

        const tooltip = LegacyTooltip.attach({
            target: button.dom,
            text: 'Hide in viewport',
            align: 'left',
            root: editor.call('layout.root')
        });
        tooltip.style.pointerEvents = 'none';

        button.on('click', (evt: MouseEvent) => {
            evt.stopPropagation();
            editor.call('entities:visibility:toggle', resourceId);
        });

        // Bridge hover: show eye icon when hovering the tree row
        const onMouseEnter = () => button.class.add(CLASS_ROW_HOVERED);
        const onMouseLeave = () => button.class.remove(CLASS_ROW_HOVERED);
        contentsRow.addEventListener('mouseenter', onMouseEnter);
        contentsRow.addEventListener('mouseleave', onMouseLeave);

        const entry: EyeEntry = { button, tooltip, onMouseEnter, onMouseLeave, contentsRow };
        eyeEntries.set(resourceId, entry);
        visibilityColumn.append(button);
        return entry;
    };

    const destroyEyeIcon = (resourceId: string) => {
        const entry = eyeEntries.get(resourceId);
        if (entry) {
            entry.contentsRow.removeEventListener('mouseenter', entry.onMouseEnter);
            entry.contentsRow.removeEventListener('mouseleave', entry.onMouseLeave);
            entry.tooltip.destroy();
            entry.button.destroy();
            eyeEntries.delete(resourceId);
        }
    };

    // Reposition all eye icons to align with their tree rows
    let repositionScheduled = false;
    const repositionEyeIcons = () => {
        repositionScheduled = false;
        const columnRect = visibilityColumn.dom.getBoundingClientRect();

        // Phase 1: Read all geometry (no writes — single layout recalc)
        const updates: Array<{ button: Button; top: number; visible: boolean }> = [];
        eyeEntries.forEach(({ button }, resourceId) => {
            const treeItem = treeView.getTreeItemForEntity(resourceId);
            if (!treeItem) {
                updates.push({ button, top: 0, visible: false });
                return;
            }
            const contentsEl = treeItem.content.dom;
            const rect = contentsEl.getBoundingClientRect();
            const visible = !!contentsEl.offsetParent;
            updates.push({ button, top: rect.top - columnRect.top, visible });
        });

        // Phase 2: Write all positions (no reads — no forced recalcs)
        for (const { button, top, visible } of updates) {
            if (visible) {
                button.hidden = false;
                button.dom.style.top = `${top}px`;
            } else {
                button.hidden = true;
            }
        }
    };

    const scheduleReposition = () => {
        if (!repositionScheduled) {
            repositionScheduled = true;
            requestAnimationFrame(repositionEyeIcons);
        }
    };

    wrapper.dom.addEventListener('scroll', scheduleReposition);
    new ResizeObserver(scheduleReposition).observe(wrapper.dom);

    const treeObserver = new MutationObserver(scheduleReposition);
    const observeTree = () => {
        treeObserver.observe(treeView.dom, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class']
        });
    };
    observeTree();

    // Update eye icon appearance when visibility state changes
    editor.on('entities:visibility:changed', (changedId: string, hidden: boolean) => {
        const entry = eyeEntries.get(changedId);
        if (!entry) {
            return;
        }

        if (hidden) {
            entry.button.class.add(CLASS_VISIBILITY_HIDDEN);
            entry.tooltip.text = 'Show in viewport';
        } else {
            entry.button.class.remove(CLASS_VISIBILITY_HIDDEN);
            entry.tooltip.text = 'Hide in viewport';
        }
    });

    // Hook into tree view entity add/remove to create/destroy eye icons
    const origOnAddEntity = treeView._onAddEntity.bind(treeView);
    treeView._onAddEntity = (entity: Observer) => {
        const item = origOnAddEntity(entity);
        const resourceId = entity.get('resource_id');
        if (!eyeEntries.has(resourceId)) {
            const contentsRow = item.content.dom;
            const entry = createEyeIcon(resourceId, contentsRow);

            if (editor.call('entities:visibility:isHidden', resourceId)) {
                entry.button.class.add(CLASS_VISIBILITY_HIDDEN);
                entry.tooltip.text = 'Show in viewport';
            }
        }
        scheduleReposition();
        return item;
    };

    const origOnRemoveEntity = treeView._onRemoveEntity.bind(treeView);
    treeView._onRemoveEntity = (entity: Observer) => {
        destroyEyeIcon(entity.get('resource_id'));
        origOnRemoveEntity(entity);
        scheduleReposition();
    };

    editor.on('permissions:writeState', (state) => {
        treeView.writePermissions = state;
    });

    editor.method('entities:hierarchy', () => {
        return treeView;
    });

    editor.on('entities:clear', () => {
        treeObserver.disconnect();
        if (treeView) {
            treeView.entities = null;
        }
        eyeEntries.forEach((entry) => {
            entry.contentsRow.removeEventListener('mouseenter', entry.onMouseEnter);
            entry.contentsRow.removeEventListener('mouseleave', entry.onMouseLeave);
            entry.tooltip.destroy();
            entry.button.destroy();
        });
        eyeEntries.clear();
    });

    editor.on('entities:load', () => {
        treeView.entities = editor.call('entities:raw');
        observeTree();
        scheduleReposition();
    });

    editor.method('entities:panel:get', (resourceId) => {
        return treeView.getTreeItemForEntity(resourceId);
    });

    editor.method('entities:panel:highlight', (resourceId, highlight) => {
        if (highlight) {
            treeView.highlightEntity(resourceId);
        } else {
            treeView.unhighlightEntity(resourceId);
        }
    });

    editor.method('entities:panel:getExpandedState', (entity) => {
        return treeView.getExpandedState(entity);
    });

    editor.method('entities:panel:restoreExpandedState', (state) => {
        treeView.restoreExpandedState(state);
    });
});
