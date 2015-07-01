editor.once('load', function () {

    var isReadonly = function () {
        return !editor.call('permissions:write') || config.project.repositories.current !== 'directory';
    };

    // initialize ace
    var aceEditor = ace.edit("editor-container");
    aceEditor.setTheme("ace/theme/playcanvas");
    aceEditor.setShowPrintMargin(false);
    aceEditor.getSession().setMode("ace/mode/javascript");
    aceEditor.setReadOnly(isReadonly());

    var customSnippets = editor.call('editor:ace:snippets');

    // load custom snippets
    ace.config.loadModule('ace/ext/language_tools', function () {
        aceEditor.setOptions({
            enableBasicAutocompletion: true,
            enableSnippets: true
        });

        var snippetManager = ace.require("ace/snippets").snippetManager;
        var config = ace.require("ace/config");

        ace.config.loadModule("ace/snippets/javascript", function(m) {
            if (m) {
                snippetManager.files.javascript = m;
                m.snippets = snippetManager.parseSnippetFile(m.snippetText);
                customSnippets.forEach(function (s) { m.snippets.push(s); });
                snippetManager.register(m.snippets, m.scope);
            }
        });
    });

    // Add save command/keyboard shortcut
    aceEditor.commands.addCommand({
        name: 'save',
        bindKey: {
            win: 'Ctrl-S',
            mac: 'Command-S'
        },
        exec: function () {
            editor.call('editor:save');
        }
    });

    // remap ctrl+, / cmd+, to do nothing
    // instead of showing the settings
    aceEditor.commands.addCommand({
        name: 'settings',
        bindKey: {
            win: 'Ctrl-,',
            mac: 'Command-,'
        },
        exec: function () {
        }
    });

    editor.on('editor:loadScript', function (content) {
        // do not fire change handler when
        // we set the source file ourselves
        aceEditor.off('change');
        // set the source file to the editor
        aceEditor.getSession().setValue(content);

        aceEditor.focus();

        // if there is a line parameter then go to that line
        var line = config.file.line;
        var col = config.file.col;
        if (line) {
            aceEditor.navigateTo(line - 1, col - 1);
        }

        // set a 'change' handler in order to mark the document as dirty
        // when it changes
        aceEditor.on('change', function () {
            editor.emit('editor:change');
        });
    });

    editor.on('permissions:set:' + config.self.id, function (level) {
        aceEditor.setReadOnly(isReadonly());
    });

    // get content
    editor.method('editor:content', function () {
        return aceEditor.getValue();
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