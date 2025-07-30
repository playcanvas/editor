import { Element, Container, TextInput, BooleanInput, LabelGroup } from '@playcanvas/pcui';

editor.once('load', () => {
    const panel = editor.call('layout.hierarchy');
    const hierarchy = editor.call('entities:hierarchy');

    // Container for the search input and the button for toggling filters
    const searchBar = new Container();

    let lastSearch = '';
    const search = new TextInput();
    search.blurOnEnter = false;
    search.keyChange = true;
    search.class.add('search');
    search.renderChanges = false;

    // Button for clearing search
    const searchClear = new Element();
    searchClear.class.add('clear');
    searchClear.dom.innerHTML = '&#57650;';
    search.element.appendChild(searchClear.dom);

    // Button for showing filters
    const showFiltersButton = new Element();
    showFiltersButton.class.add('toggle-filters');

    searchBar.append(showFiltersButton);
    searchBar.append(search);

    searchBar.class.add('advanced-search-bar');

    searchClear.on('click', () => {
        search.value = '';
    });

    // Container for both the search bar and the filters
    const advancedSearchContainer = new Container();
    advancedSearchContainer.class.add('advanced-search-container');

    // Container for only the filters
    const advancedSearchFilterContainer = new Container({ flex: true });

    // Advanced Search Filters
    const filterList = ['Name', 'Component Type', 'Script Name', 'Tags'].reverse();
    const filterMap = filterList.reduce((map, name) => {
        map[name] = {};

        map[name].field = new BooleanInput({
            type: null
        });

        map[name].field.class.add('advanced-search-label-filter-checkbox');

        map[name].field.on('change', (value) => {
            hierarchy.setFilter(name, value);

            if (value) {
                map[name].field.class.add('checked');
            } else {
                map[name].field.class.remove('checked');
            }

            // re-perform search with new filters
            if (search.value.trim()) {
                hierarchy._applyFilter(search.value.trim());
            }

            const active = filterList.filter(name => hierarchy.getFilter(name));

            // if all filters are selected then switch button name from select all to reset
            if (searchByField !== undefined) {
                searchByField.dom.innerHTML = active.length === filterList.length ? 'Reset' : 'Select All';
            }
        });

        map[name].field.on('click', () => {
            map[name].field.value = !map[name].field.value;
        });

        map[name].label = new LabelGroup({
            text: name,
            field: map[name].field
        });

        map[name].label.class.add('advanced-search-label-filter');

        map[name].label.label.class.add('advanced-search-label-filter-text');

        map[name].label.on('click', () => {
            map[name].field.value = !map[name].field.value;
        });

        advancedSearchFilterContainer.prepend(map[name].label);
        return map;
    }, {});

    filterMap[filterList[filterList.length - 1]].field.value = true;

    // Toggle Smart Search

    const smartSearchField = new BooleanInput({
        type: 'toggle',
        value: true
    });

    smartSearchField.on('change', (value) => {
        hierarchy.setFuzzy(value);

        // re-perform search with smart search change
        if (search.value.trim()) {
            hierarchy._applyFilter(search.value.trim());
        }
    });

    const smartSearchLabel = new LabelGroup({
        text: 'Smart Search',
        field: smartSearchField
    });

    smartSearchLabel.class.add('advanced-search-label-toggle');
    smartSearchLabel.label.class.add('advanced-search-label-toggle-text');
    smartSearchLabel.element.setAttribute('text-hover', 'Toggle whether only exact matches are shown');

    // Search by

    var searchByField = new Element();
    searchByField.dom.innerHTML = 'Select All';
    searchByField.class.add('advanced-search-select-all-button');

    searchByField.on('click', () => {

        const active = filterList.filter(name => hierarchy.getFilter(name));

        if (active.length === filterList.length) {
            filterList.forEach((name) => {
                filterMap[name].field.value = false;
            });

            filterMap[filterList[filterList.length - 1]].field.value = true;
        } else {
            filterList.forEach((name) => {
                filterMap[name].field.value = true;
            });
        }
    });

    const searchByLabel = new LabelGroup({
        text: 'Search By',
        field: searchByField
    });

    searchByLabel.class.add('advanced-search-label-search-by');
    searchByLabel.label.class.add('advanced-search-search-by-text');

    // Adding to container

    advancedSearchFilterContainer.prepend(searchByLabel);
    advancedSearchFilterContainer.prepend(smartSearchLabel);
    advancedSearchFilterContainer.class.add('advanced-search-filter-container');

    advancedSearchContainer.prepend(searchBar);

    // Adding to Panel

    panel.prepend(advancedSearchContainer);

    let showFilters = false;
    let searchTimeOut;

    // if show filters button is clicked toggle whether filters are shown

    showFiltersButton.on('click', () => {
        showFilters = !showFilters;

        const active = filterList.filter(name => hierarchy.getFilter(name));

        // Default to search by the first filter if nothing is selected
        if (active.length === 0) {
            filterMap[filterList[filterList.length - 1]].field.value = true;
        }

        if (showFilters) {
            advancedSearchContainer.appendAfter(advancedSearchFilterContainer, searchBar);
            showFiltersButton.class.add('showing');
            advancedSearchContainer.class.add('showing');
            searchBar.class.add('activated');
        } else {
            advancedSearchContainer.remove(advancedSearchFilterContainer);
            showFiltersButton.class.remove('showing');
            advancedSearchContainer.class.remove('showing');
            searchBar.class.remove('activated');
        }
    }, false);

    const performSearch = function () {
        hierarchy.filter = lastSearch;
    };

    // if entity added, check if it matching query
    editor.on('entities:add', (entity) => {

        const query = search.value.trim();
        if (!query) {
            return;
        }

        const items = [[entity.get('name'), entity]];
        const result = editor.call('search:items', items, query);

        if (!result.length) {
            return;
        }

        performSearch();
    });

    search.on('change', (value) => {
        clearTimeout(searchTimeOut);

        const active = filterList.filter(name => hierarchy.getFilter(name));

        // Default to search by the first filter if nothing is selected
        if (active.length === 0) {
            filterMap[filterList[filterList.length - 1]].field.value = true;
        }

        value = value.trim();

        lastSearch = value;

        if (value) {
            search.class.add('not-empty');
            searchBar.class.add('activated');
        } else {
            search.class.remove('not-empty');
            if (!showFilters) {
                searchBar.class.remove('activated');
            }
        }

        searchTimeOut = setTimeout(performSearch, value === '' ? 0 : 200);
    });
});
