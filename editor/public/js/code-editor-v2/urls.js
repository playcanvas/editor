editor.once('load', function () {
    'use strict';

    var suspendEvents = false;

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

    var totalTabs = config.tabs.length;
    var openedTabs = 0;

    var onOpen = function () {
        openedTabs++;
        if (openedTabs === totalTabs) {
            suspendEvents = false;
        }
    };

    suspendEvents = true;

    // Select tabs when ready
    for (var i = 0, len = config.tabs.length; i < len; i++) {
        var options = {
            callback: onOpen
        };

        if (i === len - 1) {
            // if this is the last tab then also focus line / col
            options.line = config.file.line;
            options.col = config.file.col;
            options.error = config.file.error;
        }

        editor.call('integration:selectWhenReady', config.tabs[i], options);
    }
});