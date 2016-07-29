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
    var delay = 2000;

    // amount of time since last local edit
    var lastEditTime = 0;

    // if true then the last two ops will be concatenated no matter what
    var forceConcatenate = false;

    var isConnected = false;

    var lastChangedLine = null;
    var changedLine = null;

    editor.method('editor:realtime:mergeOps', function (force) {
        forceConcatenate = force;
    });


    // create local copy of insert operation
    var createInsertOp = function (pos, text) {
        return customOp(
            pos ? [pos, text] : [text]
        );
    };

    // create local copy of remove operation
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
    var canConcatOps = function (prev, next) {
        if (forceConcatenate)
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
        if (changedLine !== lastChangedLine) {
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

    // transform first operation against second operation
    // priority is either 'left' or 'right' to break ties
    var transform = function (op1, op2, priority) {
        return share._doc.type.transform(op1, op2, priority);
    };

    // concatenate two ops
    var concat = function (prev, next) {
        if (! next.isWhiteSpace) {
            prev.isWhiteSpace = false;
            prev.isNewLine = false;
        } else {
            if (next.isNewLine)
                prev.isNewLine = true;
        }

        prev.op = share._doc.type.compose(next.op, prev.op);
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

            suppress = false;
        };

        isConnected = true;
    };

    editor.on('editor:loadScript', onLoaded);
    editor.on('editor:reloadScript', onLoaded);

    editor.on('realtime:disconnected', function () {
        isConnected = false;
    });

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
        if (!isConnected || ! undoStack.length) return;

        var snapshot = share.get() || '';
        var curr = undoStack.pop();

        var inverseOp = {op: invert(curr.op, snapshot)};
        redoStack.push(inverseOp);

        applyCustomOp(curr.op);

        //printStacks();
    });

    // Called when the user presses keys to Redo
    editor.method('editor:redo', function () {
        if (! isConnected || !redoStack.length) return;

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
        });

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
        var cursorCoords = cm.cursorCoords(cursorPos, 'local');

        cm.setCursor(cursorPos);

        // scroll back to where we were if needed
        if (cursorCoords.top >= scrollInfo.top && cursorCoords.top <= scrollInfo.top + scrollInfo.clientHeight) {
            cm.scrollTo(scrollInfo.left, scrollInfo.top);
        }

        // instantly flush changes
        // share._doc.resume();
        // share._doc.pause();
    };

    var suppress = false;

    // local -> server
    editor.on('editor:change', function (cm, change) {
        if (!share || suppress) return;

        applyToShareJS(cm, change);

        // clear redo stack
        redoStack.length = 0;

    });

    // // started saving so flush changes
    // editor.on('editor:save:start', function () {
    //     flushInterval();
    // });

    // editor.on('editor:beforeQuit', function () {
    //     // flush changes before leaving the window
    //     flushInterval();
    // });

    // add local op to undo history
    var addToHistory = function (localOp) {
        // try to concatenate new op with latest op in the undo stack
        var timeSinceLastEdit = localOp.time - lastEditTime;
        if (timeSinceLastEdit <= delay || forceConcatenate) {
            var prev = undoStack[undoStack.length-1];
            if (prev && canConcatOps(prev, localOp)) {
                concat(prev, localOp);
                return;
            }
        }

        // cannot concatenate so push new op
        undoStack.push(localOp);

        // make sure our undo stack doens't get too big
        if (undoStack.length > MAX_UNDO_SIZE) {
            undoStack.splice(0, 1);
        }

        // update lastEditTime
        lastEditTime = Date.now();
    };

    // Flush changes to the server
    // and pause until next flushInterval
    // var flushInterval = function () {
    //     if (share && share._doc) {
    //         share._doc.resume();
    //         share._doc.pause();
    //     }
    // };

    // flush changes to server every once in a while
    // setInterval(flushInterval, 500);

    // Convert a CodeMirror change into an op understood by share.js
    function applyToShareJS(cm, change) {
        var startPos = 0;  // Get character position from # of chars in each line.
        var i = 0;         // i goes through all lines.
        var text;
        var op;

        lastChangedLine = changedLine || change.from.line;
        changedLine = change.from.line;

        while (i < change.from.line) {
            startPos += cm.lineInfo(i).text.length + 1;   // Add 1 for '\n'
            i++;
        }

        startPos += change.from.ch;

        // handle delete
        if (change.to.line != change.from.line || change.to.ch != change.from.ch) {
            text = cm.getRange(change.from, change.to);

            if (text) {
                op = createInsertOp(startPos, text);
                addToHistory(op);

                share.remove(startPos, text.length);

                // force concatenation of subsequent ops for this frame
                forceConcatenate = true;
            }
        }

        // handle insert
        if (change.text) {
            text = change.text.join('\n');

            if (text) {
                op = createRemoveOp(startPos, text.length, text);
                addToHistory(op);

                share.insert(startPos, text);

                // force concatenation of subsequent ops for this frame
                forceConcatenate = true;
            }
        }

        if (change.next) {
            applyToShareJS(cm, change.next);
        }

        // restore forceConcatenate after 1 frame
        // do it in a timeout so that operations done
        // by multiple cursors for example are treated as one
        setTimeout(function () {
            forceConcatenate = false;
        });
    }

    // function print (text) {
    //     var chars = [];
    //     if (! text) return chars;

    //     for (var i = 0; i < text.length; i++)
    //         chars.push(text.charCodeAt(i));

    //     return chars;
    // }
});