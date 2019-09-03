Object.assign(pcui, (function () {
    'use strict';

    /**
     * @name pcui.IResizable
     * @classdesc Provides an interface for enabling resizing support for an Element
     */
    class IResizable {
        get resizable() {
            throw new Error('Not implemented');
        }

        set resizable(value) {
            throw new Error('Not implemented');
        }

        get resizeMin() {
            throw new Error('Not implemented');
        }

        set resizeMin(value) {
            throw new Error('Not implemented');
        }

        get resizeMax() {
            throw new Error('Not implemented');
        }

        set resizeMax(value) {
            throw new Error('Not implemented');
        }
    }

    /**
     * @event
     * @name pcui.IResizable#resize
     * @description Fired when the Element gets resized.
     */


    return {
        IResizable: IResizable
    };
})());
