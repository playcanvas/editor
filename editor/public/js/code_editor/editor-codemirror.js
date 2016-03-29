editor.once('load', function () {
    'use strict';

    var element = document.getElementById('editor-container');

    // create editor
    var options = {
        mode: 'javascript',
        tabIndex: 1,
        autoCloseBrackets: true,
        matchBrackets: true,
        lineComment: true,
        blockComment: true,
        indentUnit: 4,
        unComment: true,
        continueComments: true,
        styleActiveLine: true,
        readOnly: editor.call('editor:isReadonly') ? true : false
    };

    if (config.asset) {
        if (config.asset.type === 'script') {
            options.mode = 'javascript';
        } else if (config.asset.type === 'html') {
            options.mode = 'htmlmixed';
        } else if (config.asset.type === 'css') {
            options.mode = 'css';
        } else if (config.asset.type === 'json') {
            options.mode = 'javascript';
        } else if (config.asset.type === 'shader') {
            options.mode = 'glsl';
        } else {
            options.mode = 'text';
            options.lineWrapping = true;
        }

        options.gutters = ["CodeMirror-pc-gutter"];
    } else {
        options.lint = true;
        options.gutters = ["CodeMirror-lint-markers"];
    }

    options.lineNumbers = true;

    if (options.readOnly) {
        options.cursorBlinkRate = -1; // hide cursor
    }

    var codeMirror = CodeMirror(element, options);

    editor.method('editor:codemirror', function () {
        return codeMirror;
    });

    var isLoading = false;
    var code = null;
    var loadedDefinitions = false;

    var init = function () {
        if (config.asset) {
            initAsset();
        } else {
            initScript();
        }
    };

    var initScript = function () {
        if (code === null || !loadedDefinitions)
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
                if (data.doc) {
                    var div = document.createElement('div');
                    div.innerHTML = data.doc;
                    return div;
                } else {
                    return null;
                }
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
                    tip.innerHTML += '<a class="link-docs" href="' + data.url + '" target="_blank">View docs</a>';
                }

                tip.innerHTML += '</span><br/><p>' + (data.doc || 'Empty description') + '</p>';
                return tip;
            }
        });

        // create key bindings
        codeMirror.setOption("extraKeys", {
            'Ctrl-Space': function (cm) {server.complete(cm);},
            'Ctrl-I': function (cm) {server.showType(cm);},
            'Cmd-I': function (cm) {server.showType(cm);},
            'Ctrl-O': function (cm) {server.showDocs(cm);},
            'Cmd-O': function (cm) {server.showDocs(cm);},
            'Alt-.': function (cm) {server.jumpToDef(cm);},
            'Alt-,': function (cm) {server.jumpBack(cm);},
            'Ctrl-Q': function (cm) {server.rename(cm);},
            'Ctrl-.': function (cm) {server.selectName(cm);},
            'Ctrl-S': function (cm) {editor.call('editor:save');},
            'Cmd-S': function (cm) {editor.call('editor:save');},
            'Esc': 'clearSearch',
            'Tab': function(cm) {
                if (cm.somethingSelected()) {
                    cm.indentSelection("add");
                } else {
                    var spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
                    cm.replaceSelection(spaces);
                }
            },
            "Shift-Tab": "indentLess",
            'Ctrl-/': 'toggleComment',
            'Cmd-/': 'toggleComment'
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

    var initAsset = function () {
        if (code === null)
            return;

        // create key bindings
        codeMirror.setOption("extraKeys", {
            'Ctrl-S': function (cm) {editor.call('editor:save');},
            'Cmd-S': function (cm) {editor.call('editor:save');},
            'Esc': 'clearSearch',
            'Tab': function(cm) {
                if (cm.somethingSelected()) {
                    cm.indentSelection("add");
                } else {
                    var spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
                    cm.replaceSelection(spaces);
                }
            },
            "Shift-Tab": "indentLess",
            'Ctrl-/': 'toggleComment',
            'Cmd-/': 'toggleComment',
            'Ctrl-Z': function (cm) {
                editor.call('editor:undo');
            },
            'Cmd-Z': function (cm) {
                editor.call('editor:undo');
            },
            'Shift-Ctrl-Z': function (cm) {
                editor.call('editor:redo');
            },
            'Ctrl-Y': function (cm) {
                editor.call('editor:redo');
            },
            'Shift-Cmd-Z': function (cm) {
                editor.call('editor:redo');
            },
            'Cmd-Y': function (cm) {
                editor.call('editor:redo');
            }
        });

        isLoading = true;
        codeMirror.setValue(code);
        code = null;

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

    editor.on('editor:reloadScript', function (data) {
        var isDirty = editor.call('editor:isDirty');

        isLoading = true;
        codeMirror.setValue(code);

        if (!isDirty)
            codeMirror.markClean();
    });

    // emit change
    // use 'beforeChange' event so that
    // we capture the state of the document before it's changed.
    // This is so that we send correct operations to sharejs.
    codeMirror.on('beforeChange', function (cm, change) {
        if (isLoading) return;
        editor.emit('editor:change', cm, change);
    });

    // permissions changed so set readonly
    editor.on('permissions:set:' + config.self.id, function (level) {
        var readOnly = editor.call('editor:isReadonly');
        codeMirror.setOption('readOnly', readOnly ? true : false);
        codeMirror.setOption('cursorBlinkRate', readOnly ? -1 : 530);
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

        editor.emit('editor:beforeQuit');

        if (editor.call('editor:canSave')) {
            message = 'You have unsaved changes. Are you sure you want to leave?';
            event.returnValue = message;
        }

        return message;
    };
});
