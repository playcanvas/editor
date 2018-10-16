(function() {
    'use strict';

    // set window name if necessary
    if (! window.name) {
        window.name = 'codeeditor:' + config.project.id;
    }

    function CodeEditor() {
        Events.call(this);

        this._hooks = { };

        // used by other tabs to identify if this is
        // the code editor
        this.isCodeEditor = true;
    }
    CodeEditor.prototype = Object.create(Events.prototype);


    CodeEditor.prototype.method = function(name, fn) {
        if (this._hooks[name] !== undefined) {
            throw new Error('can\'t override hook: ' + name);
        }
        this._hooks[name] = fn;
    };


    CodeEditor.prototype.methodRemove = function(name) {
        delete this._hooks[name];
    };


    CodeEditor.prototype.call = function(name) {
        if (this._hooks[name]) {
            var args = Array.prototype.slice.call(arguments, 1);

            try {
                return this._hooks[name].apply(null, args);
            } catch(ex) {
                console.info('%c%s %c(editor.method error)', 'color: #06f', name, 'color: #f00');
                console.log(ex.stack);
            }
        }
        return null;
    };

    window.editor = new CodeEditor();


    var visible = ! document.hidden;

    document.addEventListener('visibilitychange', function() {
        if (visible === ! document.hidden)
            return;

        visible = ! document.hidden;
        if (visible) {
            editor.emit('visible');
        } else {
            editor.emit('hidden');
        }
        editor.emit('visibility', visible);
    }, false);

    editor.method('visibility', function() {
        return visible;
    });


    // first load
    document.addEventListener('DOMContentLoaded', function() {
        editor.emit('load');
        editor.emit('start');

        // if there is a merge in progress for our branch
        if (! config.resolveConflict) {
            var merge = config.self.branch.merge;
            if (merge) {
                editor.call('picker:versioncontrol:mergeOverlay');
            }
        }

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
