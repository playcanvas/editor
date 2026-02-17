import { Container, Button, Label } from '@playcanvas/pcui';

const CLASS_ROOT = 'pcui-asset-preview';
const CLASS_CONTAINER = `${CLASS_ROOT}-container`;
const CLASS_CONTAINER_LARGE = `${CLASS_CONTAINER}-large`;
const CLASS_LABEL_NO_PREVIEW = `${CLASS_ROOT}-label-no-preview`;

class AssetInspectorPreviewBase extends Container {
    protected _dragging = false;

    protected _mouseDown = false;

    private _noPreviewText: Label;

    private _hasPreview: boolean = false;

    constructor(args: Record<string, unknown>) {
        super(args);
        this.class.add(CLASS_CONTAINER);

        this._hasPreview = true;
        this._noPreviewText = new Label({ text: 'No preview available', class: CLASS_LABEL_NO_PREVIEW });
        this._noPreviewText.hidden = true;
        this.append(this._noPreviewText);

        this._domEvtMouseDown = this._onMouseDown.bind(this);
        this._domEvtMouseMove = this._onMouseMove.bind(this);
        this._domEvtMouseUp = this._onMouseUp.bind(this);
    }

    setHasPreview(hasPreview: boolean) {
        if (this._hasPreview === hasPreview) {
            return;
        }
        this._hasPreview = hasPreview;
        this._noPreviewText.hidden = hasPreview;
        this.class.remove(CLASS_CONTAINER_LARGE);
    }

    _onMouseDown(evt: MouseEvent) {
        if (evt.button !== 0) {
            return;
        }

        evt.preventDefault();
        evt.stopPropagation();

        this._mouseDown = true;
    }

    _onMouseMove(evt: MouseEvent) {
        if (!this._mouseDown) {
            return;
        }

        this._dragging = true;
    }

    _onMouseUp(evt: MouseEvent) {
        if (evt.button !== 0) {
            return;
        }

        if (this._mouseDown && !this._dragging && this.dom.contains(evt.target) && !(evt.target.ui instanceof Button)) {
            this._toggleSize();
        }

        this._mouseDown = false;
        this._dragging = false;
    }

    _toggleSize() {
        // When there is no preview, it would confuse the user if they are able to toggle the container size
        if (!this._hasPreview) {
            return;
        }

        this.class.toggle(CLASS_CONTAINER_LARGE);
    }

    link() {
        this.unlink();

        this.dom.addEventListener('mousedown', this._domEvtMouseDown);
        window.addEventListener('mousemove', this._domEvtMouseMove);
        window.addEventListener('mouseup', this._domEvtMouseUp);
    }

    unlink() {
        super.unlink();

        this.dom.removeEventListener('mousedown', this._domEvtMouseDown);
        window.removeEventListener('mousemove', this._domEvtMouseMove);
        window.removeEventListener('mouseup', this._domEvtMouseUp);
    }
}

export { AssetInspectorPreviewBase };
