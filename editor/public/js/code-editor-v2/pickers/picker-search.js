editor.once('load', function () {
    'use strict';

    var parent = editor.call('layout.center');
    var codePanel = editor.call('layout.code');
    var cm = editor.call('editor:codemirror');

    var panel = new ui.Panel();
    panel.flex = true;
    panel.class.add('picker-search');
    panel.style.height = '0px';
    panel.hidden = true;
    parent.append(panel);

    panel.class.add('animate-height');
    codePanel.class.add('animate-height');

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
    searchField.elementInput.placeholder = 'Find';
    // prevent default behaviour on browser shortcuts
    searchField.elementInput.classList.add('hotkeys');
    panel.append(searchField);

    var error = new ui.Label();
    error.class.add('error');
    error.hidden = true;
    searchField.element.appendChild(error.element);

    var btnFindPrev = new ui.Button({
        'text': '&#57698;'
    });
    btnFindPrev.class.add('icon');
    btnFindPrev.element.tabIndex = -1;
    panel.append(btnFindPrev);

    var btnFindNext = new ui.Button({
        'text': '&#57700;'
    });
    btnFindNext.class.add('icon');
    btnFindNext.element.tabIndex = -1;
    panel.append(btnFindNext);

    var btnFindInFiles = new ui.Button({
        'text': 'Find'
    });
    btnFindInFiles.element.tabIndex = -1;
    panel.append(btnFindInFiles);

    var replaceField = new ui.TextField();
    replaceField.class.add('replace');
    replaceField.renderChanges = false;
    replaceField.keyChange = true;
    replaceField.elementInput.placeholder = 'Replace';
    replaceField.elementInput.classList.add('hotkeys');
    panel.append(replaceField);

    replaceField.on('input:focus', function () {
        replaceField.class.add('focused');
    });

    replaceField.on('input:blur', function () {
        replaceField.class.remove('focused');
    });

    var btnReplace = new ui.Button({
        text: 'Replace'
    });
    btnReplace.element.tabIndex = -1;
    panel.append(btnReplace);

    var btnReplaceAll = new ui.Button({
        text: 'Replace All'
    });
    btnReplaceAll.element.tabIndex = -1;
    panel.append(btnReplaceAll);

    // Tooltips
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

    Tooltip.attach({
        target: btnFindPrev.element,
        text: 'Find Previous',
        align: 'bottom',
        root: editor.call('layout.root')
    });

    Tooltip.attach({
        target: btnFindNext.element,
        text: 'Find Next',
        align: 'bottom',
        root: editor.call('layout.root')
    });

    Tooltip.attach({
        target: replaceField.element,
        text: 'Use $0-9 to insert the text of capturing groups.',
        align: 'bottom',
        root: editor.call('layout.root')
    });


    var regexp = null;
    var caseSensitive = false;
    var isRegex = false;
    var matchWholeWords = false;
    var queryDirty = false;
    var previousText = '';

    var open = false;
    var findInFiles = false;
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

    var toggleFindInFilesMode = function (toggle) {
        findInFiles = toggle;
        if (findInFiles) {
            searchField.elementInput.placeholder = 'Find in files';
            replaceField.hidden = true;
            btnReplace.hidden = true;
            btnReplaceAll.hidden = true;
            btnFindNext.hidden = true;
            btnFindPrev.hidden = true;
            btnFindInFiles.hidden = false;
        } else {
            searchField.elementInput.placeholder = 'Find';
            replaceField.hidden = false;
            btnReplace.hidden = false;
            btnReplaceAll.hidden = false;
            btnFindNext.hidden = false;
            btnFindPrev.hidden = false;
            btnFindInFiles.hidden = true;
        }
    };

    toggleFindInFilesMode(false);

    var onTransitionEnd;

    panel.element.addEventListener('transitionend', function (e) {
        if (onTransitionEnd) {
            onTransitionEnd();
            onTransitionEnd = null;
        }
    });

    var openPicker = function () {
        if (! open) {
            open = true;
            panel.hidden = false;
            growPicker();
            if (findInFiles) {
                editor.emit('picker:search:files:open');
            } else {
                editor.emit('picker:search:open');
            }
        }

        // set search field to selected text in the editor
        // if there is any otherwise keep existing search field value
        if (cm.somethingSelected()) {
            var from = cm.getCursor('from');
            var to = cm.getCursor('to');
            suspendChangeEvt = true;
            searchField.value = cm.getRange(from, to);
            suspendChangeEvt = false;
        }

        searchField.elementInput.select();
        searchField.elementInput.focus();

        updateQuery();

    };

    // Open and focus search picker
    editor.method('picker:search:open', function (instantToggleMode) {
        onTransitionEnd = null;

        if (findInFiles) {
            if (open && !instantToggleMode) {
                onTransitionEnd = function () {
                    open = false;
                    editor.emit('picker:search:files:close');
                    toggleFindInFilesMode(false);
                    openPicker();
                };
                if (panel.style.height !== '0px') {
                    shrinkPicker();
                } else {
                    onTransitionEnd();
                }
            } else {
                if (open) {
                    open = false;
                    editor.emit('picker:search:files:close');
                }

                toggleFindInFilesMode(false);
                openPicker();
            }
        } else {
            openPicker();
        }
    });

    // Make this work in find-in-files mode
    editor.method('picker:search:files:open', function (instantToggleMode) {
        onTransitionEnd = null;

        if (! findInFiles) {
            if (open && !instantToggleMode) {
                onTransitionEnd = function () {
                    open = false;
                    editor.emit('picker:search:close');
                    toggleFindInFilesMode(true);
                    openPicker();
                };
                if (panel.style.height !== '0px') {
                    shrinkPicker();
                } else {
                    onTransitionEnd();
                }
            } else {
                if (open) {
                    open = false;
                    editor.emit('picker:search:close');
                }
                onTransitionEnd = null;
                toggleFindInFilesMode(true);
                openPicker();
            }
        } else {
            onTransitionEnd = null;
            openPicker();
        }
    });

    // Close picker and focus editor
    editor.method('picker:search:close', function () {
        onTransitionEnd = null;
        if (! open) return;

        onTransitionEnd = function () {
            panel.hidden = true;
        };

        open = false;
        shrinkPicker();

        // clear search too
        cm.execCommand('clearSearch');

        cm.focus();

        if (findInFiles) {
            editor.emit('picker:search:files:close');
        } else {
            editor.emit('picker:search:close');
        }
    });

    // Open and focus replace picker
    editor.method('picker:replace:open', function () {
        editor.call('picker:search:open');
        replaceField.focus();
    })

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

    // Return replace string
    editor.method('picker:replace:text', function () {
        return replaceField.value;
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
            updateQuery(options);
        }
    });

    // Updates our regular expression.
    // Optionally pass override options for the regexp
    var updateQuery = function (overrides) {
        queryDirty = true;

        var pattern = searchField.value;
        previousText = pattern;
        if (! pattern) {
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
            console.error(e);
            regexp = null;
            error.text = 'Invalid Regular Expression';
            error.hidden = false;
        }

        if (! findInFiles) {
            editor.emit('picker:search:change', regexp);
        }
    };

    var search = function (reverse) {
        if (queryDirty) {
            queryDirty = false;
            cm.execCommand('clearSearch');
        }

        if (findInFiles) {
            if (regexp)
                editor.call('editor:search:files', regexp);
        } else {
            if (reverse) {
                cm.execCommand('findPrev');
            } else {
                cm.execCommand('findNext');
            }
        }


        if (open)
            searchField.focus();
    };

    // execute search
    searchField.elementInput.addEventListener('keydown', function (e) {
        if (e.keyCode === 13) {
            search(e.shiftKey);
        }
    });

    searchField.on('change', function (value) {
        if (suspendChangeEvt) return;

        if (previousText !== value) {
            updateQuery();

            if (! findInFiles)
                search();
        }
    });

    // option buttons
    optionRegex.on('click', function () {
        isRegex = !isRegex;
        updateQuery();

        if (! findInFiles)
            search();

        if (isRegex) {
            optionRegex.class.add('toggled');
        } else {
            optionRegex.class.remove('toggled');
        }
    });

    optionCase.on('click', function () {
        caseSensitive = !caseSensitive;
        updateQuery();

        if (! findInFiles)
            search();

        if (caseSensitive) {
            optionCase.class.add('toggled');
        } else {
            optionCase.class.remove('toggled');
        }
    });

    optionWholeWords.on('click', function () {
        matchWholeWords = !matchWholeWords;
        updateQuery();

        if (! findInFiles)
            search();

        if (matchWholeWords) {
            optionWholeWords.class.add('toggled');
        } else {
            optionWholeWords.class.remove('toggled');
        }
    });

    // search buttons
    btnFindPrev.on('click', function () {
        search(true);
    });

    btnFindNext.on('click', function () {
        search();
    });

    btnFindInFiles.on('click', function () {
        search();
    });

    // replace buttons
    btnReplace.on('click', function () {
        cm.execCommand('replace');
    });

    btnReplaceAll.on('click', function () {
        cm.execCommand('replaceAll');
        cm.focus();
    });

    // replace field
    replaceField.elementInput.addEventListener('keydown', function (e) {
        if (e.keyCode === 13) {
            if (e.shiftKey) {
                cm.execCommand('replacePrev');
            } else {
                cm.execCommand('replace');
            }
            replaceField.focus();
        }
    });

    // permissions
    var refreshPermissions = function () {
        replaceField.hidden = !editor.call('permissions:write');
        btnReplace.hidden = !editor.call('permissions:write');
        btnReplaceAll.hidden = !editor.call('permissions:write');
    };

    refreshPermissions();

    editor.on('permissions:set', refreshPermissions);
});
