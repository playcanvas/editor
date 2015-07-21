// credit to https://github.com/share/share-codemirror
// most of the code in here is taken from there

editor.once('load', function () {
    'use strict';

    if (!config.asset)
        return;

    // editor
    var cm = editor.call('editor:codemirror');
    // sharejs document context
    var share;

    // contains all the operations that happened in order (remote and local)
    var edits = [];
    // contains the indices of the operations to be undone (index points to edits array)
    var undoStack = [];
    // contains the indices of the operations to be redone (index points to edits array)
    var redoStack = [];

    // amount of time to merge local edits into one
    var delay = cm.options.historyEventDelay;

    // create local copy of insert operation
    var createInsertOp = function (pos, text) {
        return customOp(
            pos ? [pos, text] : [text],
            pos ? [pos, {d: text.length}] : [{d: text.length}]
        );
    };

    // create local copy of remove operation
    var createRemoveOp = function (pos, text) {
        return customOp(
            pos ? [pos, {d: text.length}] : [{d: text.length}],
            pos ? [pos, text] : [text]
        );
    };


    // returns true if the two operations can be concatenated
    // into one. This means they are both insert operations or both delete operations
    var canConcatOps = function (prevOp, nextOp) {
        var isDelete = false;
        for (var i = 0; i < prevOp.length; i++) {
            if (typeof(prevOp[i]) === 'object') {
                isDelete = true;
                break;
            }
        }

        for (var i = 0; i < nextOp.length; i++) {
            if (typeof(nextOp[i]) === 'object') {
                return isDelete;
            }
        }

        return !isDelete;
    };

    // Returns an object that represents an operation
    // result.op - the operation
    // result.inverse -  the inverse of the operation
    // result.remote - true if this is a remote operation
    // result.time - the time when the operation was created (used to concatenate adjacent operations)
    var customOp = function (op, inverse, remote) {
        return {
            op: op,
            inverse: inverse,
            time: Date.now(),
            remote: remote
        };
    };

    // Called when the script / asset is loaded
    editor.on('editor:loadScript', function () {
        share = editor.call('realtime:context');

        // server -> local
        share.onInsert = function (pos, text) {
            if (text) {
                // add remote operation to the edits stack
                var remoteOp = createInsertOp(pos, text);
                remoteOp.remote = true;
                edits.push(remoteOp);
            }


            // apply the operation locally
            suppress = true;
            var from = cm.posFromIndex(pos);
            cm.replaceRange(text, from);
            var to = cm.posFromIndex(pos + text.length);
            suppress = false;

            // validate();
        };

        share.onRemove = function (pos, length) {
            suppress = true;
            var from = cm.posFromIndex(pos);
            var to = cm.posFromIndex(pos + length);

            // add remote operation to the edits stack
            var text = cm.getRange(from, to);
            if (text) {
                var remoteOp = createRemoveOp(pos, text);
                remoteOp.remote = true;
                edits.push(remoteOp);
            }

            // apply operation locally
            cm.replaceRange('', from, to);

            // validate();
            suppress = false;
        };
    });


    // Called when the user presses keys to Undo
    // WARNING: Doesn't work properly all the time
    editor.method('editor:undo', function () {
        if (undoStack.length === 0) return;

        var i = undoStack.length;
        var editsLength = edits.length;
        var prev, curr;
        var op;

        // Go through the undo stack and merge
        // recent local actions together into one op
        // Then apply the op to the document
        while(i--) {
            curr = edits[undoStack[i]];

            var currOp = curr.op;

            if (prev) {
                if (Math.abs(prev.time - curr.time) <= delay && canConcatOps(op, currOp)) {
                    // transform local op against future remote ops
                    for (var j = undoStack[i] + 1; j < editsLength; j++) {
                        if (edits[j].remote) {
                            currOp = share._doc.type.transform(currOp, edits[j].op, 'left');
                        }
                    }

                    // merge current op with prev op
                    op = share._doc.type.compose(op, currOp);

                    // remove from undo stack and add to redo stack
                    redoStack.push(undoStack.pop());
                } else {
                    // stop undoing
                    break;
                }
            } else {
                // this is the first undo (no prev yet)
                for (var j = undoStack[i] + 1; j < editsLength; j++) {
                    // transform current local op against future remote ops
                    if (edits[j].remote) {
                        currOp = share._doc.type.transform(currOp, edits[j].op, 'left');
                    }
                }

                op = currOp;

                // remove from undo stack and add to redo stack
                redoStack.push(undoStack.pop());
            }

            prev = curr;
        }

        // apply the final op
        if (op)
            applyCustomOp(op);
    });

    // Called when the user presses keys to Redo
    editor.method('editor:redo', function () {
        if (redoStack.length === 0) return;

        var i = redoStack.length;
        var editsLength = edits.length;
        var prev, curr;
        var op;

        // Go through the redo stack and merge recent
        // undos together into one op. Apply the op in the end
        while(i--) {
            curr = edits[redoStack[i]];

            var currOp = curr.inverse;

            if (prev) {
                if (Math.abs(prev.time - curr.time) <= delay && canConcatOps(op, currOp)) {
                    // transform undo against new remote operatinos that happened
                    // after the user did the Undo
                    for (var j = redoStack[i] + 1; j < editsLength; j++) {
                        if (edits[j].remote) {
                            currOp = share._doc.type.transform(currOp, edits[j].op, 'right');
                        }
                    }

                    // merge ops into one
                    op = share._doc.type.compose(op, currOp);

                    // remove from redo stack and add to undo stack
                    undoStack.push(redoStack.pop());
                } else {
                    break;
                }
            } else {
                // this is the first redo (no prev)
                for (var j = redoStack[i] + 1; j < editsLength; j++) {
                    // transform op against future remote ops that happened
                    // after the user did the Undo
                    if (edits[j].remote) {
                        currOp = share._doc.type.transform(currOp, edits[j].op, 'right');
                    }
                }

                op = currOp;

                // remove from redo stack and add to undo stack
                undoStack.push(redoStack.pop());
            }

            prev = curr;
        }

        // apply final op
        if (op)
            applyCustomOp(op);

    });

    // Applies an operation to the sharejs document
    // and sets the result to the editor
    var applyCustomOp = function (op) {
        share.submitOp(op, function () {
            console.log('applying');
            suppress = true;
            cm.setValue(share.get() || '');
            suppress = false;
        });

        // instantly flush changes
        share._doc.resume();
        share._doc.pause();
    };

    var suppress = false;

    // validate text is correct and if not
    // replace editor text with snapshot
    // var validate = function () {
    //     setTimeout(function () {

    //         var cmText = cm.getValue();
    //         var otText = share.get() || '';

    //         if (cmText != otText) {
    //             console.error("Text does not match!", cmText, otText);
    //             // Replace the editor text with the snapshot.
    //             suppress = true;
    //             cm.setValue(otText);
    //             suppress = false;
    //         }
    //     }, 0);
    // };

    // local -> server
    editor.on('editor:change', function (cm, change) {
        if (!share || suppress) return;

        applyToShareJS(cm, change);
        // validate();

        // clear redo stack
        redoStack.length = 0;

    });

    // add local op to edits stack and undo history
    var addToHistory = function (localOp) {
        edits.push(localOp);
        undoStack.push(edits.length-1);
    };

    // Flush changes to the server
    // and pause until next flushInterval
    var flushInterval = function () {
        share._doc.resume();
        share._doc.pause();
    };

    // flush changes to server every once in a while
    setInterval(flushInterval, 500);

    // Convert a CodeMirror change into an op understood by share.js
    function applyToShareJS(cm, change) {
        var startPos = 0;  // Get character position from # of chars in each line.
        var i = 0;         // i goes through all lines.

        while (i < change.from.line) {
            startPos += cm.lineInfo(i).text.length + 1;   // Add 1 for '\n'
            i++;
        }

        startPos += change.from.ch;

        if (change.to.line != change.from.line || change.to.ch != change.from.ch) {
            // change.removed contains an array of removed lines as strings, so this adds
            // all the lengths. Later change.removed.length - 1 is added for the \n-chars
            // (-1 because the linebreak on the last line won't get deleted)
            var delLen = 0;
            var text = '';
            var separator = '';
            for (var rm = 0; rm < change.removed.length; rm++) {
              delLen += change.removed[rm].length;
              text += separator + change.removed[rm];
              separator = '\n';
            }
            delLen += change.removed.length - 1;

            if (text) {
                var op = createInsertOp(startPos, text);
                addToHistory(op);

                share.remove(startPos, delLen);
            }
        }

        if (change.text) {
            var text = change.text.join('\n');
            if (text) {
                var op = createRemoveOp(startPos, text);
                addToHistory(op);

                share.insert(startPos, text);
            }
        }

        if (change.next) {
            applyToShareJS(cm, change.next);
        }
    }

});