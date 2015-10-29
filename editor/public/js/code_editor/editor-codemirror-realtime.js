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

    var undoStack = [];
    var redoStack = [];

    var MAX_UNDO_SIZE = 200;

    // amount of time to merge local edits into one
    var delay = cm.options.historyEventDelay;

    // create local copy of insert operation
    var createInsertOp = function (pos, text) {
        return customOp(
            pos ? [pos, text] : [text]
        );
    };

    // create local copy of remove operation
    var createRemoveOp = function (pos, length) {
        return customOp(
            pos ? [pos, {d: length}] : [{d: length}]
        );
    };

    // Returns an object that represents an operation
    // result.op - the operation
    // result.time - the time when the operation was created (used to concatenate adjacent operations)
    var customOp = function (op) {
        return {
            op: op,
            time: Date.now()
        };
    };

    // returns true if the two operations can be concatenated
    // into one. This means they are both insert operations or both delete operations.
    // Also true if one of the ops is a noop
    var canConcatOps = function (prevOp, nextOp) {
        var prevLen = prevOp.length;
        var nextLen = nextOp.length;
        if (prevLen === 0 || nextLen === 0)
            return true;

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

    // transform first operation against second operation
    // priority is either 'left' or 'right' to break ties
    var transform = function (op1, op2, priority) {
        return share._doc.type.transform(op1, op2, priority);
    };

    // concatenate two ops and return the result
    var concat = function (op1, op2) {
        return share._doc.type.compose(op1, op2);
    };

    // invert an op an return the result
    var invert = function (op, snapshot) {
        return share._doc.type.semanticInvert(snapshot, op);
    };

    // transform undo and redo operations against the new remote operation
    var transformStacks = function (remoteOp) {
        var i = undoStack.length;
        var initialRemoteOp = remoteOp.op;

        while (i--) {
            var localOp = undoStack[i];
            var old = localOp.op;
            localOp.op = transform(localOp.op, remoteOp.op, 'left');

            // remove noop
            if (localOp.op.length === 0 || (localOp.op.length === 1 && typeof localOp.op === 'object' && localOp.op.d === 0)) {
                undoStack.splice(i, 1);
            } else {
                remoteOp.op = transform(remoteOp.op, old, 'right');
            }
        }

        remoteOp.op = initialRemoteOp;
        i = redoStack.length;
        while (i--) {
            var localOp = redoStack[i] ;
            var old = localOp.op;
            localOp.op = transform(localOp.op, remoteOp.op, 'left');

            // remove noop
            if (localOp.op.length === 0 || (localOp.op.length === 1 && typeof localOp.op === 'object' && localOp.op.d === 0)) {
                redoStack.splice(i, 1);
            } else {
                remoteOp.op = transform(remoteOp.op, old, 'right');
            }
        }

        //console.log('transform', remoteOp.op);
        //printStacks();
    };

    // Called when the script / asset is loaded
    var onLoaded = function () {
        share = editor.call('realtime:context');

        // server -> local
        share.onInsert = function (pos, text) {
            // transform undos / redos with new remote op
            var remoteOp = createInsertOp(pos, text);
            transformStacks(remoteOp);

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
            var remoteOp = createRemoveOp(pos, length);
            transformStacks(remoteOp);

            // apply operation locally
            cm.replaceRange('', from, to);

            // validate();
            suppress = false;
        };
    };

    editor.on('editor:loadScript', onLoaded);
    editor.on('editor:reloadScript', onLoaded);

    // debug function
    var printStacks = function () {
        console.log('undo');
        undoStack.forEach(function (i) {
            console.log(i.op);
        });

        console.log('redo');
        redoStack.forEach(function (i) {
            console.log(i.op);
        });
    };


    // Called when the user presses keys to Undo
    editor.method('editor:undo', function () {
        if (! undoStack.length) return;

        var snapshot = share.get() || '';
        var curr = undoStack.pop();

        var inverseOp = {op: invert(curr.op, snapshot)};
        redoStack.push(inverseOp);

        applyCustomOp(curr.op);

        //printStacks();
    });

    // Called when the user presses keys to Redo
    editor.method('editor:redo', function () {
        if (!redoStack.length) return;

        var snapshot = share.get() || '';
        var curr = redoStack.pop();

        var inverseOp = {op: invert(curr.op, snapshot)};
        undoStack.push(inverseOp);

        applyCustomOp(curr.op);

        //printStacks();
    });

    // Applies an operation to the sharejs document
    // and sets the result to the editor
    var applyCustomOp = function (op) {
        share.submitOp(op, function (err) {
            if (err) {
                console.error(err);
                editor.emit('realtime:error', err);
                return;
            }

            var scrollInfo = cm.getScrollInfo();

            suppress = true;
            cm.setValue(share.get() || '');
            suppress = false;

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

            var cursorPos = cm.posFromIndex(cursor);
            var cursorCoords = cm.cursorCoords(cursorPos);
            cm.setCursor(cursorPos);

            // scroll back to where we were if needed
            if (cursorCoords.top >= scrollInfo.top && cursorCoords.top <= scrollInfo.height) {
                cm.scrollTo(scrollInfo.left, scrollInfo.top);
            }
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

    editor.on('editor:beforeQuit', function () {
        // flush changes before leaving the window
        flushInterval();
    });

    // add local op to undo history
    var addToHistory = function (localOp) {
        // try to concatenate new op with latest op in the undo stack
        var top = undoStack[undoStack.length-1];
        if (top && top.time && Math.abs(top.time - localOp.time) <= delay && canConcatOps(top.op, localOp.op)) {
            top.op = concat(localOp.op, top.op);
            top.time = localOp.time;
        } else {
            // cannot concatenate so push new op
            undoStack.push(localOp);

            // make sure our undo stack doens't get too big
            if (undoStack.length > MAX_UNDO_SIZE) {
                undoStack.splice(0, 1);
            }
        }
    };

    // Flush changes to the server
    // and pause until next flushInterval
    var flushInterval = function () {
        if (share && share._doc) {
            share._doc.resume();
            share._doc.pause();
        }
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
                var op = createRemoveOp(startPos, text.length);
                addToHistory(op);
            }

            share.insert(startPos, text);
        }

        if (change.next) {
            applyToShareJS(cm, change.next);
        }
    }

});