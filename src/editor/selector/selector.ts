import type { Observer } from '@playcanvas/observer';
import { ObserverList } from '@playcanvas/observer';

import { Asset, Entity } from '@/editor-api';

editor.once('load', () => {
    const selection = editor.api.globals.selection;
    let enabled = true;
    const selector = new ObserverList();
    selector.type = null;


    const index = { };

    const keyByType = function (type: string) {
        switch (type) {
            case 'entity':
                return 'resource_id';
            case 'asset':
                return 'id';
        }
        return null;
    };

    const setIndex = function (type: string, item: Observer) {
        const key = keyByType(type);
        if (!key) {
            return;
        }

        if (!index[type]) {
            index[type] = { };
        }

        index[type][item.get(key)] = item.once('destroy', () => {
            const state = editor.call('selector:history');
            if (state) {
                editor.call('selector:history', false);
            }

            selector.remove(item);
            delete index[type][item.get(key)];

            if (state) {
                editor.call('selector:history', true);
            }
        });
    };

    const removeIndex = function (type: string, item: Observer) {
        if (!index[type]) {
            return;
        }

        const key = keyByType(type);
        if (!key) {
            return;
        }

        const ind = index[type][item.get(key)];
        if (!ind) {
            return;
        }

        ind.unbind();
    };

    let evtChange = false;
    const evtChangeFn = function () {
        evtChange = false;
        editor.emit('selector:change', selector.type, selector.array());
    };

    // adding
    selector.on('add', function (this: typeof selector, item: Observer) {
        // add index
        setIndex(this.type, item);

        editor.emit('selector:add', item, this.type);

        if (!evtChange) {
            evtChange = true;
            setTimeout(evtChangeFn, 0);
        }
    });

    selection.on('add', (item: Asset | Entity) => {
        editor.emit('selector:add', item.observer, item instanceof Entity ? 'entity' : 'asset');
    });

    selection.on('remove', (item: Asset | Entity) => {
        editor.emit('selector:remove', item.observer, item instanceof Entity ? 'entity' : 'asset');
    });

    selection.on('change', (items: (Asset | Entity)[]) => {
        editor.emit('selector:change', items[0] instanceof Entity ? 'entity' : 'asset', items.map(item => item.observer));
    });

    // removing
    selector.on('remove', function (this: typeof selector, item: Observer) {
        editor.emit('selector:remove', item, this.type);

        // remove index
        removeIndex(this.type, item);

        if (this.length === 0) {
            this.type = null;
        }

        if (!evtChange) {
            evtChange = true;
            setTimeout(evtChangeFn, 0);
        }
    });


    // selecting item (toggle)
    editor.method('selector:toggle', (type: string, item: Observer) => {
        if (item.apiEntity) {
            selection.toggle(item.apiEntity);
            return;
        }

        if (item.apiAsset) {
            selection.toggle(item.apiAsset);
            return;
        }

        if (!enabled) {
            return;
        }

        if (selector.length && selector.type !== type) {
            selector.clear();
        }
        selector.type = type;

        if (selector.has(item)) {
            selector.remove(item);
        } else {
            selector.add(item);
        }
    });


    // selecting list of items
    editor.method('selector:set', (type: string, items: Observer[]) => {
        if (type === 'entity') {
            selection.set(items.map(item => item.apiEntity));
            return;
        }
        if (type === 'asset') {
            selection.set(items.map(item => item.apiAsset));
            return;
        }

        if (!enabled) {
            return;
        }

        selection.clear();
        selector.clear();

        if (!type || !items.length) {
            return;
        }

        // type
        selector.type = type;

        // remove
        selector.find((item) => {
            return items.indexOf(item) === -1;
        }).forEach((item) => {
            selector.remove(item);
        });

        // add
        for (let i = 0; i < items.length; i++) {
            selector.add(items[i]);
        }
    });


    // selecting item
    editor.method('selector:add', (type: string, item: Observer) => {
        if (item.apiEntity) {
            selection.add(item.apiEntity);
            return;
        }

        if (item.apiAsset) {
            selection.add(item.apiAsset);
            return;
        }

        if (!enabled) {
            return;
        }

        if (selector.has(item)) {
            return;
        }

        if (selector.length && selector.type !== type) {
            selector.clear();
        }

        selector.type = type;
        selector.add(item);
    });


    // deselecting item
    editor.method('selector:remove', (item: Observer) => {
        if (item.apiEntity) {
            selection.remove(item.apiEntity);
            return;
        }

        if (item.apiAsset) {
            selection.remove(item.apiAsset);
            return;
        }

        if (!enabled) {
            return;
        }

        if (!selector.has(item)) {
            return;
        }

        selector.remove(item);
    });


    // deselecting
    editor.method('selector:clear', (_item?: unknown) => {
        selection.clear();

        if (!enabled) {
            return;
        }

        selector.clear();
    });


    // return select type
    editor.method('selector:type', () => {
        if (selection.items[0] instanceof Entity) {
            return 'entity';
        }
        if (selection.items[0] instanceof Asset) {
            return 'asset';
        }

        return selector.type;
    });


    // return selected count
    editor.method('selector:count', () => {
        return selection.count || selector.length;
    });


    // return selected items
    editor.method('selector:items', () => {
        if (selection.count) {
            return selection.items.map(item => item.observer);
        }
        return selector.array();
    });

    // return if it has item
    editor.method('selector:has', (item: Observer) => {
        return selection.has(item.apiEntity) || selection.has(item.apiAsset) || selector.has(item);
    });


    editor.method('selector:enabled', (state: boolean) => {
        selection.enabled = state;
        enabled = state;
    });
});
