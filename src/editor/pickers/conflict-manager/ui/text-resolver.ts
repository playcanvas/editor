import { Events } from '@playcanvas/observer';

import { LegacyButton } from '../../../../common/ui/button';
import { LegacyLabel } from '../../../../common/ui/label';
import { LegacyMenu } from '../../../../common/ui/menu';
import { LegacyMenuItem } from '../../../../common/ui/menu-item';
import { LegacyPanel } from '../../../../common/ui/panel';
import { handleCallback } from '../../../../common/utils';

/**
 * Contains the UI for showing text conflicts using an i-framed code editor. Also contains buttons
 * to resolve the merged file.
 */
class TextResolver extends Events {
    /**
     * Create a new TextResolver.
     *
     * @param {object} conflict - The conflict group
     * @param {object} mergeObject - The merge object
     */
    constructor(conflict, mergeObject) {
        super();

        this._mergeId = mergeObject.id;
        this._conflict = conflict;
        this._sourceBranchId = mergeObject.sourceBranchId;
        this._destBranchId = mergeObject.destinationBranchId;

        this._isDiff = mergeObject.isDiff;

        this._panelTop = new LegacyPanel();
        this._panelTop.class.add('textmerge-top');
        this._panelTop.hidden = true;

        this._labelName = new LegacyLabel({
            text: conflict.itemName
        });
        this._labelName.class.add('name');
        this._labelName.renderChanges = false;
        this._panelTop.append(this._labelName);

        // find textual merge conflict
        this._textualMergeConflict = null;
        for (let i = 0; i < conflict.data.length; i++) {
            if (conflict.data[i].isTextualMerge) {
                this._textualMergeConflict = conflict.data[i];
                break;
            }
        }

        // button to mark resolved
        this._btnMarkResolved = new LegacyButton({
            text: 'MARK AS RESOLVED'
        });
        this._btnMarkResolved.class.add('mark-resolved');
        this._btnMarkResolved.on('click', this._onClickMarkResolved.bind(this));
        this._btnMarkResolved.hidden = this._isDiff;
        this._panelTop.append(this._btnMarkResolved);

        // button that opens dropdown menu
        this._btnUseAllFrom = new LegacyButton({
            text: 'USE ALL FROM...'
        });
        this._btnUseAllFrom.class.add('use-all');
        this._panelTop.append(this._btnUseAllFrom);
        this._btnUseAllFrom.on('click', this._onClickUseAllFrom.bind(this));
        this._btnUseAllFrom.hidden = this._isDiff;

        // revert all changes
        this._btnRevert = new LegacyButton({
            text: 'REVERT CHANGES'
        });
        this._btnRevert.on('click', this._onClickRevert.bind(this));
        this._panelTop.append(this._btnRevert);
        this._btnRevert.hidden = this._isDiff;

        // dropdown menu
        this._menu = new LegacyMenu();
        this._menu.class.add('textmerge-dropdown');
        editor.call('layout.root').append(this._menu);

        // use all from source
        this._btnUseSource = new LegacyMenuItem({
            icon: '&#58265;',
            text: mergeObject.sourceBranchName
        });
        this._menu.append(this._btnUseSource);
        this._btnUseSource.on('select', this._onClickUseSource.bind(this));

        // use all from dest
        this._btnUseDest = new LegacyMenuItem({
            icon: '&#58265;',
            text: mergeObject.destinationBranchName
        });
        this._menu.append(this._btnUseDest);
        this._btnUseDest.on('select', this._onClickUseDest.bind(this));

        // go to next conflict
        this._btnNextConflict = new LegacyButton({
            text: 'NEXT'
        });
        this._btnNextConflict.class.add('go-to-next');
        this._panelTop.append(this._btnNextConflict);
        this._btnNextConflict.on('click', this._onClickNext.bind(this));
        this._btnNextConflict.hidden = this._isDiff;

        // go to prev conflict
        this._btnPrevConflict = new LegacyButton({
            text: 'PREV'
        });
        this._btnPrevConflict.class.add('go-to-prev');
        this._panelTop.append(this._btnPrevConflict);
        this._btnPrevConflict.on('click', this._onClickPrev.bind(this));
        this._btnPrevConflict.hidden = this._isDiff;

        // go back to asset conflicts
        this._btnGoBack = new LegacyButton({
            text: this._isDiff ? 'VIEW ASSET CHANGES' : 'VIEW ASSET CONFLICTS'
        });
        // hide this button if there are only textual conflicts
        if (this._textualMergeConflict && conflict.data.length <= 1)  {
            this._btnGoBack.hidden = true;
        }

        this._btnGoBack.class.add('go-back');
        this._panelTop.append(this._btnGoBack);
        this._btnGoBack.on('click', this._onClickGoBack.bind(this));

        this._iframe = document.createElement('iframe');
        this._iframe.addEventListener('load', () => {
            this._panelTop.hidden = false;
        });

        this._iframe.src = `/editor/code/${config.project.id}?mergeId=${this._mergeId}&conflictId=${this._textualMergeConflict.id}&assetType=${this._conflict.assetType}&mergedFilePath=${this._textualMergeConflict.mergedFilePath}`;

        this._sourceFile = null;
        this._destFile = null;
        this._unresolvedFile = null;
    }

