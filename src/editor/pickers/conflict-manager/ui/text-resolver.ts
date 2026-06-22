import { Events } from '@playcanvas/observer';
import { Button, Container, Label, Menu, MenuItem } from '@playcanvas/pcui';

import { handleCallback } from '@/common/utils';

/**
 * Contains the UI for showing text conflicts using an i-framed code editor. Also contains buttons
 * to resolve the merged file.
 */
class TextResolver extends Events {
    private _mergeId: unknown;

    private _conflict: Record<string, unknown>;

    private _sourceBranchId: unknown;

    private _destBranchId: unknown;

    private _isDiff: unknown;

    private _panelTop: Container;

    private _labelStatus: Label;

    private _textualMergeConflict: Record<string, unknown> | null = null;

    private _btnMarkResolved: Button;

    private _btnActions: Button;

    private _menuActions: Menu;

    private _btnUseSource: MenuItem;

    private _btnUseDest: MenuItem;

    private _btnRevert: MenuItem;

    private _btnNextConflict: Button;

    private _btnPrevConflict: Button;

    private _btnGoBack: Button;

    private _iframe: HTMLIFrameElement;

    private _panelStatus: Container;

    private _sourceFile: string | null = null;

    private _destFile: string | null = null;

    private _unresolvedFile: string | null = null;

    private _savedContent: string | null = null;

    private _saving = false;

    private _evtContentChange: { dispose: () => void } | null = null;

    /**
     * Create a new TextResolver.
     *
     * @param conflict - The conflict group
     * @param mergeObject - The merge object
     */
    constructor(conflict: Record<string, unknown>, mergeObject: Record<string, unknown>) {
        super();

        this._mergeId = mergeObject.id;
        this._conflict = conflict;
        this._sourceBranchId = mergeObject.sourceBranchId;
        this._destBranchId = mergeObject.destinationBranchId;

        this._isDiff = mergeObject.isDiff;

        this._panelTop = new Container({ class: 'vc-merge-editor-top' });
        this._panelTop.hidden = true;

        const info = new Container({ class: 'vc-merge-editor-file' });
        const labelName = new Label({ class: 'name', text: `${conflict.itemName ?? ''}` });
        info.append(labelName);
        this._labelStatus = new Label({ class: 'sub', text: 'Loading text conflict' });
        info.append(this._labelStatus);
        this._panelTop.append(info);

        // find textual merge conflict
        for (let i = 0; i < conflict.data.length; i++) {
            if (conflict.data[i].isTextualMerge) {
                this._textualMergeConflict = conflict.data[i];
                break;
            }
        }

        const actions = new Container({ class: 'vc-merge-editor-actions' });
        this._panelTop.append(actions);

        this._btnGoBack = new Button({
            text: this._isDiff ? 'View asset changes' : 'Back to changes',
            class: 'vc-merge-editor-secondary'
        });
        this._btnGoBack.hidden = !!this._textualMergeConflict && conflict.data.length <= 1;
        this._btnGoBack.on('click', this._onClickGoBack.bind(this));
        actions.append(this._btnGoBack);

        this._btnActions = new Button({
            icon: 'E235',
            class: ['vc-merge-editor-secondary', 'icon']
        });
        this._btnActions.hidden = this._isDiff;
        this._btnActions.dom.title = 'Conflict actions';
        this._btnActions.on('click', this._onClickActions.bind(this));
        actions.append(this._btnActions);

        this._menuActions = new Menu({ class: 'version-control' });
        editor.call('layout.root').append(this._menuActions);
        this._menuActions.on('hide', () => {
            this._btnActions.class.remove('active');
        });

        this._btnUseDest = new MenuItem({
            text: 'Use destination',
            onSelect: this._onClickUseDest.bind(this)
        });
        this._menuActions.append(this._btnUseDest);

        this._btnUseSource = new MenuItem({
            text: 'Use source',
            onSelect: this._onClickUseSource.bind(this)
        });
        this._menuActions.append(this._btnUseSource);

        this._btnRevert = new MenuItem({
            text: 'Revert',
            onSelect: this._onClickRevert.bind(this)
        });
        this._menuActions.append(this._btnRevert);

        this._btnPrevConflict = new Button({
            icon: 'E162',
            class: ['vc-merge-editor-secondary', 'icon']
        });
        this._btnPrevConflict.dom.title = 'Previous conflict';
        this._btnPrevConflict.hidden = this._isDiff;
        this._btnPrevConflict.on('click', this._onClickPrev.bind(this));
        actions.append(this._btnPrevConflict);

        this._btnNextConflict = new Button({
            icon: 'E164',
            class: ['vc-merge-editor-secondary', 'icon']
        });
        this._btnNextConflict.dom.title = 'Next conflict';
        this._btnNextConflict.hidden = this._isDiff;
        this._btnNextConflict.on('click', this._onClickNext.bind(this));
        actions.append(this._btnNextConflict);

        this._btnMarkResolved = new Button({
            text: 'Mark resolved',
            class: 'vc-merge-editor-primary'
        });
        this._btnMarkResolved.hidden = this._isDiff;
        this._btnMarkResolved.on('click', this._onClickMarkResolved.bind(this));
        actions.append(this._btnMarkResolved);

        this._iframe = document.createElement('iframe');
        this._iframe.classList.add('vc-merge-frame');
        this._iframe.addEventListener('load', () => {
            this._panelTop.hidden = false;
            this._evtContentChange = this._codeEditorMethod('editor:merge:onContentChange', this._onContentChange.bind(this));
            this._updateStatus();
            this._syncMarkResolved();
        });

        this._iframe.src = `/editor/code/${config.project.id}?mergeId=${this._mergeId}&conflictId=${this._textualMergeConflict.id}&assetType=${this._conflict.assetType}&mergedFilePath=${this._textualMergeConflict.mergedFilePath}`;

        this._panelStatus = new Container({ class: 'vc-merge-editor-status' });
        const dot = document.createElement('span');
        dot.className = 'dot';
        this._panelStatus.dom.appendChild(dot);
        const status = new Label({ class: 'status', text: 'Resolve conflict markers, then mark this file resolved.' });
        this._panelStatus.append(status);
    }

