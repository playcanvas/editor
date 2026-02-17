import {
    BlendState,
    BLENDEQUATION_ADD,
    BLENDMODE_ONE_MINUS_SRC_ALPHA,
    BLENDMODE_SRC_ALPHA,
    Color,
    CULLFACE_NONE,
    Entity,
    Mesh,
    MeshInstance,
    PRIMITIVE_LINES,
    Vec3
} from 'playcanvas';

import { createColorMaterial } from './viewport-color-material';
import { config } from '@/editor/config';

editor.once('load', () => {
    const app = editor.call('viewport:app');
    if (!app) {
        return;
    } // webgl not available

    const container = new Entity(app);
    app.root.addChild(container);

    let cameraMesh = null;
    let cameraMeshInstance = null; // eslint-disable-line no-unused-vars

    const cameras = { };
    const userdata = { };

    // material default
    const materialDefault = createColorMaterial();
    materialDefault.color = new Color(1, 1, 1, 1);
    materialDefault.update();

    // material quad
    const materialQuad = createColorMaterial();
    materialQuad.color = new Color(1, 1, 1, 0.25);
    materialQuad.cull = CULLFACE_NONE;
    materialQuad.blendState = new BlendState(true, BLENDEQUATION_ADD, BLENDMODE_SRC_ALPHA, BLENDMODE_ONE_MINUS_SRC_ALPHA);
    materialQuad.update();

    // material behind
    const materialBehind = createColorMaterial();
    materialBehind.color = new Color(1, 1, 1, 0.15);
    materialBehind.blendState = new BlendState(true, BLENDEQUATION_ADD, BLENDMODE_SRC_ALPHA, BLENDMODE_ONE_MINUS_SRC_ALPHA);
    materialBehind.depthTest = false;
    materialBehind.update();

    // Subscribes to user data of specified user
    const addUser = function (userId: string): void {
        editor.once(`userdata:${userId}:raw`, (data) => {
            loadUserData(userId, data);
        });

        userdata[userId] = editor.call('realtime:subscribe:userdata', config.scene.uniqueId, userId);
    };

    // Removes user camera and unsubscribes from userdata
    const removeUser = function (userId: string) {
        if (userId === config.self.id) {
            return;
        }

        // unsubscribe from realtime userdata
        if (userdata[userId]) {
            userdata[userId].destroy();
            delete userdata[userId];
            editor.unbind(`realtime:userdata:${userId}:op:cameras`);
        }

        // remove user camera
        if (cameras[userId]) {
            cameras[userId].destroy();
            delete cameras[userId];
            editor.call('viewport:render');
        }
    };

    const close = 0.25;
    const horiz = 0.5;
    const vert = 0.375;

    const createCameraMesh = function () {
        const far = 0.5;

        const positions = [
            // top
            close * horiz, close * vert, 0,
            horiz, vert, -far,
            horiz, vert, -far,
            -horiz, vert, -far,
            -horiz, vert, -far,
            -close * horiz, close * vert, 0,
            -close * horiz, close * vert, 0,
            close * horiz, close * vert, 0,
            // bottom
            close * horiz, -close * vert, 0,
            horiz, -vert, -far,
            horiz, -vert, -far,
            -horiz, -vert, -far,
            -horiz, -vert, -far,
            -close * horiz, -close * vert, 0,
            -close * horiz, -close * vert, 0,
            close * horiz, -close * vert, 0,
            // sides
            close * horiz, -close * vert, 0,
            close * horiz, close * vert, 0,
            horiz, -vert, -far,
            horiz, vert, -far,
            -horiz, -vert, -far,
            -horiz, vert, -far,
            -close * horiz, -close * vert, 0,
            -close * horiz, close * vert, 0
        ];

        const mesh = new Mesh(app.graphicsDevice);
        mesh.setPositions(positions);
        mesh.update(PRIMITIVE_LINES, true);

        // Create a dummy mesh instance here or the mesh will be destroyed when the number
        // of user cameras falls to zero
        cameraMeshInstance = new MeshInstance(mesh, materialDefault);

        return mesh;
    };

    // Creates user camera and binds to real time events
    const loadUserData = function (userId: string, data: { cameras: { perspective: { position?: number[]; rotation?: number[] } } }) {
        if (!cameraMesh) {
            cameraMesh = createCameraMesh();
        }

        // add user camera
        const camera = cameras[userId] = new Entity();
        camera.addComponent('render', {
            castShadows: false,
            castShadowsLightmap: false,
            meshInstances: [new MeshInstance(cameraMesh, materialDefault)],
            receiveShadows: false
        });
        container.addChild(camera);

        const cameraInner = new Entity();
        cameraInner.addComponent('render', {
            castShadows: false,
            castShadowsLightmap: false,
            meshInstances: [new MeshInstance(cameraMesh, materialBehind)],
            receiveShadows: false
        });
        camera.addChild(cameraInner);

        const cameraQuad = new Entity();
        cameraQuad.addComponent('render', {
            type: 'plane',
            castShadows: false,
            castShadowsLightmap: false,
            material: materialQuad,
            receiveShadows: false
        });
        cameraQuad._userCamera = userId;
        cameraQuad.rotate(90, 0, 0);
        cameraQuad.setLocalScale(close * horiz * 2, 1, close * vert * 2);
        camera.addChild(cameraQuad);

        const pos = data.cameras.perspective.position || [0, 0, 0];
        camera.setPosition(pos[0], pos[1], pos[2]);

        const rot = data.cameras.perspective.rotation || [0, 0, 0];
        camera.setEulerAngles(rot[0], rot[1], rot[2]);

        camera.pos = camera.getPosition().clone();
        camera.rot = camera.getRotation().clone();

        editor.call('viewport:render');

        // server > client
        let evt = editor.on(`realtime:userdata:${userId}:op:cameras`, (op) => {
            if (op.p.length !== 3 || !op.oi || op.p[1] !== 'perspective') {
                return;
            }

            if (op.p[2] === 'position') {
                camera.pos.set(op.oi[0], op.oi[1], op.oi[2]);
                editor.call('viewport:render');
            } else if (op.p[2] === 'rotation') {
                camera.rot.setFromEulerAngles(op.oi[0], op.oi[1], op.oi[2]);
                editor.call('viewport:render');
            }
        });

        const unload = function () {
            if (evt) {
                evt.unbind();
                evt = null;
            }

            removeUser(userId);
        };

        editor.once('scene:unload', unload);
        editor.once('realtime:disconnected', unload);

        editor.call('users:loadOne', userId, (user) => {
            const userColor = editor.call('users:color', user.id, 'data');

            const colorNormal = new Float32Array([userColor[0], userColor[1], userColor[2], 1]);
            camera.render.meshInstances[0].setParameter('uColor', colorNormal);

            const colorBehind = new Float32Array([userColor[0], userColor[1], userColor[2], 0.15]);
            cameraInner.render.meshInstances[0].setParameter('uColor', colorBehind);

            const colorQuad = new Float32Array([userColor[0], userColor[1], userColor[2], 0.25]);
            cameraQuad.render.meshInstances[0].setParameter('uColor', colorQuad);
        });
    };

    // Add user who comes online
    editor.on('whoisonline:add', (userId) => {
        // ignore the logged in user
        if (userId === config.self.id) {
            return;
        }

        const add = function () {
            // do not add users without read access
            if (editor.call('permissions:read', userId)) {
                addUser(userId);
            }

            // subscribe to project permission changes
            editor.on(`permissions:set:${userId}`, () => {
                if (editor.call('permissions:read', userId)) {
                    if (!userdata[userId]) {
                        // WORKAROUND
                        // wait a bit before adding, for userdata to be created at sharedb
                        setTimeout(() => {
                            addUser(userId);
                        }, 500);
                    }
                } else {
                    removeUser(userId);
                }
            });
        };

        if (!config.scene.id) {
            editor.once('scene:raw', add);
        } else {
            add();
        }

    });

    // Remove user who goes offline
    editor.on('whoisonline:remove', (userId: string) => {
        if (userId === config.self.id) {
            return;
        }

        removeUser(userId);
        editor.unbind(`permissions:set:${userId}`);
    });

    const vecA = new Vec3();
    const vecB = new Vec3();

    editor.on('viewport:update', (dt: number) => {
        let render = false;

        for (const id in cameras) {
            const camera = cameras[id];

            if (vecA.copy(camera.getPosition()).sub(camera.pos).length() > 0.01) {
                vecA.lerp(camera.getPosition(), camera.pos, 4 * dt);
                camera.setPosition(vecA);
                render = true;
            } else {
                camera.setPosition(camera.pos);
            }

            vecA.set(0, 0, -1);
            vecB.set(0, 0, -1);
            camera.getRotation().transformVector(vecA, vecA);
            camera.rot.transformVector(vecB, vecB);

            if (vecA.dot(vecB) < 0.999) {
                const quat = camera.getRotation().slerp(camera.getRotation(), camera.rot, 8 * dt);
                camera.setRotation(quat);
                render = true;
            } else {
                camera.setRotation(camera.rot);
            }
        }

        if (render) {
            editor.call('viewport:render');
        }
    });
});
