editor.once('load', function () {
    'use strict';

    var parent = editor.call('layout.center');
    var codePanel = editor.call('layout.code');
    const monacoEditor = editor.call('editor:monaco');

    // Filter Panel
    var filterPanel = new ui.Panel();
    filterPanel.flex = true;
    filterPanel.class.add('picker-search');
    filterPanel.style.height = '0px';
    filterPanel.hidden = true;
    parent.append(filterPanel);

    var createFilter = function (text, storageKey) {
        var filterButton = new ui.Button({
            text: text
        });
        filterButton.element.tabIndex = -1;
        filterButton.class.add('option');
        filterButton.style.width = '80px';
        filterPanel.append(filterButton);

        var textField = new ui.TextField();
        textField.class.add('search');
        textField.renderChanges = false;
        textField.keyChange = true;
        textField.elementInput.placeholder = 'e.g. *.js, src/*';
        // prevent default behavior on browser shortcuts
        textField.elementInput.classList.add('hotkeys');
        textField.elementInput.addEventListener('keydown', onInputKeyDown);
        filterPanel.append(textField);

        return {
            filterButton,
            textField,
            storageKey,
            doFilter: false,
            pattern: '',
            regexp: null
        };
    };
    var includeFilter = createFilter('Include', 'picker:search:filters:include');
    var excludeFilter = createFilter('Exclude', 'picker:search:filters:exclude');

    // Main Panel
    var panel = new ui.Panel();
    panel.flex = true;
    panel.class.add('picker-search');
    panel.style.height = '0px';
    panel.hidden = true;
    parent.append(panel);

    panel.class.add('animate-height');
    codePanel.class.add('animate-height');
    filterPanel.class.add('animate-height');

    var optionFilter = new ui.Button({
        text: '...'
    });
    optionFilter.element.tabIndex = -1;
    optionFilter.class.add('option');
    panel.append(optionFilter);

    var optionRegex = new ui.Button({
        text: '.*'
    });
    optionRegex.element.tabIndex = -1;
    optionRegex.class.add('option');
    panel.append(optionRegex);

    var optionCase = new ui.Button({
        text: 'Aa'
    });
    optionCase.element.tabIndex = -1;
    optionCase.class.add('option');
    panel.append(optionCase);

    var optionWholeWords = new ui.Button({
        text: '“ ”'
    });
    optionWholeWords.element.tabIndex = -1;
    optionWholeWords.class.add('option');
    panel.append(optionWholeWords);

    var searchField = new ui.TextField();
    searchField.class.add('search');
    searchField.renderChanges = false;
    searchField.keyChange = true;
    searchField.elementInput.placeholder = 'Find in files';
    // prevent default behavior on browser shortcuts
    searchField.elementInput.classList.add('hotkeys');
    searchField.elementInput.addEventListener('keydown', onInputKeyDown);
    panel.append(searchField);

    var error = new ui.Label();
    error.class.add('error');
    error.hidden = true;
    searchField.element.appendChild(error.element);

    var btnFindInFiles = new ui.Button({
        'text': 'Find'
    });
    btnFindInFiles.element.tabIndex = -1;
    panel.append(btnFindInFiles);

    // Tooltips
    Tooltip.attach({
        target: optionFilter.element,
        text: 'Filter Options',
        align: 'bottom',
        root: editor.call('layout.root')
    });

    Tooltip.attach({
        target: optionCase.element,
        text: 'Case Sensitive',
        align: 'bottom',
        root: editor.call('layout.root')
    });

    Tooltip.attach({
        target: optionRegex.element,
        text: 'Regular Expression',
        align: 'bottom',
        root: editor.call('layout.root')
    });

    Tooltip.attach({
        target: optionWholeWords.element,
        text: 'Whole Word',
        align: 'bottom',
        root: editor.call('layout.root')
    });

    var regexp = null;
    var caseSensitive = false;
    var isRegex = false;
    var matchWholeWords = false;
    var filterShow = false;
    var queryDirty = false;
    var previousText = '';
    var searchTimeout = null;

    var open = false;
    var suspendChangeEvt = false;

    // Returns the picker panel
    editor.method('picker:search', function () {
        return panel;
    });

    var growPicker = function () {
        panel.style.height = '';
        codePanel.style.height = 'calc(100% - 64px)';
    };

    var shrinkPicker = function () {
        panel.style.height = '0px';
        codePanel.style.height = 'calc(100% - 32px)';
    };

    var growFilter = function () {
        filterPanel.style.height = '';
        codePanel.style.height = 'calc(100% - 96px)';
    };

    var shrinkFilter = function () {
        filterPanel.style.height = '0px';
        codePanel.style.height = 'calc(100% - 64px)';
    };

    var onTransitionEnd;

    panel.element.addEventListener('transitionend', function (e) {
        if (onTransitionEnd) {
            onTransitionEnd();
            onTransitionEnd = null;
        }
    });

    var onFilterPanelTransitionEnd;

    filterPanel.element.addEventListener('transitionend', function (e) {
        if (onFilterPanelTransitionEnd) {
            onFilterPanelTransitionEnd();
            onFilterPanelTransitionEnd = null;
        }
    });

    // Updates our regular expression.
    // Optionally pass override options for the regexp
    var updateQuery = function (overrides) {
        queryDirty = true;

        var pattern = searchField.value;
        previousText = pattern;
        if (!pattern) {
            regexp = null;
            return;
        }

        overrides = overrides || {};

        var isRawRegex = overrides.isRegex !== undefined ? overrides.isRegex : isRegex;

        if (!isRawRegex) {
            // replace characters for regex
            pattern = pattern.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&");
        }

        if (overrides.matchWholeWords !== undefined ? overrides.matchWholeWords : matchWholeWords) {
            pattern = '\\b' + pattern + '\\b';
        }

        try {
            regexp = new RegExp(
                pattern,
                (overrides.caseSensitive !== undefined ? overrides.caseSensitive : caseSensitive) ?
                    'g' : 'gi'
            );
            error.hidden = true;
        } catch (e) {
            log.error(e);
            regexp = null;
            error.text = 'Invalid Regular Expression';
            error.hidden = false;
        }
    };

    var updateFilterRegex = function (filter) {
        queryDirty = true;

        filter.pattern = filter.textField.value.trim();
        if (!filter.pattern) {
            filter.regexp = null;
            filter.doFilter = false;
            filter.filterButton.class.remove('toggled');
            editor.call('localStorage:set', filter.storageKey, '');
            return;
        }
        filter.doFilter = true;

        try {
            const regs = '^(.*' +
                // replace `*` -> `.*` (so users can use only `*` as wildcard), and escape all other regex characters
                filter.pattern.replace(/[|\\{}()[\]^$+?.]/g, '\\$&').replace(/\*+/g, '.*')
                // use commas as OR separator, trim blank spaces around them, and sets trailing forward-slash with wildcard
                .split(',').map(s => s.trim().replace(/\/$/g, '/.*')).join('|.*') +
                ')$';
            filter.regexp = new RegExp(regs);
            editor.call('localStorage:set', filter.storageKey, filter.pattern);

            filter.filterButton.class.add('toggled');
        } catch (e) {
            log.error(e);
            filter.regexp = null;
            filter.doFilter = false;
            filter.filterButton.class.remove('toggled');
        }
    };

    function onKeyDown(evt) {
        // close picker on esc
        if (evt.keyCode === 27) {
            editor.call('picker:search:close');
        }
    }

    function onInputKeyDown(evt) {
        // select input text on ctrl + shift + f
        if (evt.ctrlKey || evt.metaKey) {
            if (evt.shiftKey && evt.keyCode === 70) {
                searchField.elementInput.select();
            }
        }
        // search on enter
        if (evt.keyCode === 13) {
            search(evt.shiftKey);
        }
    }

    var closeFilter = function () {
        if (!filterShow) return;
        filterShow = false;

        if (!includeFilter.doFilter && !excludeFilter.doFilter) {
            optionFilter.class.remove('toggled');
        }

        shrinkFilter();
        onFilterPanelTransitionEnd = function () {
            filterPanel.hidden = true;
        };
    };

    var openPicker = function (defaultSearchValue) {
        if (!open) {
            open = true;
            panel.hidden = false;
            growPicker();
            editor.emit('picker:search:open');
        }

        // set default search field, if there is any. Otherwise, keep existing search field value
        if (defaultSearchValue) {
            suspendChangeEvt = true;
            searchField.value = defaultSearchValue;
            suspendChangeEvt = false;
        }

        searchField.elementInput.select();
        searchField.elementInput.focus();

        // update search query and view search overlay
        updateQuery();
        // cm.execCommand('viewSearch');

        window.addEventListener('keydown', onKeyDown);
    };

    editor.method('picker:search:open', function (instantToggleMode) {
        onTransitionEnd = null;

        // if there's a code selection, use that as search value
        // this needs to be done *before* we open/switch to 'find in files' tab
        let customSearchValue = null;
        if (!monacoEditor.getSelection().isEmpty()) {
            customSearchValue = monacoEditor.getModel().getValueInRange(monacoEditor.getSelection());
        }

        editor.emit('editor:search:openTab');
        openPicker(customSearchValue);
    });

    // Close picker and focus editor
    editor.method('picker:search:close', function () {
        window.removeEventListener('keydown', onKeyDown);

        onTransitionEnd = null;
        if (!open) return;

        onTransitionEnd = function () {
            panel.hidden = true;
        };

        open = false;

        closeFilter();
        shrinkPicker();

        // clear search too
        // cm.execCommand('clearSearch');

        monacoEditor.focus();

        editor.emit('picker:search:close');
    });

    // Esc hotkey
    editor.call('hotkey:register', 'search-close', {
        key: 'esc',
        stopPropagation: true,
        callback: function (e) {
            if (open) {
                editor.call('picker:search:close');
                return true;
            }
        }
    });

    // Return search regex
    editor.method('picker:search:regex', function () {
        return regexp;
    });

    // Set search term externally.
    editor.method('picker:search:set', function (text, options) {
        var dirty = false;

        suspendChangeEvt = true;
        if (searchField.value !== text) {
            searchField.value = text;
            dirty = true;
        }
        suspendChangeEvt = false;

        if (dirty || options) {
            // update search query and view search overlay
            updateQuery(options);
            // cm.execCommand('viewSearch');
        }
    });

    var cancelDelayedSearch = function () {
        if (searchTimeout) {
            clearTimeout(searchTimeout);
            searchTimeout = null;
        }
    };

    var search = function (reverse) {
        cancelDelayedSearch();

        if (queryDirty) {
            queryDirty = false;
            // cm.execCommand('clearSearch');
        }

        if (regexp) {
            editor.call('editor:search:files', regexp, includeFilter.regexp, excludeFilter.regexp);
        }

        if (open) {
            searchField.focus();
        }
    };

    // execute search
    searchField.on('change', function (value) {
        if (suspendChangeEvt) return;

        if (previousText !== value) {
            updateQuery();

            cancelDelayedSearch();
        }
    });

    includeFilter.textField.on('change', function (value) {
        if (suspendChangeEvt) return;

        if (includeFilter.pattern !== value) {
            updateFilterRegex(includeFilter);

            cancelDelayedSearch();
        }
    });
    excludeFilter.textField.on('change', function (value) {
        if (suspendChangeEvt) return;

        if (excludeFilter.pattern !== value) {
            updateFilterRegex(excludeFilter);

            cancelDelayedSearch();
        }
    });

    // option buttons
    optionFilter.on('click', function () {
        if (!filterShow) {
            filterShow = true;
            optionFilter.class.add('toggled');
            filterPanel.hidden = false;

            onFilterPanelTransitionEnd = null;
            growFilter();
        } else {
            closeFilter();
        }
    });

    optionRegex.on('click', function () {
        isRegex = !isRegex;
        updateQuery();

        if (isRegex) {
            optionRegex.class.add('toggled');
        } else {
            optionRegex.class.remove('toggled');
        }
    });

    optionCase.on('click', function () {
        caseSensitive = !caseSensitive;
        updateQuery();

        if (caseSensitive) {
            optionCase.class.add('toggled');
        } else {
            optionCase.class.remove('toggled');
        }
    });

    optionWholeWords.on('click', function () {
        matchWholeWords = !matchWholeWords;
        updateQuery();

        if (matchWholeWords) {
            optionWholeWords.class.add('toggled');
        } else {
            optionWholeWords.class.remove('toggled');
        }
    });

    btnFindInFiles.on('click', function () {
        search();
    });

    // set default filter values
    includeFilter.textField.value = editor.call('localStorage:get', includeFilter.storageKey) || '';
    excludeFilter.textField.value = editor.call('localStorage:get', excludeFilter.storageKey) || '';
    if (includeFilter.pattern || excludeFilter.pattern) {
        optionFilter.class.add('toggled');
    }

    // stop search timeout when documents are focused / unfocused
    editor.on('documents:focus', cancelDelayedSearch);
    editor.on('documents:unfocus', cancelDelayedSearch);
});
