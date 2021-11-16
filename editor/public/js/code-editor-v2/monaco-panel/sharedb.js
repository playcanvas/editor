editor.once('load', function () {
    'use strict';

    if (editor.call('editor:resolveConflictMode')) return;

    // max undo history
    const MAX_UNDO_SIZE = 200;
    // amount of time to merge local edits into one
    const MERGE_EDITS_DELAY = 2000;

    const documentIndex = {};
    let focusedDocument = null;

    const monacoEditor = editor.call('editor:monaco');

    // Returns an object that represents an operation
    // result.op - the operation
    // result.time - the time when the operation was created (used to concatenate adjacent operations)
    function customOp(op) {
        return { op: op, time: Date.now(), isWhiteSpace: false, isNewLine: false };
    }

    // Creates local copy of insert op
    function createInsertOp(pos, text) {
        return customOp(pos ? [pos, text] : [text]);
    }

    // Creates local copy of remove operation
    function createRemoveOp(pos, length, text) {
        const result = customOp(
            pos ? [pos, { d: length }] : [{ d: length }]
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
    }

    // transform first operation against second operation
    // priority is either 'left' or 'right' to break ties
    function transform(op1, op2, priority, entry) {
        return entry.doc.type.transform(op1, op2, priority);
    }

    // transform undo and redo operations against the new remote operation
    function transformStacks(remoteOp, entry) {
        var undo = entry.undo;
        var redo = entry.redo;

        var i = undo.length;
        var initialRemoteOp = remoteOp.op;

        while (i--) {
            const localOp = undo[i];
            const old = localOp.op;
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
            const localOp = redo[i];
            const old = localOp.op;
            localOp.op = transform(localOp.op, remoteOp.op, 'left', entry);

            // remove noop
            if (localOp.op.length === 0 || (localOp.op.length === 1 && typeof localOp.op === 'object' && localOp.op.d === 0)) {
                redo.splice(i, 1);
            } else {
                remoteOp.op = transform(remoteOp.op, old, 'right', entry);
            }
        }
    }

     // transform dummy ops with remote op
     function transformCursorOps(ops, remoteOp, entry) {
        for (let i = 0, len = ops.length; i < len; i++) {
            var data = ops[i];
            if (data.length) {
                for (let j = 0; j < data.length; j++) {
                    data[j].op = transform(data[j].op, remoteOp, 'right', entry);
                }
            } else {
                data.op = transform(data.op, remoteOp, 'right', entry);
            }
        }
    }

    // concatenate two ops
    function concat(prev, next, entry) {
        if (! next.isWhiteSpace) {
            prev.isWhiteSpace = false;
            prev.isNewLine = false;
        } else {
            if (next.isNewLine)
                prev.isNewLine = true;
        }

        prev.op = entry.doc.type.compose(next.op, prev.op);
    }

    // returns true if the two operations can be concatenated
    function canConcatOps(prev, next, entry) {
        if (entry.forceConcatenate)
            return true;

        var prevLen = prev.op.length;
        var nextLen = next.op.length;

        // true if both are noops
        if (prevLen === 0 || nextLen === 0) {
            return true;
        }

        var prevDelete = false;
        for (let i = 0; i < prevLen; i++) {
            if (typeof(prev.op[i]) === 'object') {
                prevDelete = true;
                break;
            }
        }

        var nextDelete = false;
        for (let i = 0; i < nextLen; i++) {
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
    }

    // invert an op an return the result
    function invert(op, snapshot, entry) {
        return entry.doc.type.semanticInvert(snapshot, op);
    }

    // add local op to undo history
    function addToHistory(localOp, entry) {
        // try to concatenate new op with latest op in the undo stack
        var timeSinceLastEdit = localOp.time - entry.lastEditTime;
        if (timeSinceLastEdit <= MERGE_EDITS_DELAY || entry.forceConcatenate) {
            var prev = entry.undo[entry.undo.length - 1];
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
    }

    // Convert a monaco change into an op understood by sharedb
    function applyToShareDb(change, entry) {
        const startPos = change.rangeOffset;
        let text;
        let op;

        entry.lastChangedLine = entry.changedLine || change.range.startLineNumber - 1;
        entry.changedLine = change.range.startLineNumber - 1;

        // handle delete (an insert could follow if the user replaced some text)
        if (!change.range.isEmpty()) {
            // get deleted text from document which hasn't changed yet
            text = entry.doc.data.substring(change.rangeOffset, change.rangeOffset + change.rangeLength);

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
            text = change.text;

            op = createRemoveOp(startPos, text.length, text);
            addToHistory(op, entry);

            entry.context.insert(startPos, text);

            // force concatenation of subsequent ops for this frame
            entry.forceConcatenate = true;
        }

        // restore forceConcatenate after 1 frame
        // do it in a timeout so that operations done
        // by multiple cursors for example are treated as one
        setTimeout(function () {
            entry.forceConcatenate = false;
        });
    }

    // Applies an operation to the sharedb document
    // and sets the result to the document view
    function applyCustomOp(op, entry) {
        entry.doc.submitOp(op, (err) => {
            if (err) {
                editor.emit('documents:error', entry.id, err);
            }
        });

        const state = monacoEditor.saveViewState();

        // get all folded regions
        // and create fake insert ops so that we can transform
        // them with the incoming op. That way we can restore
        // them after
        const foldOps = [];
        const folds = state.contributionsState['editor.contrib.folding'];
        if (folds && folds.collapsedRegions) {
            folds.collapsedRegions.forEach((region) => {
                let pos = new monaco.Position(region.startLineNumber, 1);
                let offset = entry.view.getOffsetAt(pos);
                foldOps.push(createInsertOp(offset, ' '));

                pos = new monaco.Position(region.endLineNumber, 1);
                offset = entry.view.getOffsetAt(pos);
                foldOps.push(createInsertOp(offset, ' '));
            });
        }

        // transform fold positions
        transformCursorOps(foldOps, op, entry);

        entry.ignoreLocalChanges = true;
        entry.view.setValue(entry.context.get() || '');
        entry.ignoreLocalChanges = false;

        // set cursor
        // put it after the text if text was inserted
        // or keep at the the delete position if text was deleted
        let cursor = 0;
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

        const cursorPos = entry.view.getPositionAt(cursor);

        // update view state with new fold positions
        if (folds && folds.collapsedRegions) {
            folds.collapsedRegions.forEach((region, index) => {
                let foldOp = foldOps[2 * index];
                let pos = entry.view.getPositionAt(foldOp.op.length > 1 ? foldOp.op[0] : 0);
                region.startLineNumber = pos.lineNumber;

                foldOp = foldOps[2 * index + 1];
                pos = entry.view.getPositionAt(foldOp.op.length > 1 ? foldOp.op[0] : 0);
                region.endLineNumber = pos.lineNumber;
            });
        }

        // update lineCount of stored state otherwise folded
        // regions will not be restored properly
        if (folds) {
            folds.lineCount = entry.view.getLineCount();
        }

        monacoEditor.restoreViewState(state);
        monacoEditor.setPosition(cursorPos);
        monacoEditor.revealRangeInCenterIfOutsideViewport(
            monaco.Range.fromPositions(cursorPos, cursorPos),
            monaco.editor.ScrollType.Immediate
        );
    }

    // load document from sharedb
    editor.on('documents:load', (doc, asset, docEntry) => {
        if (documentIndex[asset.get('id')]) return;

        const entry = {
            id: asset.get('id'),
            doc: doc, // our document
            context: doc.type.api(function () { return doc.data; }, function (component, options, callback) { return doc.submitOp(component, options, callback); }),
            view: editor.call('views:get', asset.get('id')),
            undo: [], // undo stack
            redo: [], // redo stack
            lastEditTime: 0, // timestamp since last local edit
            forceConcatenate: false, // if true then the last two ops will be concatenated
            lastChangedLine: null,
            changedLine: null,
            ignoreLocalChanges: false // do not send ops to sharedb while true
        };

        // mark document as dirty on every op
        doc.on('op', function (ops, local) {
            if (!local) {
                entry.context._onOp(ops);
            }

            if (!docEntry.isDirty) {
                docEntry.isDirty = true;
                editor.emit('documents:dirty', docEntry.id, true);
            }

            if (local && ! docEntry.hasLocalChanges) {
                docEntry.hasLocalChanges = true;
                editor.emit('documents:dirtyLocal', docEntry.id, true);
            }
        });

        // add to index
        documentIndex[asset.get('id')] = entry;

        // insert (server -> local)
        entry.context.onInsert = (pos, text) => {
            // transform undos / redos with new remote op
            const remoteOp = createInsertOp(pos, text);
            transformStacks(remoteOp, entry);

            // apply the operation locally
            entry.ignoreLocalChanges = true;

            const position = entry.view.getPositionAt(pos);

            entry.view.applyEdits([{
                forceMoveMarkers: true,
                text: text,
                range: monaco.Range.fromPositions(position)
            }]);

            entry.ignoreLocalChanges = false;
        };

        // remove (server -> local)
        entry.context.onRemove = (pos, length) => {
            entry.ignoreLocalChanges = true;
            const from = entry.view.getPositionAt(pos);
            const to = entry.view.getPositionAt(pos + length);

            // add remote operation to the edits stack
            var remoteOp = createRemoveOp(pos, length);
            transformStacks(remoteOp, entry);

            // apply operation locally
            entry.view.applyEdits([{
                text: '',
                range: monaco.Range.fromPositions(from, to)
            }]);

            entry.ignoreLocalChanges = false;
        };
    });

    // submit operation to sharedb
    editor.on('views:change', (id, view, change) => {
        var entry = documentIndex[id];
        if (! entry || entry.ignoreLocalChanges) return;

        // this happens sometimes when there is a doc error
        if (! entry.doc.type) {
            console.warn('Document ' + id + ' has no type');
            return;
        }

        change.changes.forEach(c => applyToShareDb(c, entry));

        // clear redo stack
        entry.redo.length = 0;
    });

    editor.on('documents:focus', function (id) {
        focusedDocument = documentIndex[id];
    });

    editor.on('documents:unfocus', function () {
        focusedDocument = null;
    });

    editor.on('documents:close', function (id) {
        if (focusedDocument === documentIndex[id]) {
            focusedDocument = null;
        }

        delete documentIndex[id];
    });

    editor.method('editor:command:can:undo', function () {
        return editor.call('editor:resolveConflictMode') ||
               !editor.call('editor:isReadOnly') &&
               focusedDocument && focusedDocument.undo.length;
    });

    // Undo
    editor.method('editor:command:undo', function () {
        if (editor.call('editor:command:can:undo')) {
            if (editor.call('editor:resolveConflictMode')) {
                return cm.undo();
            }

            var snapshot = focusedDocument.context.get() || '';
            var curr = focusedDocument.undo.pop();

            var inverseOp = { op: invert(curr.op, snapshot, focusedDocument) };
            focusedDocument.redo.push(inverseOp);

            applyCustomOp(curr.op, focusedDocument);
        }

        monacoEditor.focus();
    });

    editor.method('editor:command:can:redo', function () {
        return editor.call('editor:resolveConflictMode') ||
               !editor.call('editor:isReadOnly') &&
               focusedDocument && focusedDocument.redo.length;
    });

    // Redo
    editor.method('editor:command:redo', function () {
        if (editor.call('editor:command:can:redo')) {
            if (editor.call('editor:resolveConflictMode')) {
                return cm.redo();
            }

            var snapshot = focusedDocument.context.get() || '';
            var curr = focusedDocument.redo.pop();

            var inverseOp = { op: invert(curr.op, snapshot, focusedDocument) };
            focusedDocument.undo.push(inverseOp);

            applyCustomOp(curr.op, focusedDocument);
        }

        monacoEditor.focus();
    });
});
