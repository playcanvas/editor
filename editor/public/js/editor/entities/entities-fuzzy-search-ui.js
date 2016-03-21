editor.once('load', function() {
    'use strict';

    var root = editor.call('layout.root');
    var panel = editor.call('layout.left');
    var hierarchy = editor.call('entities:hierarchy');


    var results = new ui.List();
    results.hidden = true;
    results.class.add('search-results');
    panel.append(results);

    results.on('select', function(item) {
        search.value = '';
        editor.call('selector:set', 'entity', [ item.entity ]);
    });


    var lastSearch = '';
    var search = new ui.TextField({
        placeholder: 'Search'
    });
    search.keyChange = true;
    search.class.add('search');
    search.renderChanges = false;
    panel.element.insertBefore(search.element, panel.innerElement);

    search.element.addEventListener('keydown', function(evt) {
        if (evt.keyCode === 27)
            searchClear.click();

        if (evt.keyCode === 13) {
            var firstElement = results.element.firstChild;
            if (firstElement && firstElement.ui && firstElement.ui.entity) {
                search.value = '';
                editor.call('selector:set', 'entity', [ firstElement.ui.entity ]);
            }
        }
    }, false);

    var searchClear = document.createElement('div');
    searchClear.innerHTML = '&#57650;';
    searchClear.classList.add('clear');
    search.element.appendChild(searchClear);

    searchClear.addEventListener('click', function() {
        search.value = '';
    }, false);


    search.on('change', function(value) {
        value = value.trim();

        if (lastSearch === value) return;
        lastSearch = value;

        if (value) {
            search.class.add('not-empty');
        } else {
            search.class.remove('not-empty');
        }

        // clear results list
        results.clear();

        if (value) {
            var result = editor.call('entities:fuzzy-search', value);

            hierarchy.hidden = true;
            results.hidden = false;

            for(var i = 0; i < result.length; i++) {
                var item = new ui.ListItem({
                    text: result[i].get('name')
                });
                item.entity = result[i];

                if (result[i].get('children').length)
                    item.class.add('container');

                // icon
                var components = Object.keys(result[i].get('components'));
                for(var c = 0; c < components.length; c++)
                    item.class.add('c-' + components[c]);

                results.append(item);
            }
        } else {
            results.hidden = true;
            hierarchy.hidden = false;
        }
        // editor.call('assets:panel:filter', filter);
    });
});
