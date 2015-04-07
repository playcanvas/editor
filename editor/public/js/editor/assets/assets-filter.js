editor.once('load', function() {
    'use strict';

    var assetsPanel = editor.call('layout.assets');

    // filters
    var panelFilters = new ui.Panel();
    panelFilters.class.add('filters');
    assetsPanel.headerAppend(panelFilters);

    // label
    // var filterLabel = new ui.Label({
    //     text: 'Filter:'
    // });
    // filterLabel.class.add('label');
    // panelFilters.append(filterLabel);

    var filter = function(type, item) {
        var visible = true;

        // type
        if (filterField.value !== 'all') {
            if (type === 'asset') {
                visible = item.get('type') === filterField.value;
            } else if (type === 'script') {
                visible = filterField.value === 'script';
            }
        }

        // query
        if (visible && search.value) {
            if (type === 'asset') {
                visible = item.get('name').indexOf(search.value) !== -1;
            } else if (type === 'script') {
                visible = item.get('filename').indexOf(search.value) !== -1;
            }
        }

        return visible;
    };

    // options
    var filterField = new ui.SelectField({
        options: {
            all: 'All',
            animation: 'Animation',
            audio: 'Audio',
            cubemap: 'Cubemap',
            json: 'Json',
            material: 'Material',
            model: 'Model',
            script: 'Script',
            text: 'Text',
            texture: 'Texture'
        }
    });
    filterField.class.add('options');
    filterField.value = 'all';
    filterField.renderChanges = false;
    panelFilters.append(filterField);

    filterField.on('change', function(value) {
        if (value !== 'all') {
            filterField.class.add('not-empty');
        } else {
            filterField.class.remove('not-empty');
            filterField.elementValue.textContent = 'Filter';
        }
        editor.call('assets:panel:filter', filter);
    });

    editor.method('assets:filter:type', function(type) {
        if (type === undefined)
            return filterField.value;

        filterField.value = type || 'all';
    });

    editor.method('assets:filter:type:disabled', function(state) {
        filterField.disabled = state;
    });

    editor.on('assets:add', function(asset) {
        if (filterField.value === 'all' && ! search.value)
            return;

        if (! filter(asset))
            editor.call('assets:panel:get', asset.get('id')).hidden = true;
    });

    // search
    var search = new ui.TextField({
        placeholder: 'Search'
    });
    search.keyChange = true;
    search.class.add('search');
    search.renderChanges = false;
    panelFilters.append(search);

    var searchClear = document.createElement('div');
    searchClear.innerHTML = '&#58422;';
    searchClear.classList.add('clear');
    search.element.appendChild(searchClear);

    searchClear.addEventListener('click', function() {
        search.value = '';
    }, false);

    search.on('change', function(value) {
        value = value.trim();

        if (value) {
            search.class.add('not-empty');
        } else {
            search.class.remove('not-empty');
        }

        editor.call('assets:panel:filter', filter);
    });
});
