import { Container, Button, TextInput, Label } from '@playcanvas/pcui';

editor.once('load', function () {
    const parent = editor.call('layout.center');
    const codePanel = editor.call('layout.code');
    const monacoEditor = editor.call('editor:monaco');

    // Filter Panel
    const filterPanel = new Container({
        class: 'picker-search',
        flex: true,
        hidden: true
    });
    filterPanel.style.height = '0px';
    parent.append(filterPanel);

    const createFilter = function (text, storageKey) {
        const filterButton = new Button({
            class: 'option',
            text: text,
            tabIndex: -1
        });
        filterButton.style.width = '80px';
        filterPanel.append(filterButton);

        const textInput = new TextInput({
            class: 'search',
            keyChange: true,
            placeholder: 'e.g. *.js, src/*',
            renderChanges: false
        });
        // prevent default behavior on browser shortcuts
        textInput.input.classList.add('hotkeys');
        textInput.input.addEventListener('keydown', onInputKeyDown);
        filterPanel.append(textInput);

        return {
            filterButton,
            textField: textInput,
            storageKey,
            doFilter: false,
            pattern: '',
            regexp: null
        };
    };
    const includeFilter = createFilter('Include', 'picker:search:filters:include');
    const excludeFilter = createFilter('Exclude', 'picker:search:filters:exclude');

    // Main Panel
    const panel = new Container({
        class: 'picker-search',
        flex: true,
        hidden: true
    });
    panel.style.height = '0px';
    parent.append(panel);

    panel.class.add('animate-height');
    codePanel.class.add('animate-height');
    filterPanel.class.add('animate-height');

    const optionFilter = new Button({
        class: 'option',
        text: '...',
        tabIndex: -1
    });
    panel.append(optionFilter);

    const optionRegex = new Button({
        class: 'option',
        text: '.*',
        tabIndex: -1
    });
    panel.append(optionRegex);

    const optionCase = new Button({
        class: 'option',
        text: 'Aa',
        tabIndex: -1
    });
    panel.append(optionCase);

    const optionWholeWords = new Button({
        class: 'option',
        text: '“ ”',
        tabIndex: -1
    });
    panel.append(optionWholeWords);

    const searchField = new TextInput({
        class: 'search',
        keyChange: true,
        placeholder: 'Find in files',
        renderChanges: false
    });
    // prevent default behavior on browser shortcuts
    searchField.input.classList.add('hotkeys');
    searchField.input.addEventListener('keydown', onInputKeyDown);
    panel.append(searchField);

    const error = new Label({
        class: 'error',
        hidden: true
    });
    searchField.element.appendChild(error.element);

    const btnFindInFiles = new Button({
        'text': 'Find',
        tabIndex: -1
    });
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

    let regexp = null;
    let caseSensitive = false;
    let isRegex = false;
    let matchWholeWords = false;
    let filterShow = false;
    let queryDirty = false;
    let previousText = '';
    let searchTimeout = null;

    let open = false;
    let suspendChangeEvt = false;

    // Returns the picker panel
    editor.method('picker:search', function () {
        return panel;
    });

    const growPicker = function () {
        panel.style.height = '';
        codePanel.style.height = 'calc(100% - 64px)';
    };

    const shrinkPicker = function () {
        panel.style.height = '0px';
        codePanel.style.height = 'calc(100% - 32px)';
    };

    const growFilter = function () {
        filterPanel.style.height = '';
        codePanel.style.height = 'calc(100% - 96px)';
    };

    const shrinkFilter = function () {
        filterPanel.style.height = '0px';
        codePanel.style.height = 'calc(100% - 64px)';
    };

    let onTransitionEnd;

    panel.element.addEventListener('transitionend', function (e) {
        if (onTransitionEnd) {
            onTransitionEnd();
            onTransitionEnd = null;
        }
    });

    let onFilterPanelTransitionEnd;

    filterPanel.element.addEventListener('transitionend', function (e) {
        if (onFilterPanelTransitionEnd) {
            onFilterPanelTransitionEnd();
            onFilterPanelTransitionEnd = null;
        }
    });

    // Updates our regular expression.
    // Optionally pass override options for the regexp
    const updateQuery = function (overrides = {}) {
        queryDirty = true;

        let pattern = searchField.value;
        previousText = pattern;
        if (!pattern) {
            regexp = null;
            return;
        }

        const isRawRegex = overrides.isRegex !== undefined ? overrides.isRegex : isRegex;

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

    const updateFilterRegex = function (filter) {
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
                searchField.focus(true);
            }
        }
        // search on enter
        if (evt.keyCode === 13) {
            search(evt.shiftKey);
        }
    }

    const closeFilter = function () {
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

    const openPicker = function (defaultSearchValue) {
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

        searchField.focus(true);

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
        let dirty = false;

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

    const cancelDelayedSearch = function () {
        if (searchTimeout) {
            clearTimeout(searchTimeout);
            searchTimeout = null;
        }
    };

    const search = function (reverse) {
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
