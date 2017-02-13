editor.once('load', function () {
    'use strict';

    var filePanelReady = false;
    var queue = {};
    var codePanel = editor.call('layout.code');
    var cm = editor.call('editor:codemirror');

    editor.once('files:load', function () {
        filePanelReady = true;

        for (var id in queue) {
            selectAndHighlight(id, queue[id]);
        }

        queue = {};
    });

    var events = {};

    var selectAndHighlight = function (id, options) {
        if (events[id])
            events[id].unbind();

        editor.call('files:select', id);

        if (! editor.call('views:get', id)) {
            events[id] = editor.once('views:new:' + id, function () {
                delete events[id];
                highlight(id, options || {});
            });
        } else {
            highlight(id, options || {});
        }

    };

    var highlight = function (id, options) {
        var line = options.line || 1;
        var col = options.col || 1;
        var view = editor.call('views:get', id);
        if (! view) return;

        view.setCursor(line - 1, col - 1);

        if (options.error) {
            setTimeout(function () {
                codePanel.class.add('error');
                var clearError = function () {
                    codePanel.class.remove('error');
                    cm.off('beforeSelectionChange', clearError);
                };
                cm.on('beforeSelectionChange', clearError);
                cm.focus();
            });
        } else {
            cm.focus();
        }

        if (options.callback)
            options.callback();
    };

    // Meant to be called by other tabs to select an asset
    // and go to the highlighted lines / column when it's ready
    editor.method('integration:selectWhenReady', function (id, options) {
        if (filePanelReady) {
            selectAndHighlight(id, options);
        } else {
            queue[id] = options;
        }
    });
});