Object.assign(pcui, (function () {
    'use strict';

    /**
     * @name pcui.ISelectable
     * @classdesc Provides an interface for selecting an Element.
     */
    class ISelectable {
        get selected() {
            throw new Error('Not implemented');
        }

        set selected(value) {
            throw new Error('Not implemented');
        }
    }

    return {
        ISelectable: ISelectable
    };
})());
