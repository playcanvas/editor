editor.once('load', function () {
    let filePanelReady = false;
    const queue = [];
    const monacoEditor = editor.call('editor:monaco');

    const events = {};

    const highlight = function (id, options) {
        const line = options.line || 1;
        const col = options.col || 1;
        const view = editor.call('views:get', id);
        if (!view) return;

        setTimeout(function () {
            if (view !== editor.call('editor:focusedView')) return;

            const pos = new monaco.Position(line, col);
            monacoEditor.setPosition(pos);

            monacoEditor.revealRangeInCenterIfOutsideViewport(
                monaco.Range.fromPositions(pos, pos),
                monaco.editor.ScrollType.Immediate
            );

            if (options.error) {
                const settings = editor.call('editor:settings');
                monaco.editor.setTheme(`${settings.get('ide.theme')}-error`);

                let evtCursorChanged = monacoEditor.onDidChangeCursorPosition(() => {
                    monaco.editor.setTheme(settings.get('ide.theme'));

                    evtCursorChanged.dispose();
                    evtCursorChanged = null;
                });
            }

            monacoEditor.focus();

            if (options.callback)
                options.callback();
        });
    };

    const selectAndHighlight = function (id, options) {
        if (events[id])
            events[id].unbind();

        options = options || {};

        // if asset does not exist exit early
        if (!editor.call('assets:get', id)) {
            return options.callback && options.callback();
        }

        // select id
        editor.call('files:select', id);
        // make sure each new selection goes in a new tab
        editor.call('tabs:temp:stick');

        if (!editor.call('views:get', id)) {
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

        for (let i = 0, len = queue.length; i < len; i++) {
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
            for (let i = 0, len = queue.length; i < len; i++) {
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
