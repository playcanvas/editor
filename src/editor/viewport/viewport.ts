import { Canvas } from '@playcanvas/pcui';

import { ViewportApplication } from './viewport-application.ts';

editor.once('load', () => {
    const canvas = new Canvas({
        id: 'canvas-3d',
        useDevicePixelRatio: true
    });

    let keepRendering = false;

    const projectUserSettings = editor.call('settings:projectUser');

    // Passing the observer as the render settings are not available yet
    const sceneSettingsObserver = editor.call('sceneSettings');

    // Allow anti-aliasing to be forcibly disabled - this is useful for Selenium tests in
    // order to ensure that the generated screenshots are consistent across different GPUs.
    const disableAntiAliasing = /disableAntiAliasing=true/.test(location.search);

    // create playcanvas application
    let app;
    try {
        app = new ViewportApplication(canvas.element, {
            mouse: new pc.Mouse(canvas.element),
            touch: 'ontouchstart' in window ? new pc.TouchDevice(canvas.element) : null,
            editorSettings: projectUserSettings.json().editor,
            graphicsDeviceOptions: {
                antialias: !disableAntiAliasing,
                alpha: true
            },
            sceneSettingsObserver: sceneSettingsObserver
        });

        // Depth layer is where the framebuffer is copied to a texture to be used in the following layers.
        // Move the depth layer to take place after World and Skydome layers, to capture both of them.
        const depthLayer = app.scene.layers.getLayerById(pc.LAYERID_DEPTH);
        app.scene.layers.remove(depthLayer);
        app.scene.layers.insertOpaque(depthLayer, 2);

        app.enableBundles = false;

        // Force compatibility mode for Specular and Sheen maps when Editor is running with V2
        // and project running on V1.
        if (!editor.projectEngineV2) {
            app.scene.forcePassThroughSpecular = true;
        }
    } catch (ex) {
        editor.emit('viewport:error', ex);
        return;
    }

    // set module configs
    config.wasmModules.forEach((m) => {
        pc.WasmModule.setConfig(m.moduleName, {
            glueUrl: m.glueUrl,
            wasmUrl: m.wasmUrl,
            fallbackUrl: m.fallbackUrl
        });
    });

    projectUserSettings.on('*:set', () => {
        app.setEditorSettings(projectUserSettings.json().editor);
    });


    // add canvas
    editor.call('layout.viewport').prepend(canvas);

    // get canvas
    editor.method('viewport:canvas', () => {
        return canvas;
    });

    // get app
    editor.method('viewport:app', () => {
        return app;
    });

    // re-render viewport
    editor.method('viewport:render', () => {
        app.redraw = true;
    });

    // returns true if the viewport should continuously render
    editor.method('viewport:keepRendering', (value) => {
        if (typeof value === 'boolean') {
            keepRendering = value;
        }

        return keepRendering;
    });

    app.start();

    editor.emit('viewport:load', app);
});
