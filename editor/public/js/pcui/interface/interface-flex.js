Object.assign(pcui, (function () {
    'use strict';

    /**
     * @name pcui.IFlex
     * @classdesc Provides an interface for allowing support for the flexbox CSS layout
     */
    function IFlex() {}

    Object.defineProperty(IFlex.prototype, 'flex', {
        get: function () {
            throw new Error('Not implemented');
        },
        set: function (value) {
            throw new Error('Not implemented');
        },
        configurable: true
    });

    return {
        IFlex: IFlex
    };
})());
