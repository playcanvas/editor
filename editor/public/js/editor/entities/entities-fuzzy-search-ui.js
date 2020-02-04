editor.once('load', function() {
    'use strict';

    var panel = editor.call('layout.hierarchy');
    var hierarchy = editor.call('entities:hierarchy');
    var changing = false;
    var itemsIndex = { };

    const hasPcuiEntities = editor.call('users:hasFlag', 'hasPcuiEntities');

    var results = new ui.List();
    results.element.tabIndex = 0;
    results.hidden = true;
    results.class.add('search-results');
    panel.append(results);

    // clear on escape
    results.element.addEventListener('keydown', function(evt) {
        if (evt.keyCode === 27) { // esc
            searchClear.click();

        } else if (evt.keyCode === 13) { // enter
            if (! results.selected) {
                var firstElement = results.element.firstChild;
                if (firstElement && firstElement.ui && firstElement.ui.entity)
                    editor.call('selector:set', 'entity', [ firstElement.ui.entity ]);
            }
            search.value = '';

        } else if (evt.keyCode === 40) { // down
            selectNext();
            evt.stopPropagation();

        } else if (evt.keyCode === 38) { // up
            selectPrev();
            evt.stopPropagation();
        }
    }, false);

    // deselecting
    results.unbind('deselect', results._onDeselect);
    results._onDeselect = function(item) {
        var ind = this._selected.indexOf(item);
        if (ind !== -1) this._selected.splice(ind, 1);

        if (this._changing)
            return;

        if (List._ctrl && List._ctrl()) {

        } else {
            this._changing = true;

            var items = editor.call('selector:type') === 'entity' && editor.call('selector:items') || [ ];
            var inSelected = items.indexOf(item.entity) !== -1;

            if (items.length >= 2 && inSelected) {
                var selected = this.selected;
                for(var i = 0; i < selected.length; i++)
                    selected[i].selected = false;

                item.selected = true;
            }

            this._changing = false;
        }

        this.emit('change');
    };
    results.on('deselect', results._onDeselect);

    // results selection change
    results.on('change', function() {
        if (changing)
            return;

        if (results.selected) {
            editor.call('selector:set', 'entity', results.selected.map(function(item) {
                return item.entity;
            }));
        } else {
            editor.call('selector:clear');
        }
    });

    // selector change
    editor.on('selector:change', function(type, items) {
        if (changing)
            return;

        changing = true;

        if (type === 'entity') {
            results.selected = [ ];

            for(var i = 0; i < items.length; i++) {
                var item = itemsIndex[items[i].get('resource_id')];
                if (! item) continue;
                item.selected = true;
            }
        } else {
            results.selected = [ ];
        }

        changing = false;
    });

    var selectNext = function() {
        var children = results.element.children;

        // could be nothing or only one item to select
        if (! children.length)
            return;

        var toSelect = null;
        var items = results.element.querySelectorAll('.ui-list-item.selected');
        var multi = (ui.List._ctrl && ui.List._ctrl()) || (ui.List._shift && ui.List._shift());

        if (items.length) {
            var last = items[items.length - 1];
            var next = last.nextSibling;
            if (next) {
                // select next
                toSelect = next.ui;
            } else {
                // loop through
                if (! multi) toSelect = children[0].ui;
            }
        } else {
            // select first
            toSelect = children[0].ui;
        }

        if (toSelect) {
            if (! multi) results.selected = [ ];
            toSelect.selected = true;
        }
    };
    var selectPrev = function() {
        var children = results.element.children;

        // could be nothing or only one item to select
        if (! children.length)
            return;

        var toSelect = null;
        var items = results.element.querySelectorAll('.ui-list-item.selected');
        var multi = (ui.List._ctrl && ui.List._ctrl()) || (ui.List._shift && ui.List._shift());

        if (items.length) {
            var first = items[0];
            var prev = first.previousSibling;
            if (prev) {
                // select previous
                toSelect = prev.ui;
            } else {
                // loop through
                if (! multi) toSelect = children[children.length - 1].ui;
            }
        } else {
            // select last
            toSelect = children[children.length - 1].ui;
        }

        if (toSelect) {
            if (! multi) results.selected = [ ];
            toSelect.selected = true;
        }
    };


    var lastSearch = '';
    var search = new ui.TextField({
        placeholder: 'Search'
    });
    search.blurOnEnter = false;
    search.keyChange = true;
    search.class.add('search');
    search.renderChanges = false;
    panel.prepend(search);

    search.element.addEventListener('keydown', function(evt) {
        if (hasPcuiEntities) return;

        if (evt.keyCode === 27) {
            searchClear.click();

        } else if (evt.keyCode === 13) {
            if (! results.selected.length) {
                var firstElement = results.element.firstChild;
                if (firstElement && firstElement.ui && firstElement.ui.entity)
                    editor.call('selector:set', 'entity', [ firstElement.ui.entity ]);
            }
            search.value = '';

        } else if (evt.keyCode === 40) { // down
            editor.call('hotkey:updateModifierKeys', evt);
            selectNext();
            evt.stopPropagation();
            evt.preventDefault();

        } else if (evt.keyCode === 38) { // up
            editor.call('hotkey:updateModifierKeys', evt);
            selectPrev();
            evt.stopPropagation();
            evt.preventDefault();

        } else if (evt.keyCode === 65 && evt.ctrlKey) { // ctrl + a
            var toSelect = [ ];

            var items = results.element.querySelectorAll('.ui-list-item');
            for(var i = 0; i < items.length; i++)
                toSelect.push(items[i].ui);

            results.selected = toSelect;

            evt.stopPropagation();
            evt.preventDefault();
        }
    }, false);

    var searchClear = document.createElement('div');
    searchClear.innerHTML = '&#57650;';
    searchClear.classList.add('clear');
    search.element.appendChild(searchClear);

    searchClear.addEventListener('click', function() {
        search.value = '';
    }, false);


    // if entity added, check if it maching query
    editor.on('entities:add', function(entity) {
        var query = search.value.trim();
        if (! query)
            return;

        var items = [ [ entity.get('name'), entity ] ];
        var result = editor.call('search:items', items, query);

        if (! result.length)
            return;

        performSearch();
    });


    var addItem = function(entity) {
        var events = [ ];

        var item = new ui.ListItem({
            text: entity.get('name')
        });
        item.disabledClick = true;
        item.entity = entity;

        if (entity.get('children').length)
            item.class.add('container');

        // relate to tree item
        var treeItem = editor.call('entities:panel:get', entity.get('resource_id'));

        item.disabled = treeItem.disabled;

        var onStateChange = function() {
            item.disabled = treeItem.disabled;
        };

        events.push(treeItem.on('enable', onStateChange));
        events.push(treeItem.on('disable', onStateChange));

        var onNameSet = function(name) {
            item.text = name;
        };
        events.push(entity.on('name:set', onNameSet));

        // icon
        var components = Object.keys(entity.get('components'));
        for(var c = 0; c < components.length; c++)
            item.class.add('c-' + components[c]);

        var onContextMenu = function(evt) {
            var openned = editor.call('entities:contextmenu:open', entity, evt.clientX, evt.clientY);

            if (openned) {
                evt.preventDefault();
                evt.stopPropagation();
            }
        };

        var onDblClick = function(evt) {
            search.value = '';
            editor.call('selector:set', 'entity', [ entity ]);

            evt.stopPropagation();
            evt.preventDefault();
        };

        item.element.addEventListener('contextmenu', onContextMenu);
        item.element.addEventListener('dblclick', onDblClick);

        events.push(item.once('destroy', function() {
            for(var i = 0; i < events.length; i++)
                events[i].unbind();
            events = null;

            item.element.removeEventListener('contextmenu', onContextMenu);
            item.element.removeEventListener('dblclick', onDblClick);
        }));

        events.push(treeItem.once('destroy', function() {
            // if entity removed, perform search again
            performSearch();
        }));

        return item;
    };


    var performSearch = function() {
        var query = lastSearch;

        if (hasPcuiEntities) {
            hierarchy.filter = query;
            return;
        }

        // clear results list
        results.clear();
        itemsIndex = { };

        if (query) {
            var result = editor.call('entities:fuzzy-search', query);

            hierarchy.hidden = true;
            results.hidden = false;

            var selected = [ ];
            if (editor.call('selector:type') === 'entity')
                selected = editor.call('selector:items');

            for(var i = 0; i < result.length; i++) {
                var item = addItem(result[i]);

                itemsIndex[result[i].get('resource_id')] = item;

                if (selected.indexOf(result[i]) !== -1)
                    item.selected = true;

                results.append(item);
            }
        } else {
            results.hidden = true;
            hierarchy.hidden = false;
        }
    };


    search.on('change', function(value) {
        value = value.trim();

        if (lastSearch === value) return;
        lastSearch = value;

        if (value) {
            search.class.add('not-empty');
        } else {
            search.class.remove('not-empty');
        }

        performSearch();
    });
});
