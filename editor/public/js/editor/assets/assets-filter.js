editor.once('load', function() {
    'use strict';

    var assetsPanel = editor.call('layout.assets');

    // filters
    var panelFilters = new ui.Panel();
    panelFilters.class.add('filters');
    assetsPanel.headerAppend(panelFilters);

    // label
    var filterLabel = new ui.Label({
        text: 'Filter:'
    });
    filterLabel.class.add('label');
    panelFilters.append(filterLabel);

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
            text: 'Text',
            texture: 'Texture'
        }
    });
    filterField.class.add('options');
    filterField.value = 'all';
    filterField.renderChanges = false;
    panelFilters.append(filterField);

    filterField.on('change', function(value) {
        editor.call('assets:panel:filter', function(asset) {
            if (value === 'all') {
                return true;
            } else {
                var visible = asset.get('type') === value;
                if (! visible)
                    editor.call('selector:remove', asset);

                return visible;
            }
        });
    });

    editor.method('assets:filter:type', function(type) {
        if (type === undefined)
            return filterField.value;

        filterField.value = type || 'all';
    });

    editor.method('assets:filter:type:disabled', function(state) {
        filterField.disabled = state;
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

        editor.call('assets:panel:filter', function(asset) {
            if (! value) {
                return true;
            } else {
                var visible = asset.get('name').indexOf(value) !== -1;
                if (! visible)
                    editor.call('selector:remove', asset);

                return visible;
            }
        });
    });
});
