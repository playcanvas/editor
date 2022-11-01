Object.assign(pcui, (function () {
    'use strict';

    /**
     * @name pcui.IFlex
     * @classdesc Provides an interface for allowing support for the flexbox CSS layout
     */
    class IFlex {
        set flex(value) {
            throw new Error('Not implemented');
        }

        get flex() {
            throw new Error('Not implemented');
        }
    }

    return {
        IFlex: IFlex
    };
})());
