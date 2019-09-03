Object.assign(pcui, (function () {
    'use strict';

    /**
     * @name pcui.IScrollable
     * @classdesc Provides an interface for allowing scrolling on an Element.
     */
    class IScrollable {
        get scrollable() {
            throw new Error('Not implemented');
        }

        set scrollable(value) {
            throw new Error('Not implemented');
        }
    }

    /**
     * @event
     * @name pcui.IScrollable#scroll
     * @description Fired when the Element is scrolled.
     * @param {Event} The native scroll event.
     */


    return {
        IScrollable: IScrollable
    };
})());
