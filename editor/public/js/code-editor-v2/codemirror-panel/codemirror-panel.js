editor.once('load', function () {
    'use strict';

    var panel = editor.call('layout.code');

    var element = panel.innerElement;
    var cm = null;
    var tern = null;

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
        keyMap: 'sublime',

        readOnly: true,
        cursorBlinkRate: -1,

        /* match - highlighter */
        highlightSelectionMatches: {
            delay: 0,
            wordsOnly: true
        },

        // auto complete
        hintOptions: {
            completeSingle: false,
            completeOnSingleClick: false
        },

        gutters: ['CodeMirror-pc-gutter'],

        // folding
        foldOptions: {
            widget: '\u2026'
        },

        lineNumbers: true,
    };

    // set up key bindings
    options.extraKeys = {};

    options.extraKeys['Ctrl-Z'] = function (cm) { editor.call('editor:command:undo');};
    options.extraKeys['Cmd-Z'] = function (cm) { editor.call('editor:command:undo');};
    options.extraKeys['Shift-Ctrl-Z'] = function (cm) { editor.call('editor:command:redo');};
    options.extraKeys['Shift-Cmd-Z'] = function (cm) { editor.call('editor:command:redo');};
    options.extraKeys['Ctrl-Y'] = function (cm) { editor.call('editor:command:redo');};
    options.extraKeys['Cmd-Y'] = function (cm) { editor.call('editor:command:redo');};
    options.extraKeys['Ctrl-S'] = function (cm) {editor.call('editor:command:save');};
    options.extraKeys['Cmd-S'] = function (cm) {editor.call('editor:command:save');};
    options.extraKeys['Tab'] = function(cm) {editor.call('editor:command:indent');};
    options.extraKeys['Ctrl-I'] = function(cm) {editor.call('editor:command:autoindent');};
    options.extraKeys['Cmd-I'] = function(cm) {editor.call('editor:command:autoindent');};
    options.extraKeys['Ctrl-/'] = function(cm) {editor.call('editor:command:toggleComment');};
    options.extraKeys['Cmd-/'] = function(cm) {editor.call('editor:command:toggleComment');};

    options.extraKeys['Esc'] = function (cm) {cm.execCommand('clearSearch'); cm.setSelection(cm.getCursor("anchor"), cm.getCursor("anchor"));};


    options.extraKeys['Alt-Up'] = function (cm) {cm.execCommand('goLineUp'); cm.execCommand('goLineEnd');};
    options.extraKeys['Alt-Down'] = function (cm) {cm.execCommand('goLineDown'); cm.execCommand('goLineEnd');};

    // auto complete keys
    options.extraKeys['Ctrl-Space'] = function (cm) {tern && tern.complete(cm);};
    options.extraKeys['Ctrl-O'] = function (cm) {tern && tern.showDocs(cm);};
    options.extraKeys['Cmd-O'] = function (cm) {tern && tern.showDocs(cm);};
    options.extraKeys['Alt-.'] = function (cm) {tern && tern.jumpToDef(cm);};
    options.extraKeys['Alt-,'] = function (cm) {tern && tern.jumpBack(cm);};
    options.extraKeys['Ctrl-Q'] = function (cm) {tern && tern.rename(cm);};
    options.extraKeys['Ctrl-.'] = function (cm) {tern && tern.selectName(cm);};

    options.extraKeys = CodeMirror.normalizeKeyMap(options.extraKeys);



    // create code mirror
    cm = CodeMirror(element, options);

    // expose
    editor.method('editor:codemirror', function () {
        return cm;
    });

    // wait for tern definitions to be loaded
    editor.on('tern:load', function () {
        // set up tern
        try {
            tern = new CodeMirror.TernServer({
                // add definition JSON's
                defs: [
                    editor.call('tern-ecma5'),
                    editor.call('tern-browser'),
                    editor.call('tern-pc')
                ],

                // replace code before sending it to tern
                fileFilter: function (code) {
                    // match last occurence of 'return Name' and replace it with
                    // new Name(new pc.Entity()); return Name'
                    // This is so that the type inference system can deduce that Name.entity
                    // is a pc.Entity
                    code = code.replace(/return(\s+)?(\w+)?(?![\s\S]*return)/, 'new $2(new pc.Entity()); return $2');

                    // turn this:
                    // var MyScript = pc.createScript('myScript');
                    // into this:
                    // var MyScript = ScriptType
                    code = code.replace(/var (\w+).*?=.*?pc.createScript\(.*?\)/g, 'var $1 = ScriptType');

                    return code;

                },

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
            // if we are editing a script
            cm.on("cursorActivity", function(cm) {
                var focused = editor.call('documents:getFocused');
                if (! focused) return;

                var asset = editor.call('assets:get', focused);
                if (asset && asset.get('type') === 'script') {
                    tern.updateArgHints(cm);
                }
            });

            // autocomplete
            var completeTimeout = null;
            var doComplete = function () {
                tern.complete(cm);
            };

            var wordChar = /\w/;
            var shouldComplete = function (e) {
                if (cm.isReadOnly())
                    return false;

                var focused = editor.call('documents:getFocused');
                if (! focused) return false;

                var asset = editor.call('assets:get', focused);
                if (! asset || asset.get('type') !== 'script') return false;

                // auto complete on '.' or word chars
                return !e.ctrlKey && !e.altKey && !e.metaKey && (e.keyCode === 190 || (e.key.length === 1 && wordChar.test(e.key)));
            }

            // auto complete on keydown after a bit
            // so that we have the chance to cancel autocompletion
            // if a non-word character was inserted (e.g. a semicolon).
            // Otherwise we might quickly type semicolon and get completions
            // afterwards (because it's async) and that's not what we want.
            cm.on("keydown", function (cm, e) {
                var complete = shouldComplete(e);
                if (! complete && completeTimeout) {
                    clearTimeout(completeTimeout);
                    completeTimeout = null;
                } else if (complete) {
                    completeTimeout = setTimeout(doComplete, 150);
                }
            });

        } catch (ex) {
            editor.call('status:error', 'Could not initialize auto-complete');
            console.error(ex);
        }
    });

});