editor.once('load', function() {
    'use strict';

    var enabled = true;
    var selector = new ObserverList();
    selector.type = null;



    var index = { };

    var keyByType = function(type) {
        switch(type) {
            case 'entity':
                return 'resource_id';
            case 'asset':
                return 'id';
        }
        return null;
    }

    var setIndex = function(type, item) {
        var key = keyByType(type);
        if (! key) return;

        if (! index[type])
            index[type] = { };

        index[type][item.get[key]] = item.once('destroy', function() {
            var state = editor.call('selector:history');
            if (state)
                editor.call('selector:history', false);

            selector.remove(item);
            delete index[type][item.get[key]];

            if (state)
                editor.call('selector:history', true);
        });
    };

    var removeIndex = function(type, item) {
        if (! index[type]) return;

        var key = keyByType(type);
        if (! key) return;

        var ind = index[type][item.get[key]];
        if (! ind) return;

        ind.unbind();
    };

    var evtChange = false;
    var evtChangeFn = function() {
        evtChange = false;
        editor.emit('selector:change', selector.array());
    };

    // adding
    selector.on('add', function(item) {
        // add index
        setIndex(this.type, item);

        editor.emit('selector:add', item, this.type);

        if (! evtChange) {
            evtChange = true;
            setTimeout(evtChangeFn, 0);
        }
    });


    // removing
    selector.on('remove', function(item) {
        editor.emit('selector:remove', item, this.type);

        // remove index
        removeIndex(this.type, item);

        if (this.length === 0)
            this.type = null;

        if (! evtChange) {
            evtChange = true;
            setTimeout(evtChangeFn, 0);
        }
    });


    // selecting item (toggle)
    editor.method('selector:toggle', function(type, item) {
        if (! enabled)
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
    editor.method('selector:set', function(type, items) {
        if (! enabled)
            return;

        selector.clear();

        if (! type || ! items.length)
            return;

        // type
        selector.type = type;

        // remove
        selector.find(function(item) {
            return items.indexOf(item) === -1;
        }).forEach(function(item) {
            selector.remove(item);
        });

        // add
        for(var i = 0; i < items.length; i++) {
            selector.add(items[i]);
        }
    });


    // selecting item
    editor.method('selector:add', function(type, item) {
        if (! enabled)
            return;

        if (selector.has(item))
            return;

        if (selector.length && selector.type !== type)
            selector.clear();

        selector.type = type;
        selector.add(item);
    });


    // deselecting item
    editor.method('selector:remove', function(item) {
        if (! enabled)
            return;

        if (! selector.has(item))
            return;

        selector.remove(item);
    });


    // deselecting
    editor.method('selector:clear', function(item) {
        if (! enabled)
            return;

        selector.clear();
    });


    // return select type
    editor.method('selector:type', function() {
        return selector.type;
    });


    // return selected count
    editor.method('selector:count', function() {
        return selector.length;
    });


    // return selected items
    editor.method('selector:items', function() {
        return selector.array();
    });


    // return if it has item
    editor.method('selector:has', function(item) {
        return selector.has(item);
    });


    editor.method('selector:enabled', function(state) {
        enabled = state;
    });
});
