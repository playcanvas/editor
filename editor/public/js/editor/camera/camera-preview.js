editor.once('load', function() {
    'use strict';

    var selectedEntity = null;
    var currentCamera = null;
    var renderCamera = false;
    var pinnedCamera = null;
    var lastCamera = null;
    var oldLayers = null;
    var events = [ ];
    var evtUpdate = null;
    var rect = new pc.Vec4(0, 0.8, 0.2, 0.2);
    var app = null;

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
            // start rendering preview
            cameraPreviewBorder.classList.add('active');

            var obj = pinnedCamera || selectedEntity;

            if (obj.entity && obj.entity.camera) {
                var camera = obj.entity.camera;

                camera.enabled = true;
                camera.rect = rect;
                camera.camera.cullingMask = GEOMETRY_ONLY_CULLING_MASK;

                var gizmoLayers = editor.call('gizmo:layers:list');
                oldLayers = camera.layers;
                var cameraLayers = camera.layers.slice(0);
                // add all the gizmo layers to be rendered
                for (var i = 0; i < gizmoLayers.length; i++) {
                    cameraLayers.push(gizmoLayers[i].id);
                }
                camera.layers = cameraLayers;

                lastCamera = camera;
            }


        } else {
            // stop rendering preview
            cameraPreviewBorder.classList.remove('active');

            if (lastCamera) {
                lastCamera.layers = oldLayers;
                lastCamera.enabled = false;
                lastCamera.camera.cullingMask = DEFAULT_CULLING_MASK;
                lastCamera = null;
            }
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
