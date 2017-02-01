editor.once('load', function () {
    'use strict';

    var panel = editor.call('layout.code');

    var cm = editor.call('editor:codemirror');
    var viewIndex = {};
    var focusedView = null;

    var modes = {
        script: 'javascript',
        json: 'javascript',
        html: 'htmlmixed',
        css: 'css',
        shader: 'glsl'
    };

    // when we select an asset
    // if the asset is not loaded hide
    // the code panel until it's loaded
    editor.on('select:asset', function (asset) {
        if (! viewIndex[asset.get('id')]) {
            panel.hidden = true;
        }
    });

    // When document is loaded create codemirror document
    // and add entry to index
    editor.on('documents:load', function (doc, asset) {
        if (viewIndex[doc.name]) return;

        var mode;
        var type = asset.get('type');
        if (modes[type]) {
            mode = modes[type];
        } else {
            mode = 'text';
        }

        var entry = {
            doc: doc,
            type: type,
            asset: asset,
            view: CodeMirror.Doc(doc.getSnapshot(), mode),
            suppressChanges: false
        };

        // emit change
        // use 'beforeChange' event so that
        // we capture the state of the document before it's changed.
        // This is so that we send correct operations to sharejs.
        entry.view.on('beforeChange', function (view, change) {
            if (entry.suppressChanges) return;

            editor.emit('views:change', doc.name, view, change);
        });

        // called after a change has been made
        entry.view.on('change', function (view, change) {
            if (entry.suppressChanges) return;

            editor.emit('views:afterChange', doc.name, view, change);
        });

        viewIndex[doc.name] = entry;
    });

    // Focus document in code mirror
    editor.on('documents:focus', function (id) {
        // unide code panel
        panel.hidden = false;

        if (focusedView && viewIndex[id] === focusedView) {
            var content = focusedView.doc.getSnapshot();
            if (focusedView.view.getValue() === content) {
                return;
            }

            // if the reloaded data are different
            // than the current editor value then reset the contents
            // of the editor - that can happen if a change has been rolled back
            // by sharejs for example
            focusedView.suppressChanges = true;
            focusedView.view.setValue(content);
            focusedView.suppressChanges = false;

            if (! editor.call('documents:isDirty', id))
                focusedView.view.markClean();
        } else {
            focusedView = viewIndex[id];

            // set doc to code mirror
            cm.swapDoc(focusedView.view);

            // change mode options
            if (focusedView.type === 'text') {
                cm.setOption('lineWrapping', true);
                cm.setOption('foldGutter', false);
                cm.setOption('gutters', ['CodeMirror-pc-gutter']);
            } else {
                cm.setOption('lineWrapping', false);
                cm.setOption('foldGutter', true);
                cm.setOption('gutters', ['CodeMirror-lint-markers', 'CodeMirror-foldgutter']);
            }

            if (focusedView.type === 'script') {
                cm.setOption('lint', true);
            } else {
                cm.setOption('lint', false);
            }

            cm.refresh();
        }

        refreshReadonly();

        // focus editor
        cm.focus();

        // reset cursor
        cm.setSelections(focusedView.view.listSelections());
    });



    // Close document
    editor.on('documents:close', function (id) {
        if (focusedView === viewIndex[id]) {

            // clear code
            // but suppress changes to the doc
            // to avoid sending them to sharejs
            focusedView.suppressChanges = true;
            cm.setValue('');
            cm.clearHistory();

            focusedView = null;

            // hide code panel
            panel.hidden = true;
        }

        delete viewIndex[id];

    });

    editor.on('documents:unfocus', function () {
        focusedView = null;
        panel.hidden = true;
    });

    // Get focused document
    editor.call('editor:focusedView', function () {
        return focusedView;
    });

    editor.on('documents:error', function () {
        refreshReadonly();
    });

    editor.method('editor:isReadOnly', function () {
        return ! focusedView ||
               ! editor.call('permissions:write') ||
                 editor.call('errors:hasRealtime') ||
                 editor.call('documents:hasError', focusedView.asset.get('id'));
    });

    var refreshReadonly = function () {
        var readonly = editor.call('editor:isReadOnly');
        var wasReadonly = cm.isReadOnly();
        if (readonly) {
            cm.setOption('readOnly', true);
            cm.setOption('cursorBlinkRate', -1);
        } else {
            cm.setOption('readOnly', false);
            cm.setOption('cursorBlinkRate', 530);
        }

        if (readonly !== wasReadonly)
            editor.emit('editor:readonly:change', readonly);
    };

    // set code editor to readonly if necessary
    editor.on('permissions:writeState', refreshReadonly);

    // Returns the codemirror view for an id
    editor.method('views:get', function (id) {
        var entry = viewIndex[id];
        return entry ? entry.view : null;
    });

});


    // // if there is a line parameter then go to that line
    // var line = config.file.line;
    // var col = config.file.col;
    // if (line) {
    //     codeMirror.setCursor(line - 1, col - 1);

    //     // add error class to the container if there is an error
    //     if (config.file.error) {
    //         element.classList.add('error');

    //         // clear error class when we interact with the editor
    //         var clearError = function () {
    //             element.classList.remove('error');
    //             codeMirror.off('beforeSelectionChange', clearError);
    //         };

    //         codeMirror.on('beforeSelectionChange', clearError);
    //     }
    // }
