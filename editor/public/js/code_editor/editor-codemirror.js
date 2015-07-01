editor.once('load', function () {
    var element = document.getElementById('editor-container');

    // create editor
    var codeMirror = CodeMirror(element, {
        mode: 'javascript',
        indentUnit: 4,
        lineNumbers: true,
        tabIndex: 1,
        autoCloseBrackets: true,
        matchBrackets: true,
        lineComment: true,
        blockComment: true,
        unComment: true,
        continueComments: true,
        lint: true,
        gutters: ["CodeMirror-lint-markers"],
        readOnly: editor.call('editor:isReadonly') ? 'nocursor' : false
    });

    var isLoading = false;
    var code = null;
    var loadedDefinitions = false;

    var init = function () {
        if (!code || !loadedDefinitions)
            return;

        var patchScriptBeforeTern = function (code) {
            // match last occurence of 'return Name' and replace it with
            // new Name(new pc.Entity()); return Name'
            // This is so that the type inference system can deduce that Name.entity
            // is a pc.Entity
            return code.replace(/return(\s+)?(\w+)?(?![\s\S]*return)/, 'new $2(new pc.Entity()); return $2');
        };

        // set up tern
        var server = new CodeMirror.TernServer({
            // add definition JSON's
            defs: [
                editor.call('tern-ecma5'),
                editor.call('tern-browser'),
                editor.call('tern-pc')
            ],
            fileFilter: patchScriptBeforeTern,

            // called when we are about to show the docs for a method
            completionTip: function (data) {
                var div = document.createElement('div');
                div.innerHTML = data.doc;
                return div;
            },

            // called when we are about to show the definition of a type
            typeTip: function (data) {
                var tip = document.createElement('span');
                var type = data.type;
                if (data.url) {
                    var parts = data.url.split('/');
                    type = parts[parts.length-1].replace('.html', '');
                }
                tip.innerHTML = '<span><strong>' + type + '</strong>&nbsp;';
                if (data.url) {
                    tip.innerHTML += '<a href="' + data.url + '" target="_blank">[docs]</a>';
                }

                tip.innerHTML += '</span><br/><p>' + (data.doc || 'Empty description') + '</p>';
                return tip;
            }
        });

        // create key bindings
        codeMirror.setOption("extraKeys", {
            'Ctrl-Space': function (cm) {server.complete(cm);},
            'Ctrl-I':     function (cm) {server.showType(cm);},
            'Cmd-I':     function (cm) {server.showType(cm);},
            'Ctrl-O':     function (cm) {server.showDocs(cm);},
            'Cmd-O':     function (cm) {server.showDocs(cm);},
            'Alt-.':      function (cm) {server.jumpToDef(cm);},
            'Alt-,':      function (cm) {server.jumpBack(cm);},
            'Ctrl-Q':     function (cm) {server.rename(cm);},
            'Ctrl-.':     function (cm) {server.selectName(cm);},
            'Ctrl-S':     function (cm) {editor.call('editor:save');},
            'Cmd-S':     function (cm) {editor.call('editor:save');}
        });

        // update hints on cursor activity
        codeMirror.on("cursorActivity", function(cm) {
            server.updateArgHints(cm);
        });

        // autocomplete on dot
        codeMirror.on("keyup", function (cm, e) {
            if (e.keyCode === 190)
                server.complete(cm);
        });

        isLoading = true;
        codeMirror.setValue(code);
        code = null;

        // if there is a line parameter then go to that line
        var line = config.file.line;
        var col = config.file.col;
        if (line) {
            codeMirror.setCursor(line - 1, col - 1);
        }

        codeMirror.clearHistory();
        codeMirror.markClean();

        codeMirror.focus();

        isLoading = false;
    };

    // wait for tern definitions to be loaded
    editor.on('tern:load', function () {
        loadedDefinitions = true;
        init();
    });

    // load script
    editor.on('editor:loadScript', function (data) {
        code = data;
        init();
    });

    // emit change
    codeMirror.on('change', function () {
        if (isLoading) return;
        editor.emit('editor:change');
    });

    // permissions changed so set readonly
    editor.on('permissions:set:' + config.self.id, function (level) {
        codeMirror.setOption('readOnly', editor.call('editor:isReadonly') ? 'nocursor' : false);
    });

    // return document content
    editor.method('editor:content', function () {
        return codeMirror.getValue();
    });

    // returns true if document is dirty
    editor.method('editor:isDirty', function () {
        return !codeMirror.isClean();
    });

    // mark document as clean
    editor.on('editor:save:success', function () {
        codeMirror.markClean();
    });

    // fired when the user tries to leave the current page
    window.onbeforeunload = function (event) {
        var message;

        if (editor.call('editor:canSave')) {
            message = 'You have unsaved changes. Are you sure you want to leave?';
            event.returnValue = message;
        }

        return message;
    };
});