    appendToParent(parent: { append: (el: unknown) => void }) {
        parent.append(this._panelTop.dom);
        parent.append(this._iframe);
        parent.append(this._panelStatus.dom);
    }

    destroy() {
        if (this._evtContentChange) {
            this._evtContentChange.dispose();
        }
        this._panelTop.destroy();
        this._panelStatus.destroy();
        this._menuActions.destroy();
        if (this._iframe.parentElement) {
            this._iframe.parentElement.removeChild(this._iframe);
        }

        this._panelTop = null;
        this._panelStatus = null;
        this._menuActions = null;
        this._iframe = null;
        this._evtContentChange = null;
    }

    _codeEditorMethod(method: string, arg1?: unknown, arg2?: unknown, arg3?: unknown, arg4?: unknown) {
        return this._iframe.contentWindow.editor.call(method, arg1, arg2, arg3, arg4);
    }

    _setContent(content: string) {
        this._codeEditorMethod('editor:merge:setContent', content);
        this._onContentChange();
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
        this._saving = true;
        this._toggleButtons(false);

        const content = this._codeEditorMethod('editor:merge:getContent');
        const file = new Blob([content]);
        handleCallback(editor.api.globals.rest.conflicts.conflictsUpload({
            conflictId: this._textualMergeConflict.id,
            file
        }), (err) => {
            this._saving = false;
            if (err) {
                this._toggleButtons(true);
                log.error(err);
                return;
            }

            this._textualMergeConflict.useMergedFile = true;
            this.emit('resolve', this._textualMergeConflict.id, {
                useMergedFile: true
            });
            this._setResolved(content);
            this._toggleButtons(true);

        });
    }

    _toggleButtons(toggle: boolean) {
        this._btnGoBack.enabled = toggle;
        this._btnActions.enabled = toggle;
        this._btnRevert.enabled = toggle;
        this._btnUseDest.enabled = toggle;
        this._btnUseSource.enabled = toggle;
        this._btnPrevConflict.enabled = toggle;
        this._btnNextConflict.enabled = toggle;
        this._syncMarkResolved(toggle);
    }

    _onClickActions() {
        const btnRect = this._btnActions.dom.getBoundingClientRect();
        this._menuActions.hidden = false;
        this._btnActions.class.add('active');
        const menuRect = this._menuActions.dom.querySelector('.pcui-menu-items').getBoundingClientRect();
        this._menuActions.position(btnRect.right - menuRect.width, btnRect.bottom);
    }

    _updateStatus() {
        const conflicts = this._codeEditorMethod('editor:merge:getNumberOfConflicts');
        this._labelStatus.text = conflicts === 1 ? '1 conflict remaining' : `${conflicts} conflicts remaining`;
        this._panelStatus.class.remove('resolved');
    }

    _setResolved(content: string) {
        this._savedContent = content;
        this._labelStatus.text = 'File marked resolved';
        this._panelStatus.class.add('resolved');
        this._syncMarkResolved();
    }

    _syncMarkResolved(toggle: boolean = true) {
        if (!toggle || this._saving) {
            this._btnMarkResolved.enabled = false;
            return;
        }

        if (this._savedContent === null) {
            this._btnMarkResolved.enabled = true;
            return;
        }

        this._btnMarkResolved.enabled = this._codeEditorMethod('editor:merge:getContent') !== this._savedContent;
    }

    _onContentChange() {
        if (this._saving) {
            return;
        }

        if (this._savedContent === null) {
            this._updateStatus();
            this._syncMarkResolved();
            return;
        }

        const changed = this._codeEditorMethod('editor:merge:getContent') !== this._savedContent;
        this._btnMarkResolved.enabled = changed;
        this._labelStatus.text = changed ? 'Unsaved resolution changes' : 'File marked resolved';
        if (changed) {
            this._panelStatus.class.remove('resolved');
        } else {
            this._panelStatus.class.add('resolved');
        }
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
            this._setContent(this._sourceFile);
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
            this._setContent(this._sourceFile);
        });
    }

    _onClickUseDest() {
        if (this._destFile) {
            this._setContent(this._destFile);
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
            this._setContent(this._destFile);
        });
    }

    _onClickRevert() {
        if (this._unresolvedFile) {
            this._setContent(this._unresolvedFile);
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
            this._setContent(this._unresolvedFile);
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
