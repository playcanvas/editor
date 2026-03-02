import type * as Monaco from 'monaco-editor';

import { handleCallback } from '@/common/utils';

const MODES: Record<string, string> = {
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
    type: string;

    codePanel: any;

    monacoEditor: Monaco.editor.IStandaloneCodeEditor;

    model: Monaco.editor.ITextModel | null = null;

    decorations: string[] | null = null;

    overlays: Array<{ pos: number; className: string }> = [];

    overlayGroups: Array<{ dest: number | null; src: number | null }> = [];

    timeoutRefreshOverlays: ReturnType<typeof setTimeout> | null = null;

    isDirty = false;

    constructor() {
        this.type = config.self.branch.merge.conflict.assetType;
        this.codePanel = editor.call('layout.code');
        this.monacoEditor = editor.call('editor:monaco');
    }

    setOptions() {
        this.monacoEditor.updateOptions({
            readOnly: false
        });
    }

    createOverlay(className: string, branchName: string, startPos: Monaco.Position, endPos: Monaco.Position, reverse?: boolean) {
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

    rebuildOverlayGroups() {
        this.overlayGroups.length = 0;
        const sortedOverlays = this.overlays.slice().sort((a, b) => {
            return a.pos - b.pos;
        });

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

            if (sortedOverlays[i].className === 'dst-branch') {
                if (currentGroup.dest !== null) {
                    this.overlayGroups.push(currentGroup);
                    currentGroup = createOverlayGroup();
                }

                currentGroup.dest = sortedOverlays[i].pos;
            } else {
                if (currentGroup.src !== null) {
                    this.overlayGroups.push(currentGroup);
                    currentGroup = createOverlayGroup();
                } else if (currentGroup.dest === null) {
                    currentGroup.src = sortedOverlays[i].pos;
                    this.overlayGroups.push(currentGroup);
                    currentGroup = createOverlayGroup();
                } else {
                    currentGroup.src = sortedOverlays[i].pos;
                }
            }

            if (currentGroup.dest !== null && currentGroup.src !== null) {
                this.overlayGroups.push(currentGroup);
                currentGroup = null;
            }
        }

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
        if (this.timeoutRefreshOverlays) {
            return;
        }
        this.timeoutRefreshOverlays = setTimeout(this.refreshOverlays.bind(this), 300);
    }

    renderDocument() {
        this.monacoEditor.setModel(this.model);
        this.setOptions();
        this.codePanel.toggleCode(true);
        this.refreshOverlays();

        setTimeout(() => {
            this.goToNextConflict(true);
        });
    }

    goToNextConflict(stayInCurrentConflictIfPossible?: boolean) {
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
        const conflict = config.self.branch.merge.conflict;
        const isResolved = conflict.useSrc || conflict.useDst || conflict.useMergedFile;

        handleCallback(editor.api.globals.rest.merge.mergeConflicts({
            mergeId: config.self.branch.merge.id,
            conflictId: config.self.branch.merge.conflict.id,
            fileName: config.self.branch.merge.conflict.mergedFilePath,
            resolved: isResolved
        }), (err: unknown, contents: string) => {
            if (err) {
                log.error(err);
                editor.call('status:error', err);
                return;
            }

            let mode = MODES[this.type];
            if (contents.length > LARGE_FILE_SIZE) {
                mode = 'text';
            }

            this.model = monaco.editor.createModel(contents, mode);
            this.model.onDidChangeContent(() => {
                this.isDirty = true;
                this.deferredRefreshOverlays();
            });

            this.renderDocument();
        });
    }
}

export { MergeFileEditor };
