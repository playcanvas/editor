Object.assign(pcui, (function () {
    'use strict';

    /**
     * @name pcui.IResizable
     * @classdesc Provides an interface for enabling resizing support for an Element
     */
    function IResizable() {}

    /**
     * @event
     * @name pcui.IResizable#resize
     * @description Fired when the Element gets resized.
     */

    Object.defineProperty(IResizable.prototype, 'resizable', {
        get: function () {
            throw new Error('Not implemented');
        },
        set: function (value) {
            throw new Error('Not implemented');
        },
        configurable: true
    });

    Object.defineProperty(IResizable.prototype, 'resizeMin', {
        get: function () {
            throw new Error('Not implemented');
        },
        set: function (value) {
            throw new Error('Not implemented');
        },
        configurable: true
    });

    Object.defineProperty(IResizable.prototype, 'resizeMax', {
        get: function () {
            throw new Error('Not implemented');
        },
        set: function (value) {
            throw new Error('Not implemented');
        },
        configurable: true
    });

    return {
        IResizable: IResizable
    };
})());
