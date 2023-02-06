editor.once('load', function () {
    const panel = editor.call('layout.code');

    const monacoEditor = editor.call('editor:monaco');
    const viewIndex = {};
    let focusedView = null;

    const modes = {
        script: 'javascript',
        json: 'json',
        html: 'html',
        css: 'css',
        shader: 'glsl'
    };

    function refreshReadonly() {
        const readonly = editor.call('editor:isReadOnly');
        const wasReadonly = monacoEditor.getOption('readOnly');
        monacoEditor.updateOptions({ readOnly: readonly });

        if (readonly !== wasReadonly)
            editor.emit('editor:readonly:change', readonly);
    }

    // when we select an asset
    // if the asset is not loaded hide
    // the code panel until it's loaded
    editor.on('select:asset', function (asset) {
        if (asset.get('type') === 'folder') return;

        if (!viewIndex[asset.get('id')]) {
            panel.toggleCode(false);
        }
    });

    // When document is loaded create document
    // and add entry to index
    editor.on('documents:load', function (doc, asset) {
        const id = asset.get('id');
        if (viewIndex[id]) return;

        let mode;
        const type = asset.get('type');
        if (modes[type]) {
            mode = modes[type];
        } else {
            mode = null;
        }

        const entry = {
            doc: doc,
            type: type,
            asset: asset,
            view: monaco.editor.createModel(doc.data, mode),
            suppressChanges: false,
            viewState: null
        };

        // emit change event
        entry.view.onDidChangeContent((evt) => {
            if (entry.suppressChanges) return;

            editor.emit('views:change', id, entry.view, evt);
        });

        viewIndex[id] = entry;

        editor.emit('views:new', id, entry.view, type);
        editor.emit('views:new:' + id, entry.view, type);
    });

    // Focus document
    editor.on('documents:focus', function (id) {
        if (!viewIndex[id]) {
            // This happens on some rare occasions not sure why yet...
            console.warn('Requested to focus document that has no view yet', 'Document ' + id);
            return;
        }
        // unhide code
        panel.toggleCode(true);

        // remember view state for the current view
        // so we can restore it after switching back to it
        if (focusedView) {
            focusedView.viewState = monacoEditor.saveViewState();
        }

        if (focusedView && viewIndex[id] === focusedView) {
            const content = focusedView.doc.data;
            if (focusedView.view.getValue() === content) {
                return;
            }

            // if the reloaded data are different
            // than the current editor value then reset the contents
            // of the editor - that can happen if a change has been rolled back
            // by sharedb for example
            focusedView.suppressChanges = true;
            focusedView.view.setValue(content);
            focusedView.suppressChanges = false;

        } else {
            focusedView = viewIndex[id];

            // set doc to monaco
            monacoEditor.setModel(focusedView.view);

            const options = {
                lineNumbers: true
            };

            // change mode options
            if (focusedView.type === 'text') {
                options.folding = false;
            } else {
                options.folding = true;
            }

            monacoEditor.updateOptions(options);

            // only allow linting for script assets
            monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
                noSemanticValidation: true,
                noSyntaxValidation: (focusedView.type !== 'script')
            });
        }

        refreshReadonly();

        // focus editor
        setTimeout(function () {
            monacoEditor.focus();

            // restore state
            if (focusedView.viewState) {
                monacoEditor.restoreViewState(focusedView.viewState);
            }
        });
    });

    // Close document
    editor.on('documents:close', function (id) {
        if (focusedView === viewIndex[id]) {

            // clear code
            // but suppress changes to the doc
            // to avoid sending them to sharedb
            focusedView.suppressChanges = true;
            monacoEditor.setValue('');

            panel.toggleCode(false);

            focusedView = null;
        }

        const entry = viewIndex[id];
        if (entry && entry.view) {
            entry.view.dispose();
        }

        delete viewIndex[id];

    });

    // unfocus
    editor.on('documents:unfocus', function () {
        // remember view state for the current view
        // so we can restore it after switching back to it
        if (focusedView) {
            focusedView.viewState = monacoEditor.saveViewState();
        }

        focusedView = null;
    });

    // Get focused document
    editor.method('editor:focusedView', function () {
        return focusedView && focusedView.view;
    });

    editor.on('documents:error', function () {
        refreshReadonly();
    });

    editor.method('editor:isReadOnly', function () {
        return !focusedView ||
               !editor.call('permissions:write') ||
                 editor.call('errors:hasRealtime') ||
                 editor.call('documents:hasError', focusedView.asset.get('id'));
    });

    // set code editor to readonly if necessary
    editor.on('permissions:writeState', refreshReadonly);

    // Returns the monaco view for an id
    editor.method('views:get', function (id) {
        const entry = viewIndex[id];
        return entry ? entry.view : null;
    });
});
