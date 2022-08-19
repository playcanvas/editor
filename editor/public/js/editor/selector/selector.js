editor.once('load', function () {
    'use strict';

    var enabled = true;
    var selector = new ObserverList();
    selector.type = null;


    var index = { };

    var keyByType = function (type) {
        switch (type) {
            case 'entity':
                return 'resource_id';
            case 'asset':
                return 'id';
        }
        return null;
    };

    var setIndex = function (type, item) {
        var key = keyByType(type);
        if (!key) return;

        if (!index[type])
            index[type] = { };

        index[type][item.get[key]] = item.once('destroy', function () {
            var state = editor.call('selector:history');
            if (state)
                editor.call('selector:history', false);

            selector.remove(item);
            delete index[type][item.get[key]];

            if (state)
                editor.call('selector:history', true);
        });
    };

    var removeIndex = function (type, item) {
        if (!index[type]) return;

        var key = keyByType(type);
        if (!key) return;

        var ind = index[type][item.get[key]];
        if (!ind) return;

        ind.unbind();
    };

    var evtChange = false;
    var evtChangeFn = function () {
        evtChange = false;
        editor.emit('selector:change', selector.type, selector.array());
    };

    // adding
    selector.on('add', function (item) {
        // add index
        setIndex(this.type, item);

        editor.emit('selector:add', item, this.type);

        if (!evtChange) {
            evtChange = true;
            setTimeout(evtChangeFn, 0);
        }
    });

    editor.selection.on('add', (item) => {
        editor.emit('selector:add', item._observer, item instanceof api.Entity ? 'entity' : 'asset');
    });

    editor.selection.on('remove', (item) => {
        editor.emit('selector:remove', item._observer, item instanceof api.Entity ? 'entity' : 'asset');
    });

    editor.selection.on('change', (items) => {
        editor.emit('selector:change', items[0] instanceof api.Entity ? 'entity' : 'asset', items.map(item => item._observer));
    });

    // removing
    selector.on('remove', function (item) {
        editor.emit('selector:remove', item, this.type);

        // remove index
        removeIndex(this.type, item);

        if (this.length === 0)
            this.type = null;

        if (!evtChange) {
            evtChange = true;
            setTimeout(evtChangeFn, 0);
        }
    });


    // selecting item (toggle)
    editor.method('selector:toggle', function (type, item) {
        if (item.apiEntity) {
            editor.selection.toogle(item.apiEntity);
            return;
        }

        if (item.apiAsset) {
            editor.selection.toggle(item.apiAsset);
            return;
        }

        if (!enabled)
            return;

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
    editor.method('selector:set', function (type, items) {
        if (type === 'entity') {
            editor.selection.set(items.map(item => item.apiEntity));
            return;
        } else if (type === 'asset') {
            editor.selection.set(items.map(item => item.apiAsset));
            return;
        }

        if (!enabled)
            return;

        editor.selection.clear();
        selector.clear();

        if (!type || !items.length)
            return;

        // type
        selector.type = type;

        // remove
        selector.find(function (item) {
            return items.indexOf(item) === -1;
        }).forEach(function (item) {
            selector.remove(item);
        });

        // add
        for (let i = 0; i < items.length; i++)
            selector.add(items[i]);
    });


    // selecting item
    editor.method('selector:add', function (type, item) {
        if (item.apiEntity) {
            editor.selection.add(item.apiEntity);
            return;
        }

        if (item.apiAsset) {
            editor.selection.add(item.apiAsset);
            return;
        }

        if (!enabled)
            return;

        if (selector.has(item))
            return;

        if (selector.length && selector.type !== type)
            selector.clear();

        selector.type = type;
        selector.add(item);
    });


    // deselecting item
    editor.method('selector:remove', function (item) {
        if (item.apiEntity) {
            editor.selection.remove(item.apiEntity);
            return;
        }

        if (item.apiAsset) {
            editor.selection.remove(item.apiAsset);
            return;
        }

        if (!enabled)
            return;

        if (!selector.has(item))
            return;

        selector.remove(item);
    });


    // deselecting
    editor.method('selector:clear', function (item) {
        editor.selection.clear();

        if (!enabled)
            return;

        selector.clear();
    });


    // return select type
    editor.method('selector:type', function () {
        if (editor.selection.items[0] instanceof api.Entity) {
            return 'entity';
        } else if (editor.selection.items[0] instanceof api.Asset) {
            return 'asset';
        }

        return selector.type;
    });


    // return selected count
    editor.method('selector:count', function () {
        return editor.selection.count || selector.length;
    });


    // return selected items
    editor.method('selector:items', function () {
        if (editor.selection.count) {
            return editor.selection.items.map(item => item._observer);
        }
        return selector.array();
    });

    // return if it has item
    editor.method('selector:has', function (item) {
        return editor.selection.has(item.apiEntity) || editor.selection.has(item.apiAsset) || selector.has(item);
    });


    editor.method('selector:enabled', function (state) {
        editor.selection.enabled = state;
        enabled = state;
    });
});
