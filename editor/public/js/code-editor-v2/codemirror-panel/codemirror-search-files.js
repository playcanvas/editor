editor.once('load', function () {
    'use strict';

    var doc = null;
    var cm = editor.call('editor:codemirror');
    var totalMatches = 0;
    var totalFiles = 0;
    var tab = null;
    var isFocused = false;
    var codePanel = editor.call('layout.code');
    var contextLimit = 128;

    // options for decorating matches
    var matchDecoration = {
        className: 'search-results-match'
    };

    var setDoc = function () {
        cm.setOption('lineWrapping', false);
        cm.setOption('lineNumbers', false);
        cm.setOption('foldGutter', false);
        cm.setOption('gutters', ['CodeMirror-pc-gutter']);
        cm.setOption('lint', false);

        cm.swapDoc(doc);
        setTimeout(function () {
            cm.focus();
        });
    };

    // create new doc and start adding results to it
    editor.on('editor:search:files:start', function () {
        totalMatches = 0;
        totalFiles = 0;

        // if we are already showing results
        // then scroll to the top first (if we try to scroll
        // after it's not gonna work)
        if (doc) {
            doc.setCursor(CodeMirror.Pos(doc.firstLine(), 0));
        }

        doc = CodeMirror.Doc('Searching files...');
        setDoc();

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

    // hide highlighted search results when the user
    // is searching within the results
    editor.on('editor:search:overlay:open', function () {
        cm.getWrapperElement().classList.add('hide-find-in-files');
    });

    editor.on('editor:search:overlay:close', function () {
        cm.getWrapperElement().classList.remove('hide-find-in-files');
    });

    // release mousedown event if we switch documents
    cm.on('swapDoc', function (cm) {
        cm.off('mousedown', onMouseDown);
        if (cm.getDoc() === doc) {
            cm.on('mousedown', onMouseDown);

            // show code
            codePanel.toggleCode(true);

            isFocused = true;

            // deselect files in tree view
            editor.call('files:deselectAll');
        } else {
            cm.setOption('lineNumbers', true);
            isFocused = false;
        }
    });

    // check if the focused tab was closed in which case
    // cancel search
    editor.on('tabs:close', function (t) {
        if (tab && tab === t) {
            doc = null;
            tab = null;
            editor.call('editor:search:files:cancel');

            if (isFocused)
                codePanel.toggleCode(false);
        }
    });

    // if we focus on the search tab then
    // show results again
    editor.on('tabs:focus', function (t) {
        if (t === tab && doc) {
            setDoc();
        }
    });

    var lastMouseDown = null;
    var lastLineClicked = null;

    // do a custom double click detection
    // here because codemirror eats the dblclick event
    // depending on where you click
    var onMouseDown = function (cm, e) {
        var pos = cm.coordsChar({ left: e.clientX, top: e.clientY });
        var line = cm.getLineHandle(pos.line);

        var sameLine = true;
        if (lastLineClicked) {
            sameLine = (lastLineClicked === line);
        }

        lastLineClicked = line;

        if (! lastMouseDown) {
            lastMouseDown = Date.now();

        } else {
            if (Date.now() - lastMouseDown < 300 && sameLine) {
                // double click
                lastMouseDown = null;
                lastLineClicked = null;
                e.preventDefault();
                onDblClick(line);
            } else {
                lastMouseDown = Date.now();
            }

        }
    };

    // Open asset on double click
    var onDblClick = function (line) {
        if (line._assetId) {
            // go to line and column if clicking on a match
            if (line._line !== undefined || line._col !== undefined) {
                editor.call('integration:selectWhenReady', line._assetId, {
                    line: line._line,
                    col: line._col
                });
            } else {
                // if clicking on the asset name then just open the asset
                editor.call('files:select', line._assetId);
            }

            // open the regular find
            setTimeout(function () {
                editor.call('picker:search:open', true); // true for instant change mode to normal find
                cm.focus();
            });
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

        var len = results.matches.length;
        if (! len) return;

        totalFiles++;
        totalMatches += len;

        // show asset name
        doc.replaceRange('\n\n' + asset.get('name') + ':\n', CodeMirror.Pos(doc.lastLine()));
        doc.addLineClass(doc.lastLine() - 1, 'text', 'search-results-file');
        doc.getLineHandle(doc.lastLine() - 1)._assetId = results.id;

        // find maximum line length so that we
        // can align stuff better
        let maxLine = 0;
        for (let i = 0; i < len; i++) {
            const match = results.matches[i];
            if (match.line + 1 > maxLine)
                maxLine = match.line + 1;
        }

        // The next loop goes through each match and tries to
        // only keep text that is up to 'contextLimit' characters around
        // the match. Multiple matches on the same line will be concatenated
        // and if their distance is more than 'contextLimit' they will be separated
        // with dots.
        var space = ' ';
        var previousMatchLine = null;
        var previousEndingDots = null;
        var previousEndPosition = null;
        var i = 0;
        while (i < len) {
            var match = results.matches[i];

            // this match is on a different line than the previous
            // match so reset previous variables
            if (match.line !== previousMatchLine) {
                previousMatchLine = null;
                previousEndingDots = null;
                previousEndPosition = null;
            }

            var textLen = match.text.length;

            // 'from' is the start of the substring
            var from = Math.max(0, match.char - contextLimit);
            // 'to' is the end of the substring
            var to = Math.min(textLen, match.char + match.length + contextLimit);

            // index of last match which belongs to the same 'group' of matches
            // on the same line - meaning matches that are close together
            var end = i;

            for (var j = end + 1; j < len; j++) {
                var nextMatch = results.matches[j];
                if (nextMatch.line === match.line) {
                    var nextFrom = nextMatch.char - contextLimit;
                    // if the next match with context starts before the end
                    // of the previous match then extend the context to include this match
                    if (nextFrom <= to) {
                        to = Math.min(textLen, nextMatch.char + nextMatch.length + contextLimit);
                        end++;
                    } else {
                        break;
                    }
                } else {
                    break;
                }
            }

            // add dots in the beginning
            let addStartingDots = false;
            if (! previousEndingDots) {
                for (let s = 0; s < from; s++) {
                    if (match.text[s] !== space) {
                        addStartingDots = true;
                        break;
                    }
                }
            }

            // add dots to the end
            let addEndingDots = false;
            for (let s = textLen - 1; s > to; s--) {
                if (match.text[s] !== space) {
                    addEndingDots = true;
                }
            }

            // trim spaces from the beginning
            while (match.char > from && match.text[from] === space) {
                from++;
            }

            // trim spaces from the end
            while (match.char + match.length < to && match.text[to - 1] === space) {
                to--;
            }

            // cut text with context
            var text = match.text.substring(from, to);

            // add dots
            if (addStartingDots) {
                text = '...' + text;
                from = Math.max(0, from - 3);
            }

            if (addEndingDots) {
                text += '...';
                to += 3;
            }

            var addNewLine = (end === results.matches.length - 1 || results.matches[end + 1].line !== match.line);
            var lastLine = doc.lastLine();
            var matchStart = 0;

            // if this is a new line then
            // add text on the bottom
            if (previousMatchLine === null) {
                doc.replaceRange(
                    text + (addNewLine ? '\n' : ''),
                    CodeMirror.Pos(doc.lastLine())
                );

                if (addNewLine)
                    lastLine = doc.lastLine() - 1;

                previousEndPosition = to - from;

                // Show line numbers in the gutter
                var lineDiv = document.createElement('div');
                lineDiv.classList.add('CodeMirror-linenumber');
                lineDiv.classList.add('CodeMirror-gutter-elt');
                lineDiv.innerHTML = (match.line + 1).toString();
                cm.setGutterMarker(lastLine, 'CodeMirror-pc-gutter', lineDiv);

                // clicking on line will get us to the
                // first match
                var lineHandle = doc.getLineHandle(lastLine);
                lineHandle._assetId = results.id;
                lineHandle._line = match.line + 1;
                lineHandle._col = match.char + 1;
            } else {
                // this belongs to the same line as the previous batch of matches
                // so append text to the same line
                matchStart = previousEndPosition;
                doc.replaceRange(text + (addNewLine ? '\n' : ''), CodeMirror.Pos(lastLine, previousEndPosition));
                previousEndPosition += to - from;
            }

            // mark matches on text
            for (var j = i; j <= end; j++) {
                match = results.matches[j];

                var matchFrom = match.char - from;

                // decorate match
                doc.markText(
                    CodeMirror.Pos(
                        lastLine,
                        matchStart + matchFrom
                    ),
                    CodeMirror.Pos(
                        lastLine,
                        matchStart + matchFrom + match.length
                    ),
                    matchDecoration
                );
            }

            previousMatchLine = match.line;
            previousEndingDots = addEndingDots;

            // go to next batch of matches
            i = end + 1;
        }
    });
});
