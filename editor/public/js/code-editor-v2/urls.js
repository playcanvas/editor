editor.once('load', function () {
    'use strict';

    var suspendEvents = false;

    // Update url with new tab order
    var updateUrl = function () {
        if (suspendEvents)
            return;

        var tabs = editor.call('tabs:list');
        var str = '';
        var comma = '';
        for (var i = 0, len = tabs.length; i < len; i++) {
            if (tabs[i].asset) {
                str += comma + tabs[i].id;
                comma = ',';
            }
        }

        var url = '/editor/code/' + config.project.id;
        if (str) {
            url += '?tabs=' + str;
        }

        window.history.replaceState('', '', url);
    };

    var timeout;
    var deferredUpdate = function (tab) {
        if (! tab.asset) return;

        clearTimeout(timeout);
        timeout = setTimeout(updateUrl);
    }

    editor.on('tabs:open', deferredUpdate);
    editor.on('tabs:close', deferredUpdate);
    editor.on('tabs:reorder', deferredUpdate);

    var totalTabs = config.tabs.length;
    var openedTabs = 0;

    var onOpen = function () {
        openedTabs++;
        if (openedTabs === totalTabs) {
            suspendEvents = false;
        }
    };

    // Select tabs when ready
    if (config.tabs.length) {
        suspendEvents = true;
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

    }

});