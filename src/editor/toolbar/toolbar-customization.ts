import { Menu, MenuItem } from '@playcanvas/pcui';
import type { Button } from '@playcanvas/pcui';

import { mergeToolbarOrder, moveToolbarItem } from './toolbar-order';

const STORAGE_KEY = 'editor:toolbar';

type Item = {
    id: string;
    label: string;
    group: 'main' | 'utility';
    button: Button;
};

const items: Item[] = [];

editor.method('toolbar:register', (item: Item) => {
    item.button.dom.dataset.toolbarId = item.id;
    items.push(item);
});

editor.once('loaded', () => {
    const root = editor.call('layout.root');
    const toolbar = editor.call('layout.toolbar');
    const stored = editor.call('localStorage:get', STORAGE_KEY) as { hidden?: unknown; order?: unknown } | null;
    const ids = new Set(items.map((item) => item.id));
    const dom = [...toolbar.dom.children];
    const defaults = [...items]
        .sort((a, b) => {
            if (a.group !== b.group) {
                return a.group === 'main' ? -1 : 1;
            }
            return (
                Number(getComputedStyle(a.button.dom).order) - Number(getComputedStyle(b.button.dom).order) ||
                dom.indexOf(a.button.dom) - dom.indexOf(b.button.dom)
            );
        })
        .map((item) => item.id);
    const hidden = new Set(
        Array.isArray(stored?.hidden)
            ? stored.hidden.filter((id): id is string => typeof id === 'string' && ids.has(id))
            : []
    );
    let order = mergeToolbarOrder(stored?.order, defaults);
    let dragged: Item | null = null;
    let moved = false;
    const menu = new Menu();
    root.append(menu);

    const save = () => {
        editor.call('localStorage:set', STORAGE_KEY, { hidden: [...hidden], order });
    };
    const render = () => {
        const utilities = order
            .map((id) => items.find((item) => item.id === id))
            .filter((item) => item?.group === 'utility');
        items.forEach((item) => {
            item.button.class.toggle('toolbar-user-hidden', hidden.has(item.id));
            item.button.class.remove('push-top');
        });
        order
            .filter((id) => items.find((item) => item.id === id)?.group === 'main')
            .forEach((id, index) => {
                items.find((item) => item.id === id).button.dom.style.order = String(index + 1);
            });
        utilities.forEach((item, index) => {
            item.button.dom.style.order = String(index + 100);
        });
        utilities.find((item) => !hidden.has(item.id))?.button.class.add('push-top');
    };
    const show = (item: Item) => {
        hidden.delete(item.id);
        render();
        save();
    };

    render();

    items.forEach((item) => {
        item.button.dom.draggable = true;
        item.button.dom.addEventListener('mousedown', (evt) => evt.stopPropagation());
        item.button.dom.addEventListener('dragstart', (evt) => {
            evt.stopPropagation();
            dragged = item;
            moved = false;
            item.button.class.add('toolbar-dragging');
            evt.dataTransfer?.setData('text/plain', item.id);
            if (evt.dataTransfer) {
                evt.dataTransfer.effectAllowed = 'move';
            }
        });
        item.button.dom.addEventListener('dragend', () => {
            dragged?.button.class.remove('toolbar-dragging');
            dragged = null;
            if (moved) {
                save();
            }
        });
    });

    toolbar.dom.addEventListener('dragover', (evt: DragEvent) => {
        const id = (evt.target as HTMLElement).closest<HTMLElement>('[data-toolbar-id]')?.dataset.toolbarId;
        const target = items.find((item) => item.id === id);
        if (!dragged || !target || dragged.group !== target.group) {
            return;
        }
        evt.preventDefault();
        evt.stopPropagation();
        const rect = target.button.dom.getBoundingClientRect();
        const next = moveToolbarItem(order, dragged.id, target.id, evt.clientY > rect.top + rect.height / 2);
        if (next.some((id, index) => id !== order[index])) {
            order = next;
            moved = true;
            render();
        }
    });
    toolbar.dom.addEventListener('drop', (evt: DragEvent) => {
        if (dragged) {
            evt.preventDefault();
            evt.stopPropagation();
        }
    });

    toolbar.dom.addEventListener('contextmenu', (evt: MouseEvent) => {
        evt.preventDefault();
        evt.stopPropagation();

        const id = (evt.target as HTMLElement).closest<HTMLElement>('[data-toolbar-id]')?.dataset.toolbarId;
        const item = items.find((item) => item.id === id);
        menu.clear();

        if (item && !hidden.has(item.id)) {
            menu.append(
                new MenuItem({
                    text: `Hide ${item.label}`,
                    icon: 'E132',
                    onSelect: () => {
                        hidden.add(item.id);
                        render();
                        save();
                    }
                })
            );
        }
        items
            .filter((item) => hidden.has(item.id))
            .forEach((item) => {
                menu.append(
                    new MenuItem({
                        text: `Show ${item.label}`,
                        icon: 'E133',
                        onSelect: () => show(item)
                    })
                );
            });
        if (hidden.size > 1) {
            menu.append(
                new MenuItem({
                    text: 'Show All',
                    icon: 'E133',
                    onSelect: () => {
                        hidden.clear();
                        render();
                        save();
                    }
                })
            );
        }
        if (hidden.size || order.some((id, index) => id !== defaults[index])) {
            menu.append(
                new MenuItem({
                    text: 'Reset Toolbar',
                    onSelect: () => {
                        hidden.clear();
                        order = [...defaults];
                        render();
                        editor.call('localStorage:unset', STORAGE_KEY);
                    }
                })
            );
        }
        if (item || hidden.size) {
            menu.hidden = false;
            menu.position(evt.clientX + 1, evt.clientY);
        }
    });
});
