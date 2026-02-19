import { Entity, PROJECTION_ORTHOGRAPHIC, PROJECTION_PERSPECTIVE, SHADOWUPDATE_THISFRAME, Vec3 } from 'playcanvas';

editor.once('load', () => {
    editor.once('viewport:load', (app) => {
        const camerasIndex = { };
        const editorCameras = { };
        let currentCamera = null;
        let defaultCamera = null;

        let evtLayersSet = null;
        let evtLayersInsert = null;
        let evtLayersRemove = null;

        const projectSettings = editor.call('settings:project');
        const projectUserSettings = editor.call('settings:projectUser');

        editor.method('camera:get', (name: string) => {
            return editorCameras[name] || null;
        });

        editor.method('camera:editor', () => {
            return editorCameras;
        });

        editor.method('camera:current', () => {
            return currentCamera;
        });

        const addGizmoLayers = function (camera: import('playcanvas').CameraComponent, layers: import('playcanvas').Layer[]): void {
            for (let i = 0; i < layers.length; i++) {
                const layer = layers[i];
                const idx = camera.layers.indexOf(layer.id);
                if (idx === -1) {
                    camera.layers.push(layer.id);
                }
            }
            // eslint-disable-next-line no-self-assign
            camera.layers = camera.layers; // force update
        };

        const removeGizmoLayers = function (camera: import('playcanvas').CameraComponent, layers: import('playcanvas').Layer[]): void {
            for (let i = 0; i < layers.length; i++) {
                const layer = layers[i];
                const idx = camera.layers.indexOf(layer.id);
                if (idx !== -1) {
                    camera.layers.splice(idx, 1);
                }
            }

            // eslint-disable-next-line no-self-assign
            camera.layers = camera.layers; // force update
        };

        editor.method('camera:set', (entity?: import('playcanvas').Entity) => {
            if (!entity) {
                entity = defaultCamera;
            }

            if (currentCamera === entity || !entity.camera) {
                return;
            }

            const gizmoLayers = editor.call('gizmo:layers:list');

            const old = currentCamera;
            if (old) {
                if (old.camera) {
                    old.camera.enabled = false;
                    removeGizmoLayers(old.camera, gizmoLayers);
                }

                if (evtLayersSet) {
                    evtLayersSet.unbind();
                    evtLayersSet = null;
                }

                if (evtLayersInsert) {
                    evtLayersInsert.unbind();
                    evtLayersInsert = null;
                }

                if (evtLayersRemove) {
                    evtLayersRemove.unbind();
                    evtLayersRemove = null;
                }
            }

            currentCamera = entity;
            currentCamera.camera.enabled = true;

            addGizmoLayers(currentCamera.camera, gizmoLayers);

            // if this is a user's camera and the user changes its layers
            // make sure we re-add editor layers to this camera if this is the selected viewport
            // camera at the moment
            if (!entity.__editorCamera) {
                const fixLayers = function () {
                    if (entity !== currentCamera) {
                        return;
                    }

                    setTimeout(() => {
                        // check again
                        if (entity !== currentCamera) {
                            return;
                        }

                        // add layers and re-render
                        addGizmoLayers(entity.camera, editor.call('gizmo:layers:list'));
                        editor.call('viewport:render');
                    });
                };

                const e = editor.call('entities:get', entity.getGuid());
                if (e) {
                    evtLayersInsert = e.on('components.camera.layers:insert', fixLayers);
                    evtLayersRemove = e.on('components.camera.layers:remove', fixLayers);
                    evtLayersSet = e.on('components.camera.layers:set', fixLayers);
                }
            }

            // if this is a user's camera, make sure it clears depth and color buffers
            if (!entity.__editorCamera) {

                const setClearing = () => {
                    entity.camera.clearColorBuffer = true;
                    entity.camera.clearDepthBuffer = true;

                    // set this again each frame until the user changes the camera, to handle the case the user disabled clears
                    setTimeout(() => {
                        if (entity === currentCamera) {
                            setClearing();
                        }
                    });
                };

                setClearing();
            }

            editor.emit('camera:change', currentCamera, old);

            // Update shadow maps for lights with Shadow Update Mode set to "Once"
            editor.call('entities:list').forEach((e) => {
                if (e.get('components.light.shadowUpdateMode') === SHADOWUPDATE_THISFRAME && e.entity?.light) {
                    e.entity.light.shadowUpdateMode = SHADOWUPDATE_THISFRAME;
                }
            });

            editor.call('viewport:render');
        });

        editor.method('camera:add', (entity: import('playcanvas').Entity) => {
            if (camerasIndex[entity.getGuid()]) {
                return;
            }

            camerasIndex[entity.getGuid()] = entity;

            if (entity.camera) {
                entity.camera.enabled = false;
                editor.call('viewport:render');
            }

            editor.emit('camera:add', entity);
        });

        editor.method('camera:remove', (entity: import('playcanvas').Entity) => {
            if (!camerasIndex[entity.getGuid()]) {
                return;
            }

            delete camerasIndex[entity.getGuid()];

            if (entity === currentCamera) {
                editor.call('camera:set');
            }

            editor.emit('camera:remove', entity);
        });

        editor.on('permissions:writeState', (state: boolean) => {
            if (state || currentCamera.__editorCamera) {
                return;
            }

            editor.call('camera:set', editorCameras.perspective);
        });


        const list = [{
            name: 'perspective',
            title: 'Perspective',
            className: 'viewport-camera-perspective',
            position: new Vec3(9.2, 6, 9),
            rotation: new Vec3(-25, 45, 0),
            default: true
        }, {
            name: 'top',
            title: 'Top',
            className: 'viewport-camera-top',
            position: new Vec3(0, 1000, 0),
            rotation: new Vec3(-90, 0, 0),
            ortho: true
        }, {
            name: 'bottom',
            title: 'Bottom',
            className: 'viewport-camera-bottom',
            position: new Vec3(0, -1000, 0),
            rotation: new Vec3(90, 0, 0),
            ortho: true
        }, {
            name: 'front',
            title: 'Front',
            className: 'viewport-camera-front',
            position: new Vec3(0, 0, 1000),
            rotation: new Vec3(0, 0, 0),
            ortho: true
        }, {
            name: 'back',
            title: 'Back',
            className: 'viewport-camera-back',
            position: new Vec3(0, 0, -1000),
            rotation: new Vec3(0, 180, 0),
            ortho: true
        }, {
            name: 'left',
            title: 'Left',
            className: 'viewport-camera-left',
            position: new Vec3(-1000, 0, 0),
            rotation: new Vec3(0, -90, 0),
            ortho: true
        }, {
            name: 'right',
            title: 'Right',
            className: 'viewport-camera-right',
            position: new Vec3(1000, 0, 0),
            rotation: new Vec3(0, 90, 0),
            ortho: true
        }];


        const createCamera = function (args: { name: string; title: string; className: string; position: import('playcanvas').Vec3; rotation: import('playcanvas').Vec3; default?: boolean; ortho?: boolean }) {
            const entity = new Entity();
            entity.__editorCamera = true;
            entity.__editorName = args.name;
            entity.name = args.title;
            entity.className = args.className;
            entity.setPosition(args.position);
            entity.setEulerAngles(args.rotation);
            entity.focus = new Vec3();

            editorCameras[args.name] = entity;

            const params = {
                nearClip: 0.1,
                farClip: 10000,
                priority: 0,
                clearColorBuffer: true,
                clearDepthBuffer: true,
                frustumCulling: true
            };

            const layerOrder = projectSettings.get('layerOrder');
            if (layerOrder) {
                params.layers = layerOrder.map((l) => {
                    return parseInt(l.layer, 10);
                });
            }

            if (args.ortho) {
                params.projection = PROJECTION_ORTHOGRAPHIC;
                params.orthoHeight = 5;
            } else {
                params.projection = PROJECTION_PERSPECTIVE;
                params.fov = 45;
            }

            entity.addComponent('camera', params);
            entity.camera.enabled = false;

            app.root.addChild(entity);

            return entity;
        };

        // add default cameras
        for (let i = 0; i < list.length; i++) {
            const entity = createCamera(list[i]);

            editor.call('camera:add', entity);

            if (list[i].default && !defaultCamera) {
                defaultCamera = entity;
                editor.call('camera:set', entity);
            }
        }

        // restore persisted camera mode
        const storedMode = editor.call('localStorage:get', 'editor:camera:mode');
        if (storedMode && editorCameras[storedMode]) {
            editor.call('camera:set', editorCameras[storedMode]);
        }

        // persist camera mode on change
        editor.on('camera:change', (camera: import('playcanvas').Entity) => {
            if (camera?.__editorCamera && camera.__editorName) {
                editor.call('localStorage:set', 'editor:camera:mode', camera.__editorName);
            }
        });

        // when layers change make sure that our Editor cameras have them
        projectSettings.on('layerOrder:insert', (value: import('@playcanvas/observer').Observer) => {
            const id = parseInt(value.get('layer'), 10);
            for (const key in editorCameras) {
                const entity = editorCameras[key];
                const idx = entity.camera.layers.indexOf(id);
                if (idx === -1) {
                    entity.camera.layers.push(id);
                    // eslint-disable-next-line no-self-assign
                    entity.camera.layers = entity.camera.layers; // force update
                }
            }

            editor.call('viewport:render');
        });

        projectSettings.on('layerOrder:remove', (value: import('@playcanvas/observer').Observer) => {
            const id = parseInt(value.get('layer'), 10);
            for (const key in editorCameras) {
                const entity = editorCameras[key];
                const idx = entity.camera.layers.indexOf(id);
                if (idx !== -1) {
                    entity.camera.layers.splice(idx, 1);
                    // eslint-disable-next-line no-self-assign
                    entity.camera.layers = entity.camera.layers; // force update
                }
            }

            editor.call('viewport:render');
        });

        editor.on('camera:shader:pass', (shaderPass: string): void => {
            for (const key in camerasIndex) {
                const entity = camerasIndex[key];
                entity.camera.setShaderPass(shaderPass);
            }
            editor.call('viewport:render');
        });

        const requestSceneColorMap = function (enabled: boolean): void {
            for (const key in editorCameras) {
                const entity = editorCameras[key];
                entity.camera.requestSceneColorMap(enabled);
            }
            editor.call('viewport:render');
        };

        const requestSceneDepthMap = function (enabled: boolean): void {
            for (const key in editorCameras) {
                const entity = editorCameras[key];
                entity.camera.requestSceneDepthMap(enabled);
            }
            editor.call('viewport:render');
        };

        editor.on('settings:projectUser:load', () => {
            if (projectUserSettings.get('editor.cameraGrabDepth')) {
                requestSceneDepthMap(true);
            }

            if (projectUserSettings.get('editor.cameraGrabColor')) {
                requestSceneColorMap(true);
            }

            projectUserSettings.on('editor.cameraGrabDepth:set', (value: boolean) => {
                requestSceneDepthMap(value);
            });

            projectUserSettings.on('editor.cameraGrabColor:set', (value: boolean) => {
                requestSceneColorMap(value);
            });
        });

        editor.emit('camera:load');
    });
});
