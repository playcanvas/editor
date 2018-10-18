editor.once('load', function () {
    'use strict';

    /**
     * Contains the UI for showing text conflicts using
     * an i-framed code editor. Also contains buttons to resolve
     * the merged file.
     * @param {Object} conflict The conflict group
     * @param {Object} mergeObject The merge object
     */
    var TextResolver = function (conflict, mergeObject) {
        Events.call(this);

        this._conflict = conflict;

        this._panelTop = new ui.Panel();
        this._panelTop.class.add('textmerge-top');
        this._panelTop.hidden = true;

        this._labelName = new ui.Label({
            text: conflict.itemName
        });
        this._labelName.class.add('name');
        this._labelName.renderChanges = false;
        this._panelTop.append(this._labelName);

        // find textual merge conflict
        this._textualMergeConflict = null;
        for (var i = 0; i < conflict.data.length; i++) {
            if (conflict.data[i].isTextualMerge) {
                this._textualMergeConflict = conflict.data[i];
                break;
            }
        }

        // button to mark resolved
        this._btnMarkResolved = new ui.Button({
            text: 'MARK AS RESOLVED'
        });
        this._btnMarkResolved.class.add('mark-resolved');
        this._btnMarkResolved.on('click', this._uploadResolved.bind(this));
        this._panelTop.append(this._btnMarkResolved);


        // button that opens dropdown menu
        this._btnUseAllFrom = new ui.Button({
            text: 'USE ALL FROM...'
        });
        this._btnUseAllFrom.class.add('use-all');
        this._panelTop.append(this._btnUseAllFrom);
        this._btnUseAllFrom.on('click', this._onClickUseAllFrom.bind(this));

        // revert all changes
        this._btnRevert = new ui.Button({
            text: 'REVERT CHANGES'
        });
        this._btnRevert.on('click', this._onClickRevert.bind(this));
        this._panelTop.append(this._btnRevert);

        // dropdown menu
        this._menu = new ui.Menu();
        this._menu.class.add('textmerge-dropdown');
        editor.call('layout.root').append(this._menu);

        // use all from source
        this._btnUseSource = new ui.MenuItem({
            icon: '&#58265;',
            text: 'tiksdflsdjf ldksfj sladfkads fsldfjdslkfldskafadslkfjads'//mergeObject.sourceBranchName + '"'
        });
        this._menu.append(this._btnUseSource);
        this._btnUseSource.on('select', this._onClickUseSource.bind(this));

        // use all from dest
        this._btnUseDest = new ui.MenuItem({
            icon: '&#58265;',
            text: mergeObject.destinationBranchName
        });
        this._menu.append(this._btnUseDest);
        this._btnUseDest.on('select', this._onClickUseDest.bind(this));

        // go back to asset conflicts
        this._btnGoBack = new ui.Button({
            text: 'VIEW ASSET CONFLICTS'
        });
        // hide this button if there are only textual conflicts
        if (this._textualMergeConflict && conflict.data.length <= 1)  {
            // this._btnGoBack.hidden = true;
        }

        this._btnGoBack.class.add('go-back');
        this._panelTop.append(this._btnGoBack);
        this._btnGoBack.on('click', this._onClickGoBack.bind(this));

        this._iframe = document.createElement('iframe');
        this._iframe.addEventListener('load', function () {
            this._panelTop.hidden = false;
        }.bind(this));

        this._iframe.src = '/editor/code/' + config.project.id + '?resolveConflict=' + this._textualMergeConflict.id;

        this._sourceFile = null;
        this._destFile = null;
        this._unresolvedFile = null;
    };

    TextResolver.prototype = Object.create(Events.prototype);

    TextResolver.prototype.appendToParent = function (parent) {
        parent.append(this._panelTop);
        parent.append(this._iframe);
    };

    TextResolver.prototype.destroy = function () {
        this._panelTop.destroy();
        if (this._iframe.parentElement) {
            this._iframe.parentElement.removeChild(this._iframe);
        }

        this._panelTop = null;
        this._iframe = null;
    };

    TextResolver.prototype._getCodeMirror = function () {
        return this._iframe.contentWindow.editor.call('editor:codemirror');
    };

    TextResolver.prototype._uploadResolved = function () {
        this._toggleButtons(false);

        this._btnMarkResolved.disabled = true;
        var content = this._getCodeMirror().getValue();
        var file = new Blob([content]);
        editor.call('conflicts:uploadResolvedFile', this._textualMergeConflict.id, file, function (err) {
            this._toggleButtons(true);
            this._btnMarkResolved.disabled = false;
            if (err) {
                console.error(err);
                return;
            }

            this._textualMergeConflict.useMergedFile = true;
            this.emit('resolve', this._textualMergeConflict.id, {
                useMergedFile: true
            });

        }.bind(this));
    };

    TextResolver.prototype._toggleButtons = function (toggle) {
        this._btnGoBack.disabled = !toggle;
        this._btnMarkResolved.disabled = !toggle;
        this._btnUseAllFrom.disabled = !toggle;
        this._btnRevert.disabled = !toggle;
        this._btnUseDest.disabled = !toggle;
        this._btnUseSource.disabled = !toggle;
    };

    TextResolver.prototype._onClickUseAllFrom = function () {
        this._menu.open = !this._menu.open;
        requestAnimationFrame(function () {
            var menuRect = this._menu.innerElement.getBoundingClientRect();
            var btnRect = this._btnUseAllFrom.element.getBoundingClientRect();
            this._menu.position(btnRect.left - (menuRect.width - btnRect.width), btnRect.bottom);
        }.bind(this));
    };

    TextResolver.prototype._onClickGoBack = function () {
        var cm = this._getCodeMirror();
        if (!cm.isClean()) {
            editor.call('picker:confirm', 'Your changes will not be saved unless you hit "Mark As Resolved". Are you sure you want to go back?', function () {
                this.emit('close');
            }.bind(this));
        } else {
            this.emit('close');
        }
    };

    TextResolver.prototype._onClickUseSource = function () {
        if (this._sourceFile) {
            this._getCodeMirror().setValue(this._sourceFile);
            return;
        }

        this._toggleButtons(false);

        editor.call('checkpoints:getAssetFile', this._conflict.itemId, this._conflict.srcImmutableBackup, this._conflict.srcFilename, function (err, data) {
            this._toggleButtons(true);

            if (err) {
                return editor.call('status:error', err);
            }

            this._sourceFile = data;
            this._getCodeMirror().setValue(this._sourceFile);

        }.bind(this));
    };

    TextResolver.prototype._onClickUseDest = function () {

        if (this._destFile) {
            this._getCodeMirror().setValue(this._destFile);
            return;
        }

        this._toggleButtons(false);
        editor.call('checkpoints:getAssetFile', this._conflict.itemId, this._conflict.dstImmutableBackup, this._conflict.dstFilename, function (err, data) {
            this._toggleButtons(true);

            if (err) {
                return editor.call('status:error', err);
            }

            this._destFile = data;
            this._getCodeMirror().setValue(this._destFile);

        }.bind(this));

    };

    TextResolver.prototype._onClickRevert = function () {
        if (this._unresolvedFile) {
            this._getCodeMirror().setValue(this._unresolvedFile);
            return;
        }

        this._toggleButtons(false);

        editor.call('conflicts:getUnresolvedFile', this._textualMergeConflict.id, function (err, data) {
            this._toggleButtons(true);
            if (err) {
                return editor.call('status:error', err);
            }

            this._unresolvedFile = data;
            this._getCodeMirror().setValue(this._unresolvedFile);
        }.bind(this));
    };

    window.ui.TextResolver = TextResolver;
});
