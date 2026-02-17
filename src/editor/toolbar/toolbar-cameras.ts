import { BooleanInput, Container, Label, RadioButton } from '@playcanvas/pcui';

editor.once('viewport:load', (app) => {
    const controls = editor.call('layout.toolbar.launch');

    const viewportCamera = {
        active: null,
        default: null,
        cameras: {},
        cameraEvents: {},
        optionTitles: {},
        optionElements: {}
    };

    // Panels and Containers UI
    const cameraPanel = new Container({
        class: 'camera'
    });
    controls.prepend(cameraPanel);

    const cameraSelected = new Label({
        class: 'viewport-camera'
    });
    cameraPanel.append(cameraSelected);

    const cameraOptions = new Container({
        class: 'camera-options',
        hidden: true
    });
    cameraPanel.append(cameraOptions);

    // Clear out all active cameras
    const clearRadioButtons = () => {
        for (const key in viewportCamera.optionElements) {
            const radioButton = viewportCamera.optionElements[key];
            radioButton.value = false;
        }
    };

    // Option Fields UI
    const createOption = (cameraName: string, guid: string) => {

        // Create UI Panel
        const panelCameraOption = new Container({
            flex: true
        });
        cameraOptions.append(panelCameraOption);

        // Create Field
        const currentCamera = viewportCamera.optionTitles[viewportCamera.active];
        const fieldCameraOption = new RadioButton({
            value: currentCamera === cameraName
        });
        panelCameraOption.append(fieldCameraOption);
        viewportCamera.optionElements[guid] = fieldCameraOption;

        // Listen for field option clicks
        panelCameraOption.dom.addEventListener('click', () => {
            const entity = app.root.findByGuid(guid);
            editor.call('camera:set', entity);

            clearRadioButtons();

            // Set active camera radio button
            fieldCameraOption.value = true;
        });

        if (panelCameraOption.value) {
            viewportCamera.active = currentCamera;
        }

        panelCameraOption.on('change', (value) => {
            editor.call('camera:change', value);
        });

        // Create Label
        const label = new Label({
            text: cameraName
        });
        label.on('click', () => {
            panelCameraOption.dom.click();
        });
        panelCameraOption.append(label);
    };

    cameraOptions.on('change', (value) => {
        const entity = app.root.findByGuid(value);
        editor.call('camera:set', entity);
    });

    const buildOptionsUI = () => {
        // Reset options
        cameraOptions.innerElement.innerHTML = '';
        viewportCamera.optionElements = {};

        // Physics Edit Mode
        const panelCollision = new Container({
            flex: true
        });
        cameraOptions.append(panelCollision);
        // field
        const fieldCollisionVisible = new BooleanInput({
            value: editor.call('gizmo:collision:visible')
        });
        panelCollision.append(fieldCollisionVisible);
        fieldCollisionVisible.on('change', (value) => {
            editor.call('gizmo:collision:visible', value);
        });
        editor.on('gizmo:collision:visible', (visible) => {
            fieldCollisionVisible.value = visible;
        });
        // label
        const label = new Label({
            text: 'Physics Edit Mode'
        });
        label.on('click', () => {
            fieldCollisionVisible.dom.click();
        });
        panelCollision.append(label);

        // Divider UI
        const divider = new Container({
            class: 'divider'
        });
        cameraOptions.append(divider);

        for (const key in viewportCamera.optionTitles) {
            createOption(viewportCamera.optionTitles[key], key);
        }
    };

    const refreshOptions = () => {
        buildOptionsUI();

        const writePermission = editor.call('permissions:write');
        for (const key in viewportCamera.optionElements) {
            if (viewportCamera.cameras[key].__editorCamera) {
                continue;
            }

            const radioButton = viewportCamera.optionElements[key];
            radioButton.hidden = !writePermission;
        }
    };

    editor.on('permissions:writeState', refreshOptions);

    editor.on('camera:add', (entity) => {
        const guid = entity.getGuid();

        viewportCamera.optionTitles[guid] = entity.name;
        viewportCamera.cameras[guid] = entity;
        refreshOptions();

        // Set perspective camera as default
        if (entity.name === 'Perspective') {
            viewportCamera.default = guid;
            viewportCamera.active = guid;
        }

        if (viewportCamera.cameraEvents[guid]) {
            viewportCamera.cameraEvents[guid].unbind();
        }

        const obj = editor.call('entities:get', guid);
        if (obj) {
            viewportCamera.cameraEvents[guid] = obj.on('name:set', (value) => {
                viewportCamera.optionTitles[guid] = value;
                refreshOptions();

                if (viewportCamera.active === guid) {
                    cameraSelected.text = value;
                }
            });
        }
    });

    editor.on('camera:remove', (entity) => {
        const guid = entity.getGuid();

        delete viewportCamera.optionTitles[guid];
        refreshOptions();

        if (viewportCamera.cameraEvents[guid]) {
            viewportCamera.cameraEvents[guid].unbind();
            delete viewportCamera.cameraEvents[guid];
        }
    });

    // Update camera selected title and active button
    editor.on('camera:change', (entity) => {
        const guid = entity.getGuid();

        viewportCamera.active = guid;
        clearRadioButtons();
        viewportCamera.optionElements[viewportCamera.active].value = true;
        cameraSelected.text = viewportCamera.optionTitles[guid];
    });

    // UI interactions
    let timeout;
    let inOptions = false;
    let inButton = false;

    const enable = () => {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }

        cameraOptions.hidden = false;
    };

    const disable = () => {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }

        if (!inOptions && !inButton) {
            cameraOptions.hidden = true;
        }
    };

    cameraPanel.dom.addEventListener('mouseenter', () => {
        inButton = true;
        enable();
    }, false);

    cameraPanel.dom.addEventListener('mouseleave', () => {
        inButton = false;
        disable();
    }, false);

    cameraOptions.dom.addEventListener('mouseenter', () => {
        inOptions = true;

        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
    }, false);

    cameraOptions.dom.addEventListener('mouseleave', () => {
        inOptions = false;

        disable();
    }, false);
});
