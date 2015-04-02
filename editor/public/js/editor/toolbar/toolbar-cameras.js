editor.once('viewport:load', function(framework) {
    'use strict';

    var viewport = editor.call('layout.viewport');

    var options = {};

    framework.cameras.forEach(function (camera) {
        options[camera.getGuid()] = camera.name;
    });

    var combo = new ui.SelectField({
        options: options
    });
    combo.enabled = false;
    combo.class.add('viewport-camera');
    combo.value = framework.cameras[0].getGuid();

    editor.on('permissions:writeState', function(state) {
        combo.enabled = state;
    });


    viewport.append(combo);

    combo.on('change', function (value) {
        var framework = editor.call('viewport:framework') ;
        if (framework) {
            framework.setActiveCamera(value);
        }
    });

    function refreshOptions () {
        combo._updateOptions(options);
    }

    // look for entities with camera components and
    // add those to the list as well
    editor.on('entities:add', function (entity) {
        if (entity.get('components.camera')) {
            options[entity.get('resource_id')] = entity.get('name');
            refreshOptions();
        }

        entity.on('components.camera:set', function (value) {
            if (value) {
                options[entity.get('resource_id')] = entity.get('name');
                refreshOptions();
            }
        });

        entity.on('components.camera:unset', function () {
            // reset active camera if the current one is deleted
            if (framework.activeCamera.getGuid() === entity.get('resource_id')) {
                combo.value = framework.cameras[0].getGuid();
            }

            delete options[entity.get('resource_id')];
            refreshOptions();
        });
    });

    editor.on('entities:remove', function (entity) {
        // reset active camera if the current one is deleted
        if (framework.activeCamera.getGuid() === entity.get('resource_id')) {
            combo.value = framework.cameras[0].getGuid();
        }

        delete options[entity.get('resource_id')];
        refreshOptions();
    });
});
