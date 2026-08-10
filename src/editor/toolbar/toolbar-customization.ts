import { Button, Menu, MenuItem } from '@playcanvas/pcui';

import { mergeToolbarOrder, moveToolbarItem } from './toolbar-order';

const STORAGE_KEY = 'editor:toolbar';
const EYE_ICON =
    '<svg class="toolbar-visibility-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></svg>';
const EYE_OFF_ICON =
    '<svg class="toolbar-visibility-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18"/><path d="M10.6 6.1A11 11 0 0 1 12 6c6.5 0 10 6 10 6a15 15 0 0 1-2.1 2.8M6.6 6.6C3.6 8.4 2 12 2 12s3.5 6 10 6a10 10 0 0 0 4.2-.9"/></svg>';

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
    let editing = false;
    let dragged: Item | null = null;
    let moved = false;
    const toggles = new Map<string, HTMLSpanElement>();
    const menu = new Menu();
    const done = new Button({ class: 'toolbar-edit-done', text: 'DONE', hidden: true });
    root.append(menu);
    root.append(done);

    const save = () => {
        editor.call('localStorage:set', STORAGE_KEY, { hidden: [...hidden], order });
    };
    const render = () => {
        const utilities = order
            .map((id) => items.find((item) => item.id === id))
            .filter((item) => item?.group === 'utility');
        items.forEach((item) => {
            const isHidden = hidden.has(item.id);
            const toggle = toggles.get(item.id);
            item.button.class.toggle('toolbar-user-hidden', isHidden);
            item.button.class.remove('push-top');
            if (toggle) {
                toggle.innerHTML = isHidden ? EYE_OFF_ICON : EYE_ICON;
                toggle.ariaLabel = `${isHidden ? 'Show' : 'Hide'} ${item.label}`;
            }
        });
        order
            .filter((id) => items.find((item) => item.id === id)?.group === 'main')
            .forEach((id, index) => {
                items.find((item) => item.id === id).button.dom.style.order = String(index + 1);
            });
        utilities.forEach((item, index) => {
            item.button.dom.style.order = String(index + 100);
        });
        utilities.find((item) => editing || !hidden.has(item.id))?.button.class.add('push-top');
    };
    const setEditing = (value: boolean) => {
        editing = value;
        toolbar.class.toggle('toolbar-editing', value);
        done.hidden = !value;
        items.forEach((item) => {
            const toggle = toggles.get(item.id)!;
            item.button.dom.draggable = value;
            if (value) {
                item.button.dom.append(toggle);
            } else {
                toggle.remove();
            }
        });
        render();
    };

    items.forEach((item) => {
        const toggle = document.createElement('span');
        const toggleVisibility = () => {
            if (hidden.has(item.id)) {
                hidden.delete(item.id);
            } else {
                hidden.add(item.id);
            }
            render();
            save();
        };
        toggle.className = 'toolbar-visibility';
        toggle.role = 'button';
        toggle.tabIndex = 0;
        toggle.addEventListener('mousedown', (evt) => {
            evt.preventDefault();
            evt.stopPropagation();
        });
        toggle.addEventListener('click', (evt) => {
            evt.preventDefault();
            evt.stopPropagation();
            toggleVisibility();
        });
        toggle.addEventListener('keydown', (evt) => {
            if (evt.key !== 'Enter' && evt.key !== ' ') {
                return;
            }
            evt.preventDefault();
            evt.stopPropagation();
            toggleVisibility();
        });
        toggles.set(item.id, toggle);

        item.button.dom.addEventListener('mousedown', (evt) => evt.stopPropagation());
        item.button.dom.addEventListener(
            'click',
            (evt) => {
                if (editing && !(evt.target as HTMLElement).closest('.toolbar-visibility')) {
                    evt.preventDefault();
                    evt.stopImmediatePropagation();
                }
            },
            true
        );
        item.button.dom.addEventListener('dragstart', (evt) => {
            if (!editing) {
                evt.preventDefault();
                return;
            }
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

    render();
    done.on('click', () => setEditing(false));

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
        menu.clear();
        menu.append(
            new MenuItem({
                text: editing ? 'Done Editing' : 'Edit Toolbar',
                onSelect: () => setEditing(!editing)
            })
        );
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
        menu.hidden = false;
        menu.position(evt.clientX + 1, evt.clientY);
    });
});
