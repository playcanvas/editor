import { Container } from '@playcanvas/pcui';

Object.assign(pcui, (function () {
    'use strict';

    const CLASS_DROP_MANAGER = 'pcui-dropmanager';
    const CLASS_DROP_MANAGER_WALL = CLASS_DROP_MANAGER + '-wall';
    const CLASS_DROP_MANAGER_WALL_FULL = CLASS_DROP_MANAGER_WALL + '-full';
    const CLASS_DROP_MANAGER_WALL_TOP = CLASS_DROP_MANAGER_WALL + '-top';
    const CLASS_DROP_MANAGER_WALL_LEFT = CLASS_DROP_MANAGER_WALL + '-left';
    const CLASS_DROP_MANAGER_WALL_RIGHT = CLASS_DROP_MANAGER_WALL + '-right';
    const CLASS_DROP_MANAGER_WALL_BOTTOM = CLASS_DROP_MANAGER_WALL + '-bottom';
    const CLASS_DROP_MANAGER_TARGETS = CLASS_DROP_MANAGER + '-targets';
    const CLASS_DROP_MANAGER_ACTIVE = CLASS_DROP_MANAGER + '-active';

    /**
     * @name pcui.DropManager
     * @classdesc Handles drag and drop
     * @property {boolean} active True when we are currently dragging
     * @property {string} dropType The type of data that is being dropped
     * @property {Any} dropData The data being dropped
     * @augments Container
     */
    class DropManager extends Container {
        /**
         * Creates a new DropManager
         *
         * @param {object} args - The arguments.
         */
        constructor(args) {
            super(args);

            this.class.add(CLASS_DROP_MANAGER);

            // 1 full screen element for when we want to overlay the entire screen
            this._domWallFull = document.createElement('div');
            this._domWallFull.classList.add(CLASS_DROP_MANAGER_WALL);
            this._domWallFull.classList.add(CLASS_DROP_MANAGER_WALL_FULL);
            this.append(this._domWallFull);

            // 4 elements that form the walls around a hole in the middle.
            // these 4 elements are resized to surround a drop target but they leave
            // a hole in the middle just big enough for the drop target to be able
            // to receive mouse events
            this._domWallTop = document.createElement('div');
            this._domWallTop.classList.add(CLASS_DROP_MANAGER_WALL);
            this._domWallTop.classList.add(CLASS_DROP_MANAGER_WALL_TOP);
            this.append(this._domWallTop);

            this._domWallBottom = document.createElement('div');
            this._domWallBottom.classList.add(CLASS_DROP_MANAGER_WALL);
            this._domWallBottom.classList.add(CLASS_DROP_MANAGER_WALL_BOTTOM);
            this.append(this._domWallBottom);

            this._domWallLeft = document.createElement('div');
            this._domWallLeft.classList.add(CLASS_DROP_MANAGER_WALL);
            this._domWallLeft.classList.add(CLASS_DROP_MANAGER_WALL_LEFT);
            this.append(this._domWallLeft);

            this._domWallRight = document.createElement('div');
            this._domWallRight.classList.add(CLASS_DROP_MANAGER_WALL);
            this._domWallRight.classList.add(CLASS_DROP_MANAGER_WALL_RIGHT);
            this.append(this._domWallRight);

            // container for all the drop targets
            const targets = document.createElement('div');
            targets.classList.add(CLASS_DROP_MANAGER_TARGETS);
            this.append(targets);

            // from now on all append calls will be directed to this element.
            this.domContent = targets;

            // deactivate when disabled or readonly
            this.on('disable', () => { this.active = false; });
            this.on('readOnly', (readOnly) => { if (!readOnly) this.active = false; });

            this._domEventDragEnter = this._onDragEnter.bind(this);
            this._domEventDragOver = this._onDragOver.bind(this);
            this._domEventDragLeave = this._onDragLeave.bind(this);
            this._domEventDrop = this._onDrop.bind(this);
            this._domEventMouseUp = this._onMouseUp.bind(this);

            window.addEventListener('dragenter', this._domEventDragEnter);
            window.addEventListener('dragover', this._domEventDragOver);
            window.addEventListener('dragleave', this._domEventDragLeave);
            window.addEventListener('drop', this._domEventDrop);

            this._active = false;

            // Increases on dragenter events
            // and decreases on dragleave events.
            // Used to activate or deactivate the manager
            // because dragenter / dragleave events are also raised
            // by child elements of the body
            this._dragEventCounter = 0;

            this._dropType = 'files';
            this._dropData = {};
        }

        _onActivate() {
            // cursor:set grabbing
            this.class.add(CLASS_DROP_MANAGER_ACTIVE);

            window.addEventListener('mouseup', this._domEventMouseUp);

            let top = this.parent.height;
            let bottom = 0;
            let left = this.parent.width;
            let right = 0;

            this._domWallFull.classList.remove(pcui.CLASS_HIDDEN);
            this._domWallTop.classList.add(pcui.CLASS_HIDDEN);
            this._domWallLeft.classList.add(pcui.CLASS_HIDDEN);
            this._domWallBottom.classList.add(pcui.CLASS_HIDDEN);
            this._domWallRight.classList.add(pcui.CLASS_HIDDEN);
            this.domContent.style.pointerEvents = '';

            // go through our child drop targets and show the ones
            // that are valid based on our current dropData
            const children = this.domContent.childNodes;
            for (let i = 0; i < children.length; i++) {
                const dropTarget = children[i].ui;
                if (!(dropTarget instanceof pcui.DropTarget)) continue;

                dropTarget.hidden = !dropTarget.onFilter(this.dropType, this.dropData);

                if (!dropTarget.hidden && dropTarget.hole) {

                    const rect = dropTarget.rect;
                    if (top > rect.top) top = rect.top;
                    if (bottom < rect.bottom) bottom = rect.bottom;
                    if (left > rect.left) left = rect.left;
                    if (right < rect.right) right = rect.right;

                    this._domWallTop.classList.remove(pcui.CLASS_HIDDEN);
                    this._domWallTop.style.height = top + 'px';

                    this._domWallRight.classList.remove(pcui.CLASS_HIDDEN);
                    this._domWallRight.style.top = top + 'px';
                    this._domWallRight.style.bottom = (this.parent.height - bottom) + 'px';
                    this._domWallRight.style.width = (this.parent.width - right) + 'px';

                    this._domWallBottom.classList.remove(pcui.CLASS_HIDDEN);
                    this._domWallBottom.style.height = (this.parent.height - bottom) + 'px';

                    this._domWallLeft.classList.remove(pcui.CLASS_HIDDEN);
                    this._domWallLeft.style.top = top + 'px';
                    this._domWallLeft.style.bottom = (this.parent.height - bottom) + 'px';
                    this._domWallLeft.style.width = left + 'px';

                    this._domWallFull.classList.add(pcui.CLASS_HIDDEN);

                    if (dropTarget.passThrough) {
                        this.domContent.style.pointerEvents = 'none';
                    }
                }
            }


            this.emit('activate');
        }

        _onDeactivate() {
            this._dragEventCounter = 0;

            this.class.remove(CLASS_DROP_MANAGER_ACTIVE);

            window.removeEventListener('mouseup', this._domEventMouseUp);

            const children = this.domContent.childNodes;
            for (let i = 0; i < children.length; i++) {
                const dropTarget = children[i].ui;
                if (!(dropTarget instanceof pcui.DropTarget)) continue;

                dropTarget.hidden = true;
            }

            this.dropType = null;
            this.dropData = null;

            this.emit('deactivate');
        }

        _onDragEnter(evt) {
            if (!this.enabled) return;

            evt.preventDefault();

            if (this.readOnly) return;

            this._dragEventCounter++;
            this.active = true;
        }

        _onDragOver(evt) {
            if (!this.enabled) return;

            evt.preventDefault();

            if (this.readOnly) return;

            evt.dataTransfer.dropEffect = 'move';

            this.active = true;
        }

        _onDragLeave(evt) {
            if (!this.enabled) return;

            evt.preventDefault();

            if (this.readOnly) return;

            this._dragEventCounter--;

            if (this._dragEventCounter <= 0) {
                this._dragEventCounter = 0; // sanity check
                this.active = false;
            }
        }

        _onMouseUp(evt) {
            if (!this.enabled) return;
            if (this.readOnly) return;

            this.active = false;
        }

        _onDrop(evt) {
            if (!this.enabled) return;

            evt.preventDefault();

            if (this.readOnly) return;

            // deactivate
            this.active = false;
        }

        _onAppendChild(element) {
            super._onAppendChild(element);
            if (!(element instanceof pcui.DropTarget)) return;

            element.dropManager = this;
            element.hidden = true;
        }

        _onRemoveChild(element) {
            super._onRemoveChild(element);
            if (!(element instanceof pcui.DropTarget)) return;

            element.dropManager = null;
        }

        getDropData(evt) {
            let data = this.dropData;
            if (this.dropType === 'files' && evt.dataTransfer && evt.dataTransfer.files) {
                data = evt.dataTransfer.files;
            }

            return data;
        }

        destroy() {
            if (this._destroyed) return;
            window.removeEventListener('dragenter', this._domEventDragEnter);
            window.removeEventListener('dragover', this._domEventDragOver);
            window.removeEventListener('dragleave', this._domEventDragLeave);
            window.removeEventListener('drop', this._domEventDrop);
            window.removeEventListener('mouesup', this._domEventMouseUp);

            super.destroy();
        }

        set active(value) {
            if (this._active === value) return;
            this._active = value;
            if (value) {
                this._onActivate();
            } else {
                this._onDeactivate();
            }
        }

        get active() {
            return this._active;
        }

        set dropType(value) {
            if (this._dropType === value) return;
            this._dropType = value || 'files';
            this.emit('dropType', this.dropType);
        }

        get dropType() {
            return this._dropType;
        }

        set dropData(value) {
            if (this._dropData === value) return;
            this._dropData = value || {};
            this.emit('dropData', value);
        }

        get dropData() {
            return this._dropData;
        }
    }

    return {
        DropManager: DropManager
    };
})());
