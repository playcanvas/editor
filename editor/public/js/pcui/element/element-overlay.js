Object.assign(pcui, (function () {
    'use strict';

    const CLASS_OVERLAY = 'pcui-overlay';
    const CLASS_OVERLAY_INNER = CLASS_OVERLAY + '-inner';
    const CLASS_OVERLAY_CLICKABLE = CLASS_OVERLAY + '-clickable';
    const CLASS_OVERLAY_TRANSPARENT = CLASS_OVERLAY + '-transparent';
    const CLASS_OVERLAY_CONTENT = CLASS_OVERLAY + '-content';

    /**
     * @name pcui.Overlay
     * @classdesc An overlay element.
     * @property {Boolean} clickable Whether the overlay can be hidden by clicking on it.
     * @property {Boolean} transparent Whether the overlay is transparent.
     * @extends pcui.Container
     */
    class Overlay extends pcui.Container {
        /**
         * Creates a new pcui.Overlay.
         * @param {Object} args The arguments.
         */
        constructor(args) {
            if (!args) args = {};
            super(args);

            this.class.add(CLASS_OVERLAY);

            this._domClickableOverlay = document.createElement('div');
            this._domClickableOverlay.ui = this;
            this._domClickableOverlay.classList = CLASS_OVERLAY_INNER;
            this.dom.appendChild(this._domClickableOverlay);

            this._domEventMouseDown = this._onMouseDown.bind(this);
            this._domClickableOverlay.addEventListener('mousedown', this._domEventMouseDown);

            this.domContent = document.createElement('div');
            this.domContent.ui = this;
            this.domContent.classList.add(CLASS_OVERLAY_CONTENT);
            this.dom.appendChild(this.domContent);

            this.clickable = args.clickable || false;
            this.transparent = args.transparent || false;
        }

        _onMouseDown(evt) {
            if (!this.clickable) return;

            // some field might be in focus
            document.body.blur();

            // wait till blur is done
            requestAnimationFrame(() => {
                this.hidden = true;
            });

            evt.preventDefault();
        }

        /**
         * @name pcui.Overlay#position
         * @description Position the overlay at specific x, y coordinates.
         * @param {Number} x The x coordinate
         * @param {Number} y The y coordinate
         */
        position(x, y) {
            const area = this._domClickableOverlay.getBoundingClientRect();
            const rect = this.domContent.getBoundingClientRect();

            x = Math.max(0, Math.min(area.width - rect.width, x));
            y = Math.max(0, Math.min(area.height - rect.height, y));

            this.domContent.style.position = 'absolute';
            this.domContent.style.left = `${x}px`;
            this.domContent.style.top = `${y}px`;
        }

        destroy() {
            if (this._destroyed) return;
            this._domClickableOverlay.removeEventListener('mousedown', this._domEventMouseDown);
            super.destroy();
        }

        get clickable() {
            return this.class.contains(CLASS_OVERLAY_CLICKABLE);
        }

        set clickable(value) {
            if (value) {
                this.class.add(CLASS_OVERLAY_CLICKABLE);
            } else {
                this.class.remove(CLASS_OVERLAY_CLICKABLE);
            }
        }

        get transparent() {
            return this.class.contains(CLASS_OVERLAY_TRANSPARENT);
        }

        set transparent(value) {
            if (value) {
                this.class.add(CLASS_OVERLAY_TRANSPARENT);
            } else {
                this.class.remove(CLASS_OVERLAY_TRANSPARENT);
            }
        }
    }

    return {
        Overlay: Overlay
    };
})());
