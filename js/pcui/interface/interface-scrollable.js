Object.assign(pcui, (function () {
    /**
     * @name pcui.IScrollable
     * @classdesc Provides an interface for allowing scrolling on an Element.
     */
    class IScrollable {
        set scrollable(value) {
            throw new Error('Not implemented');
        }

        get scrollable() {
            throw new Error('Not implemented');
        }
    }

    /**
     * @event
     * @name pcui.IScrollable#scroll
     * @description Fired when the Element is scrolled.
     * @param {Event} The - native scroll event.
     */


    return {
        IScrollable: IScrollable
    };
})());
