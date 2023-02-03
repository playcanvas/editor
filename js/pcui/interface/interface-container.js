Object.assign(pcui, (function () {
    'use strict';

    /**
     * @name pcui.IContainer
     * @classdesc Provides an interface for appending / removing children from an Element.
     */
    class IContainer {
        append(element) {
            throw new Error('Not Implemented');
        }

        appendBefore(element, referenceElement) {
            throw new Error('Not Implemented');
        }

        appendAfter(element, referenceElement) {
            throw new Error('Not Implemented');
        }

        prepend(element) {
            throw new Error('Not Implemented');
        }

        remove(element) {
            throw new Error('Not Implemented');
        }

        clear() {
            throw new Error('Not Implemented');
        }
    }

    /**
     * @event
     * @name pcui.IContainer#append
     * @description Fired when a child Element gets added
     * @param {Element} The - element that was added
     */

    /**
     * @event
     * @name pcui.IContainer#remove
     * @description Fired when a child Element gets removed
     * @param {Element} The - element that was removed
     */


    return {
        IContainer: IContainer
    };
})());
