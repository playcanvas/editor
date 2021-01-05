editor.once('load', function () {
    'use strict';

    if (!editor.call('editor:resolveConflictMode')) return;
    if (!config.self.branch.merge.isDiff) return;

    var MODES = {
        script: 'javascript',
        json: 'javascript',
        html: 'htmlmixed',
        css: 'css',
        shader: 'glsl'
    };

    var REGEX_HUNK = /^\@\@ -([0-9]+)(?:,[0-9]+)? \+([0-9]+)(?:,[0-9]+)? \@\@$/gm;

    var LARGE_FILE_SIZE = 1000000;

    var DiffEditor = function () {
        // the asset type
        this.type = config.self.branch.merge.conflict.assetType;
        this.codePanel = editor.call('layout.code');
        // code mirror instance
        this.cm = editor.call('editor:codemirror');
        // the Code Mirror document
        this.doc = null;
    };

    DiffEditor.prototype.setOptions = function () {
        // change mode options
        this.cm.setOption('lineWrapping', false);
        this.cm.setOption('foldGutter', false);
        this.cm.setOption('gutters', ['CodeMirror-pc-gutter']);
        this.cm.setOption('lint', false);
        this.cm.setOption('readOnly', true);
        this.cm.setOption('lineNumbers', false);

        this.cm.refresh();
    };

    DiffEditor.prototype.createLineOverlay = function (line, cls) {
        var height = this.cm.heightAtLine(line + 1) - this.cm.heightAtLine(line);
        var overlay = document.createElement('div');
        overlay.style.height = height + 'px';
        overlay.classList.add('conflict-overlay');
        overlay.classList.add('conflict-overlay-content');
        overlay.classList.add(cls);
        this.cm.addWidget({ ch: 0, line: line }, overlay);
    };

    DiffEditor.prototype.createLineNumber = function (cmLine, codeLine) {
        var lineDiv = document.createElement('div');
        lineDiv.classList.add('CodeMirror-linenumber');
        lineDiv.classList.add('CodeMirror-gutter-elt');
        lineDiv.innerHTML = codeLine;
        this.cm.setGutterMarker(cmLine, 'CodeMirror-pc-gutter', lineDiv);
    };

    DiffEditor.prototype.createOverlays = function () {
        var content = this.content;
        var isLarge = (content.length > LARGE_FILE_SIZE);
        var match;

        var hunk;
        var hunks = [];

        // get all hunks
        while ((match = REGEX_HUNK.exec(content)) !== null) {
            var pos = this.cm.posFromIndex(match.index);
            hunk = {
                hunkStart: pos.line,
                hunkLength: match[0].length,
                hunkLeftStart: parseInt(match[1], 10),
                hunkRightStart: parseInt(match[2], 10)
            };

            // add lines for each hunk to the array
            hunks.push(hunk);
        }

        // iterate all lines and add overlays on each line
        // depending on the line contents
        var lineCount = this.cm.lineCount();

        this.cm.operation(() => {
            for (var i = 0, len = hunks.length; i < len; i++) {
                hunk = hunks[i];

                var nextHunk = hunks[i + 1];
                var codeLine = hunk.hunkRightStart;

                // hunk overlay
                this.createLineOverlay(hunk.hunkStart - 1, 'hunk');

                for (var j = hunk.hunkStart + 1; j < (nextHunk ? nextHunk.hunkStart : lineCount); j++) {
                    var line = this.cm.getLine(j);

                    var showLine = false;

                    if (line.startsWith('+')) {
                        showLine = true;
                        // 'add' overlay
                        if (!isLarge) {
                            this.createLineOverlay(j - 1, 'add');
                        }
                    } else if (!isLarge && line.startsWith('-')) {
                        // if the line was removed from the current state
                        // then don't increase the line number
                        codeLine--;

                        // 'remove' overlay
                        this.createLineOverlay(j - 1, 'remove');
                    }

                    // line number (only for current state)
                    if (showLine) {
                        this.createLineNumber(j, codeLine);
                    }

                    codeLine++;
                }

                // change hunk text to something more user-friendly
                this.cm.replaceRange(
                    'Lines ' + hunk.hunkRightStart + '-' + (codeLine - 1) + ':',
                    { line: hunk.hunkStart, ch: 0 },
                    { line: hunk.hunkStart, ch: hunk.hunkLength }
                );
            }
        });
    };


    DiffEditor.prototype.renderDocument = function () {
        this.cm.swapDoc(this.doc);
        this.setOptions();
        this.codePanel.toggleCode(true);
        this.createOverlays();

        setTimeout(function () {
            this.cm.focus();
        }.bind(this));

        // Subscribe to font size changes so that we can resize the red/green widgets
        var settings = editor.call('editor:settings');
        settings.on('ide.fontSize:set', function (value) {
            // As we want to wait for the font size to be set in the CM editor
            // wait for the next frame before adding the overlays
            setTimeout(function () {
                // Clear the line caches so we don't use the old measurements
                // for line heights etc
                this.cm.refresh();
                var rootDom = this.cm.display.sizer;
                var overlays = rootDom.getElementsByClassName('conflict-overlay');
                for (var i = overlays.length - 1; i >= 0; --i) {
                    rootDom.removeChild(overlays[i]);
                }
                this.createOverlays();
            }.bind(this));
        }.bind(this));
    };

    DiffEditor.prototype.run = function () {
        editor.call('conflicts:getUnresolvedFile',
            config.self.branch.merge.id,
            config.self.branch.merge.conflict.id,
            config.self.branch.merge.conflict.mergedFilePath,
            function (err, contents) {
                if (err) {
                    log.error(err);
                    editor.call('status:error', err);
                    return;
                }

                // stop highlighting if document is larger than 1MB
                let mode = MODES[this.type];
                if (contents.length > LARGE_FILE_SIZE) {
                    mode = 'text';
                }

                this.doc = CodeMirror.Doc(contents, mode);
                this.content = contents;
                this.renderDocument();
            }.bind(this)
        );
    };

    var diffEditor = new DiffEditor();
    diffEditor.run();
});
