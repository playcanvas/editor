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
    const cameraPanel = new pcui.Container({
        class: 'camera',
        flex: true
    });
    controls.append(cameraPanel);

    const cameraSelected = new pcui.Label({
        class: 'viewport-camera'
    });
    cameraPanel.append(cameraSelected);

    const cameraOptions = new pcui.Container({
        class: 'camera-options',
        hidden: true
    });
    cameraPanel.append(cameraOptions);

    // Clear out all active cameras
    const clearRadioButtons = function () {
        for (const key in viewportCamera.optionElements) {
            const radioButton = viewportCamera.optionElements[key];
            radioButton.value = false;
        }
    };

    // Option Fields UI
    const createOption = function (title, id) {

        // Create UI Panel
        const panelCameraOption = new pcui.Container({
            flex: true
        });
        cameraOptions.append(panelCameraOption);

        // Create Field
        const fieldCameraOption = new pcui.RadioButton();
        viewportCamera.optionElements[id] = fieldCameraOption;
        const currentCamera = viewportCamera.optionTitles[viewportCamera.active];
        fieldCameraOption.value = currentCamera === title;
        panelCameraOption.append(fieldCameraOption);

        // Listen for field option clicks
        panelCameraOption.element.addEventListener('click', function () {
            const entity = app.root.findByGuid(id);
            editor.call('camera:set', entity);

            clearRadioButtons();

            // Set active camera radio button
            fieldCameraOption.value = true;
        });

        if (panelCameraOption.value)
            viewportCamera.active = currentCamera;

        panelCameraOption.on('change', function (value) {
            editor.call('camera:change', value);
        });

        // Create Label
        const label = new pcui.Label({
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
        const entity = app.root.findByGuid(value);
        editor.call('camera:set', entity);
    });


    const buildOptionsUI = function () {
        // Reset options
        cameraOptions.innerElement.innerHTML = '';
        viewportCamera.optionElements = {};

        // Physics Edit Mode
        const physicsEditMode = new pcui.Container();
        cameraOptions.append(physicsEditMode);

        // field
        const fieldCollisionVisible = new pcui.BooleanInput();
        physicsEditMode.append(fieldCollisionVisible);
        fieldCollisionVisible.value = editor.call('gizmo:collision:visible');
        fieldCollisionVisible.on('change', function (value) {
            editor.call('gizmo:collision:visible', value);
        });
        editor.on('gizmo:collision:visible', function (visible) {
            fieldCollisionVisible.value = visible;
        });
        // label
        const label = new pcui.Label({
            text: 'Physics Edit Mode'
        });
        label.on('click', function () {
            fieldCollisionVisible.element.click();
        });
        physicsEditMode.append(label);

        // Divider UI
        const divider = new pcui.Container({
            class: 'divider'
        });
        cameraOptions.append(divider);

        for (const key in viewportCamera.optionTitles) {
            createOption(viewportCamera.optionTitles[key], key);
        }
    };

    const refreshOptions = function (entity) {
        buildOptionsUI(entity);

        const writePermission = editor.call('permissions:write');
        for (const key in viewportCamera.optionElements) {
            if (viewportCamera.cameras[key].__editorCamera)
                continue;

            const radioButton = viewportCamera.optionElements[key];
            radioButton.parent.hidden = !writePermission;
        }
    };

    editor.on('permissions:writeState', refreshOptions);

    editor.on('camera:add', function (entity) {
        const guid = entity.getGuid();

        viewportCamera.optionTitles[guid] = entity.name;
        viewportCamera.cameras[guid] = entity;
        refreshOptions();

        // Set perspective camera as default
        if (entity.name === "Perspective") {
            viewportCamera.default = guid;
            viewportCamera.active = guid;
        }

        if (viewportCamera.cameraEvents[guid])
            viewportCamera.cameraEvents[guid].unbind();

        const obj = editor.call('entities:get', guid);
        if (obj) {
            viewportCamera.cameraEvents[guid] = obj.on('name:set', function (value) {
                viewportCamera.optionTitles[guid] = value;
                refreshOptions();

                if (viewportCamera.active === guid)
                    cameraSelected.text = value;
            });
        }
    });

    editor.on('camera:remove', function (entity) {
        const guid = entity.getGuid();

        delete viewportCamera.optionTitles[guid];
        refreshOptions();

        if (viewportCamera.cameraEvents[guid]) {
            viewportCamera.cameraEvents[guid].unbind();
            delete viewportCamera.cameraEvents[guid];
        }
    });

    // Update camera selected title and active button
    editor.on('camera:change', function (entity) {
        viewportCamera.active = entity.getGuid();
        clearRadioButtons();
        viewportCamera.optionElements[viewportCamera.active].value = true;
        cameraSelected.text = viewportCamera.optionTitles[entity.getGuid()];
    });

    // UI interactions
    let inOptions = false;
    let inButton = false;

    cameraPanel.element.addEventListener('mouseenter', function () {
        inButton = true;
        cameraOptions.hidden = false;
    }, false);

    cameraPanel.element.addEventListener('mouseleave', function () {
        inButton = false;
        cameraOptions.hidden = !inOptions && !inButton;
    }, false);

    cameraOptions.element.addEventListener('mouseenter', function () {
        inOptions = true;
    }, false);

    cameraOptions.element.addEventListener('mouseleave', function () {
        inOptions = false;
        cameraOptions.hidden = !inOptions && !inButton;
    }, false);
});
