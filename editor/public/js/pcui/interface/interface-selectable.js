Object.assign(pcui, (function () {
    'use strict';

    /**
     * @name pcui.ISelectable
     * @classdesc Provides an interface for selecting an Element.
     */
    function ISelectable() {}

    Object.defineProperty(ISelectable.prototype, 'selected', {
        get: function () {
            throw new Error('Not implemented');
        },
        set: function (value) {
            throw new Error('Not implemented');
        },
        configurable: true
    });

    return {
        ISelectable: ISelectable
    };
})());
