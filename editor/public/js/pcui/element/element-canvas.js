Object.assign(pcui, (function () {
    'use strict';

    const CLASS_CANVAS = 'pcui-canvas';

    /**
     * @name pcui.Canvas
     * @classdesc A canvas element.
     * @property {Number} canvasWidth The width of the HTML canvas
     * @property {Number} canvasHeight The height of the HTML canvas
     * @extends pcui.Element
     */
    class Canvas extends pcui.Element {
        constructor(args) {
            if (!args) args = {};
            super(document.createElement('canvas'), args);

            this.class.add(CLASS_CANVAS);

            this._suspendResizeEvt = false;
        }

        /**
         * @name pcui.Canvas#resize
         * @description Resizes the HTML canvas
         * @param {Number} width The width
         * @param {Number} height The height
         */
        resize(width, height) {
            if (this.canvasWidth === width && this.canvasHeight === height) return;

            this._suspendResizeEvt = true;
            this.canvasWidth = width;
            this.canvasHeight = height;
            this._suspendResizeEvt = false;
            this.emit('resize', this.canvasWidth, this.canvasHeight);
        }

        get canvasWidth() {
            return this.dom.width;
        }

        set canvasWidth(value) {
            if (value === this.canvasWidth) return;
            this.dom.width = value;
            if (!this._suspendResizeEvt) {
                this.emit('resize', this.canvasWidth, this.canvasHeight);
            }
        }

        get canvasHeight() {
            return this.dom.height;
        }

        set canvasHeight(value) {
            if (value === this.canvasHeight) return;
            this.dom.height = value;
            if (!this._suspendResizeEvt) {
                this.emit('resize', this.canvasWidth, this.canvasHeight);
            }
        }
    }

    /**
     * @event
     * @name pcui.Element#resize
     * @description
     */

    return {
        Canvas: Canvas
    };
})());
