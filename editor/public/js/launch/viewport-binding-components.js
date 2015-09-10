app.once('load', function() {
    'use strict';

    var framework = app.call('viewport');

    // converts the data to runtime types
    var runtimeComponentData = function (component, data) {
        var result = {};
        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                result[key] = app.call('components:convertValue', component, key, data[key]);
            }
        }

        return result;
    };

    app.on('entities:add', function (obj) {
        // subscribe to changes
        obj.on('*:set', function(path, value) {
            if (path.indexOf('components') !== 0) {
                return;
            }

            var entity = framework.root.findByGuid(obj.get('resource_id'));
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
                    framework.systems[component].addComponent(entity, data);

                    // render
                    app.call('viewport:render');
                }
            } else if (property) {
                // edit component property
                value = obj.get('components.' + component + '.' + property);
                entity[component][property] = app.call('components:convertValue', component, property, value);
            }

        });


        obj.on('*:unset', function (path) {
            if (path.indexOf('components') !== 0) {
                return;
            }

            var entity = framework.root.findByGuid(obj.get('resource_id'));
            if (!entity)
                return;

            var parts = path.split('.');
            var component = parts[1];
            var property = parts[2];

            if (property) {
                // edit component property
                var value = obj.get('components.' + component + '.' + property);
                entity[component][property] = editor.call('components:convertValue', component, property, value);
            }
            else if (entity[component]) {
                // remove component
                framework.systems[component].removeComponent(entity);
            }
        });

        var setComponentProperty = function (path, value) {
            if (path.indexOf('components') !== 0) {
                return;
            }

            var entity = framework.root.findByGuid(obj.get('resource_id'));
            if (!entity) {
                return;
            }

            var parts = path.split('.');
            var component = parts[1];
            var property = parts[2];

            if (property) {
                // edit component property
                value = obj.get('components.' + component + '.' + property);
                entity[component][property] = app.call('components:convertValue', component, property, value);

                // render
                app.call('viewport:render');
            }
        };

        obj.on('*:insert', setComponentProperty);
        obj.on('*:remove', setComponentProperty);

    });

});
