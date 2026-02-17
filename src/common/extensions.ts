/**
 * Checks if the array is equal to another array.
 */
if (!Array.prototype.equals) {
    // eslint-disable-next-line no-extend-native
    Object.defineProperty(Array.prototype, 'equals', {
        enumerable: false,
        value: function (array: any) {
            if (!array) {
                return false;
            }

            if (this.length !== array.length) {
                return false;
            }

            for (let i = 0, l = this.length; i < l; i++) {
                if (this[i] instanceof Array && array[i] instanceof Array) {
                    if (!this[i].equals(array[i])) {
                        return false;
                    }
                } else if (this[i] !== array[i]) {
                    return false;
                }
            }
            return true;
        }
    });
}
