editor.once('load', function () {
    if (!editor.call('editor:resolveConflictMode')) return;
    if (!config.self.branch.merge.isDiff) return;

    const MODES = {
        script: 'javascript',
        json: 'json',
        html: 'html',
        css: 'css',
        shader: 'javascript'
    };

    const REGEX_HUNK = /^\@\@ -([0-9]+)(?:,[0-9]+)? \+([0-9]+)(?:,[0-9]+)? \@\@$/gm;

    const LARGE_FILE_SIZE = 300000;

    class DiffEditor {
        constructor() {
            // the asset type
            this.type = config.self.branch.merge.conflict.assetType;
            this.codePanel = editor.call('layout.code');
            this.monacoEditor = editor.call('editor:monaco');
            this.model = null;
            this.decorations = [];
            this.lineNumbers = {};
        }

        setOptions() {
            this.monacoEditor.updateOptions({
                folding: false,
                readOnly: true,
                lineNumbers: originalLineNumber => this.lineNumbers[originalLineNumber]
            });
        }

        createLineOverlay(line, cls) {
            return {
                range: new monaco.Range(line, 1, line, 1),
                options: {
                    isWholeLine: true,
                    className: 'diff-overlay-' + cls
                }
            };
        }

        createLineNumber(cmLine, codeLine) {
            this.lineNumbers[cmLine + 1] = codeLine;
        }

        createOverlays() {
            const content = this.content;
            const isLarge = (content.length > LARGE_FILE_SIZE);
            let match;

            let hunk;
            const hunks = [];

            // get all hunks
            while ((match = REGEX_HUNK.exec(content)) !== null) {
                const pos = this.model.getPositionAt(match.index);
                hunk = {
                    hunkStart: pos.lineNumber,
                    hunkLength: match[0].length,
                    hunkLeftStart: parseInt(match[1], 10),
                    hunkRightStart: parseInt(match[2], 10)
                };

                // add lines for each hunk to the array
                hunks.push(hunk);
            }

            // iterate all lines and add overlays on each line
            // depending on the line contents
            const lineCount = this.model.getLineCount();

            const decorations = [];

            for (let i = 0, len = hunks.length; i < len; i++) {
                hunk = hunks[i];

                const nextHunk = hunks[i + 1];
                let codeLine = hunk.hunkRightStart;

                // hunk overlay
                decorations.push(this.createLineOverlay(hunk.hunkStart, 'hunk'));

                for (let j = hunk.hunkStart + 1; j < (nextHunk ? nextHunk.hunkStart : lineCount); j++) {
                    const line = this.model.getLineContent(j + 1);

                    let showLine = false;

                    if (line.startsWith('+')) {
                        showLine = true;
                        // 'add' overlay
                        if (!isLarge) {
                            decorations.push(this.createLineOverlay(j + 1, 'add'));
                        }
                    } else if (!isLarge && line.startsWith('-')) {
                        // if the line was removed from the current state
                        // then don't increase the line number
                        codeLine--;

                        // 'remove' overlay
                        decorations.push(this.createLineOverlay(j + 1, 'remove'));
                    }

                    // line number (only for current state)
                    if (showLine) {
                        this.createLineNumber(j, codeLine);
                    }

                    codeLine++;
                }

                // change hunk text to something more user-friendly
                this.model.applyEdits([{
                    text: 'Lines ' + hunk.hunkRightStart + '-' + (codeLine - 1) + ':',
                    range: new monaco.Range(hunk.hunkStart, 1, hunk.hunkStart, hunk.hunkLength + 1)
                }]);
            }

            this.decorations = this.monacoEditor.deltaDecorations(this.decorations, decorations);
        }

        renderDocument() {
            this.monacoEditor.setModel(this.model);
            this.setOptions();
            this.codePanel.toggleCode(true);
            this.createOverlays();

            setTimeout(() => {
                this.monacoEditor.focus();
            });
        }

        run() {
            editor.call('conflicts:getUnresolvedFile',
                config.self.branch.merge.id,
                config.self.branch.merge.conflict.id,
                config.self.branch.merge.conflict.mergedFilePath,
                (err, contents) => {
                    if (err) {
                        log.error(err);
                        editor.call('status:error', err);
                        return;
                    }

                    // stop highlighting if document is large
                    let mode = MODES[this.type];
                    if (contents.length > LARGE_FILE_SIZE) {
                        mode = 'text';
                    }

                    this.model = monaco.editor.createModel(contents, mode);
                    this.content = contents;
                    this.renderDocument();
                }
            );
        }
    }

    const diffEditor = new DiffEditor();
    diffEditor.run();
});
