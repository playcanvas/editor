Object.assign(pcui, (function () {
    'use strict';

    /**
     * @name pcui.IContainer
     * @classdesc Provides an interface for appending / removing children from an Element.
     */
    function IContainer() {}

    /**
     * @event
     * @name pcui.IContainer#append
     * @description Fired when a child Element gets added
     * @param {pcui.Element} The element that was added
     */

    /**
     * @event
     * @name pcui.IContainer#remove
     * @description Fired when a child Element gets removed
     * @param {pcui.Element} The element that was removed
     */

    IContainer.prototype.append = function (element) {
        throw new Error('Not Implemented');
    };

    IContainer.prototype.appendBefore = function (element, referenceElement) {
        throw new Error('Not Implemented');
    };

    IContainer.prototype.appendAfter = function (element, referenceElement) {
        throw new Error('Not Implemented');
    };

    IContainer.prototype.prepend = function (element) {
        throw new Error('Not Implemented');
    };

    IContainer.prototype.remove = function (element) {
        throw new Error('Not Implemented');
    };

    IContainer.prototype.clear = function () {
        throw new Error('Not Implemented');
    };

    return {
        IContainer: IContainer
    };
})());
