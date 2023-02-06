Object.assign(pcui, (function () {
    /**
     * @name pcui.ISelection
     * @classdesc Provides an interface for allow the selection of child elements.
     */
    class ISelection {
        set allowSelection(value) {
            throw new Error('Not implemented');
        }

        get allowSelection() {
            throw new Error('Not implemented');
        }

        set multiSelect(value) {
            throw new Error('Not implemented');
        }

        get multiSelect() {
            throw new Error('Not implemented');
        }

        set selection(value) {
            throw new Error('Not implemented');
        }

        get selection() {
            throw new Error('Not implemented');
        }
    }

    return {
        ISelection: ISelection
    };
})());
