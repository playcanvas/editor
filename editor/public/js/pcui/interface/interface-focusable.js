Object.assign(pcui, (function () {
    'use strict';

    /**
     * @name pcui.IFocusable
     * @classdesc Provides an interface for focusing / unfocusing an Element.
     */
    class IFocusable {
        focus() {
            throw new Error('Not implemented');
        }

        blur() {
            throw new Error('Not implemented');
        }
    }

    /**
     * @event
     * @name pcui.IFocusable#focus
     * @description Fired when the element is focused
     */

    /**
     * @event
     * @name pcui.IFocusable#blur
     * @description Fired when the element is blurred (unfocused)
    */

    return {
        IFocusable: IFocusable
    };
})());