    appendToParent(parent) {
        parent.append(this._panelTop);
        parent.append(this._iframe);
    }

    destroy() {
        this._panelTop.destroy();
        if (this._iframe.parentElement) {
            this._iframe.parentElement.removeChild(this._iframe);
        }

        this._panelTop = null;
        this._iframe = null;
    }

    _codeEditorMethod(method, arg1, arg2, arg3, arg4) {
        return this._iframe.contentWindow.editor.call(method, arg1, arg2, arg3, arg4);
    }

    _onClickMarkResolved() {
        const hasMoreConflicts = this._codeEditorMethod('editor:merge:getNumberOfConflicts') > 0;
        if (hasMoreConflicts) {
            editor.call(
                'picker:confirm',
                'There are more unresolved conflicts in this file. Are you sure you want to mark it as resolved?',
                this._uploadResolved.bind(this)
            );
        } else {
            this._uploadResolved();
        }
    }

    _uploadResolved() {
        this._toggleButtons(false);

        this._btnMarkResolved.disabled = true;
        const content = this._codeEditorMethod('editor:merge:getContent');
        const file = new Blob([content]);
        handleCallback(editor.api.globals.rest.conflicts.conflictsUpload({
            conflictId: this._textualMergeConflict.id,
            file
        }), (err) => {
            this._toggleButtons(true);
            this._btnMarkResolved.disabled = false;
            if (err) {
                log.error(err);
                return;
            }

            this._textualMergeConflict.useMergedFile = true;
            this.emit('resolve', this._textualMergeConflict.id, {
                useMergedFile: true
            });

        });
    }

    _toggleButtons(toggle) {
        this._btnGoBack.disabled = !toggle;
        this._btnMarkResolved.disabled = !toggle;
        this._btnUseAllFrom.disabled = !toggle;
        this._btnRevert.disabled = !toggle;
        this._btnUseDest.disabled = !toggle;
        this._btnUseSource.disabled = !toggle;
    }

    _onClickUseAllFrom() {
        this._menu.open = !this._menu.open;
        requestAnimationFrame(() => {
            const menuRect = this._menu.innerElement.getBoundingClientRect();
            const btnRect = this._btnUseAllFrom.element.getBoundingClientRect();
            this._menu.position(btnRect.left - (menuRect.width - btnRect.width), btnRect.bottom);
        });
    }

    _onClickGoBack() {
        if (!this._isDiff && this._codeEditorMethod('editor:merge:isDirty')) {
            editor.call('picker:confirm', 'Your changes will not be saved unless you hit "Mark As Resolved". Are you sure you want to go back?', () => {
                this.emit('close');
            });
        } else {
            this.emit('close');
        }
    }

    _onClickUseSource() {
        if (this._sourceFile) {
            this._codeEditorMethod('editor:merge:setContent', this._sourceFile);
            return;
        }

        this._toggleButtons(false);
        handleCallback(editor.api.globals.rest.assets.assetGetFile(this._conflict.itemId, this._conflict.srcFilename, {
            immutableBackup: this._conflict.srcImmutableBackup,
            branchId: this._sourceBranchId
        }), (err, data) => {
            this._toggleButtons(true);

            if (err) {
                return editor.call('status:error', err);
            }

            this._sourceFile = data;
            this._codeEditorMethod('editor:merge:setContent', this._sourceFile);
        });
    }

    _onClickUseDest() {
        if (this._destFile) {
            this._codeEditorMethod('editor:merge:setContent', this._destFile);
            return;
        }

        this._toggleButtons(false);
        handleCallback(editor.api.globals.rest.assets.assetGetFile(this._conflict.itemId, this._conflict.dstFilename, {
            immutableBackup: this._conflict.dstImmutableBackup,
            branchId: this._destBranchId
        }), (err, data) => {
            this._toggleButtons(true);

            if (err) {
                return editor.call('status:error', err);
            }

            this._destFile = data;
            this._codeEditorMethod('editor:merge:setContent', this._destFile);
        });
    }

    _onClickRevert() {
        if (this._unresolvedFile) {
            this._codeEditorMethod('editor:merge:setContent', this._unresolvedFile);
            return;
        }

        this._toggleButtons(false);

        handleCallback(editor.api.globals.rest.merge.mergeConflicts({
            mergeId: this._mergeId,
            conflictId: this._textualMergeConflict.id,
            fileName: this._textualMergeConflict.mergedFilePath,
            resolved: false
        }), (err, data) => {
            this._toggleButtons(true);
            if (err) {
                return editor.call('status:error', err);
            }

            this._unresolvedFile = data;
            this._codeEditorMethod('editor:merge:setContent', this._unresolvedFile);
        });
    }

    _onClickNext() {
        this._codeEditorMethod('editor:merge:goToNextConflict');
    }

    _onClickPrev() {
        this._codeEditorMethod('editor:merge:goToPrevConflict');
    }
}

export { TextResolver };
