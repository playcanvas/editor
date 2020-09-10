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
        scrollPastEnd: true,

        readOnly: editor.call('editor:isReadonly') ? true : false,

        /* match - highlighter */
        highlightSelectionMatches: {
            delay: 0,
            wordsOnly: true
        },

        // auto complete
        hintOptions: {
            completeSingle: false,
            completeOnSingleClick: false
        }
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
    }

    if (!config.asset || config.asset.type === 'script') {
        options.lint = true;
        options.gutters = ["CodeMirror-lint-markers", "CodeMirror-foldgutter"];

        // folding
        options.foldOptions = {
            widget: '\u2026'
        }
        options.foldGutter = true;
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
        if (code === null)
            return;

        var extraKeys;

        if (config.asset) {
            extraKeys = {
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
            };
        }

        if (! config.asset || config.asset.type === 'script') {
            if (! loadedDefinitions)
                return;

            var patchScriptBeforeTern = function (code) {
                // match last occurence of 'return Name' and replace it with
                // new Name(new pc.Entity()); return Name'
                // This is so that the type inference system can deduce that Name.entity
                // is a pc.Entity
                code = code.replace(/return(\s+)?(\w+)?(?![\s\S]*return)/, 'new $2(new pc.Entity()); return $2');

                // turn this:
                // var MyScript = pc.createScript('myScript');
                // into this:
                // var MyScript = ScriptType
                code = code.replace(/var (\w+).*?=.*?pc.createScript\(.*?\)/g, 'var $1 = pc.ScriptType');

                return code;

            };

            var server;

            // set up tern
            try {
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

                // update hints on cursor activity
                codeMirror.on("cursorActivity", function(cm) {
                    server.updateArgHints(cm);
                });

                // autocomplete
                var completeTimeout = null;
                var doComplete = function () {
                    server.complete(codeMirror);
                };

                var wordChar = /\w/;
                var shouldComplete = function (e) {
                    // auto complete on '.' or word chars
                    return !e.ctrlKey && !e.altKey && !e.metaKey && (e.keyCode === 190 || (e.key.length === 1 && wordChar.test(e.key)));
                }

                // auto complete on keydown after a bit
                // so that we have the chance to cancel autocompletion
                // if a non-word character was inserted (e.g. a semicolon).
                // Otherwise we might quickly type semicolon and get completions
                // afterwards (because it's async) and that's not what we want.
                codeMirror.on("keydown", function (cm, e) {
                    var complete = shouldComplete(e);
                    if (! complete && completeTimeout) {
                        clearTimeout(completeTimeout);
                        completeTimeout = null;
                    } else if (complete) {
                        completeTimeout = setTimeout(doComplete, 150);
                    }
                });

                extraKeys = extraKeys || {};

                extraKeys['Ctrl-Space'] = function (cm) {server.complete(cm);};
                extraKeys['Ctrl-O'] = function (cm) {server.showDocs(cm);};
                extraKeys['Cmd-O'] = function (cm) {server.showDocs(cm);};
                extraKeys['Alt-.'] = function (cm) {server.jumpToDef(cm);};
                extraKeys['Alt-,'] = function (cm) {server.jumpBack(cm);};
                extraKeys['Ctrl-Q'] = function (cm) {server.rename(cm);};
                extraKeys['Ctrl-.'] = function (cm) {server.selectName(cm);};
            } catch (ex) {
                console.error('Could not initialize auto complete');
                log.error(ex);
            }
        }

        extraKeys = extraKeys || {};

        extraKeys['Ctrl-S'] = function (cm) {editor.call('editor:save');};
        extraKeys['Cmd-S'] = function (cm) {editor.call('editor:save');};
        extraKeys['Tab'] = function(cm) {
            if (cm.somethingSelected()) {
                cm.indentSelection("add");
            } else {
                cm.execCommand('insertSoftTab');
            }
        };

        extraKeys['Esc'] = function (cm) {cm.execCommand('clearSearch'); cm.setSelection(cm.getCursor("anchor"), cm.getCursor("anchor"));};
        extraKeys["Shift-Tab"] = "indentLess";
        extraKeys['Ctrl-/'] = 'toggleComment';
        extraKeys['Cmd-/'] = 'toggleComment';

        extraKeys['Ctrl-I'] = 'indentAuto';
        extraKeys['Cmd-I'] = 'indentAuto';

        extraKeys['Alt-Up'] = function (cm) {cm.execCommand('goLineUp'); cm.execCommand('goLineEnd');};
        extraKeys['Alt-Down'] = function (cm) {cm.execCommand('goLineDown'); cm.execCommand('goLineEnd');};

        // create key bindings
        codeMirror.setOption("extraKeys", CodeMirror.normalizeKeyMap(extraKeys));

        isLoading = true;
        codeMirror.setValue(code);
        code = null;

        // if there is a line parameter then go to that line
        var line = config.file.line;
        var col = config.file.col;
        if (line) {
            codeMirror.setCursor(line - 1, col - 1);

            // add error class to the container if there is an error
            if (config.file.error) {
                element.classList.add('error');

                // clear error class when we interact with the editor
                var clearError = function () {
                    element.classList.remove('error');
                    codeMirror.off('beforeSelectionChange', clearError);
                };

                codeMirror.on('beforeSelectionChange', clearError);
            }
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

    editor.on('editor:reloadScript', function (data) {
        // if the reloaded data are different
        // than the current editor value then reset the contents
        // of the editor - that can happen if a change has been rolled back
        // by sharedb for example
        if (codeMirror.getValue() === data)
            return;

        var isDirty = editor.call('editor:isDirty');
        isLoading = true;
        code = data;
        codeMirror.setValue(code);

        if (!isDirty)
            codeMirror.markClean();

        isLoading = false;

    });

    // emit change
    // use 'beforeChange' event so that
    // we capture the state of the document before it's changed.
    // This is so that we send correct operations to sharedb.
    codeMirror.on('beforeChange', function (cm, change) {
        if (isLoading) return;
        editor.emit('editor:change', cm, change);
    });

    // called after a change has been made
    codeMirror.on('change', function (cm, change) {
        if (isLoading) return;
        editor.emit('editor:afterChange', cm, change);
    });

    var stateBeforeReadOnly = null;

    var toggleReadOnly = function (readOnly) {
        var cm = codeMirror;

        // remember state before we make this read only
        if (readOnly) {
            stateBeforeReadOnly = {
                scrollInfo: cm.getScrollInfo(),
                cursor: cm.getCursor()
            };
        }

        codeMirror.setOption('readOnly', readOnly ? true : false);
        codeMirror.setOption('cursorBlinkRate', readOnly ? -1 : 530);

        // if we are enabling write then restore
        // previous state
        if (! readOnly && stateBeforeReadOnly) {
            var cursorCoords = cm.cursorCoords(stateBeforeReadOnly.cursor, 'local');
            cm.setCursor(stateBeforeReadOnly.cursor);

            // scroll back to where we were if needed
            var scrollInfo = stateBeforeReadOnly.scrollInfo;
            if (cursorCoords.top >= scrollInfo.top && cursorCoords.top <= scrollInfo.top + scrollInfo.clientHeight) {
                cm.scrollTo(scrollInfo.left, scrollInfo.top);
            }
        }
    };

    // permissions changed so set readonly
    editor.on('permissions:set:' + config.self.id, function (level) {
        toggleReadOnly(editor.call('editor:isReadonly'));
    });

    // set readonly if writeState becomes false (like when we're disconnected from sharedb)
    editor.on('permissions:writeState', function (state) {
        toggleReadOnly(!state);
    });

    // return document content
    editor.method('editor:content', function () {
        return codeMirror.getValue();
    });

    // returns true if document is dirty
    editor.method('editor:isDirty', function () {
        return !codeMirror.isClean() || editor.call('document:isDirty');
    });

    // mark document as clean
    editor.on('editor:save:end', function () {
        codeMirror.markClean();
    });

    // fired when the user tries to leave the current page
    if (! config.asset) {
        window.onbeforeunload = function (event) {
            var message;

            editor.emit('editor:beforeQuit');

            if (editor.call('editor:canSave')) {
                message = 'You have unsaved changes. Are you sure you want to leave?';
                event.returnValue = message;
            }

            return message;
        };
    }

});
