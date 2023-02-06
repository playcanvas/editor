Object.assign(pcui, (function () {
    /**
     * @name pcui.IGrid
     * @classdesc Provides an interface for allowing support for the grid CSS layout
     */
    class IGrid {
        set grid(value) {
            throw new Error('Not implemented');
        }

        get grid() {
            throw new Error('Not implemented');
        }
    }

    return {
        IGrid: IGrid
    };
})());
