editor.once('load', function() {
    'use strict';

    var pluginNameCheck = /[a-z0-9\-_]/i;
    var pluginsLoading = { };
    var plugins = { };
    var projectSettings = editor.call('settings:project');


    editor.method('plugins:load', function(name, fn) {
        if (! name || ! pluginNameCheck.test(name)) {
            if (fn) fn(new Error('invalid plugin name'));
            return;
        }

        if (pluginsLoading[name] || plugins[name])
            return;

        pluginsLoading[name] = true;

        var loaded = false;
        var element = document.createElement('script');
        element.async = false;

        element.addEventListener('error', function(err) {
            if (loaded)
                return;

            loaded = true;
            delete pluginsLoading[name];
            editor.emit('plugins:load:error', name, err);

            editor.call('status:error', 'plugins:load:error ' + name);

            if (fn) fn(err);
        });

        element.onload = element.onreadystatechange = function() {
            if (loaded)
                return;

            if (this.readyState && (this.readyState !== 'loaded' && this.readyState === 'complete'))
                return;

            loaded = true;
            delete pluginsLoading[name];
            plugins[name] = element;
            editor.emit('plugins:load', name);
            editor.emit('plugins:load:' + name);

            editor.call('status:text', 'plugins:load ' + name);

            if (fn) fn(null);
        };

        element.src = '/editor/scene/js/plugins/' + name + '.js';

        document.head.appendChild(element);

        editor.emit('plugins:loading', name);
    });

    editor.method('plugins:unload', function(name) {
        if (! plugins[name])
            return;

        document.head.removeChild(plugins[name]);
        delete plugins[name];

        editor.emit('plugins:removed', name);
    });


    var pluginsPreload = projectSettings.get('plugins');
    if (pluginsPreload) {
        for(var i = 0; i < pluginsPreload.length; i++)
            editor.call('plugins:load', pluginsPreload[i]);
    }
});
