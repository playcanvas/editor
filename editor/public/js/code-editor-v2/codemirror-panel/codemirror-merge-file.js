editor.once('load', function () {
    'use strict';

    if (! editor.call('editor:resolveConflictMode')) return;
    if (config.self.branch.merge.isDiff) return;

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
        // the asset type
        this.type = config.self.branch.merge.conflict.assetType;
        this.codePanel = editor.call('layout.code');
        // whether tern finished loading
        this.ternLoaded = false;
        // code mirror instance
        this.cm = editor.call('editor:codemirror');
        // the Code Mirror document
        this.doc = null;
        // The overlay HTML elements
        this.overlays = [];
        // Each group contains a src and dest overlay or just one of them
        // Each group essentially represents a conflict that could have just
        // the source, dest or both portions
        this.overlayGroups = [];
        // timeout for refreshing overlay elements
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
        content.pos = this.cm.indexFromPos({
            line: startPos.line + 1,
            ch: 0
        });

        // this.overlays.push(header);
        this.overlays.push(content);

        // position label on the right of the current viewport
        content.positionLabel = function () {
            var scrollInfo = this.cm.getScrollInfo();
            var margin = 20;
            var right = Math.max(scrollInfo.width - scrollInfo.clientWidth - scrollInfo.left + margin, 0);
            label.style.right = right + 'px';
        }.bind(this);

        content.positionLabel();
        this.cm.on('scroll', content.positionLabel);

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

    // Creates groups out of the created overlays
    MergeFileEditor.prototype.rebuildOverlayGroups = function () {
        this.overlayGroups.length = 0;
        // sort overlays by position in code
        var sortedOverlays = this.overlays.slice().sort(function (a, b) {
            return a.pos - b.pos;
        });

        // creates a group
        function createOverlayGroup() {
            return {
                dest: null,
                src: null
            };
        }

        var currentGroup;
        for (var i = 0; i < sortedOverlays.length; i++) {
            if (!currentGroup) {
                currentGroup = createOverlayGroup();
            }

            // if this is a dest overlay then put it in the dest field
            // of the group
            if (sortedOverlays[i].classList.contains('dst-branch')) {
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
    };

    MergeFileEditor.prototype.refreshOverlays = function () {
        this.timeoutRefreshOverlays = null;

        // clear existing overlays
        for (var i = 0; i < this.overlays.length; i++) {
            this.cm.off('scroll', this.overlays[i].positionLabel);
            this.overlays[i].parentElement.removeChild(this.overlays[i]);
        }
        this.overlays.length = 0;

        this.createDstOverlays();
        this.createSrcOverlays();
        this.rebuildOverlayGroups();
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
            this.goToNextConflict(true);
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
                this.refreshOverlays();
            }.bind(this));
        }.bind(this));
    };

    // Moves cursor to the next conflict. Wraps around if needed
    MergeFileEditor.prototype.goToNextConflict = function (stayInCurrentConflictIfPossible) {
        var cm = this.cm;
        cm.focus();

        var len = this.overlayGroups.length;
        if (!len) {
            return;
        }

        var currentPos = cm.indexFromPos(cm.getCursor());
        var foundPos = null;
        for (var i = 0; i < len; i++) {
            var group = this.overlayGroups[i];
            var overlayPos = group.dest !== null ? group.dest : group.src;
            if (stayInCurrentConflictIfPossible && overlayPos >= currentPos || overlayPos > currentPos) {
                foundPos = overlayPos;
                break;
            }
        }

        if (foundPos === null) {
            var wrappedGroup = this.overlayGroups[0];
            foundPos = wrappedGroup.dest !== null ? wrappedGroup.dest : wrappedGroup.src;
        }

        if (foundPos !== null) {
            var pos = cm.posFromIndex(foundPos);
            cm.setCursor(pos);
            cm.scrollIntoView(pos, 300);
        }
    };

    // Moves cursor to the previous conflict. Wraps around if needed
    MergeFileEditor.prototype.goToPrevConflict = function () {
        var cm = this.cm;
        cm.focus();

        var len = this.overlayGroups.length;
        if (!len) {
            return;
        }

        var currentPos = cm.indexFromPos(cm.getCursor());
        var foundPos = null;
        for (var i = len - 1; i >= 0; i--) {
            var group = this.overlayGroups[i];
            var overlayPos = group.dest !== null ? group.dest : group.src;
            if (overlayPos < currentPos) {
                foundPos = overlayPos;
                break;
            }
        }

        if (foundPos === null) {
            var wrappedGroup = this.overlayGroups[this.overlayGroups.length - 1];
            foundPos = wrappedGroup.dest !== null ? wrappedGroup.dest : wrappedGroup.src;
        }

        if (foundPos !== null) {
            var pos = cm.posFromIndex(foundPos);
            cm.setCursor(pos);
            cm.scrollIntoView(pos, 300);
        }
    };

    MergeFileEditor.prototype.run = function () {
        // if the conflict is resolved then get the resolved file otherwise get the unresolved file
        var conflict = config.self.branch.merge.conflict;
        var isResolved = conflict.useSrc || conflict.useDst || conflict.useMergedFile;
        var method = isResolved ? 'conflicts:getResolvedFile' : 'conflicts:getUnresolvedFile';
        editor.call(
            method,
            config.self.branch.merge.id,
            config.self.branch.merge.conflict.id,
            config.self.branch.merge.conflict.mergedFilePath,
            function (err, contents) {
                if (err) {
                    log.error(err);
                    editor.call('status:error', err);
                    return;
                }

                this.doc = CodeMirror.Doc(contents, MODES[this.type]);
                if (this.ternLoaded) {
                    this.renderDocument();
                }
            }.bind(this)
        );
    };

    var mergeFileEditor = new MergeFileEditor();
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
        return !mergeFileEditor.cm.isClean();
    });

    /**
     * Gets the current content of the code editor
     */
    editor.method('editor:merge:getContent', function () {
        return mergeFileEditor.cm.getValue();
    });

    /**
     * Sets the current content of the code editor
     */
    editor.method('editor:merge:setContent', function (value) {
        return mergeFileEditor.cm.setValue(value);
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
