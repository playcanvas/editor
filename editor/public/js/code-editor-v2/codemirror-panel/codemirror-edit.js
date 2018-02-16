editor.once('load', function () {
    'use strict';

    // max undo history
    var MAX_UNDO_SIZE = 200;
    // amount of time to merge local edits into one
    var MERGE_EDITS_DELAY = 2000;

    var cm = editor.call('editor:codemirror');

    // holds contexts about each document
    var documentIndex = {};

    var focusedDocument = null;

    // transform first operation against second operation
    // priority is either 'left' or 'right' to break ties
    var transform = function (op1, op2, priority, entry) {
        return entry.doc.type.transform(op1, op2, priority);
    };

    // concatenate two ops
    var concat = function (prev, next, entry) {
        if (! next.isWhiteSpace) {
            prev.isWhiteSpace = false;
            prev.isNewLine = false;
        } else {
            if (next.isNewLine)
                prev.isNewLine = true;
        }

        prev.op = entry.doc.type.compose(next.op, prev.op);
    };

    // returns true if the two operations can be concatenated
    var canConcatOps = function (prev, next, entry) {
        if (entry.forceConcatenate)
            return true;

        var prevLen = prev.op.length;
        var nextLen = next.op.length;

        // true if both are noops
        if (prevLen === 0 || nextLen === 0) {
            return true;
        }

        var prevDelete = false;
        for (var i = 0; i < prevLen; i++) {
            if (typeof(prev.op[i]) === 'object') {
                prevDelete = true;
                break;
            }
        }

        var nextDelete = false;
        for (var i = 0; i < nextLen; i++) {
            if (typeof(next.op[i]) === 'object') {
                nextDelete = true;
                break;
            }
        }


        // if one of the ops is a delete op and the other an insert op return false
        if (prevDelete !== nextDelete) {
            return false;
        }

        // if we added a whitespace after a non-whitespace return false
        if (next.isWhiteSpace && !prev.isWhiteSpace)
            return false;

        // check if the two ops are on different lines
        if (entry.changedLine !== entry.lastChangedLine) {
            // allow multiple whitespaces to be concatenated
            // on different lines unless the previous op is a new line
            if (prev.isWhiteSpace && !prev.isNewLine) {
                return false;
            }

            // don't allow concatenating multiple inserts in different lines
            if (!next.isWhiteSpace && !prev.isWhiteSpace)
                return false;
        }

        return true;
    };

    // invert an op an return the result
    var invert = function (op, snapshot, entry) {
        return entry.doc.type.semanticInvert(snapshot, op);
    };

    // Returns an object that represents an operation
    // result.op - the operation
    // result.time - the time when the operation was created (used to concatenate adjacent operations)
    var customOp = function (op) {
        return {op: op, time: Date.now()};
    };

    // Creates local copy of insert op
    var createInsertOp = function (pos, text) {
        return customOp(pos? [pos, text] : [text]);
    };

    // Creates local copy of remove operation
    var createRemoveOp = function (pos, length, text) {
        var result = customOp(
            pos ? [pos, {d: length}] : [{d: length}]
        );

        // if text exists remember if it's whitespace
        // so that we concatenate multiple whitespaces together
        if (text) {
            if (/^[ ]+$/.test(text)) {
                result.isWhiteSpace = true;
            } else if (/^\n+$/.test(text)) {
                result.isWhiteSpace = true;
                result.isNewLine = true;
            }
        }

        return result;
    };

    // creates dummy operation in order to move the cursor
    // correctly when remote ops are happening
    var createCursorOp = function (pos, entry) {
        return createInsertOp(entry.view.indexFromPos(pos), ' ');
    };

    // create 2 ops if anchor and head are different or 1 if they are the same (which is just a cursor..)
    var createCursorOpsFromSelection = function (selection, entry) {
        return selection.anchor === selection.head ?
               createCursorOp(selection.anchor, entry) :
               [createCursorOp(selection.anchor, entry), createCursorOp(selection.head, entry)];
    };

    // transform dummy ops with remote op
    var transformCursorOps = function (ops, remoteOp, entry) {
        for (var i = 0, len = ops.length; i < len; i++) {
            var data = ops[i];
            if (data.length) {
                for (var j = 0; j < data.length; j++) {
                    data[j].op = transform(data[j].op, remoteOp, 'right', entry)
                }
            } else {
                data.op = transform(data.op, remoteOp, 'right', entry);
            }
        }
    };

    var posFromCursorOp = function (cursorOp, entry) {
        return entry.view.posFromIndex(cursorOp.op.length > 1 ? cursorOp.op[0] : 0);
    };

    var restoreSelectionsOptions = {
        scroll: false
    };

    // restore selections after remote ops
    var restoreSelections = function (cursorOps, entry) {
        for (var i = 0, len = cursorOps.length; i < len; i++) {
            var data = cursorOps[i];
            var start,end;

            if (data.length) {
                start = posFromCursorOp(data[0], entry);
                end = posFromCursorOp(data[1], entry);
            } else {
                start = posFromCursorOp(data, entry);
                end = start;
            }

            entry.view.addSelection(start, end, restoreSelectionsOptions);
        }
    };

    // transform undo and redo operations against the new remote operation
    var transformStacks = function (remoteOp, entry) {
        var undo = entry.undo;
        var redo = entry.redo;
        var doc = entry.doc;

        var i = undo.length;
        var initialRemoteOp = remoteOp.op;

        while (i--) {
            var localOp = undo[i];
            var old = localOp.op;
            localOp.op = transform(localOp.op, remoteOp.op, 'left', entry);

            // remove noop
            if (localOp.op.length === 0 || (localOp.op.length === 1 && typeof localOp.op === 'object' && localOp.op.d === 0)) {
                undo.splice(i, 1);
            } else {
                remoteOp.op = transform(remoteOp.op, old, 'right', entry);
            }
        }

        remoteOp.op = initialRemoteOp;
        i = redo.length;
        while (i--) {
            var localOp = redo[i] ;
            var old = localOp.op;
            localOp.op = transform(localOp.op, remoteOp.op, 'left', entry);

            // remove noop
            if (localOp.op.length === 0 || (localOp.op.length === 1 && typeof localOp.op === 'object' && localOp.op.d === 0)) {
                redo.splice(i, 1);
            } else {
                remoteOp.op = transform(remoteOp.op, old, 'right', entry);
            }
        }
    };

    // Applies an operation to the sharejs document
    // and sets the result to the document view
    var applyCustomOp = function (op, entry) {
        entry.doc.submitOp(op, function (err) {
            if (err) {
                editor.emit('documents:error', entry.doc.id, err);
                return;
            }
        });

        var scrollInfo = cm.getScrollInfo();

        // remember folded positions
        var folds = entry.view.findMarks(
            CodeMirror.Pos(entry.view.firstLine(), 0),
            CodeMirror.Pos(entry.view.lastLine(), 0)
        ).filter(function (mark) {
            return mark.__isFold
        });

        // transform folded positions with op
        var foldOps;
        if (folds.length) {
            foldOps = [];
            for (var i = 0; i < folds.length; i++) {
                var pos = CodeMirror.Pos(folds[i].lines[0].lineNo(), 0);
                foldOps.push(createCursorOp(pos, entry));
            }

            transformCursorOps(foldOps, op, entry);
        }

        entry.ignoreLocalChanges = true;
        entry.view.setValue(entry.context.get() || '');
        entry.ignoreLocalChanges = false;

        // restore folds because after cm.setValue they will all be lost
        if (foldOps) {
            for (var i = 0; i < foldOps.length; i++) {
                var pos = posFromCursorOp(foldOps[i], entry);
                cm.foldCode(pos);
            }
        }

        // set cursor
        // put it after the text if text was inserted
        // or keep at the the delete position if text was deleted
        var cursor = 0;
        if (op.length === 1) {
            if (typeof op[0] === 'string') {
                cursor += op[0].length;
            }
        } else if (op.length > 1) {
            cursor = op[0];
            if (typeof op[1] === 'string') {
                cursor += op[1].length;
            }
        }

        var cursorPos = entry.view.posFromIndex(cursor);
        var cursorCoords = cm.cursorCoords(cursorPos, 'local');

        entry.view.setCursor(cursorPos);

        // scroll back to where we were if needed
        if (cursorCoords.top >= scrollInfo.top && cursorCoords.top <= scrollInfo.top + scrollInfo.clientHeight) {
            cm.scrollTo(scrollInfo.left, scrollInfo.top);
        }
    };

    // Convert a CodeMirror change into an op understood by share.js
    var applyToShareJs = function (change, entry) {
        var startPos = 0;  // Get character position from # of chars in each line.
        var i = 0;         // i goes through all lines.
        var text;
        var op;

        entry.lastChangedLine = entry.changedLine || change.from.line;
        entry.changedLine = change.from.line;

        while (i < change.from.line) {
            startPos += cm.lineInfo(i).text.length + 1;   // Add 1 for '\n'
            i++;
        }

        startPos += change.from.ch;

        // handle delete
        if (change.to.line != change.from.line || change.to.ch != change.from.ch) {
            text = entry.view.getRange(change.from, change.to);

            if (text) {
                op = createInsertOp(startPos, text);
                addToHistory(op, entry);

                entry.context.remove(startPos, text.length);

                // force concatenation of subsequent ops for this frame
                entry.forceConcatenate = true;
            }
        }

        // handle insert
        if (change.text) {
            text = change.text.join('\n');

            if (text) {
                op = createRemoveOp(startPos, text.length, text);
                addToHistory(op, entry);

                entry.context.insert(startPos, text);

                // force concatenation of subsequent ops for this frame
                entry.forceConcatenate = true;
            }
        }

        if (change.next) {
            applyToShareJs(change.next, entry);
        }

        // restore forceConcatenate after 1 frame
        // do it in a timeout so that operations done
        // by multiple cursors for example are treated as one
        setTimeout(function () {
            entry.forceConcatenate = false;
        });
    };

    // add local op to undo history
    var addToHistory = function (localOp, entry) {
        // try to concatenate new op with latest op in the undo stack
        var timeSinceLastEdit = localOp.time - entry.lastEditTime;
        if (timeSinceLastEdit <= MERGE_EDITS_DELAY || entry.forceConcatenate) {
            var prev = entry.undo[entry.undo.length-1];
            if (prev && canConcatOps(prev, localOp, entry)) {
                concat(prev, localOp, entry);
                return;
            }
        }

        // cannot concatenate so push new op
        entry.undo.push(localOp);

        // make sure our undo stack doens't get too big
        if (entry.undo.length > MAX_UNDO_SIZE) {
            entry.undo.splice(0, 1);
        }

        // update lastEditTime
        entry.lastEditTime = Date.now();
    };

    editor.on('documents:load', function (doc, asset) {
        if (documentIndex[doc.id]) return;

        var entry = {
            doc: doc, // our document
            context: doc.type.api(function() { return doc.data; }, function(component, options, callback) { return doc.submitOp(component, options, callback); }),
            view: editor.call('views:get', doc.id),
            undo: [], // undo stack
            redo: [], // redo stack
            lastEditTime: 0, // timestamp since last local edit
            forceConcatenate: false, // if true then the last two ops will be concatenated
            lastChangedLine: null,
            changedLine: null,
            ignoreLocalChanges: false // do not send ops to sharejs while true
        };

        // add to index
        documentIndex[doc.id] = entry;

        // insert server -> local
        entry.context.onInsert = function (pos, text) {
            // transform undos / redos with new remote op
            var remoteOp = createInsertOp(pos, text);
            transformStacks(remoteOp, entry);

            // apply the operation locally
            entry.ignoreLocalChanges = true;
            var from = entry.view.posFromIndex(pos);

            // get selections before we change the contents
            var selections = entry.view.listSelections();
            var cursorOps = selections.map(function (sel) {
                return createCursorOpsFromSelection(sel, entry);
            });
            transformCursorOps(cursorOps, remoteOp.op, entry);

            entry.view.replaceRange(text, from);

            // restore selections after we set the content
            restoreSelections(cursorOps, entry);

            entry.ignoreLocalChanges = false;
        };

        // remove server -> local
        entry.context.onRemove = function (pos, length) {
            entry.ignoreLocalChanges = true;
            var from = entry.view.posFromIndex(pos);
            var to = entry.view.posFromIndex(pos + length);

            // add remote operation to the edits stack
            var remoteOp = createRemoveOp(pos, length);
            transformStacks(remoteOp, entry)

            // get selections before we change the contents
            var selections = entry.view.listSelections();
            var cursorOps = selections.map(function (sel) {
                return createCursorOpsFromSelection(sel, entry);
            });
            transformCursorOps(cursorOps, remoteOp.op, entry);

            // apply operation locally
            entry.view.replaceRange('', from, to);

            // restore selections after we set the content
            restoreSelections(cursorOps, entry);

            entry.ignoreLocalChanges = false;
        };
    });


    // local -> server
    editor.on('views:change', function (id, view, change) {
        var entry = documentIndex[id];
        if (! entry || entry.ignoreLocalChanges) return;

        // this happens sometimes when there is a doc error
        if (! entry.doc.type) {
            console.warn('Document ' + entry.doc.id + ' has no type');
            return;
        }

        applyToShareJs(change, entry);

        // clear redo stack
        entry.redo.length = 0;
    });


    editor.on('documents:close', function (id) {
        if (focusedDocument === documentIndex[id]) {
            focusedDocument = null;
        }

        delete documentIndex[id];
    });

    editor.on('documents:focus', function (id) {
        focusedDocument = documentIndex[id];
    });

    editor.on('documents:unfocus', function () {
        focusedDocument = null;
    });

    editor.method('editor:command:can:undo', function () {
        return !editor.call('editor:isReadOnly') &&
               focusedDocument && focusedDocument.undo.length;
    });

    // Undo
    editor.method('editor:command:undo', function () {
        if (editor.call('editor:command:can:undo')) {
            var snapshot = focusedDocument.context.get() || '';
            var curr = focusedDocument.undo.pop();

            var inverseOp = {op: invert(curr.op, snapshot, focusedDocument)};
            focusedDocument.redo.push(inverseOp);

            applyCustomOp(curr.op, focusedDocument);
        }

        cm.focus();
    });

    editor.method('editor:command:can:redo', function () {
        return !editor.call('editor:isReadOnly') &&
               focusedDocument && focusedDocument.redo.length;
    });

    // Redo
    editor.method('editor:command:redo', function () {
        if (editor.call('editor:command:can:redo')) {
            var snapshot = focusedDocument.context.get() || '';
            var curr = focusedDocument.redo.pop();

            var inverseOp = {op: invert(curr.op, snapshot, focusedDocument)};
            focusedDocument.undo.push(inverseOp);

            applyCustomOp(curr.op, focusedDocument);
        }

        cm.focus();
    });

    // set the value on a view and specifly if you want to force concatenating it with previous ops
    editor.method('views:setValue', function (id, value, forceConcatenate) {
        var entry = documentIndex[id];
        if (! entry) return;

        var concat = entry.forceConcatenate;
        if (forceConcatenate) {
            entry.forceConcatenate = true;
        }
        entry.view.setValue(value);
        if (forceConcatenate) {
            entry.forceConcatenate = concat;
        }

        if (entry === focusedDocument)
            cm.focus();

    });

});