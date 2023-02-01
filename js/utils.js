var utils = { };
window.utils = utils;

// utils.deepCopy
utils.deepCopy = function deepCopy(data) {
    if (data == null || typeof (data) !== 'object')
        return data;

    if (data instanceof Array) {
        var arr = [];
        for (var i = 0; i < data.length; i++) {
            arr[i] = deepCopy(data[i]);
        }
        return arr;
    }
    var obj = { };
    for (var key in data) {
        if (data.hasOwnProperty(key))
            obj[key] = deepCopy(data[key]);
    }
    return obj;
};

// Appends query parameter to string (supposedly the string is a URL)
// automatically figuring out if the separator should be ? or &.
// Example: url.appendQuery('t=123').appendQuery('q=345');
if (!String.prototype.appendQuery) {
    Object.defineProperty(String.prototype, 'appendQuery', { // eslint-disable-line no-extend-native
        enumerable: false,
        configurable: false,
        writable: false,
        value: function (queryParameter) {
            var separator = this.indexOf('?') !== -1 ? '&' : '?';
            return this + separator + queryParameter;
        }
    });
}

var bytesToHuman = function (bytes) {
    if (isNaN(bytes) || bytes === 0) return '0 B';
    var k = 1000;
    var sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
};
window.bytesToHuman = bytesToHuman;
