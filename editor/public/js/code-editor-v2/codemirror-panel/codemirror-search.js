editor.once('load', function () {
    'use strict';

    // the overlay highlights the results
    var overlay = null;
    // where to start searching
    var originalFrom = null;
    var posFrom = null;
    var posTo = null;
    // the current regular expression used for searching
    var regex = null;
    var className = 'searching';

    var isPickerOpen = false;

    var previousSelection = null;

    var cm = editor.call('editor:codemirror');

    var resetSearchPositions = function (pos) {
        originalFrom = pos || cm.getCursor();
        posFrom = originalFrom;
        posTo = originalFrom;
    };

    // When the user changes their cursor position
    // update our internal positions
    var onCursorActivity = function () {
        resetSearchPositions();

        if (! isPickerOpen) {
            hideSearchOverlay();
        }
    };

    // When the user changes cursor positions update where we start
    // searching from
    cm.on('cursorActivity', onCursorActivity);

    editor.on('picker:search:open', function () {
        isPickerOpen = true;
        resetSearchPositions();
        showSearchOverlay();
    });

    editor.on('picker:search:close', function () {
        isPickerOpen = false;
        resetSearchPositions();
    });

    // Either performs clean search or finds next/prev occurrence
    var doSearch = function (reverse, addToSelection) {
        // if we have a regex and the overlay is being displayed
        // then find next / prev
        if (regex && overlay) {
            // Move each position to either the start
            // or the end of the current selection depending
            // on whether we are searching forward or reverse
            if (reverse) {
                posFrom = cm.getCursor('from');
            } else {
                posTo = cm.getCursor('to');
            }

            cm.off('cursorActivity', onCursorActivity);
            cm.operation(function () {
                findNext(reverse, addToSelection);
            });
            cm.on('cursorActivity', onCursorActivity);
        }
        // either we don't have a regex or the overlay is closed
        // so perform a clean search
        else {
            regex = editor.call('picker:search:regex');
            if(! regex)
                return;

            cm.operation(function () {
                // we don't want any cursor changes to affect our positions
                cm.off('cursorActivity', onCursorActivity);

                // hide overlay and let findNext
                // re-enable it
                hideSearchOverlay();

                // reset positions to original
                // and restart findNext
                posFrom = originalFrom;
                posTo = originalFrom;

                findNext(reverse, addToSelection);

                // re-scan for cursor changes
                cm.on('cursorActivity', onCursorActivity);
           });
        }
    };

    var showSearchOverlay = function () {
        var newRegex = editor.call('picker:search:regex');
        if (regex === newRegex) return;

        hideSearchOverlay();

        regex = newRegex;

        if (regex) {
            overlay = editor.call('editor:codemirror:overlay', regex, className);
            cm.addOverlay(overlay);

            editor.emit('editor:search:overlay:open');
        }
    };

    // Hide existing search overlay
    var hideSearchOverlay = function () {
        regex = null;

        if (overlay) {
            cm.removeOverlay(overlay);
            overlay = null;
            editor.emit('editor:search:overlay:close');
        }
    };

    // Find next occurrence of our regex and select
    // the match
    var findNext = function (reverse, addToSelection) {
        if (! overlay)
            showSearchOverlay();

        var cursor = cm.getSearchCursor(regex, reverse ? posFrom : posTo, regex.ignoreCase);
        if (! cursor.find(reverse)) {
            cursor = cm.getSearchCursor(regex, reverse ? CodeMirror.Pos(cm.lastLine()) : CodeMirror.Pos(cm.firstLine(), 0), regex.ignoreCase);
            if (! cursor.find(reverse))
                return;
        }

        posFrom = cursor.from();
        posTo = cursor.to();

        if (addToSelection) {
            cm.addSelection(posFrom, posTo);
        } else {
            cm.setSelection(posFrom, posTo);
        }
        cm.scrollIntoView({from: posFrom, to: posTo}, 20);
        return cursor;
    };

    // Returns {from: Pos, to: Pos, text: string, newSelection: bool}.
    // If the cursor has no selection returns the word under it.
    // If the cursor has a selection returns that instead.
    var getUnderCursor = function () {
        var from = cm.getCursor('from');
        var to = cm.getCursor('to');
        var text = '';
        var newSelection = false;

        if (CodeMirror.cmpPos(from, to) === 0) {
            // get word at cursor
            var start = from.ch;
            var end = start;
            var line = cm.getLine(from.line);

            while (start && CodeMirror.isWordChar(line.charAt(start - 1))) --start;
            while (end < line.length && CodeMirror.isWordChar(line.charAt(end))) ++end;

            from = CodeMirror.Pos(from.line, start);
            to = CodeMirror.Pos(from.line, end);
            text = line.slice(start, end);
            newSelection = true;
        } else {
            text = cm.getRange(from, to);
        }

        if (! text)
            return null;

        return {
            from: from,
            to: to,
            text: text,
            newSelection: newSelection
        };
    };


    // Register codemirror commands
    CodeMirror.commands.clearSearch = hideSearchOverlay;

    CodeMirror.commands.viewSearch = showSearchOverlay;

    CodeMirror.commands.find = function (cm) {
        hideSearchOverlay();
        return doSearch();
    };

    CodeMirror.commands.findNext = function (cm) {
        return doSearch();
    };

    CodeMirror.commands.findPrev = function (cm) {
        return doSearch(true);
    };

    // Find next occurrence of text under cursor and add to selection.
    // If no text is selected then select the word under the cursor.
    CodeMirror.commands.selectNextOccurrence = function (cm) {
        var underCursor = getUnderCursor();
        if (! underCursor)
            return;

        var fullWord = previousSelection === cm.doc.sel;

        if (underCursor.newSelection) {
            resetSearchPositions(underCursor.from);
            fullWord = true;
        }

        editor.call('picker:search:set', underCursor.text, {isRegex: false, matchWholeWords: fullWord});

        cm.off('cursorActivity', onCursorActivity);
        cm.operation(function () {
            findNext(false, true);
        });
        cm.on('cursorActivity', onCursorActivity);

        if (fullWord)
            previousSelection = cm.doc.sel;
    };

    // Find next occurrence of selection and select that instead.
    // If no selection then select word under cursor and then select next occurrence.
    CodeMirror.commands.findUnder = function (cm) {
        var underCursor = getUnderCursor();
        if (! underCursor)
            return;

        var fullWord = previousSelection === cm.doc.sel;

        if (underCursor.newSelection) {
            fullWord = true;
            resetSearchPositions(underCursor.to);
        }

        editor.call('picker:search:set', underCursor.text, {isRegex: false, matchWholeWords: fullWord});

        cm.off('cursorActivity', onCursorActivity);
        cm.operation(function () {
            findNext();
        });
        cm.on('cursorActivity', onCursorActivity);

        if (fullWord)
            previousSelection = cm.doc.sel;
    };

    // Same as findUnder but for previous
    CodeMirror.commands.findUnderPrevious = function (cm) {
        var underCursor = getUnderCursor();
        if (! underCursor)
            return;

        var fullWord = previousSelection === cm.doc.sel;

        if (underCursor.newSelection) {
            fullWord = true;
            resetSearchPositions(underCursor.from);
        }

        editor.call('picker:search:set', underCursor.text, {isRegex: false, matchWholeWords: fullWord});

        cm.off('cursorActivity', onCursorActivity);
        cm.operation(function () {
            findNext(true);
        });
        cm.on('cursorActivity', onCursorActivity);

        if (fullWord)
            previousSelection = cm.doc.sel;
    };

    // Select all occurrences of current selection.
    // If no selection then select word under cursor first
    // and then select all occurrences of that
    CodeMirror.commands.findAllUnder = function (cm) {
        var underCursor = getUnderCursor();
        if (! underCursor)
            return;

        if (underCursor.newSelection) {
            resetSearchPositions(underCursor.from);
        }

        // only do full words with this - won't work in all cases like if you select non-word characters
        // but that's also kinda how sublime works.
        editor.call('picker:search:set', underCursor.text, {isRegex: false, matchWholeWords: true});

        var cursor = cm.getSearchCursor(regex);
        var matches = [];
        var primaryIndex = -1;
        while (cursor.findNext()) {
            matches.push({anchor: cursor.from(), head: cursor.to()});
            if (cursor.from().line <= underCursor.from.line && cursor.from().ch <= underCursor.from.ch) {
                primaryIndex++;
            }
        }
        cm.setSelections(matches, primaryIndex);
    };


    // Replace next occurrence of regex with text provided in the replace picker.
    // After we replace we select the next occurence.
    var replace = function (reverse) {
        if (cm.getOption("readOnly")) return;

        regex = regex || editor.call('picker:search:regex');
        if (! regex)
            return;

        var text = editor.call('picker:replace:text') || '';

        cm.operation(function () {
            var from = cm.getCursor('from');
            var to = cm.getCursor('to');
            resetSearchPositions(reverse ?  to : from);

            var cursor = findNext(reverse);
            if (cursor) {
                var match = cm.getRange(cursor.from(), cursor.to()).match(regex);
                cursor.replace(text.replace(/\$(\d)/g, function(_, i) {return match[i];}));
                findNext(reverse);
            }

        });

    };

    // Replace next occurrence or current selection if it matches
    CodeMirror.commands.replace = function (cm) {
        replace();
    };

    // Replace previous occurrence or current selection if it matches
    CodeMirror.commands.replacePrev = function (cm) {
        replace(true);
    };

    // Replace all occurrences
    CodeMirror.commands.replaceAll = function (cm) {
        if (cm.getOption("readOnly")) return;

        regex = regex || editor.call('picker:search:regex');
        if (! regex)
            return;

        var text = editor.call('picker:replace:text') || '';

        cm.operation(function() {
            for (var cursor = cm.getSearchCursor(regex); cursor.findNext();) {
                var match = cm.getRange(cursor.from(), cursor.to()).match(regex);
                cursor.replace(text.replace(/\$(\d)/g, function(_, i) {return match[i];}));
            }
        });
    };

});
