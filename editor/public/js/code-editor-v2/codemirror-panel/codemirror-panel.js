editor.once('load', function () {
    'use strict';

    var panel = editor.call('layout.code');
    panel.toggleCode = function (toggle) {
        if (toggle) {
            cm.getWrapperElement().classList.remove('invisible');
        } else {
            cm.getWrapperElement().classList.add('invisible');
        }
    }

    var element = panel.innerElement;
    var cm = null;
    var tern = null;

    var settings = editor.call('editor:settings');

    // create editor
    var options = {
        mode: 'javascript',
        tabIndex: 1,
        autoCloseBrackets: settings.get('autoCloseBrackets'),
        matchBrackets: settings.get('highlightBrackets'),
        lineComment: true,
        blockComment: true,
        indentUnit: 4,
        unComment: true,
        continueComments: settings.get('continueComments'),
        styleActiveLine: true,
        scrollPastEnd: true,
        keyMap: 'sublime',

        readOnly: true,
        cursorBlinkRate: -1,

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

    var mac = navigator.userAgent.indexOf('Mac OS X') !== -1;

    options.extraKeys['Esc'] = function (cm) {
        var selections = cm.listSelections();

        if (cm.somethingSelected()) {
            // Reset selections for each cursor
            cm.setSelections(selections.map(function (selection) {
                return {
                    anchor: selection.anchor,
                    head: selection.anchor
                }
            }));
        } else {
            if (selections.length > 1) {
                // clear multiple cursors
                cm.setCursor(selections[0].anchor);
            } else {
                // clear search
                cm.execCommand('clearSearch');
            }
        }
    };

    options.extraKeys['Ctrl-Z'] = function (cm) { editor.call('editor:command:undo');};
    options.extraKeys['Shift-Ctrl-Z'] = function (cm) { editor.call('editor:command:redo');};
    options.extraKeys['Ctrl-Y'] = function (cm) { editor.call('editor:command:redo');};
    options.extraKeys['Ctrl-S'] = function (cm) {editor.call('editor:command:save');};
    options.extraKeys['Tab'] = function(cm) {editor.call('editor:command:indent');};
    options.extraKeys['Shift-Tab'] = function(cm) {editor.call('editor:command:unindent');};
    options.extraKeys['Ctrl-I'] = function(cm) {editor.call('editor:command:autoindent');};
    options.extraKeys['Ctrl-/'] = function(cm) {editor.call('editor:command:toggleComment');};
    options.extraKeys['Ctrl-K Ctrl-J'] = function(cm) {editor.call('editor:command:unfoldAll');};
    options.extraKeys['Shift-Enter'] = 'newlineAndIndent';

    options.extraKeys['Ctrl-F'] = function (cm) {editor.call('editor:command:find');};
    options.extraKeys['Shift-Ctrl-F'] = function (cm) {editor.call('editor:command:findInFiles');};
    options.extraKeys['Ctrl-D'] = function (cm) {editor.call('editor:command:selectNextOccurrence');};

    options.extraKeys['Ctrl-K Ctrl-Space'] = function (cm) {editor.call('editor:command:setMark');};
    options.extraKeys['Ctrl-K Ctrl-A'] = function (cm) {editor.call('editor:command:selectToMark');};
    options.extraKeys['Ctrl-K Ctrl-Backspace'] = function (cm) {editor.call('editor:command:deleteToMark');};
    options.extraKeys['Ctrl-K Ctrl-X'] = function (cm) {editor.call('editor:command:swapMark');};
    options.extraKeys['Ctrl-K Ctrl-G'] = function (cm) {editor.call('editor:command:clearMark');};
    options.extraKeys['Ctrl-K Ctrl-Y'] = function (cm) {editor.call('editor:command:yank');};

    options.extraKeys['Alt-Up'] = function (cm) {cm.execCommand('goLineUp'); cm.execCommand('goLineEnd');};
    options.extraKeys['Alt-Down'] = function (cm) {cm.execCommand('goLineDown'); cm.execCommand('goLineEnd');};

    // auto complete keys
    options.extraKeys['Ctrl-Space'] = function (cm) {isTernEnabled() && tern.complete(cm);};
    options.extraKeys['Ctrl-O'] = function (cm) {isTernEnabled() && tern.showDocs(cm);};
    options.extraKeys['Alt-.'] = function (cm) {isTernEnabled() && tern.jumpToDef(cm);};
    options.extraKeys['Alt-,'] = function (cm) {isTernEnabled() && tern.jumpBack(cm);};
    options.extraKeys['Ctrl-Q'] = function (cm) {isTernEnabled() && tern.rename(cm);};
    options.extraKeys['Ctrl-.'] = function (cm) {isTernEnabled() && tern.selectName(cm);};

    if (mac) {
        options.extraKeys['Cmd-Z'] = function (cm) { editor.call('editor:command:undo');};
        options.extraKeys['Shift-Cmd-Z'] = function (cm) { editor.call('editor:command:redo');};
        options.extraKeys['Cmd-Y'] = function (cm) { editor.call('editor:command:redo');};
        options.extraKeys['Cmd-S'] = function (cm) {editor.call('editor:command:save');};
        options.extraKeys['Cmd-I'] = function(cm) {editor.call('editor:command:autoindent');};
        options.extraKeys['Cmd-/'] = function(cm) {editor.call('editor:command:toggleComment');};
        options.extraKeys['Alt-Cmd-/'] = function(cm) {editor.call('editor:command:toggleBlockComment');};
        options.extraKeys['Alt-Ctrl-['] = function(cm) {editor.call('editor:command:fold');};
        options.extraKeys['Alt-Ctrl-]'] = function(cm) {editor.call('editor:command:unfold');};
        options.extraKeys['Cmd-K Cmd-J'] = function(cm) {editor.call('editor:command:unfoldAll');};
        options.extraKeys['Cmd-Backspace'] = function (cm) {editor.call('editor:command:deleteBeginning');};
        options.extraKeys['Cmd-O'] = function (cm) {isTernEnabled() && tern.showDocs(cm);};

        options.extraKeys['Cmd-F'] = function (cm) {editor.call('editor:command:find');};
        options.extraKeys['Shift-Cmd-F'] = function (cm) {editor.call('editor:command:findInFiles');};
        options.extraKeys['Cmd-G'] = function (cm) {editor.call('editor:command:findNext');};
        options.extraKeys['Shift-Cmd-G'] = function (cm) {editor.call('editor:command:findPrevious');};
        options.extraKeys['Ctrl-H'] = function (cm) {}; // nothing
        options.extraKeys['Alt-Cmd-F'] = function (cm) {editor.call('editor:command:replace');};
        options.extraKeys['Alt-Cmd-E'] = function (cm) {editor.call('editor:command:replaceNext');};
        options.extraKeys['Cmd-D'] = function (cm) {editor.call('editor:command:selectNextOccurrence');};
        options.extraKeys['Alt-Cmd-G'] = function (cm) {editor.call('editor:command:findUnder');};
        options.extraKeys['Ctrl-Cmd-G'] = function (cm) {editor.call('editor:command:findAllUnder');};

    } else {
        options.extraKeys['Shift-Ctrl-/'] = function(cm) {editor.call('editor:command:toggleBlockComment');};
        options.extraKeys['Shift-Ctrl-['] = function(cm) {editor.call('editor:command:fold');};
        options.extraKeys['Shift-Ctrl-]'] = function(cm) {editor.call('editor:command:unfold');};
        options.extraKeys['Ctrl-Shift-Backspace'] = function (cm) {editor.call('editor:command:deleteBeginning');};

        options.extraKeys['F3'] = function (cm) {editor.call('editor:command:findNext');};
        options.extraKeys['Shift-F3'] = function (cm) {editor.call('editor:command:findPrevious');};
        options.extraKeys['Ctrl-H'] = function (cm) {editor.call('editor:command:replace');};
        options.extraKeys['Shift-Ctrl-H'] = function (cm) {editor.call('editor:command:replaceNext');};
        options.extraKeys['Ctrl-F3'] = function (cm) {editor.call('editor:command:findUnder');};
        options.extraKeys['Alt-F3'] = function (cm) {editor.call('editor:command:findAllUnder');};
    }

    options.extraKeys = CodeMirror.normalizeKeyMap(options.extraKeys);

    // create code mirror
    cm = CodeMirror(element, options);

    cm.getWrapperElement().style.fontSize = settings.get('fontSize') + 'px';

    // subscribe to settings changes
    settings.on('fontSize:set', function (value) {
        cm.getWrapperElement().style.fontSize = value + 'px';
    });

    settings.on('continueComments:set', function (value) {
        cm.setOption('continueComments', !!value);
    });

    settings.on('autoCloseBrackets:set', function (value) {
        cm.setOption('autoCloseBrackets', !!value);
    });

    settings.on('highlightBrackets:set', function (value) {
        cm.setOption('matchBrackets', !!value);
    });

    // hide initially
    panel.toggleCode(false);

    // expose
    editor.method('editor:codemirror', function () {
        return cm;
    });

    var isTernEnabled = function () {
        if (! tern || cm.isReadOnly())
            return false;

        var focused = editor.call('documents:getFocused');
        if (! focused) return false;

        var asset = editor.call('assets:get', focused);
        if (! asset || asset.get('type') !== 'script') return false;

        return true;
    };

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
                    // match last occurrence of 'return Name' and replace it with
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

            // close arg hints when we swap docs
            cm.on('swapDoc', function () {
                if (cm.state.completionActive)
                    cm.state.completionActive.close();

                tern.updateArgHints(cm);
            });

            // autocomplete
            var completeTimeout = null;
            var doComplete = function () {
                tern.complete(cm);
            };

            var wordChar = /\w/;
            var shouldComplete = function (e) {
                if (! isTernEnabled())
                    return false;

                // auto complete on '.' or word chars
                return !e.ctrlKey && !e.altKey && !e.metaKey && (e.keyCode === 190 || (e.key && e.key.length === 1 && wordChar.test(e.key)));
            };

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
