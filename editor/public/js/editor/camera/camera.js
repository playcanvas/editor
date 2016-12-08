editor.once('load', function() {
    'use strict';

    editor.once('viewport:load', function() {
        var cameras = [ ];
        var camerasIndex = { };
        var editorCameras = { };
        var currentCamera = null;
        var defaultCamera = null;
        var app = editor.call('viewport:app');


        editor.method('camera:get', function(name) {
            return editorCameras[name] || null;
        });

        editor.method('camera:editor', function() {
            return editorCameras;
        });

        editor.method('camera:current', function() {
            return currentCamera;
        });

        editor.method('camera:set', function(entity) {
            if (! entity) entity = defaultCamera

            if (currentCamera === entity || ! entity.camera)
                return;

            var old = currentCamera;
            if (old && old.__editorCamera) old.enabled = false;

            currentCamera = entity;
            if (currentCamera.__editorCamera)
                currentCamera.enabled = true;

            editor.emit('camera:change', currentCamera, old);
            editor.call('viewport:render');
        });

        editor.method('camera:add', function(entity) {
            if (camerasIndex[entity.getGuid()])
                return;

            cameras.push(entity);
            camerasIndex[entity.getGuid()] = entity;

            editor.emit('camera:add', entity);
        });

        editor.method('camera:remove', function(entity) {
            if (! camerasIndex[entity.getGuid()])
                return;

            var ind = cameras.indexOf(entity);
            if (ind !== -1)
                cameras.splice(ind, 1);

            delete camerasIndex[entity.getGuid()];

            if (entity === currentCamera)
                editor.call('camera:set');

            editor.emit('camera:remove', entity);
        });

        editor.method('camera:list', function() {
            return cameras.slice(0);
        });

        editor.on('permissions:writeState', function(state) {
            if (state || currentCamera.__editorCamera)
                return;

            editor.call('camera:set', editorCameras['perspective']);
        });


        var list = [{
            name: 'perspective',
            title: 'Perspective',
            position: new pc.Vec3(9.2, 6, 9),
            rotation: new pc.Vec3(-25, 45, 0),
            default: true
        }, {
            name: 'top',
            title: 'Top',
            position: new pc.Vec3(0, 1000, 0),
            rotation: new pc.Vec3(-90, 0, 0),
            ortho: true
        }, {
            name: 'bottom',
            title: 'Bottom',
            position: new pc.Vec3(0, -1000, 0),
            rotation: new pc.Vec3(90, 0, 0),
            ortho: true
        }, {
            name: 'front',
            title: 'Front',
            position: new pc.Vec3(0, 0, 1000),
            rotation: new pc.Vec3(0, 0, 0),
            ortho: true
        }, {
            name: 'back',
            title: 'Back',
            position: new pc.Vec3(0, 0, -1000),
            rotation: new pc.Vec3(0, 180, 0),
            ortho: true
        }, {
            name: 'left',
            title: 'Left',
            position: new pc.Vec3(-1000, 0, 0),
            rotation: new pc.Vec3(0, -90, 0),
            ortho: true
        }, {
            name: 'right',
            title: 'Right',
            position: new pc.Vec3(1000, 0, 0),
            rotation: new pc.Vec3(0, 90, 0),
            ortho: true
        }];


        var createCamera = function(args) {
            var entity = new pc.Entity();
            entity.__editorCamera = true;
            entity.__editorName = args.name;
            entity.enabled = false;
            entity.name = args.title;
            entity.setPosition(args.position);
            entity.setEulerAngles(args.rotation);
            entity.focus = new pc.Vec3();

            editorCameras[args.name] = entity;

            var params = {
                nearClip: 0.1,
                farClip: 10000,
                priority: 0,
                clearColorBuffer: true,
                clearDepthBuffer: true,
                frustumCulling: true
            };

            if (args.ortho) {
                params.projection = pc.PROJECTION_ORTHOGRAPHIC;
                params.orthoHeight = 5;
            } else {
                params.projection = pc.PROJECTION_PERSPECTIVE;
                params.fov = 45;
            }

            entity.addComponent('camera', params);

            app.root.addChild(entity);

            return entity;
        };

        // add default cameras
        for(var i = 0; i < list.length; i++) {
            var entity = createCamera(list[i]);

            editor.call('camera:add', entity);

            if (list[i].default && ! defaultCamera) {
                defaultCamera = entity;
                editor.call('camera:set', entity);
            }
        }

        editor.emit('camera:load');
    });
});
