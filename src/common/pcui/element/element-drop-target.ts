import { Element, ElementArgs } from '@playcanvas/pcui';

import type { DropManager } from './element-drop-manager';

const CLASS_DROP_TARGET = 'pcui-droptarget';
const CLASS_DROP_TARGET_HOLE = `${CLASS_DROP_TARGET}-hole`;
const CLASS_DROP_TARGET_PASSTHROUGH = `${CLASS_DROP_TARGET}-passthrough`;
const CLASS_DROP_TARGET_DRAG_OVER = `${CLASS_DROP_TARGET}-dragover`;
const CLASS_DROP_TARGET_FRONT = `${CLASS_DROP_TARGET}-front`;

/**
 * The arguments for the {@link DropTarget} constructor.
 */
interface DropTargetArgs extends ElementArgs {
    /** The type of data that is valid for this drop target. */
    dropType?: string;
    /** The drop manager. */
    dropManager?: DropManager;
    /** If true then the drop target will be above other overlays and will receive drag drop events (unless passThrough is true). */
    hole?: boolean;
    /** If true then the drop target will not receive mouse events. */
    passThrough?: boolean;
    /** A function with signature (type, data) => bool that returns true if the dragged type and data is valid for this drop target. */
    onFilter?: (type: string, data: any) => boolean;
    /** A function with signature (type, data) => void that is called when something is dragged over the drop target. */
    onDragEnter?: (type: string, data: any) => void;
    /** A function with signature () => void that is called when something is no longer dragged over the drop target. */
    onDragLeave?: () => void;
    /** A function with signature (type, data) => void that is called when something is dropped over the drop target. */
    onDrop?: (type: string, data: any) => void;
}

/**
 * Defines an area where we can drag drop data.
 */
class DropTarget extends Element {
    private _onFilterFn?: ((type: string, data: any) => boolean) | null;

    private _onDragEnterFn?: ((type: string, data: any) => void) | null;

    private _onDragLeaveFn?: (() => void) | null;

    private _onDropFn?: ((type: string, data: any) => void) | null;

    private _domTargetElement: HTMLElement;

    private _dropType: string | null;

    private _dropManager: DropManager | null;

    private _hole?: boolean;

    private _passThrough?: boolean;

    private _domEventDragEnter: (evt: Event) => void;

    private _domEventDragLeave: (evt?: Event) => void;

    private _domEventDrop: (evt: Event) => void;

    constructor(targetElement: Element | HTMLElement, args: DropTargetArgs = {}) {
        super(args);

        this.class.add(CLASS_DROP_TARGET);

        this._onFilterFn = args.onFilter;
        this._onDragEnterFn = args.onDragEnter;
        this._onDragLeaveFn = args.onDragLeave;
        this._onDropFn = args.onDrop;

        // destroy drop target if its target element gets destroyed
        if (targetElement instanceof Element) {
            targetElement.once('destroy', this.destroy.bind(this));
        }

        this._domTargetElement = targetElement instanceof HTMLElement ? targetElement : targetElement.dom;

        this._dropType = args.dropType || null;

        this._dropManager = args.dropManager || null;

        this._hole = args.hole;
        if (this._hole) {
            this.class.add(CLASS_DROP_TARGET_HOLE);
        }

        this._passThrough = args.passThrough;
        if (this._passThrough) {
            this.class.add(CLASS_DROP_TARGET_PASSTHROUGH);
        }

        this._domEventDragEnter = this._onDragEnter.bind(this);
        this._domEventDragLeave = this._onDragLeave.bind(this);
        this._domEventDrop = this._onDrop.bind(this);

        this.dom.addEventListener('dragenter', this._domEventDragEnter);
        this.dom.addEventListener('mouseenter', this._domEventDragEnter);
        this.dom.addEventListener('dragleave', this._domEventDragLeave);
        this.dom.addEventListener('mouseleave', this._domEventDragLeave);

        if (this.passThrough) {
            this._domTargetElement.addEventListener('drop', this._domEventDrop);
            this._domTargetElement.addEventListener('mouseup', this._domEventDrop);
        } else {
            this.dom.addEventListener('drop', this._domEventDrop);
            this.dom.addEventListener('mouseup', this._domEventDrop);
        }

        this.on('show', this._onShow.bind(this));
        this.on('hide', this._onHide.bind(this));
    }

