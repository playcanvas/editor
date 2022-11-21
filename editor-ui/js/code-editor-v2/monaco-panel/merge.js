editor.once('load', function () {
    'use strict';

    if (!editor.call('editor:resolveConflictMode')) return;
    if (config.self.branch.merge.isDiff) return;

    const MODES = {
        script: 'javascript',
        json: 'json',
        html: 'html',
        css: 'css',
        shader: 'javascript'
    };

    const REGEX_DST_BRANCH_START = /^<<<<<<< /gm;
    const REGEX_DST_BRANCH_END = /^=======$/gm;
    const REGEX_SRC_BRANCH_END = /^>>>>>>> /gm;

    const LARGE_FILE_SIZE = 1000000;

    class MergeFileEditor {
        constructor() {
            // the asset type
            this.type = config.self.branch.merge.conflict.assetType;
            this.codePanel = editor.call('layout.code');
            // code mirror instance
            this.monacoEditor = editor.call('editor:monaco');
            // the document
            this.model = null;
            // decorations
            this.decorations = null;
            this.overlays = [];
            // Each group contains a src and dest overlay or just one of them
            // Each group essentially represents a conflict that could have just
            // the source, dest or both portions
            this.overlayGroups = [];
            // timeout for refreshing overlay elements
            this.timeoutRefreshOverlays = null;
            this.isDirty = false;
        }

        setOptions() {
            this.monacoEditor.updateOptions({
                readOnly: false
            });
        }

        createOverlay(className, branchName, startPos, endPos, reverse) {
            this.overlays.push({
                pos: this.model.getOffsetAt({
                    lineNumber: startPos.lineNumber,
                    column: 1
                }),
                className: className
            });

            return {
                range: monaco.Range.fromPositions(startPos, endPos),
                options: {
                    isWholeLine: true,
                    className: className,
                    inlineClassName: className
                }
            };
        }

        createOverlays() {
            const content = this.monacoEditor.getValue();
            let match;
            let dstStartPos;
            let dstEndPos;
            let srcStartPos;
            let srcEndPos;

            const overlays = [];

            while ((match = REGEX_DST_BRANCH_START.exec(content)) !== null) {
                dstStartPos = this.model.getPositionAt(match.index);

                REGEX_DST_BRANCH_END.lastIndex = match.index;
                match = REGEX_DST_BRANCH_END.exec(content);
                if (match !== null) {
                    dstEndPos = this.model.getPositionAt(match.index);
                    dstEndPos.lineNumber--;
                    overlays.push(this.createOverlay('dst-branch', config.self.branch.merge.destinationBranchName, dstStartPos, dstEndPos));

                    REGEX_SRC_BRANCH_END.lastIndex = match.index;
                    match = REGEX_SRC_BRANCH_END.exec(content);
                    if (match !== null) {
                        srcStartPos = dstEndPos;
                        srcStartPos.lineNumber += 2;
                        srcEndPos = this.model.getPositionAt(match.index);
                        overlays.push(this.createOverlay('src-branch', config.self.branch.merge.sourceBranchName, srcStartPos, srcEndPos, true));

                        REGEX_DST_BRANCH_START.lastIndex = match.index;
                    }
                }
            }

            if (overlays.length) {
                this.decorations = this.monacoEditor.deltaDecorations(this.decorations || [], overlays);
            }
        }

        // Creates groups out of the created overlays
        rebuildOverlayGroups() {
            this.overlayGroups.length = 0;
            // sort overlays by position in code
            const sortedOverlays = this.overlays.slice().sort(function (a, b) {
                return a.pos - b.pos;
            });

            // creates a group
            function createOverlayGroup() {
                return {
                    dest: null,
                    src: null
                };
            }

            let currentGroup;
            for (let i = 0; i < sortedOverlays.length; i++) {
                if (!currentGroup) {
                    currentGroup = createOverlayGroup();
                }

                // if this is a dest overlay then put it in the dest field
                // of the group
                if (sortedOverlays[i].className === 'dst-branch') {
                    // if there already exists a dest field then push that in
                    // the overlayGroups and start a new group
                    if (currentGroup.dest !== null) {
                        this.overlayGroups.push(currentGroup);
                        currentGroup = createOverlayGroup();
                    }

                    currentGroup.dest = sortedOverlays[i].pos;
                } else {
                    // if this is a source overlay then
                    if (currentGroup.src !== null) {
                        // if there's already a source overlay then
                        // push that in overlayGroups and start a new group
                        this.overlayGroups.push(currentGroup);
                        currentGroup = createOverlayGroup();
                    } else if (currentGroup.dest === null) {
                        // if there is no dest group (since dest group should
                        // come first) then push this group in the overlayGroups
                        // and start a new group
                        currentGroup.src = sortedOverlays[i].pos;
                        this.overlayGroups.push(currentGroup);
                        currentGroup = createOverlayGroup();
                    } else {
                        // none of the above is true so just set the src field
                        currentGroup.src = sortedOverlays[i].pos;
                    }
                }

                // if we filled both dest and src fields then push the group in the overlayGroups array
                if (currentGroup.dest !== null && currentGroup.src !== null) {
                    this.overlayGroups.push(currentGroup);
                    currentGroup = null;
                }
            }

            // if there is a last group then add it to the overlayGroups
            if (currentGroup && (currentGroup.dest || currentGroup.src)) {
                this.overlayGroups.push(currentGroup);
            }


        }

        refreshOverlays() {
            this.timeoutRefreshOverlays = null;
            this.decorations = this.monacoEditor.deltaDecorations(this.decorations || [], []);
            this.overlays = [];
            this.createOverlays();
            this.rebuildOverlayGroups();
        }

        deferredRefreshOverlays() {
            if (this.timeoutRefreshOverlays) return;
            this.timeoutRefreshOverlays = setTimeout(this.refreshOverlays.bind(this), 300);
        }

        renderDocument() {
            this.monacoEditor.setModel(this.model);
            this.setOptions();
            this.codePanel.toggleCode(true);
            this.refreshOverlays();

            setTimeout(function () {
                this.goToNextConflict(true);
            }.bind(this));
        }

        // Moves cursor to the next conflict. Wraps around if needed
        goToNextConflict(stayInCurrentConflictIfPossible) {
            this.monacoEditor.focus();

            const len = this.overlayGroups.length;
            if (!len) {
                return;
            }

            const currentPos = this.model.getOffsetAt(this.monacoEditor.getPosition());
            let foundPos = null;
            for (let i = 0; i < len; i++) {
                const group = this.overlayGroups[i];
                const overlayPos = group.dest !== null ? group.dest : group.src;
                if (stayInCurrentConflictIfPossible && overlayPos >= currentPos || overlayPos > currentPos) {
                    foundPos = overlayPos;
                    break;
                }
            }

            if (foundPos === null) {
                const wrappedGroup = this.overlayGroups[0];
                foundPos = wrappedGroup.dest !== null ? wrappedGroup.dest : wrappedGroup.src;
            }

            if (foundPos !== null) {
                const pos = this.model.getPositionAt(foundPos);
                this.monacoEditor.setPosition(pos);
                this.monacoEditor.revealRangeInCenterIfOutsideViewport(
                    monaco.Range.fromPositions(pos, pos),
                    monaco.editor.ScrollType.Smooth
                );
            }
        }

        // Moves cursor to the previous conflict. Wraps around if needed
        goToPrevConflict() {
            this.monacoEditor.focus();

            const len = this.overlayGroups.length;
            if (!len) {
                return;
            }

            const currentPos = this.model.getOffsetAt(this.monacoEditor.getPosition());
            let foundPos = null;
            for (let i = len - 1; i >= 0; i--) {
                const group = this.overlayGroups[i];
                const overlayPos = group.dest !== null ? group.dest : group.src;
                if (overlayPos < currentPos) {
                    foundPos = overlayPos;
                    break;
                }
            }

            if (foundPos === null) {
                const wrappedGroup = this.overlayGroups[this.overlayGroups.length - 1];
                foundPos = wrappedGroup.dest !== null ? wrappedGroup.dest : wrappedGroup.src;
            }

            if (foundPos !== null) {
                const pos = this.model.getPositionAt(foundPos);
                this.monacoEditor.setPosition(pos);
                this.monacoEditor.revealRangeInCenterIfOutsideViewport(
                    monaco.Range.fromPositions(pos, pos),
                    monaco.editor.ScrollType.Smooth
                );
            }
        }

        run() {
            // if the conflict is resolved then get the resolved file otherwise get the unresolved file
            const conflict = config.self.branch.merge.conflict;
            const isResolved = conflict.useSrc || conflict.useDst || conflict.useMergedFile;
            const method = isResolved ? 'conflicts:getResolvedFile' : 'conflicts:getUnresolvedFile';
            editor.call(
                method,
                config.self.branch.merge.id,
                config.self.branch.merge.conflict.id,
                config.self.branch.merge.conflict.mergedFilePath,
                (err, contents) => {
                    if (err) {
                        log.error(err);
                        editor.call('status:error', err);
                        return;
                    }

                    let mode = MODES[this.type];
                    // stop highlighting if document is larger than 1MB
                    if (contents.length > LARGE_FILE_SIZE) {
                        mode = 'text';
                    }

                    this.model = monaco.editor.createModel(contents, mode);
                    this.model.onDidChangeContent(() => {
                        this.isDirty = true;
                        this.deferredRefreshOverlays();
                    });

                    this.renderDocument();
                }
            );
        }
    }

    const mergeFileEditor = new MergeFileEditor();
    mergeFileEditor.run();

    /**
     * Gets the number of conflict overlays in the code editor
     */
    editor.method('editor:merge:getNumberOfConflicts', function () {
        return mergeFileEditor.overlayGroups.length;
    });

    /**
     * Returns true if the code editor is dirty
     */
    editor.method('editor:merge:isDirty', function () {
        return mergeFileEditor.isDirty;
    });

    /**
     * Gets the current content of the code editor
     */
    editor.method('editor:merge:getContent', function () {
        return mergeFileEditor.monacoEditor.getValue();
    });

    /**
     * Sets the current content of the code editor
     */
    editor.method('editor:merge:setContent', function (value) {
        return mergeFileEditor.monacoEditor.setValue(value);
    });

    /**
     * Moves cursor to the next conflict
     */
    editor.method('editor:merge:goToNextConflict', function () {
        mergeFileEditor.goToNextConflict();
    });

    /**
     * Moves cursor to the previous conflict
     */
    editor.method('editor:merge:goToPrevConflict', function () {
        mergeFileEditor.goToPrevConflict();
    });
});
