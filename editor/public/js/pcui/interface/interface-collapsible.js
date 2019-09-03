Object.assign(pcui, (function () {
    'use strict';

    /**
     * @name pcui.ICollapsible
     * @classdesc Provides an interface to allow collapsing / expanding of an Element.
     */
    class ICollapsible {
        get collapsible() {
            throw new Error('Not implemented');
        }

        set collapsible(value) {
            throw new Error('Not implemented');
        }

        get collapsed() {
            throw new Error('Not implemented');
        }

        set collapsed(value) {
            throw new Error('Not implemented');
        }
    }

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

    return {
        ICollapsible: ICollapsible
    };
})());
