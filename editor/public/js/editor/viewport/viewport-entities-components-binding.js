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
        var app;

        // subscribe to changes
        obj.on('*:set', function(path, value) {
            if (obj._silent || ! path.startsWith('components'))
                return;

            var entity = obj.entity;
            if (! entity) return;

            var parts = path.split('.');
            var component = parts[1];
            var property = parts[2];

            // ignore script component
            if (component === 'script')
                return;

            if (!entity[component]) {
                if (!property) {
                    // add component
                    var data = runtimeComponentData(component, value);

                    // override particlesystem
                    if (component === 'particlesystem') {
                        data.enabled = false;
                        data.autoPlay = true;
                    } else if (component === 'animation') {
                        data.enabled = false;
                    }

                    app = editor.call('viewport:app');
                    if (! app) return; // webgl not available
                    app.context.systems[component].addComponent(entity, data);

                    // render
                    editor.call('viewport:render');
                }
            } else if (property) {
                // edit component property
                value = obj.get('components.' + component + '.' + property);

                if (component === 'particlesystem') {
                    if (property === 'enabled') {
                        value = false;
                    } else if (property === 'autoPlay') {
                        value = true;
                    }
                } else if (component === 'animation') {
                    if (property === 'enabled') {
                        value = false;
                    }
                } else if (component === 'element') {
                    if (property === 'margin') {
                        var anchor = obj.get('components.element.anchor');
                        if (Math.abs(anchor[0] - anchor[2]) < 0.001 && Math.abs(anchor[1] - anchor[3]) < 0.001) {
                            return;
                        }
                    } else if (property === 'width' || property === 'height') {
                        var anchor = obj.get('components.element.anchor');
                        if (Math.abs(anchor[0] - anchor[2]) > 0.001 || Math.abs(anchor[1] - anchor[3]) > 0.001) {
                            return;
                        }
                    }
                }

                entity[component][property] = editor.call('components:convertValue', component, property, value);

                if (component === 'element' && property === 'anchor') {
                    if (Math.abs(value[0] - value[2]) > 0.001 || Math.abs(value[1] - value[3]) > 0.001) {
                        var margin = obj.get('components.element.margin');
                        entity.element.margin.set(margin[0], margin[1], margin[2], margin[3]);
                        entity.element.margin = entity.element.margin; // force change
                    } else {
                        entity.element.width = obj.get('components.element.width');
                        entity.element.height = obj.get('components.element.height');
                        var pos = obj.get('position');
                        entity.setLocalPosition(pos[0], pos[1], pos[2]);
                    }
                }

                // render
                editor.call('viewport:render');
            }
        });

        var setComponentProperty = function (path, value) {
            if (obj._silent || ! path.startsWith('components'))
                return;

            var entity = obj.entity;
            if (! entity) return;

            var parts = path.split('.');
            var component = parts[1];
            var property = parts[2];

            // ignore script component
            if (component === 'script')
                return;

            if (property) {
                // edit component property
                value = obj.get('components.' + component + '.' + property);
                entity[component][property] = editor.call('components:convertValue', component, property, value);

                // render
                editor.call('viewport:render');
            }
        };

        obj.on('*:insert', setComponentProperty);
        obj.on('*:remove', setComponentProperty);

        obj.on('*:unset', function (path) {
            if (obj._silent || ! path.startsWith('components'))
                return;

            var entity = obj.entity;
            if (! entity) return;

            var parts = path.split('.');
            var component = parts[1];
            var property = parts[2];

            if (component === 'script')
                return;

            if (property) {
                // edit component property
                var value = obj.get('components.' + component + '.' + property);
                entity[component][property] = editor.call('components:convertValue', component, property, value);
            } else if (entity[component]) {
                // remove component
                var app = editor.call('viewport:app');
                if (! app) return; // webgl not available

                app.context.systems[component].removeComponent(entity);
            }

            // render
            editor.call('viewport:render');
        });
    });
});
