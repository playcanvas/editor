editor.once('load', function() {
    'use strict';

    var grid = editor.call('assets:grid');

    var sortQueued = false;
    var sort = function() {
        sortQueued = false;

        var items = [ ];
        for(var i = 0; i < grid.element.children.length; i++) {
            var name = grid.element.children[i].ui.labelElement.textContent.toLowerCase();
            items.push({
                name: name,
                element: grid.element.children[i]
            });
        }

        items.sort(function(a, b) {
            if (a.name < b.name) {
                return -1;
            } else if (a.name > b.name) {
                return 1;
            } else {
                return 0;
            }
        });

        var element = grid.element.firstChild;
        var i = 0;
        while(element) {
            if (items[i].element !== element) {
                items[i].element.parentNode.removeChild(items[i].element);
                grid.element.insertBefore(items[i].element, element);
                element = items[i].element.nextSibling;
            } else {
                element = element.nextSibling;
            }
            i++;
        }

        if (grid.selected.length)
            grid.selected[0].element.scrollIntoView();
    };

    var queueSort = function() {
        if (sortQueued) return;
        sortQueued = true;

        requestAnimationFrame(sort);
    };

    grid.on('append', function(item) {
        var evtName;

        if (item.asset) {
            evtName = item.asset.on('name:set', queueSort)
        } else if (item.script) {
            evtName = item.script.on('filename:set', queueSort)
        }

        if (evtName) {
            item.once('destroy', function() {
                evtName.unbind();
            });
        }

        queueSort();
    });
});
