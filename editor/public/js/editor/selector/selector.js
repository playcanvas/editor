editor.once('load', function() {
    'use strict';

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

        var ind = index[type][item[key]] = {
            item: item,
            onDestroy: function() {
                selector.remove(item);
                delete index[type][item[key]];
            }
        };

        item.once('destroy', ind.onDestroy);
    };

    var removeIndex = function(type, item) {
        if (! index[type]) return;

        var key = keyByType(type);
        if (! key) return;

        var ind = index[type][item[key]];
        if (! ind) return;

        ind.item.unbind('destroy', ind.onDestroy);
    }

    // adding
    selector.on('add', function(item) {
        // add index
        setIndex(this.type, item);

        editor.emit('selector:add', item, this.type);
        editor.emit('selector:change', this.array());
    });


    // removing
    selector.on('remove', function(item) {
        editor.emit('selector:remove', item, this.type);

        // remove index
        removeIndex(this.type, item);

        if (this.length === 0)
            this.type = null;

        editor.emit('selector:change', this.array());
    });


    // selecting item (toggle)
    editor.hook('selector:toggle', function(type, item) {
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
    editor.hook('selector:set', function(type, items) {
        if (! type || ! items.length) {
            selector.clear();
            return;
        }

        if (selector.type !== type) {
            selector.clear();
            selector.type = type;
        }

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
    editor.hook('selector:add', function(type, item) {
        if (selector.has(item))
            return;

        if (selector.length && selector.type !== type) {
            selector.clear();
        }
        selector.type = type;
        selector.add(item);
    });


    // deselecting item
    editor.hook('selector:remove', function(item) {
        if (! selector.has(item))
            return;

        selector.remove(item);
    });


    // deselecting
    editor.hook('selector:clear', function(item) {
        selector.clear();
    });


    // return select type
    editor.hook('selector:type', function() {
        return selector.type;
    });


    // return selected count
    editor.hook('selector:count', function() {
        return selector.length;
    });


    // return selected items
    editor.hook('selector:items', function() {
        return selector.array();
    });


    // return if it has item
    editor.hook('selector:has', function(item) {
        return selector.has(item);
    });
});
