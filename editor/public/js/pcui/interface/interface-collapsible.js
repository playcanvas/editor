Object.assign(pcui, (function () {
    'use strict';

    /**
     * @name pcui.ICollapsible
     * @classdesc Provides an interface to allow collapsing / expanding of an Element.
     */
    function ICollapsible() {}

    /**
     * @event
     * @name pcui.ICollapsible#collapse
     * @description Fired when the element gets collapsed
     */

    /**
     * @event
     * @name pcui.ICollapsible#expand
     * @description Fired when the element gets expanded
     */

    Object.defineProperty(ICollapsible.prototype, 'collapsible', {
        get: function () {
            throw new Error('Not implemented');
        },
        set: function (value) {
            throw new Error('Not implemented');
        },
        configurable: true
    });

    Object.defineProperty(ICollapsible.prototype, 'collapsed', {
        get: function () {
            throw new Error('Not implemented');
        },
        set: function (value) {
            throw new Error('Not implemented');
        },
        configurable: true
    });

    return {
        ICollapsible: ICollapsible
    };
})());
