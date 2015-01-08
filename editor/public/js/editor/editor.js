(function() {
    'use strict';

    function Editor() {
        Events.call(this);

        this._hooks = { };
    }
    Editor.prototype = Object.create(Events.prototype);


    Editor.prototype.hook = function(name, fn) {
        this._hooks[name] = fn;
    };


    Editor.prototype.unhook = function(name) {
        delete this._hooks[name];
    };


    Editor.prototype.call = function(name) {
        if (this._hooks[name]) {
            var args = Array.prototype.slice.call(arguments, 1);
            return this._hooks[name].apply(null, args);
        } else {
            return null;
        }
    };


    // editor
    window.editor = new Editor();


    // first load
    document.addEventListener('DOMContentLoaded', function() {
        editor.emit('load');
        editor.emit('start');

        editor.call('layout.root').enabled = true;
    }, false);
})();


// config
(function() {
    'use strict';

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
})();
