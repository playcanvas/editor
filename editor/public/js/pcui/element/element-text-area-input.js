Object.assign(pcui, (function () {
    'use strict';

    const CLASS_TEXT_AREA_INPUT = 'pcui-text-area-input';

    /**
     * @name pcui.TextInput
     * @classdesc The TextAreaInput wraps a textarea element. It has the same interface as pcui.TextInput.
     * @extends pcui.TextInput
     */
    class TextAreaInput extends pcui.TextInput {
        /**
         * Creates a new TextAreaInput.
         * @param {Object} args The arguments. Extends the pcui.TextInput constructor arguments.
         */
        constructor(args) {
            args = Object.assign({
                input: document.createElement('textarea')
            }, args);

            super(args);

            this.class.add(CLASS_TEXT_AREA_INPUT);
        }

        _onInputKeyDown(evt) {
            if ((evt.keyCode === 27 && this.blurOnEscape) || (evt.keyCode === 13 && this.blurOnEnter && !evt.shiftKey)) {
                this._domInput.blur();
            }

            this.emit('keydown', evt);
        }
    }

    pcui.Element.register('text', TextAreaInput, { renderChanges: true });

    return {
        TextAreaInput: TextAreaInput
    };
})());
