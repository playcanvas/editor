Object.assign(pcui, (function () {
    'use strict';

    /**
     * @name pcui.ISelection
     * @classdesc Provides an interface for allow the selection of child elements.
     */
    function ISelection() {}

    Object.defineProperty(ISelection.prototype, 'allowSelection', {
        get: function () {
            throw new Error('Not implemented');
        },
        set: function (value) {
            throw new Error('Not implemented');
        },
        configurable: true
    });

    Object.defineProperty(ISelection.prototype, 'multiSelect', {
        get: function () {
            throw new Error('Not implemented');
        },
        set: function (value) {
            throw new Error('Not implemented');
        },
        configurable: true
    });

    Object.defineProperty(ISelection.prototype, 'selection', {
        get: function () {
            throw new Error('Not implemented');
        },
        set: function (value) {
            throw new Error('Not implemented');
        },
        configurable: true
    });

    return {
        ISelection: ISelection
    };
})());
