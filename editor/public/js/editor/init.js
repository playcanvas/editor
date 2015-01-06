var applyConfig = function(path, value) {
    if (typeof(value) === 'object') {
        for(var key in value) {
            applyConfig((path ? path + '.' : '') + key, value[key]);
        }
    } else {
        Ajax.param(path, value);
    }
};

applyConfig('', config);
