Object.assign(pcui, (function () {
    'use strict';

    /**
     * @name pcui.IGrid
     * @classdesc Provides an interface for allowing support for the grid CSS layout
     */
    class IGrid {
        get grid() {
            throw new Error('Not implemented');
        }

        set grid(value) {
            throw new Error('Not implemented');
        }
    }

    return {
        IGrid: IGrid
    };
})());
