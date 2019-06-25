Object.assign(pcui, (function () {
    'use strict';

    /**
     * @name pcui.IGrid
     * @classdesc Provides an interface for allowing support for the grid CSS layout
     */
    function IGrid() {}

    Object.defineProperty(IGrid.prototype, 'grid', {
        get: function () {
            throw new Error('Not implemented');
        },
        set: function (value) {
            throw new Error('Not implemented');
        },
        configurable: true
    });

    return {
        IGrid: IGrid
    };
})());
