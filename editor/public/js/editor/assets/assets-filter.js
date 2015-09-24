editor.once('load', function() {
    'use strict';

    var root = editor.call('layout.root');
    var assetsPanel = editor.call('layout.assets');

    // filters
    var panelFilters = new ui.Panel();
    panelFilters.class.add('filters');
    assetsPanel.headerAppend(panelFilters);

    var filter = function(type, item) {
        if (! item)
            return false;

        var visible = true;

        // source
        if (! btnSources.class.contains('active') && item.get('source'))
            visible = false;

        // type
        if (visible && filterField.value !== 'all') {
            if (type === 'asset') {
                visible = item.get('type') === filterField.value;
            } else if (type === 'script') {
                visible = filterField.value === 'script';
            }
        }

        // query
        if (visible && search.value) {
            var name = item.get(type === 'asset' ? 'name' : 'filename');
            var normalSearch = true;

            if (search.value[0] === '*' && search.value.length > 1) {
                try {
                    visible = (new RegExp(search.value.slice(1), 'i')).test(name);
                    normalSearch = false;
                } catch(ex) { }
            }

            if (normalSearch)
                visible = name.toLowerCase().indexOf(search.value.toLowerCase()) !== -1;
        }

        return visible;
    };

    // source assets
    var btnSources = new ui.Button({
        text: 'Sources'
    });
    btnSources.class.add('sources');
    btnSources.on('click', function() {
        if (this.class.contains('active')) {
            this.class.remove('active');
        } else {
            this.class.add('active');
        }
        editor.call('assets:panel:filter', filter);
    });
    panelFilters.append(btnSources);

    var tooltipSources = Tooltip.attach({
        target: btnSources.element,
        text: 'Show Source Assets',
        align: 'bottom',
        root: root
    });

    // options
    var filterField = new ui.SelectField({
        options: {
            all: 'All',
            animation: 'Animation',
            audio: 'Audio',
            cubemap: 'Cubemap',
            css: 'Css',
            json: 'Json',
            html: 'Html',
            material: 'Material',
            model: 'Model',
            script: 'Script',
            shader: 'Shader',
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
            // filterField.elementValue.textContent = 'Filter';
        }
        editor.call('assets:panel:filter', filter);
    });

    var tooltipFilter = Tooltip.attach({
        target: filterField.element,
        text: 'Filter Assets',
        align: 'bottom',
        root: root
    });
    filterField.on('open', function() {
        tooltipFilter.disabled = true;
    });
    filterField.on('close', function() {
        tooltipFilter.disabled = false;
    });

    editor.method('assets:filter:sources', function(state) {
        if (state === undefined)
            return btnSources.class.contains('active');

        if (btnSources.class.contains('active') === !! state)
            return;

        if (state) {
            btnSources.class.add('active');
        } else {
            btnSources.class.remove('active');
        }

        editor.call('assets:panel:filter', filter);
    });

    editor.method('assets:filter:sources:disabled', function(state) {
        btnSources.disabled = state;
    });

    editor.method('assets:filter:search', function(query) {
        if (query === undefined)
            return search.value;

        search.value = query;
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

        if (! filter((asset.get('type') === 'script') ? 'script' : 'asset', asset))
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

    Tooltip.attach({
        target: search.element,
        text: 'Search Assets',
        align: 'bottom',
        root: root
    });
});
