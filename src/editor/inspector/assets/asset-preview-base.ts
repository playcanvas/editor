import type { Observer } from '@playcanvas/observer';
import { Container, Label } from '@playcanvas/pcui';

const CLASS_ROOT = 'pcui-asset-preview';
const CLASS_CONTAINER = `${CLASS_ROOT}-container`;
const CLASS_CONTAINER_LARGE = `${CLASS_CONTAINER}-large`;
const CLASS_LABEL_NO_PREVIEW = `${CLASS_ROOT}-label-no-preview`;

class AssetInspectorPreviewBase extends Container {
    protected _dragging = false;

    protected _pointerId = -1;

    protected _previewElement: HTMLElement | null = null;

    private _noPreviewText: Label;

    private _hasPreview: boolean = false;

    private _domEvtPointerDown = (evt: PointerEvent) => this._onPointerDown(evt);

    private _domEvtPointerMove = (evt: PointerEvent) => this._onPointerMove(evt);

    private _domEvtPointerUp = (evt: PointerEvent) => this._onPointerUp(evt);

    private _domEvtPointerCancel = () => this._resetPointerState();

    constructor(args: Record<string, unknown>) {
        super(args);
        this.class.add(CLASS_CONTAINER);

        this._hasPreview = true;
        this._noPreviewText = new Label({ text: 'No preview available', class: CLASS_LABEL_NO_PREVIEW });
        this._noPreviewText.hidden = true;
        this.append(this._noPreviewText);
    }

    private get _eventTarget(): HTMLElement {
        return this._previewElement ?? this.dom;
    }

    setHasPreview(hasPreview: boolean) {
        if (this._hasPreview === hasPreview) {
            return;
        }
        this._hasPreview = hasPreview;
        this._noPreviewText.hidden = hasPreview;
        this.class.remove(CLASS_CONTAINER_LARGE);
    }

    _onPointerDown(evt: PointerEvent) {
        if (evt.button !== 0 || this._pointerId !== -1) {
            return;
        }

        evt.preventDefault();
        evt.stopPropagation();

        this._pointerId = evt.pointerId;
        (evt.currentTarget as HTMLElement).setPointerCapture(evt.pointerId);
    }

    _onPointerMove(evt: PointerEvent) {
        if (evt.pointerId !== this._pointerId) {
            return;
        }

        this._dragging = true;
    }

    _onPointerUp(evt: PointerEvent) {
        if (evt.pointerId !== this._pointerId) {
            return;
        }

        if (!this._dragging) {
            this._toggleSize();
        }

        this._resetPointerState();
    }

    private _resetPointerState() {
        this._pointerId = -1;
        this._dragging = false;
    }

    _toggleSize() {
        // When there is no preview, it would confuse the user if they are able to toggle the container size
        if (!this._hasPreview) {
            return;
        }

        this.class.toggle(CLASS_CONTAINER_LARGE);
    }

    link(_assets?: Observer[]) {
        this.unlink();

        const target = this._eventTarget;
        target.style.touchAction = 'none';
        target.addEventListener('pointerdown', this._domEvtPointerDown);
        target.addEventListener('pointermove', this._domEvtPointerMove);
        target.addEventListener('pointerup', this._domEvtPointerUp);
        target.addEventListener('pointercancel', this._domEvtPointerCancel);
        target.addEventListener('lostpointercapture', this._domEvtPointerCancel);
    }

    unlink() {
        super.unlink();

        const target = this._eventTarget;
        if (this._pointerId !== -1) {
            if (target.hasPointerCapture(this._pointerId)) {
                target.releasePointerCapture(this._pointerId);
            }
            this._resetPointerState();
        }
        target.removeEventListener('pointerdown', this._domEvtPointerDown);
        target.removeEventListener('pointermove', this._domEvtPointerMove);
        target.removeEventListener('pointerup', this._domEvtPointerUp);
        target.removeEventListener('pointercancel', this._domEvtPointerCancel);
        target.removeEventListener('lostpointercapture', this._domEvtPointerCancel);
    }
}

export { AssetInspectorPreviewBase };
