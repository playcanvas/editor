editor.once('load', function() {
    'use strict';

    var selectedEntity = null; // currently selected entity
    var currentCamera = null;  // current camera rendering to viewport
    var renderCamera = false;
    var pinnedCamera = null;   // camera that is currently pinned in preview
    var enabled = false;
    var lastCamera = null;     // camera that was last set to preview
    var oldLayers = null;
    var events = [ ];
    var evtUpdate = null;
    var rect = new pc.Vec4(0, 0.8, 0.2, 0.2);
    var app = null;
    var previewLayer = null;
    var editorCamera = null;
    var previewCamera = null;

    var viewport = editor.call('layout.viewport');

    var cameraPreviewBorder = document.createElement('div');
    cameraPreviewBorder.classList.add('camera-preview');
    if (editor.call('permissions:write'))
        cameraPreviewBorder.classList.add('clickable');

    var btnPin = new ui.Button({
        text: '&#58177;'
    });
    btnPin.class.add('pin');
    cameraPreviewBorder.appendChild(btnPin.element);

    btnPin.on('click', function(evt) {
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

    cameraPreviewBorder.addEventListener('click', function() {
        var obj = pinnedCamera || selectedEntity;
        if (! obj || ! obj.entity || ! editor.call('permissions:write'))
            return;

        editor.call('camera:set', obj.entity);

        // updateCameraState();
    }, false);


    editor.once('viewport:load', function(application) {
        app = application;
    });

    editor.on('permissions:writeState', function(state) {
        if (state) {
            cameraPreviewBorder.classList.add('clickable');
        } else {
            cameraPreviewBorder.classList.remove('clickable');
        }
    });

    editor.on('viewport:resize', function(width, height) {
        rect.x = 6.0 / width;
        rect.y = 1.0 - ((43.0 + 196.0) / (height || 1.0));
        rect.z = 258.0 / width;
        rect.w = 198.0 / height;

        updateCameraState();
    });

    var updateCameraState = function() {
        if (pinnedCamera) {
            if (currentCamera && currentCamera === pinnedCamera.entity) {
                renderCamera = false;
            } else {
                renderCamera = true;
            }
        } else if (selectedEntity && selectedEntity.entity && ! (currentCamera && selectedEntity.entity === currentCamera) && selectedEntity.has('components.camera')) {
            renderCamera = true;
        } else {
            renderCamera = false;
        }

        if (renderCamera) {
            var camera;

            // start rendering preview
            cameraPreviewBorder.classList.add('active');

            var obj = pinnedCamera || selectedEntity;
            if (obj.entity && obj.entity.camera) {
                camera = obj.entity.camera;
            }

            if (camera) {
                // ### ENABLE CAMERA ###

                previewCamera = camera;
                editorCamera = editor.call('camera:current');

                if (!previewLayer) {
                    previewLayer = editor.call('gizmo:layers', 'Camera Preview');
                    previewLayer.onPostRender = function() {
                        previewCamera.enabled = true;
                        previewCamera.rect = rect;
                        previewCamera.camera.cullingMask = GEOMETRY_ONLY_CULLING_MASK;
                        editorCamera.enabled = false;

                        previewLayer.enabled = false;
                        app.renderer.renderComposition(app.scene.layers);
                        previewLayer.enabled = true;

                        previewCamera.enabled = false;
                        previewCamera.camera.cullingMask = DEFAULT_CULLING_MASK;
                        editorCamera.enabled = true;
                    };
                }

                previewLayer.enabled = true;

                if (lastCamera && lastCamera !== camera) {
                    lastCamera.enabled = false;
                    lastCamera.camera.cullingMask = DEFAULT_CULLING_MASK;
                    lastCamera = null;
                }


                lastCamera = camera;
            }
        } else {

            // stop rendering preview
            cameraPreviewBorder.classList.remove('active');


            if (previewLayer) previewLayer.enabled = false;
            if (lastCamera) {
                // ### DISABLE CAMERA ###
                lastCamera.enabled = false;
                lastCamera.camera.cullingMask = DEFAULT_CULLING_MASK;
                lastCamera = null;
            }


            enabled = false;
        }
    };

    editor.on('camera:change', function(camera) {
        if (camera && ! camera.__editorCamera) {
            currentCamera = camera;
        } else {
            currentCamera = null;
        }

        updateCameraState();
    });

    editor.on('selector:change', function(type, items) {
        if (events.length) {
            for(var i = 0; i < events.length; i++)
                events[i].unbind();

            events = [ ];
        }

        if (type === 'entity' && items.length === 1) {
            selectedEntity = items[0];
            events.push(selectedEntity.on('components.camera:set', updateCameraState));
            events.push(selectedEntity.on('components.camera:unset', updateCameraState));
            events.push(selectedEntity.on('destroy', updateCameraState));
        } else {
            selectedEntity = null;
        }

        updateCameraState();
    });
});
