editor.once('load', function() {
    'use strict';

    var panel = editor.call('layout.hierarchy');
    var hierarchy = editor.call('entities:hierarchy');

    var lastSearch = '';
    var search = new ui.TextField({
        placeholder: 'Search'
    });
    search.blurOnEnter = false;
    search.keyChange = true;
    search.class.add('search');
    search.renderChanges = false;
    panel.prepend(search);

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


    var performSearch = function() {
        hierarchy.filter = lastSearch;
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
