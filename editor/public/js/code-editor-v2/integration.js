editor.once('load', function () {
    'use strict';

    var filePanelReady = false;
    var queue = [];
    var codePanel = editor.call('layout.code');
    var cm = editor.call('editor:codemirror');

    var events = {};

    var highlight = function (id, options) {
        var line = options.line || 1;
        var col = options.col || 1;
        var view = editor.call('views:get', id);
        if (! view) return;

        setTimeout(function () {
            view.setCursor(line - 1, col - 1);

            if (options.error) {
                codePanel.class.add('error');
                var clearError = function () {
                    codePanel.class.remove('error');
                    cm.off('beforeSelectionChange', clearError);
                };
                cm.on('beforeSelectionChange', clearError);
            }

            cm.scrollIntoView(null, document.body.clientHeight / 2);
            cm.focus();
        });

        if (options.callback)
            options.callback();
    };

    var selectAndHighlight = function (id, options) {
        if (events[id])
            events[id].unbind();

        options = options || {};

        // if asset does not exist exit early
        if (! editor.call('assets:get', id)) {
            return options.callback && options.callback();
        }

        // select id
        editor.call('files:select', id);
        // make sure each new selection goes in a new tab
        editor.call('tabs:temp:stick');

        if (! editor.call('views:get', id)) {
            events[id] = editor.once('views:new:' + id, function () {
                delete events[id];
                highlight(id, options || {});
            });
        } else {
            highlight(id, options || {});
        }
    };

    editor.once('files:load', function () {
        filePanelReady = true;

        for (var i = 0, len = queue.length; i < len; i++) {
            selectAndHighlight(queue[i].id, queue[i].options);
        }

        queue.length = 0;
    });

    // Meant to be called by other tabs to select an asset
    // and go to the highlighted lines / column when it's ready
    editor.method('integration:selectWhenReady', function (id, options) {
        if (filePanelReady) {
            selectAndHighlight(id, options);
        } else {
            for (var i = 0, len = queue.length; i < len; i++) {
                if (queue[i].id === id) {
                    queue.splice(i, 1);
                    break;
                }
            }

            queue.push({
                id: id,
                options: options
            });
        }
    });
});
