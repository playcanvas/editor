import { Container, Button } from '@playcanvas/pcui';

const CLASS_ROOT = 'pcui-asset-preview';
const CLASS_CONTAINER = `${CLASS_ROOT}-container`;
const CLASS_CONTAINER_LARGE = `${CLASS_CONTAINER}-large`;

class AssetInspectorPreviewBase extends Container {
    constructor(args) {
        super(args);
        this.class.add(CLASS_CONTAINER);

        this._mouseDown = false;
        this._dragging = false;

        this._domEvtMouseDown = this._onMouseDown.bind(this);
        this._domEvtMouseMove = this._onMouseMove.bind(this);
        this._domEvtMouseUp = this._onMouseUp.bind(this);
    }

    _onMouseDown(evt) {
        if (evt.button !== 0) return;

        evt.preventDefault();
        evt.stopPropagation();

        this._mouseDown = true;
    }

    _onMouseMove(evt) {
        if (!this._mouseDown) return;

        this._dragging = true;
    }

    _onMouseUp(evt) {
        if (evt.button !== 0) return;

        if (this._mouseDown && !this._dragging && this.dom.contains(evt.target) && !(evt.target.ui instanceof Button)) {
            this._toggleSize();
        }

        this._mouseDown = false;
        this._dragging = false;
    }

    _toggleSize() {
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
