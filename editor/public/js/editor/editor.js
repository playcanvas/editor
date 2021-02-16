(function () {
    'use strict';

    function Editor() {
        Events.call(this);

        this._hooks = { };
    }
    Editor.prototype = Object.create(Events.prototype);


    Editor.prototype.method = function (name, fn) {
        if (this._hooks[name] !== undefined) {
            throw new Error('can\'t override hook: ' + name);
        }
        this._hooks[name] = fn;
    };


    Editor.prototype.methodRemove = function (name) {
        delete this._hooks[name];
    };


    Editor.prototype.call = function (name) {
        if (this._hooks[name]) {
            var args = Array.prototype.slice.call(arguments, 1);

            try {
                return this._hooks[name].apply(null, args);
            } catch (ex) {
                console.info('%c%s %c(editor.method error)', 'color: #06f', name, 'color: #f00');
                log.error(ex);
            }
        } else {
            // console.info('%c%s %c - editor.method does not exist yet', 'color: #06f', name, 'color: #f00');
        }
        return null;
    };


    // editor
    window.editor = new Editor();
})();


// config
(function () {
    'use strict';

    var applyConfig = function (path, value) {
        if (typeof(value) === 'object') {
            for (const key in value) {
                applyConfig((path ? path + '.' : '') + key, value[key]);
            }
        } else {
            Ajax.param(path, value);
        }
    };

    applyConfig('', config);
})();
