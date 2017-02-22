editor.once('load', function () {
    'use strict';

    var doc = null;
    var cm = editor.call('editor:codemirror');
    var totalMatches = 0;
    var totalFiles = 0;
    var tab = null;
    var codePanel = editor.call('layout.code');

    // options for decorating line numbers
    var lineDecoration = {
        className: 'search-results-line'
    };

    // options for decorating matches
    var matchDecoration = {
        className: 'search-results-match'
    };

    // create new doc and start adding results to it
    editor.on('editor:search:files:start', function () {
        totalMatches = 0;
        totalFiles = 0;

        doc = CodeMirror.Doc('Searching files...');
        cm.swapDoc(doc);

        // open find in files tab
        tab = editor.call('tabs:findInFiles');
    });

    // end of search
    editor.on('editor:search:files:end', function () {
        var str = totalMatches + ' matches';
        if (totalFiles) {
            str += ' across ' + totalFiles + ' files';
        }
        doc.replaceRange('\n\n' + str, CodeMirror.Pos(doc.lastLine()));
    });

    // release mousedown event if we switch documents
    cm.on('swapDoc', function (cm) {
        cm.off('mousedown', onMouseDown);
        if (cm.getDoc() === doc) {
            cm.on('mousedown', onMouseDown);

            // show code
            codePanel.toggleCode(true);
        }
    });

    // check if the focused tab was closed in which case
    // cancel search
    editor.on('tabs:close', function (t) {
        if (tab && tab === t) {
            doc = null;
            editor.call('editor:search:files:cancel');
            tab = null;
        }
    });

    // if we focus on the search tab then
    // show results again
    editor.on('tabs:focus', function (t) {
        if (t === tab && doc) {
            cm.swapDoc(doc);
        }
    });

    var lastMouseDown = null;

    // do a custom double click detection
    // here because codemirror eats the dblclick event
    // depending on where you click
    var onMouseDown = function (e) {
        if (! lastMouseDown) {
            lastMouseDown = Date.now();
            return;
        } else {
            if (Date.now() - lastMouseDown < 300) {
                // double click
                lastMouseDown = null;
                onDblClick(e);
            } else {
                lastMouseDown = Date.now();
            }

        }
    };

    // Open asset on double click
    var onDblClick = function (e) {
        if (!e.state.activeLines || !e.state.activeLines.length)
            return;

        var activeLine = e.state.activeLines[0];
        if (activeLine._assetId) {
            // go to line and column if clicking on a match
            if (activeLine._line !== undefined || activeLine._col !== undefined) {
                editor.call('integration:selectWhenReady', activeLine._assetId, {
                    line: activeLine._line,
                    col: activeLine._col
                });
            } else {
                // if clicking on the asset name then just open the asset
                editor.call('files:select', activeLine._assetId);
            }

            // open the regular find
            setTimeout(function () {
                editor.call('editor:picker:search:open', true); // true for instant change mode to normal find
                cm.focus();
            })
        }
    };

    // Add results to document
    editor.on('editor:search:files:results', function (results, done, total) {
        if (! doc) return;

        var asset = editor.call('assets:get', results.id);
        if (! asset) return;

        // show progress
        var firstLine = doc.firstLine();
        doc.replaceRange((done === total ? 'Searched (' : 'Searching (') + done + ' out of ' + total + ' files)', CodeMirror.Pos(firstLine, 0), CodeMirror.Pos(firstLine, firstLine.length));

        if (! results.matches.length) return;

        totalFiles++;

        // show asset name
        doc.replaceRange('\n\n' + asset.get('name') + ':\n', CodeMirror.Pos(doc.lastLine()));
        doc.addLineClass(doc.lastLine() - 1, 'text', 'search-results-file');
        doc.getLineHandle(doc.lastLine() - 1)._assetId = results.id;

        var len = results.matches.length;

        // find maximum line length so that we
        // can align stuff better
        var lineIndent = ' ';
        var maxLineLength = 1;
        for (var i = 0; i < len; i++) {
            var match = results.matches[i];
            var lineLength = match.line.toString().length;
            if (lineLength > maxLineLength) {
                maxLineLength = lineLength;
            }
        }

        // show all matches
        for (var i = 0; i < len; i++) {
            var match = results.matches[i];

            totalMatches++;

            // indent after line number
            var indent = lineIndent;
            var lineLength = match.line.toString().length;
            if (lineLength < maxLineLength) {
                for (var j = 0; j < maxLineLength - lineLength; j++) {
                    indent += lineIndent;
                }
            }

            // add a new match or use same line if match is on the same line
            if (!i || match.line !== results.matches[i-1].line) {
                doc.replaceRange(
                    (match.line + 1) + ':' + indent + match.text + '\n',
                    CodeMirror.Pos(doc.lastLine())
                );

                // decorate line number
                doc.markText(CodeMirror.Pos(doc.lastLine() - 1, 0), CodeMirror.Pos(doc.lastLine() - 1, lineLength + 1), lineDecoration);

                // hook up match results to the line
                var lineHandle = doc.getLineHandle(doc.lastLine() - 1);
                lineHandle._assetId = results.id;
                lineHandle._line = match.line + 1;
                lineHandle._col = match.char;
            }

            // decorate match
            doc.markText(CodeMirror.Pos(doc.lastLine() - 1, match.char + lineLength + indent.length), CodeMirror.Pos(doc.lastLine() - 1, match.char + match.length + lineLength + indent.length), matchDecoration);
        }

    });
});