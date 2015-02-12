editor.once('load', function() {
    'use strict';

    // converts the data to runtime types
    var runtimeComponentData = function (component, data) {
        var result = {};
        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                result[key] = editor.call('components:convertValue', component, key, data[key]);
            }
        }

        return result;
    };

    editor.on('entities:add', function (obj) {
        var framework;

        // subscribe to changes
        obj.on('*:set', function(path, value) {
            if (path.indexOf('components') !== 0) {
                return;
            }

            var entity = obj.entity;
            if (!entity) {
                return;
            }

            var parts = path.split('.');
            var component = parts[1];
            var property = parts[2];

            if (!entity[component]) {
                if (!property) {
                    // add component
                    var data = runtimeComponentData(component, value);
                    framework = editor.call('viewport:framework');
                    framework.context.systems[component].addComponent(entity, data);

                    // render
                    editor.call('viewport:render');
                }
            } else if (property) {
                // edit component property
                value = obj.components[component][property];
                entity[component][property] = editor.call('components:convertValue', component, property, value);

                // render
                editor.call('viewport:render');
            }

        });

        obj.on('*:unset', function (path) {
            if (path.indexOf('components') !== 0) {
                return;
            }

            var entity = obj.entity;
            if (!entity) {
                return;
            }

            var parts = path.split('.');
            var component = parts[1];

            if (entity[component]) {
                // remove component
                var framework = editor.call('viewport:framework');
                framework.context.systems[component].removeComponent(entity);

                // render
                editor.call('viewport:render');
            }
        });

    });

});
