Object.assign(pcui, (function () {
    /**
     * @name pcui.IBindable
     * @classdesc Provides an interface for getting / setting a value for the Element.
     * @property {Any} value Gets / sets the value of the Element.
     * @property {Any[]} values Sets multiple values to the Element. It is up to the Element to determine how to display them.
     */
    class IBindable {
        set value(value) {
            throw new Error('Not implemented');
        }

        get value() {
            throw new Error('Not implemented');
        }

        set values(values) {
            throw new Error('Not implemented');
        }
    }

    /**
     * @event
     * @name pcui.IBindable#change
     * @description Fired when the value of the Element changes
     * @param {object} value - The new value
     */

    return {
        IBindable: IBindable
    };
})());
