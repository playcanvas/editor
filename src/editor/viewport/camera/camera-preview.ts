import { Button } from '@playcanvas/pcui';
import { FOG_NONE, Vec4 } from 'playcanvas';

editor.once('load', () => {

    let selectedEntity = null; // currently selected entity
    let currentCamera = null;  // current camera rendering to viewport
    let renderCamera = false;
    let pinnedCamera = null;   // camera that is currently pinned in preview
    let lastCamera = null;     // camera that was last set to preview
    let preRenderEvent = null;
    let postRenderEvent = null;
    let events = [];
    const rect = new Vec4(0, 0.8, 0.2, 0.2);
    let app = null;
    let previewCamera = null;

    const viewport = editor.call('layout.viewport');

    const cameraPreviewBorder = document.createElement('div');
    cameraPreviewBorder.classList.add('camera-preview');
    if (editor.call('permissions:write')) {
        cameraPreviewBorder.classList.add('clickable');
    }

    const btnPin = new Button({
        class: 'lock',
        icon: 'E340'
    });
    cameraPreviewBorder.appendChild(btnPin.element);

    const updateCameraState = function () {
        if (pinnedCamera) {
            if (currentCamera && currentCamera === pinnedCamera.entity) {
                renderCamera = false;
            } else {
                renderCamera = true;
            }
        } else if (selectedEntity && selectedEntity.entity && !(currentCamera && selectedEntity.entity === currentCamera) && selectedEntity.has('components.camera')) {
            renderCamera = true;
        } else {
            renderCamera = false;
        }

        if (renderCamera) {
            let camera;

            // start rendering preview
            cameraPreviewBorder.classList.add('active');

            const obj = pinnedCamera || selectedEntity;
            if (obj.entity && obj.entity.camera) {
                camera = obj.entity.camera;
            }

            if (camera) {
                // ### ENABLE CAMERA ###

                previewCamera = camera;
                previewCamera.entity.enabled = true;
                previewCamera.enabled = true;
                previewCamera.rect = rect;
                previewCamera.priority = 99999;

                preRenderEvent = app.scene.on('prerender', (camera) => {
                    // the preview camera uses the scene fog settings
                    if (previewCamera === camera) {
                        app.scene.fog.type = editor.call('sceneSettings')?.get('render.fog') ?? pc.FOG_NONE;
                    }
                });

                postRenderEvent = app.scene.on('postrender', () => {
                    if (previewCamera === camera) {
                        app.scene.fog.type = FOG_NONE;
                    }
                });

                if (lastCamera && lastCamera !== camera) {
                    if (lastCamera && lastCamera.entity && lastCamera.data && lastCamera.entity !== currentCamera) {
                        lastCamera.enabled = false;
                    }
                    lastCamera = null;
                }

                lastCamera = camera;
            }
        } else {

            // stop rendering preview
            cameraPreviewBorder.classList.remove('active');

            preRenderEvent?.off();
            preRenderEvent = null;

            postRenderEvent?.off();
            postRenderEvent = null;

            if (lastCamera) {
                // ### DISABLE CAMERA ###
                if (lastCamera && lastCamera.entity && lastCamera.data && lastCamera.entity !== currentCamera) {
                    lastCamera.enabled = false;
                }
                lastCamera = null;
            }
        }
    };

    let frameRequest = null;
    const deferUpdate = function () {
        if (frameRequest) {
            cancelAnimationFrame(frameRequest);
        }

        frameRequest = requestAnimationFrame(updateCameraState);
    };

    btnPin.on('click', (evt) => {
        evt.stopPropagation();

        if (pinnedCamera) {
            pinnedCamera = null;
            btnPin.class.remove('active');
        } else {
            pinnedCamera = selectedEntity;
            btnPin.class.add('active');
        }

        updateCameraState();
    });

    viewport.append(cameraPreviewBorder);

    cameraPreviewBorder.addEventListener('click', () => {
        const obj = pinnedCamera || selectedEntity;
        if (!obj || !obj.entity || !editor.call('permissions:write')) {
            return;
        }

        editor.call('camera:set', obj.entity);
    }, false);

    editor.once('viewport:load', (application) => {
        app = application;
    });

    editor.on('permissions:writeState', (state) => {
        if (state) {
            cameraPreviewBorder.classList.add('clickable');
        } else {
            cameraPreviewBorder.classList.remove('clickable');
        }
    });

    editor.on('viewport:resize', (width, height) => {
        rect.x = 6.0 / width;
        rect.y = 1.0 - ((43.0 + 196.0) / (height || 1.0));
        rect.z = 258.0 / width;
        rect.w = 198.0 / height;

        updateCameraState();
    });

    editor.on('camera:change', (camera) => {
        if (camera && !camera.__editorCamera) {
            currentCamera = camera;
        } else {
            currentCamera = null;
        }

        updateCameraState();
    });

    editor.on('selector:change', (type, items) => {
        if (events.length) {
            for (let i = 0; i < events.length; i++) {
                events[i].unbind();
            }

            events = [];
        }

        if (type === 'entity' && items.length === 1) {
            selectedEntity = items[0];
            // wait a frame before updating camera so that camera exists in the engine entity
            events.push(selectedEntity.on('components.camera:set', deferUpdate));
            events.push(selectedEntity.on('components.camera:unset', updateCameraState));
            events.push(selectedEntity.on('destroy', updateCameraState));
        } else {
            selectedEntity = null;
        }

        updateCameraState();
    });
});
