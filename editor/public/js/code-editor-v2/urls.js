editor.once('load', function () {
    'use strict';

    var suspendEvents = false;

    // When assets are loaded open tabs as specified
    // in query parameters
    editor.once('files:load', function () {
        suspendEvents = true;
        for (var i = 0; i < config.tabs.length; i++) {
            editor.call('files:select', config.tabs[i]);
        }
        suspendEvents = false;

        // if only one tab then set set cursor
        if (config.tabs.length === 1) {
            selectLineCol();
        }
    });

    // Set line and column and also add error class
    // if necessary
    var selectLineCol = function () {
        if (config.file.line === undefined && config.file.col === undefined)
            return;

        var line = config.file.line || 1;
        var col = config.file.col || 1;
        var cm = editor.call('editor:codemirror');

        setTimeout(function () {
            cm.setCursor(line - 1, col - 1);
            cm.focus();

            if (config.file.error) {
                var codePanel = editor.call('layout.code');
                codePanel.class.add('error');
                var clearError = function () {
                    codePanel.class.remove('error');
                    cm.off('beforeSelectionChange', clearError);
                };
                cm.on('beforeSelectionChange', clearError);
            }
        });
    };


    // Update url with new tab order
    var updateUrl = function () {
        if (suspendEvents)
            return;

        var tabs = editor.call('tabs:list').map(function (tab) {return tab.asset.get('id');}).join(',');
        var url = '/editor/code/' + config.project.id;
        if (tabs) {
            url += '?tabs=' + tabs;
        }

        window.history.replaceState('', '', url);
    };

    editor.on('tabs:open', updateUrl);
    editor.on('tabs:close', updateUrl);
    editor.on('tabs:reorder', updateUrl);

});