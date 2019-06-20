Object.assign(pcui, (function () {
    'use strict';

    /**
     * @name pcui.IScrollable
     * @classdesc Provides an interface for allowing scrolling on an Element.
     */
    function IScrollable() {}

    /**
     * @event
     * @name pcui.IScrollable#scroll
     * @description Fired when the Element is scrolled.
     * @param {Event} The native scroll event.
     */


    Object.defineProperty(IScrollable.prototype, 'scrollable', {
        get: function () {
            throw new Error('Not implemented');
        },
        set: function (value) {
            throw new Error('Not implemented');
        },
        configurable: true
    });

    return {
        IScrollable: IScrollable
    };
})());
