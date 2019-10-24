Object.assign(pcui, (function () {
    'use strict';

    const CLASS_LABEL_GROUP = 'pcui-label-group';

    /**
     * @name pcui.LabelGroup
     * @classdesc Represents a group of a pcui.Label and a pcui.Element. Useful for rows of labeled fields.
     * @extends pcui.Element
     * @property {String} text Gets / sets the label text.
     * @property {pcui.Element} field Gets the field. This can only be set through the constructor by passing it in the arguments.
     * @property {pcui.Element} label Gets the label element.
     */
    class LabelGroup extends pcui.Element {
        /**
         * Creates a new LabelGroup.
         * @param {Object} args The arguments. Extends the pcui.Element arguments. Any settable property can also be set through the constructor.
         * @param {Boolean} [args.nativeTooltip] If true then use the text as the HTML tooltip of the label.
         */
        constructor(args) {
            if (!args) args = {};

            super(document.createElement('div'), args);

            this.class.add(CLASS_LABEL_GROUP);

            this._label = new pcui.Label({
                text: args.text || 'Label',
                nativeTooltip: args.nativeTooltip
            });
            this.dom.appendChild(this._label.dom);
            this._label.parent = this;

            this._field = args.field;
            this.dom.appendChild(this._field.dom);
            this._field.parent = this;
        }

        get label() {
            return this._label;
        }

        get field() {
            return this._field;
        }

        get text() {
            return this._label.text;
        }

        set text(value) {
            this._label.text = value;
        }
    }

    return {
        LabelGroup: LabelGroup
    };
})());
