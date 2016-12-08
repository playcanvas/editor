editor.once('load', function() {
    'use sctrict';

    var selectedEntity = null;
    var currentCamera = null;
    var renderCamera = false;
    var events = [ ];
    var evtUpdate = null;
    var rect = new pc.Vec4(0, 0.8, 0.2, 0.2);
    var app = editor.call('viewport:app');
    var viewport = editor.call('layout.viewport');

    var cameraPreviewBorder = document.createElement('div');
    cameraPreviewBorder.classList.add('camera-preview');
    viewport.append(cameraPreviewBorder);

    cameraPreviewBorder.addEventListener('click', function() {
        if (! selectedEntity || ! selectedEntity.entity)
            return;

        editor.call('camera:set', selectedEntity.entity);
    }, false);


    editor.once('viewport:load', function(application) {
        app = application;
    });

    editor.on('viewport:resize', function(width, height) {
        rect.x = 6.0 / width;
        rect.y = 1.0 - ((43.0 + 196.0) / (height || 1.0));
        rect.z = 258.0 / width;
        rect.w = 198.0 / height;
    });

    var update = function() {
        if (! renderCamera)
            return;

        var camera = selectedEntity.entity.camera;
        if (! camera)
            return;

        camera.camera.renderTarget = null;
        camera.rect = rect;

        camera.frameBegin();
        app.renderer.render(app.scene, camera.camera);
        camera.frameEnd();
    };

    var updateCameraState = function() {
        if (selectedEntity && selectedEntity.entity && ! (currentCamera && selectedEntity.entity === currentCamera) && selectedEntity.entity.camera && editor.call('permissions:write')) {
            renderCamera = true;

            cameraPreviewBorder.classList.add('active');

            if (! evtUpdate)
                evtUpdate = editor.on('viewport:postRender', update);

        } else {
            renderCamera = false;

            cameraPreviewBorder.classList.remove('active');

            if (evtUpdate) {
                evtUpdate.unbind();
                evtUpdate = null;
            }
        }
    };

    editor.on('permissions:writeState', updateCameraState);

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
