Object.assign(pcui, (function () {
    'use strict';

    const CLASS_BUTTON = 'pcui-button';

    /**
     * @name pcui.Button
     * @classdesc Represents a button.
     * @property {String} text Gets / sets the text of the button
     * @property {String} size Gets / sets the 'size' type of the button. Can be null or 'small'.
     * @property {String} icon The CSS code for an icon for the button. e.g. E401 (notice we omit the '\' character).
     * @mixes pcui.IFocusable
     */
    class Button extends pcui.Element {
        /**
         * Creates a new Button.
         * @param {Object} args The arguments. Extends the pcui.Element constructor arguments. All settable properties can also be set through the constructor.
         */
        constructor(args) {
            if (!args) args = {};

            super(document.createElement('button'), args);

            this.class.add(CLASS_BUTTON);

            this.text = args.text || '';
            this.size = args.size || null;
            this.icon = args.icon || '';

            this._domEventKeyDown = this._onKeyDown.bind(this);
            this.dom.addEventListener('keydown', this._onKeyDown.bind(this));
        }

        // click on enter
        // blur on escape
        _onKeyDown(evt) {
            if (evt.keyCode === 27) {
                this.blur();
            } else if (evt.keyCode === 13) {
                this._onClick(evt);
            }
        }

        _onClick(evt) {
            this.blur();
            super._onClick(evt);
        }

        focus() {
            this.dom.focus();
        }

        blur() {
            this.dom.blur();
        }

        destroy() {
            if (this._destroyed) return;

            this.dom.removeEventListener('keydown', this._domEventKeyDown);
            super.destroy();
        }

        get text() {
            return this._text;
        }

        set text(value) {
            if (this._text === value) return;
            this._text = value;
            this.dom.textContent = value;
        }

        get icon() {
            return this._icon;
        }

        set icon(value) {
            if (this._icon === value) return;
            this._icon = value;
            if (value) {
                // set data-icon attribute but first convert the value to a code point
                this.dom.setAttribute('data-icon', String.fromCodePoint(parseInt(value, 16)));
            } else {
                this.dom.removeAttribute('data-icon');
            }
        }

        get size() {
            return this._size;
        }

        set size(value) {
            if (this._size === value) return;
            if (this._size) {
                this.class.remove('pcui-' + this._size);
                this._size = null;
            }

            this._size = value;

            if (this._size) {
                this.class.add('pcui-' + this._size);
            }
        }
    }

    utils.implements(Button, pcui.IFocusable);

    return {
        Button: Button
    };
})());
