import { BooleanInput, Button, Container, Label, RadioButton } from '@playcanvas/pcui';
import {
    CULLFACE_BACK,
    CULLFACE_NONE,
    RENDERSTYLE_SOLID,
    RENDERSTYLE_WIREFRAME,
    SHADERPASS_ALBEDO,
    SHADERPASS_AO,
    SHADERPASS_EMISSION,
    SHADERPASS_FORWARD,
    SHADERPASS_GLOSS,
    SHADERPASS_LIGHTING,
    SHADERPASS_METALNESS,
    SHADERPASS_OPACITY,
    SHADERPASS_SPECULARITY,
    SHADERPASS_UV0,
    SHADERPASS_WORLDNORMAL
} from 'playcanvas';

editor.once('viewport:load', (app) => {
    const controls = editor.call('layout.toolbar.launch');

    // Render dropdown
    const renderContainer = new Container({
        class: 'render'
    });
    controls.prepend(renderContainer);

    const renderButton = new Button({
        icon: 'E188',
        text: 'Render'
    });
    renderContainer.append(renderButton);

    const renderOptions = new Container({
        class: 'render-options',
        hidden: true
    });
    renderContainer.append(renderOptions);

    // Option Fields UI
    const createCheckbox = (name, callback = (state) => {}) => {
        // Create UI Panel
        const renderOption = new Container({
            flex: true
        });
        renderOptions.append(renderOption);

        // Create Field
        let state = false;
        const renderOptionRadio = new BooleanInput({
            value: state
        });
        renderOption.append(renderOptionRadio);

        // Listen for radio button clicks
        renderOption.dom.addEventListener('click', () => {
            state = !state;
            renderOptionRadio.value = state;
            callback(state);
        });

        // Create Label
        const label = new Label({
            text: name
        });
        renderOption.append(label);
    };

    const renderRadioOptions = [];
    const createShaderOption = (name: string, state = false, callback: () => void = () => {}) => {
        // Create UI Panel
        const renderOption = new Container({
            flex: true
        });
        renderOptions.append(renderOption);

        // Create Field
        const renderOptionRadio = new RadioButton({
            value: state
        });
        renderOption.append(renderOptionRadio);
        renderRadioOptions.push(renderOptionRadio);
        if (state) {
            renderButton.text = name;
        }

        // Listen for radio button clicks
        renderOption.dom.addEventListener('click', () => {
            renderButton.text = name;
            for (let i = 0; i < renderRadioOptions.length; i++) {
                renderRadioOptions[i].value = false;
            }
            renderOptionRadio.value = true;
            callback();
        });

        // Create Label
        const label = new Label({
            text: name
        });
        renderOption.append(label);
    };

    // Wireframe
    createCheckbox('Wireframe', (state) => {
        renderButton.icon = state ? 'E187' : 'E188';

        const renderStyle = state ? RENDERSTYLE_WIREFRAME : RENDERSTYLE_SOLID;
        const sceneLayers = app.scene.layers.layerList;
        const gizmoLayers = editor.call('gizmo:layers:list');
        for (let i = 0; i < sceneLayers.length; i++) {
            const layer = sceneLayers[i];
            if (gizmoLayers.some(gizmoLayer => gizmoLayer.id === layer.id)) {
                continue;
            }
            for (let j = 0; j < layer.meshInstances.length; j++) {
                const meshInstance = layer.meshInstances[j];
                meshInstance.renderStyle = renderStyle;
            }
        }
        editor.call('viewport:render');
    });

    // Backface Culling
    let cullBackfaces = true;
    createCheckbox('Cull Backfaces', (state) => {
        cullBackfaces = !state;
        const cull = cullBackfaces ? CULLFACE_BACK : CULLFACE_NONE;
        const sceneLayers = app.scene.layers.layerList;
        const gizmoLayers = editor.call('gizmo:layers:list');
        for (let i = 0; i < sceneLayers.length; i++) {
            const layer = sceneLayers[i];
            if (gizmoLayers.some(gizmoLayer => gizmoLayer.id === layer.id)) {
                continue;
            }
            for (let j = 0; j < layer.meshInstances.length; j++) {
                layer.meshInstances[j].material.cull = cull;
            }
        }
        editor.call('viewport:render');
    });

    // Divider UI
    const divider = new Container({
        class: 'divider'
    });
    renderOptions.append(divider);

    // Shader Passes
    const shaderPassMap = {
        'Standard': SHADERPASS_FORWARD,
        'Albedo': SHADERPASS_ALBEDO,
        'Opacity': SHADERPASS_OPACITY,
        'World Normal': SHADERPASS_WORLDNORMAL,
        'Specularity': SHADERPASS_SPECULARITY,
        'Gloss': SHADERPASS_GLOSS,
        'Metalness': SHADERPASS_METALNESS,
        'AO': SHADERPASS_AO,
        'Emission': SHADERPASS_EMISSION,
        'Lighting': SHADERPASS_LIGHTING,
        'UV0': SHADERPASS_UV0
    };
    for (const name in shaderPassMap) {
        createShaderOption(name, name === 'Standard', () => {
            editor.emit('camera:shader:pass', shaderPassMap[name]);
        });
    }

    // UI interactions
    let timeout;
    let inOptions = false;
    let inButton = false;

    const enable = () => {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }

        renderOptions.hidden = false;
    };

    const disable = () => {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }

        if (!inOptions && !inButton) {
            renderOptions.hidden = true;
        }
    };

    renderContainer.dom.addEventListener('mouseenter', () => {
        inButton = true;
        enable();
    }, false);

    renderContainer.dom.addEventListener('mouseleave', () => {
        inButton = false;
        disable();
    }, false);

    renderContainer.dom.addEventListener('mouseenter', () => {
        inOptions = true;

        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
    }, false);

    renderContainer.dom.addEventListener('mouseleave', () => {
        inOptions = false;

        disable();
    }, false);
});
