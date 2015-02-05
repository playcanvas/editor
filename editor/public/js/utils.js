var utils = { };


// utils.deepCopy
utils.deepCopy = function deepCopy(data) {
    if (data == null || typeof(data) !== 'object')
        return data;

    if (data instanceof Array) {
        var arr = [ ];
        for(var i = 0; i < data.length; i++) {
            arr[i] = deepCopy(data[i]);
        }
        return arr;
    } else {
        var obj = { };
        for(var key in data) {
            if (data.hasOwnProperty(key))
                temp[key] = deepCopy(data[key]);
        }
        return obj;
    }
};


// String.startsWith
if (! String.prototype.startsWith) {
    Object.defineProperty(String.prototype, 'startsWith', {
        enumerable: false,
        configurable: false,
        writable: false,
        value: function(str) {
            var that = this;
            var ceil = str.length;
            for(var i = 0; i < ceil; i++)
                if(that[i] !== str[i]) return false;
            return true;
        }
    });
}
