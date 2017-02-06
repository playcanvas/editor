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

    codePanel.on('show', function () {
        panel.hidden = false;
    });

    codePanel.on('hide', function () {
        panel.hidden = true;
    });

    panel.class.add('animate-height');
    codePanel.class.add('animate-height');

    var optionRegex = new ui.Button({
        text: '.*'
    });
    optionRegex.class.add('option');
    panel.append(optionRegex);

    var optionCase = new ui.Button({
        text: 'Aa'
    });
    optionCase.class.add('option');
    panel.append(optionCase);

    var optionWholeWords = new ui.Button({
        text: '“ ”'
    });
    optionWholeWords.class.add('option');
    panel.append(optionWholeWords);

    var searchField = new ui.TextField();
    searchField.class.add('search');
    searchField.renderChanges = false;
    searchField.keyChange = true;
    searchField.elementInput.placeholder = 'Find';
    panel.append(searchField);

    var error = new ui.Label();
    error.class.add('error');
    error.hidden = true;
    searchField.element.append(error.element);

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

    var replaceField = new ui.TextField();
    replaceField.class.add('replace');
    replaceField.renderChanges = false;
    replaceField.keyChange = true;
    replaceField.elementInput.placeholder = 'Replace';
    replaceField.hidden = !editor.call('permissions:write');
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
    btnReplace.hidden = !editor.call('permissions:write');
    panel.append(btnReplace);

    var btnReplaceAll = new ui.Button({
        text: 'Replace All'
    });
    btnReplaceAll.hidden = !editor.call('permissions:write');
    panel.append(btnReplaceAll);

    var regexp = null;
    var caseSensitive = false;
    var isRegex = false;
    var matchWholeWords = false;
    var queryDirty = false;
    var previousText = '';

    var open = false;
    var suspendChangeEvt = false;

    // Returns the picker panel
    editor.method('editor:picker:search', function () {
        return panel;
    });

    // Open and focus search picker
    editor.method('editor:picker:search:open', function () {
        if (! open) {
            open = true;
            panel.style.height = '';
            codePanel.style.height = 'calc(100% - 64px)';
            editor.emit('editor:picker:search:open');
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
    });

    // Close picker and focus editor
    editor.method('editor:picker:search:close', function () {
        if (! open) return;

        open = false;
        panel.style.height = '0px';
        codePanel.style.height = 'calc(100% - 32px)';

        // clear search too
        cm.execCommand('clearSearch');

        cm.focus();

        editor.emit('editor:picker:search:close');
    });

    // Open and focus replace picker
    editor.method('editor:picker:replace:open', function () {
        editor.call('editor:picker:search:open');
        replaceField.focus();
    })

    // Esc hotkey
    editor.call('hotkey:register', 'search-close', {
        key: 'esc',
        callback: function (e) {
            if (open) {
                editor.call('editor:picker:search:close');
            }
        }
    });

    // Return search regex
    editor.method('editor:picker:search:regex', function () {
        return regexp;
    });

    // Return replace string
    editor.method('editor:picker:replace:text', function () {
        return replaceField.value;
    });

    // Set search term externally.
    editor.method('editor:picker:search:set', function (text, options) {
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

        editor.emit('editor:picker:search:change', regexp);
    };

    var search = function (reverse) {
        if (queryDirty) {
            queryDirty = false;
            cm.execCommand('clearSearch');
        }

        if (reverse) {
            cm.execCommand('findPrev');
        } else {
            cm.execCommand('findNext');
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
            search();
        }
    });

    // option buttons
    optionRegex.on('click', function () {
        isRegex = !isRegex;
        updateQuery();
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
});