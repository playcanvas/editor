editor.once('viewport:load', function () {
    'use strict';

    const controls = editor.call('layout.toolbar.launch');

    const app = editor.call('viewport:app');
    if (!app) return;  // webgl not available

    const viewportCamera = {
        active: null,
        default: null,
        cameras: {},
        cameraEvents: {},
        optionTitles: {},
        optionElements: {}
    };

    // Panels and Containers UI
    const cameraPanel = new ui.Panel();
    cameraPanel.class.add('camera');
    controls.append(cameraPanel);

    const cameraSelected = new ui.Label();
    cameraSelected.class.add('viewport-camera');
    cameraSelected.renderChanges = false;
    cameraPanel.append(cameraSelected);

    const cameraOptions = new ui.Panel();
    cameraOptions.class.add('camera-options');
    cameraOptions.hidden = true;
    cameraPanel.append(cameraOptions);

    // Option Fields UI
    var createOption = function (title, id) {

        // Create UI Panel
        const panelCameraOption = new ui.Panel();
        panelCameraOption.class.add('flex');
        cameraOptions.append(panelCameraOption);

        // Create Field
        const fieldCameraOption = new ui.RadioButton();
        viewportCamera.optionElements[id] = fieldCameraOption;
        const currentCamera = viewportCamera.optionTitles[viewportCamera.active];
        fieldCameraOption.value = currentCamera == title;
        panelCameraOption.append(fieldCameraOption);

        // Listen for field option (radio button) clicks
        fieldCameraOption.element.addEventListener('click', function () {
            var entity = app.root.findByGuid(id);
            editor.call('camera:set', entity);

            // Clear out all active cameras
            for (const key in viewportCamera.optionElements) {
                const radioButton = viewportCamera.optionElements[key];
                radioButton.value = false;
            }

            // Set active camera radio button
            fieldCameraOption.value = true;
        });

        if (panelCameraOption.value)
            viewportCamera.active = currentCamera;

        panelCameraOption.on('change', function (value) {
            editor.call('camera:change', value);
        });

        // Create Label
        const label = new ui.Label({
            text: title
        });
        label.on('click', function () {
            panelCameraOption.element.click();
        });
        panelCameraOption.append(label);
    };

    // Camera Events
    editor.method('layout.viewport.camera', function () {
        return cameraOptions;
    });

    cameraOptions.on('change', function (value) {
        var entity = app.root.findByGuid(value);
        editor.call('camera:set', entity);
    });


    var buildOptionsUI = function () {
        // Reset options
        cameraOptions.innerElement.innerHTML = '';
        viewportCamera.optionElements = {};

        for (const key in viewportCamera.optionTitles) {
            createOption(viewportCamera.optionTitles[key], key);
        }

        // Divider UI
        const divider = new ui.Panel();
        divider.class.add("divider");
        cameraOptions.append(divider);

        // Physics Edit Mode
        const panelCollision = new ui.Panel();
        panelCollision.class.add('flex');
        cameraOptions.append(panelCollision);
        // field
        const fieldCollisionVisible = new ui.Checkbox();
        fieldCollisionVisible.class.add('tick');
        panelCollision.append(fieldCollisionVisible);
        fieldCollisionVisible.value = editor.call('gizmo:collision:visible');
        fieldCollisionVisible.on('change', function (value) {
            editor.call('gizmo:collision:visible', value);
        });
        editor.on('gizmo:collision:visible', function (visible) {
            fieldCollisionVisible.value = visible;
        });
        // label
        const label = new ui.Label({
            text: 'Physics Edit Mode'
        });
        label.on('click', function () {
            fieldCollisionVisible.element.click();
        });
        panelCollision.append(label);
    };

    var refreshOptions = function (entity) {
        buildOptionsUI(entity);

        var writePermission = editor.call('permissions:write');
        for (const key in viewportCamera.optionElements) {
            if (viewportCamera.cameras[key].__editorCamera)
                continue;

            if (writePermission) {
                viewportCamera.optionElements[key].element.classList.remove('hidden');
            } else {
                viewportCamera.optionElements[key].element.classList.add('hidden');
            }
        }
    };

    editor.on('permissions:writeState', refreshOptions);

    editor.on('camera:add', function (entity) {
        viewportCamera.optionTitles[entity.getGuid()] = entity.name;
        viewportCamera.cameras[entity.getGuid()] = entity;
        refreshOptions();

        // Set perspective camera as default
        if (entity.name == "Perspective") {
            viewportCamera.default = entity.getGuid();
            viewportCamera.active = entity.getGuid();
        }

        if (viewportCamera.cameraEvents[entity.getGuid()])
            viewportCamera.cameraEvents[entity.getGuid()].unbind();

        const obj = editor.call('entities:get', entity.getGuid());
        if (obj) {
            viewportCamera.cameraEvents[entity.getGuid()] = obj.on('name:set', function (value) {
                viewportCamera.optionTitles[entity.getGuid()] = value;
                refreshOptions();

                if (viewportCamera.active === entity.getGuid())
                    cameraSelected.text = value;
            });
        }
    });

    editor.on('camera:remove', function (entity) {
        delete viewportCamera.optionTitles[entity.getGuid()];
        refreshOptions();

        if (viewportCamera.cameraEvents[entity.getGuid()]) {
            viewportCamera.cameraEvents[entity.getGuid()].unbind();
            delete viewportCamera.cameraEvents[entity.getGuid()];
        }
    });

    // Update camera selected title
    editor.on('camera:change', function (entity) {
        viewportCamera.active = entity.getGuid();
        cameraSelected.text = viewportCamera.optionTitles[entity.getGuid()];
    });

    // UI interactions
    var timeout;
    var inOptions = false;
    var inButton = false;

    const enable = function () {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }

        cameraOptions.hidden = false;
    };

    const disable = function () {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }

        timeout = setTimeout(function () {
            if (!inOptions && !inButton)
                cameraOptions.hidden = true;
        }, 500);
    };

    cameraPanel.element.addEventListener('mouseenter', function () {
        inButton = true;

        if (cameraOptions.hidden) {
            enable();
        }
    }, false);

    cameraPanel.element.addEventListener('mouseleave', function () {
        inButton = false;

        disable();
    }, false);

    cameraOptions.element.addEventListener('mouseenter', function () {
        inOptions = true;

        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
    }, false);

    cameraOptions.element.addEventListener('mouseleave', function () {
        inOptions = false;

        disable();
    }, false);

});
