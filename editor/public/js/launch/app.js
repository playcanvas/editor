(function() {
    'use strict';

    function App() {
        Events.call(this);

        this._hooks = { };
    }
    App.prototype = Object.create(Events.prototype);


    App.prototype.method = function(name, fn) {
        if (this._hooks[name] !== undefined) {
            throw new Error('can\'t override hook: ' + name);
        }
        this._hooks[name] = fn;
    };


    App.prototype.methodRemove = function(name) {
        delete this._hooks[name];
    };


    App.prototype.call = function(name) {
        if (this._hooks[name]) {
            var args = Array.prototype.slice.call(arguments, 1);

            try {
                return this._hooks[name].apply(null, args);
            } catch(ex) {
                console.info('%c%s %c(app.method error)', 'color: #06f', name, 'color: #f00');
                console.log(ex.stack);
            }
        }
        return null;
    };


    // app
    window.app = new App();

    // set editor to be the same as app so we can include files from the editor
    window.editor = window.app;

    // first load
    document.addEventListener('DOMContentLoaded', function() {
        app.emit('load');
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