    onFilter(type: string, data: any) {
        if (!this._preDropFilter(type, data)) {
            return false;
        }

        // check whether our target element is visible
        if (!this._isTargetElementVisible()) {
            return false;
        }

        return true;
    }

    protected _preDropFilter(type: string, data: any) {
        // do not show if disabled or readonly
        if (!this.enabled || this.readOnly) {
            return false;
        }

        // if our desired dropType does not match the current type then do not show
        if (this._dropType && this._dropType !== type) {
            return false;
        }

        // if we have been giver a filter function call that
        if (this._onFilterFn) {
            return this._onFilterFn(type, data);
        }

        return true;
    }

    protected _onDragEnter(evt: Event) {
        if (!this.enabled) {
            return;
        }
        if (this.readOnly) {
            return;
        }

        this.class.add(CLASS_DROP_TARGET_DRAG_OVER);

        this.emit('dragenter');

        if (this._dropManager && this._onDragEnterFn) {
            this._onDragEnterFn(this._dropManager.dropType, this._dropManager.getDropData(evt));
        }
    }

    protected _onDragLeave(evt?: Event) {
        if (!this.enabled) {
            return;
        }

        if (this.readOnly) {
            return;
        }

        // check if we have already called drag leave. This can happen
        // if we call onDragLeave from onDrop and then our mouse leaves
        // the drop target in which case onDragLeave will be called twice
        // (once in onDrop and once on mouseleave)
        if (!this.class.contains(CLASS_DROP_TARGET_DRAG_OVER)) {
            return;
        }

        this.class.remove(CLASS_DROP_TARGET_DRAG_OVER);

        this.emit('dragleave');

        if (this._onDragLeaveFn) {
            this._onDragLeaveFn();
        }
    }

    protected _onDrop(evt: Event) {
        this._onDragLeave();

        if (this._dropManager && this._onDropFn) {
            const type = this._dropManager.dropType;
            const data = this._dropManager.getDropData(evt);

            if (this._preDropFilter(type, data)) {
                this._onDropFn(type, data);
            }
        }
    }

    _onShow() {
        const rect = this.rect;
        const margin = this.hole ? 2 : 1;
        this.style.left = `${rect.left + margin}px`;
        this.style.top = `${rect.top + margin}px`;
        this.style.width = `${rect.width - 2 * margin}px`;
        this.style.height = `${rect.height - 2 * margin}px`;

        if (!this.hole) {
            this._domTargetElement.classList.add(CLASS_DROP_TARGET_FRONT);
        }
    }

    _onHide() {
        this._domTargetElement.classList.remove(CLASS_DROP_TARGET_FRONT);
    }

    protected _isTargetElementVisible() {
        const rect = this.rect;
        if (!rect.width || !rect.height) {
            return false;
        }

        const parent = this._domTargetElement.parentNode as HTMLElement;
        if (!parent?.offsetHeight) {
            return false;
        }

        const style = getComputedStyle(this._domTargetElement);
        if (style.visibility === 'hidden' || style.display === 'none') {
            return false;
        }

        return true;
    }

    destroy() {
        if (this._destroyed) {
            return;
        }
        this.dom.removeEventListener('dragenter', this._domEventDragEnter);
        this.dom.removeEventListener('mouseenter', this._domEventDragEnter);
        this.dom.removeEventListener('dragleave', this._domEventDragLeave);
        this.dom.removeEventListener('mouseleave', this._domEventDragLeave);

        if (this.passThrough) {
            this._domTargetElement.removeEventListener('drop', this._domEventDrop);
            this._domTargetElement.removeEventListener('mouseup', this._domEventDrop);
        } else {
            this.dom.removeEventListener('drop', this._domEventDrop);
            this.dom.removeEventListener('mouseup', this._domEventDrop);
        }

        this._onDragEnterFn = null;
        this._onDragLeaveFn = null;
        this._onDropFn = null;
        this.dropManager = null;

        super.destroy();
    }

    get hole() {
        return this._hole;
    }

    get passThrough() {
        return this._passThrough;
    }

    set dropManager(value: DropManager | null) {
        this._dropManager = value;
    }

    get dropManager() {
        return this._dropManager;
    }

    get rect() {
        return this._domTargetElement.getBoundingClientRect();
    }
}

export { DropTarget };
