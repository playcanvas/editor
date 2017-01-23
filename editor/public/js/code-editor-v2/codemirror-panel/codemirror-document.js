editor.once('load', function () {
    'use strict';

    var cm = editor.call('editor:codemirror');
    var documentIndex = {};
    var focusedDocument = null;
    var suppressEvents = false;

    var modes = {
        script: 'javascript',
        json: 'javascript',
        html: 'htmlmixed',
        css: 'css',
        shader: 'glsl'
    };

    // When document is loaded create codemirror document
    // and add entry to index
    editor.on('document:load', function (doc, asset) {
        var mode;
        var type = asset.get('type');
        if (modes[type]) {
            mode = modes[type];
        } else {
            mode = 'text';
        }

        documentIndex[doc.name] = {
            doc: doc,
            type: type,
            asset: asset,
            view: CodeMirror.Doc(doc.getSnapshot(), mode)
        };
    });

    // Focus document in code mirror
    editor.on('document:focus', function (doc) {
        if (focusedDocument.doc === doc) return;

        focusedDocument = documentIndex[doc.name];

        cm.swapDoc(focusedDocument.view);

        if (focusedDocument.type === 'text') {
            cm.setOption('lineWrapping', true);
            cm.setOption('foldGutter', false);
            cm.setOption('gutters', ['CodeMirror-pc-gutter']);
        } else {
            cm.setOption('lineWrapping', false);
            cm.setOption('foldGutter', true);
            cm.setOption('gutters', ['CodeMirror-lint-markers', 'CodeMirror-foldgutter']);
        }

        if (focusedDocument.type === 'script') {
            cm.setOption('lint', true);
        } else {
            cm.setOption('lint', false);
        }

        cm.focus();
    });

    // Get focused document
    editor.call('editor:focusedDocument', function () {
        return focusedDocument;
    })

    // returns true if focused document is dirty
    editor.method('editor:isDirty', function () {
        if (! focusedDocument) return false;

        return !codeMirror.isClean() || editor.call('document:isDirty', focusedDocument.doc);
    });


    // emit change
    // use 'beforeChange' event so that
    // we capture the state of the document before it's changed.
    // This is so that we send correct operations to sharejs.
    cm.on('beforeChange', function (cm, change) {
        if (suppressEvents) return;
        editor.emit('editor:change', cm, change);
    });

    // called after a change has been made
    cm.on('change', function (cm, change) {
        if (suppressEvents) return;
        editor.emit('editor:afterChange', cm, change);
    });

    // // permissions changed so set readonly
    // editor.on('permissions:set:' + config.self.id, function (level) {
    //     toggleReadOnly(editor.call('editor:isReadonly'));
    // });

    // set code editor to readonly if necessary
    editor.on('permissions:writeState', function (write) {
        if (write) {
            cm.setOption('readOnly', false);
            cm.setOption('cursorBlinkRate', 530);
        } else {
            cm.setOption('readOnly', true);
            cm.setOption('cursorBlinkRate', -1);
        }


        // // remember state before we make this read only
        // if (readOnly) {
        //     stateBeforeReadOnly = {
        //         scrollInfo: cm.getScrollInfo(),
        //         cursor: cm.getCursor()
        //     };
        // }


        // // if we are enabling write then restore
        // // previous state
        // if (! readOnly && stateBeforeReadOnly) {
        //     var cursorCoords = cm.cursorCoords(stateBeforeReadOnly.cursor, 'local');
        //     cm.setCursor(stateBeforeReadOnly.cursor);

        //     // scroll back to where we were if needed
        //     var scrollInfo = stateBeforeReadOnly.scrollInfo;
        //     if (cursorCoords.top >= scrollInfo.top && cursorCoords.top <= scrollInfo.top + scrollInfo.clientHeight) {
        //         cm.scrollTo(scrollInfo.left, scrollInfo.top);
        //     }
        // }
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



    // editor.on('editor:reloadScript', function (data) {
    //     // if the reloaded data are different
    //     // than the current editor value then reset the contents
    //     // of the editor - that can happen if a change has been rolled back
    //     // by sharejs for example
    //     if (codeMirror.getValue() === data)
    //         return;

    //     var isDirty = editor.call('editor:isDirty');
    //     suppressEvents = true;
    //     code = data;
    //     codeMirror.setValue(code);

    //     if (!isDirty)
    //         codeMirror.markClean();

    //     suppressEvents = false;

    // });


});