editor.once('load', function () {
    let model = null;
    const monacoEditor = editor.call('editor:monaco');
    let totalMatches = 0;
    let totalFiles = 0;
    let tab = null;
    let previousTabState = null;

    const CONTEXT_LIMIT = 128;
    const SPACE = ' ';

    let lineNumbers = {};
    let clickableRanges = [];
    let onMouseDownEvt;
    let lastMouseDown = null;
    let lastLineClicked = null;

    const codePanel = editor.call('layout.code');

    function onMouseDown(evt) {
        const line = evt.target.range.startLineNumber;

        let sameLine = true;
        if (lastLineClicked) {
            sameLine = (lastLineClicked === line);
        }

        lastLineClicked = line;

        if (!lastMouseDown) {
            lastMouseDown = Date.now();
        } else {
            if (Date.now() - lastMouseDown < 300 && sameLine) {
                // double click
                lastMouseDown = null;
                lastLineClicked = null;
                evt.event.preventDefault();
                onDblClick(evt.target.position);
            } else {
                lastMouseDown = Date.now();
            }

        }
    }

    // Open asset on double click
    function onDblClick(position) {
        for (const clickable of clickableRanges) {
            if (clickable.range.containsPosition(position)) {
                clickable.onDblClick();
                break;
            }
        }
    }

    function onMatchDblClick(assetId, match) {
        // save state in order to restore later
        previousTabState = monacoEditor.saveViewState();

        editor.call('integration:selectWhenReady', assetId, {
            line: match.line + 1,
            col: match.char + 1,
            callback: () => {
                // select match and open native find widget
                monacoEditor.setSelection(new monaco.Range(match.line + 1, match.char + 1, match.line + 1, match.char + 1 + match.length));
                monacoEditor.trigger(null, 'actions.find');
                // focus on document in order to properly save and restore state (scroll, selected line and position, etc)
                editor.emit('documents:focus', assetId);
            }
        });
    }

    function setModel() {
        monacoEditor.updateOptions({
            lineNumbers: originalLineNumber => lineNumbers[originalLineNumber] || '',
            folding: false,
            readOnly: true
        });

        monacoEditor.setModel(model);
        monacoEditor.focus();
        monacoEditor.trigger(null, 'closeFindWidget');

        codePanel.toggleCode(true);

        // deselect files in tree view
        editor.call('files:deselectAll');

        if (!onMouseDownEvt) {
            onMouseDownEvt = monacoEditor.onMouseDown(onMouseDown);
        }
    }

    // create new doc and start adding results to it
    editor.on('editor:search:files:start', function () {
        totalMatches = 0;
        totalFiles = 0;

        lineNumbers = {};
        clickableRanges = [];

        // open find in files tab
        tab = editor.call('tabs:findInFiles');

        model = monaco.editor.createModel('Find in files');
        setModel();
    });

    editor.on('editor:search:openTab', function () {
        if (!tab) {
            editor.emit('editor:search:files:start');
        } else {
            editor.call('tabs:findInFiles');
        }
    });

    // end of search
    editor.on('editor:search:files:end', function () {
        let str = totalMatches + ' matches';
        if (totalFiles) {
            str += ' across ' + totalFiles + ' files';
        }

        const lastLine = model.getLineCount() + 1;
        model.applyEdits([{
            text: '\n\n' + str,
            range: new monaco.Range(lastLine, 1, lastLine, 1)
        }]);
    });

    // check if the focused tab was closed in which case
    // cancel search
    editor.on('tabs:close', (t) => {
        if (tab && tab === t) {
            if (model) {
                model.dispose();
                model = null;
            }

            if (onMouseDownEvt) {
                onMouseDownEvt.dispose();
                onMouseDownEvt = null;
            }

            lineNumbers = {};
            clickableRanges = [];

            tab = null;
            editor.call('editor:search:files:cancel');
            editor.call('picker:search:close');
        }
    });

    // if we focus on the search tab then
    // show results again
    editor.on('tabs:focus', (t) => {
        if (t === tab && model) {
            setModel();
            if (previousTabState) {
                monacoEditor.restoreViewState(previousTabState);
            }
            editor.call('picker:search:open');
        } else {
            if (onMouseDownEvt) {
                onMouseDownEvt.dispose();
                onMouseDownEvt = null;
            }
            editor.call('picker:search:close');
        }
    });

    // Add results to document
    editor.on('editor:search:files:results', (results, done, ignored, total) => {
        if (!model) return;

        const asset = editor.call('assets:get', results.id);
        if (!asset) return;

        // show progress
        model.applyEdits([{
            text: `${total ? 'Searched' : 'Searching'} (${done} out of ${total} searched files; excluded ${ignored} files)`,
            range: new monaco.Range(1, 1, 1, model.getLineMaxColumn(1))
        }]);

        const len = results.matches.length;
        if (!len) return;

        const decorations = [];

        totalFiles++;
        totalMatches += len;

        // show asset name
        model.applyEdits([{
            text: `\n\n${asset.get('name')}:\n`,
            range: new monaco.Range(model.getLineCount() + 1, 1, model.getLineCount() + 1, 1)
        }]);

        // the range where the asset line is clickable
        const assetRange = new monaco.Range(model.getLineCount() - 1, 1, model.getLineCount() - 1, model.getLineMaxColumn(model.getLineCount() - 1));

        // color asset name
        decorations.push({
            range: new monaco.Range(model.getLineCount() - 1, 1, model.getLineCount() - 1, 1),
            options: {
                isWholeLine: true,
                inlineClassName: 'search-results-file'
            }
        });

        // find maximum line length so that we
        // can align stuff better
        let maxLine = 0;
        for (let i = 0; i < len; i++) {
            const match = results.matches[i];
            if (match.line + 1 > maxLine) {
                maxLine = match.line + 1;
            }
        }

        let lineCount = model.getLineCount();
        let newText = "";

        // The next loop goes through each match and tries to
        // only keep text that is up to 'contextLimit' characters around
        // the match. Multiple matches on the same line will be concatenated
        // and if their distance is more than 'contextLimit' they will be separated
        // with dots.
        let i = 0;
        while (i < len) {
            const match = results.matches[i];

            const textLen = match.text.length;

            // 'from' is the start of the substring
            let from = Math.max(0, match.char - CONTEXT_LIMIT);
            // 'to' is the end of the substring
            let to = Math.min(textLen, match.char + match.length + CONTEXT_LIMIT);

            // index of last match which belongs to the same 'group' of matches
            // on the same line - meaning matches that are close together
            let end = i;

            for (let j = end + 1; j < len; j++) {
                const nextMatch = results.matches[j];
                if (nextMatch.line === match.line) {
                    const nextFrom = nextMatch.char - CONTEXT_LIMIT;
                    // if the next match with context starts before the end
                    // of the previous match then extend the context to include this match
                    if (nextFrom <= to) {
                        to = Math.min(textLen, nextMatch.char + nextMatch.length + CONTEXT_LIMIT);
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
            for (let s = 0; s < from; s++) {
                if (match.text[s] !== SPACE) {
                    addStartingDots = true;
                    break;
                }
            }

            // add dots to the end
            let addEndingDots = false;
            for (let s = textLen - 1; s > to; s--) {
                if (match.text[s] !== SPACE) {
                    addEndingDots = true;
                    break;
                }
            }

            // trim spaces from the beginning
            while (match.char > from && match.text[from] === SPACE) {
                from++;
            }

            // trim spaces from the end
            while (match.char + match.length < to && match.text[to - 1] === SPACE) {
                to--;
            }

            // cut text with context
            let text = match.text.substring(from, to);

            // add dots
            if (addStartingDots) {
                text = '...' + text;
                from = Math.max(0, from - 3);
            }

            if (addEndingDots) {
                text += '...';
                to += 3;
            }

            const matchStart = 1;

            // add text on the bottom
            newText += text + '\n';

            // add custom line number
            lineNumbers[lineCount] = (match.line + 1).toString();

            // add asset clickable range so that dbl clicking
            // on asset takes you to the first match
            if (i === 0) {
                clickableRanges.push({
                    range: assetRange,
                    onDblClick: () => onMatchDblClick(asset.get('id'), match)
                });
            }

            // make dbl click take you to match
            clickableRanges.push({
                range: new monaco.Range(lineCount, 1, lineCount, text.length),
                onDblClick: () => onMatchDblClick(asset.get('id'), match)
            });

            // mark matches on text
            for (let j = i; j <= end; j++) {
                const match = results.matches[j];

                const matchFrom = match.char - from;

                // decorate match
                decorations.push({
                    range: new monaco.Range(lineCount, matchStart + matchFrom, lineCount, matchFrom + match.length + 1),
                    options: {
                        inlineClassName: 'search-results-match'
                    }
                });
            }

            // go to next batch of matches
            i = end + 1;

            lineCount++;
        }

        const lc = model.getLineCount();
        const lm = model.getLineMaxColumn(lc);

        model.applyEdits([{
            text: newText,
            range: new monaco.Range(lc, lm, lc, lm)
        }]);
        model.deltaDecorations([], decorations);
    });
});
