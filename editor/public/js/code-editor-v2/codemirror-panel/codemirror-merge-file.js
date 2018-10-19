editor.once('load', function () {
    'use strict';

    if (! editor.call('editor:resolveConflictMode')) return;

    var MODES = {
        script: 'javascript',
        json: 'javascript',
        html: 'htmlmixed',
        css: 'css',
        shader: 'glsl'
    };

    var REGEX_DST_BRANCH = /(.*?<<<<<<<[\s\S]*?)=======.*?$/gm;
    var REGEX_SRC_BRANCH = /.*?=======.*?\n([\s\S]*?>>>>>>>.*?$)/gm; // eslint-disable-line no-div-regex

    var MergeFileEditor = function () {
        this.type = config.self.branch.merge.conflict.assetType;
        this.codePanel = editor.call('layout.code');
        this.ternLoaded = false;
        this.cm = editor.call('editor:codemirror');
        this.doc = null;
        this.overlays = [];
        this.timeoutRefreshOverlays = null;

        editor.once('tern:load', this.onTernLoaded.bind(this));
    };

    MergeFileEditor.prototype.onTernLoaded = function () {
        this.ternLoaded = true;
        if (this.doc) {
            this.renderDocument();
        }
    };

    MergeFileEditor.prototype.setOptions = function () {
        // change mode options
        if (this.type === 'text') {
            this.cm.setOption('lineWrapping', true);
            this.cm.setOption('foldGutter', false);
            this.cm.setOption('gutters', ['CodeMirror-pc-gutter']);
        } else {
            this.cm.setOption('lineWrapping', false);
            this.cm.setOption('foldGutter', true);
            this.cm.setOption('gutters', ['CodeMirror-lint-markers', 'CodeMirror-foldgutter']);
        }

        if (this.type === 'script') {
            this.cm.setOption('lint', true);
        } else {
            this.cm.setOption('lint', false);
        }

        this.cm.setOption('readOnly', false);
        this.cm.setOption('cursorBlinkRate', 530);

        this.cm.on('change', this.deferredRefreshOverlays.bind(this));

        this.cm.refresh();
    };

    MergeFileEditor.prototype.initializeTern = function () {
        var tern = editor.call('tern');
        var cm = this.cm;
        cm.on("cursorActivity", function (cm) {
            tern.updateArgHints(cm);
        });

        var completeTimeout = null;
        var doComplete = function () {
            tern.complete(cm);
        };

        var wordChar = /\w/;
        var shouldComplete = function (e) {
            // auto complete on '.' or word chars
            return !e.ctrlKey && !e.altKey && !e.metaKey && (e.keyCode === 190 || (e.key && e.key.length === 1 && wordChar.test(e.key)));
        };

        // auto complete on keydown after a bit
        // so that we have the chance to cancel autocompletion
        // if a non-word character was inserted (e.g. a semicolon).
        // Otherwise we might quickly type semicolon and get completions
        // afterwards (because it's async) and that's not what we want.
        this.cm.on("keydown", function (cm, e) {
            var complete = shouldComplete(e);
            if (! complete && completeTimeout) {
                clearTimeout(completeTimeout);
                completeTimeout = null;
            } else if (complete) {
                completeTimeout = setTimeout(doComplete, 150);
            }
        });
    };

    MergeFileEditor.prototype.createOverlay = function (className, branchName, startPos, endPos, reverse) {
        // var header = document.createElement('div');
        // header.classList.add('conflict-overlay');
        // header.classList.add('conflict-overlay-header');
        // header.classList.add(className);

        // var btnUse = new ui.Button({
        //     text: 'USE ME'
        // });
        // header.appendChild(btnUse.element);

        var label = new ui.Label({
            text: branchName
        });

        var content = document.createElement('div');
        content.classList.add('conflict-overlay');
        content.classList.add('conflict-overlay-content');
        content.classList.add(className);
        content.appendChild(label.element);

        var height = this.cm.heightAtLine(endPos.line) - this.cm.heightAtLine(startPos.line);
        content.style.height = height + 'px';

        // this.overlays.push(header);
        this.overlays.push(content);

        if (reverse) {
            // header.classList.add('reverse');
            // header.style.marginTop = height + 'px';
            this.cm.addWidget(startPos, content);
            // this.cm.addWidget(startPos, header);
        } else {
            // this.cm.addWidget(startPos, header);
            this.cm.addWidget(startPos, content);
        }
    };

    MergeFileEditor.prototype.createDstOverlays = function () {
        var content = this.cm.getValue();

        var match;
        while ((match = REGEX_DST_BRANCH.exec(content)) !== null) {
            var startPos = this.cm.posFromIndex(match.index);
            startPos.line--;
            var endPos = this.cm.posFromIndex(match.index + match[1].length);
            endPos.line--;

            this.createOverlay('dst-branch', config.self.branch.merge.destinationBranchName, startPos, endPos);
        }
    };

    MergeFileEditor.prototype.createSrcOverlays = function () {
        var content = this.cm.getValue();

        var match;
        while ((match = REGEX_SRC_BRANCH.exec(content)) !== null) {
            var startPos = this.cm.posFromIndex(match.index);
            var endPos = this.cm.posFromIndex(match.index + match[1].length);
            this.createOverlay('src-branch', config.self.branch.merge.sourceBranchName, startPos, endPos, true);
        }
    };

    MergeFileEditor.prototype.refreshOverlays = function () {
        this.timeoutRefreshOverlays = null;

        // clear existing overlays
        for (var i = 0; i < this.overlays.length; i++) {
            this.overlays[i].parentElement.removeChild(this.overlays[i]);
        }
        this.overlays.length = 0;

        this.createDstOverlays();
        this.createSrcOverlays();
    };

    MergeFileEditor.prototype.deferredRefreshOverlays = function () {
        if (this.timeoutRefreshOverlays) return;
        this.timeoutRefreshOverlays = setTimeout(this.refreshOverlays.bind(this), 300);
    };

    MergeFileEditor.prototype.renderDocument = function () {
        this.cm.swapDoc(this.doc);
        this.setOptions();
        this.codePanel.toggleCode(true);
        this.refreshOverlays();

        // // update hints on cursor activity
        // // if we are editing a script
        if (this.type === 'script') {
            this.initializeTern();
        }

        setTimeout(function () {
            this.cm.focus();
        }.bind(this));
    };

    MergeFileEditor.prototype.run = function () {
        // if the conflict is resolved then get the resolved file otherwise get the unresolved file
        var conflict = config.self.branch.merge.conflict;
        var isResolved = conflict.useSrc || conflict.useDst || conflict.useMergedFile;
        var method = isResolved ? 'conflicts:getResolvedFile' : 'conflicts:getUnresolvedFile';
        editor.call(method, config.resolveConflict, function (err, contents) {
            if (err) {
                console.error(err);
                editor.call('status:error', err);
                return;
            }

            this.doc = CodeMirror.Doc(contents, MODES[this.type]);
            if (this.ternLoaded) {
                this.renderDocument();
            }
        }.bind(this));
    };

    var mergeFileEditor = new MergeFileEditor();
    mergeFileEditor.run();

    editor.method('dis', function () {
        mergeFileEditor.refreshOverlays();
    });
});
