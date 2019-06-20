Object.assign(pcui, (function () {
    'use strict';

    /**
     * @name pcui.IInput
     * @classdesc Provides an interface for getting / setting a value for the Element.
     */
    function IInput() {}

    Object.defineProperty(IInput.prototype, 'value', {
        get: function () {
            throw new Error('Not implemented');
        },
        set: function (value) {
            throw new Error('Not implemented');
        },
        configurable: true
    });

    return {
        IInput: IInput
    };
})());
