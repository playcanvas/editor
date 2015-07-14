editor.once('load', function() {
    'use strict';

    var project = new Observer();

    var loadedProject = false;

    // Loads current project from the server
    editor.method('project:load', function () {
        Ajax.get('{{url.api}}/projects/{{project.id}}?access_token={{accessToken}}')
        .on('load', function (status, data) {
            project.patch(data.response[0]);

            loadedProject = true;
            editor.emit('project:load', project);
        });
    });

    // Adds the physics library to the project and updates db
    editor.method('project:enablePhysics', function () {
        function enable () {
            var libraries = project.getRaw('settings.libraries');
            if (libraries.indexOf('physics-engine-3d') < 0) {
                project.insert('settings.libraries', 'physics-engine-3d', libraries.length - 1);

                Ajax.put('{{url.api}}/projects/{{project.id}}?access_token={{accessToken}}', project.json())
                .on('error', function () {
                    // remove physics from libraries on error
                    project.removeValue('settings.libraries', 'physics-engine-3d');
                });
            }
        }

        if (!loadedProject) {
            editor.call('project:load');
            editor.once('project:load', enable);
        } else {
            enable();
        }
    });

    editor.method('project:setLoadingScreenScript', function (script) {
        function set () {
            project.set('settings.loading_screen_script', script);

            Ajax.put('{{url.api}}/projects/{{project.id}}?access_token={{accessToken}}', project.json())
            .on('error', function () {
                // remove physics from libraries on error
                project.unset('settings.loading_screen_script');
            });
        }

        if (!loadedProject) {
            editor.call('project:load');
            editor.once('project:load', set);
        } else {
            set();
        }
    });

    editor.method('project:getLoadingScreenScript', function (callback) {
        function get () {
            callback(project.get('settings.loading_screen_script'));
        }

        if (!loadedProject) {
            editor.call('project:load');
            editor.once('project:load', get);
        } else {
            get();
        }
    });

});
