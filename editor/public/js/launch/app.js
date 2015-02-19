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


    // first load
    document.addEventListener('DOMContentLoaded', function() {
        app.emit('load');
    }, false);
})();
