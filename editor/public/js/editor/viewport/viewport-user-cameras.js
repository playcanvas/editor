editor.once('load', function() {
    'use strict';

    var app = editor.call('viewport:framework');
    var container = new pc.Entity(app);
    app.root.addChild(container);

    var cameraModel = null;
    var cameras = { };
    var userdata = { };


    // material default
    var materialDefault = new pc.BasicMaterial();
    materialDefault.color = new pc.Color(1, 1, 1, 1);
    materialDefault.update();
    // material quad
    var materialQuad = new pc.BasicMaterial();
    materialQuad.color = new pc.Color(1, 1, 1, .25);
    materialQuad.cull = pc.CULLFACE_NONE;
    materialQuad.blend = true;
    materialQuad.blendSrc = pc.BLENDMODE_SRC_ALPHA;
    materialQuad.blendDst = pc.BLENDMODE_ONE_MINUS_SRC_ALPHA;
    materialQuad.update();
    // material behind
    var materialBehind = new pc.BasicMaterial();
    materialBehind.color = new pc.Color(1, 1, 1, .15);
    materialBehind.blend = true;
    materialBehind.blendSrc = pc.BLENDMODE_SRC_ALPHA;
    materialBehind.blendDst = pc.BLENDMODE_ONE_MINUS_SRC_ALPHA;
    materialBehind.depthTest = false;
    materialBehind.update();


    // Subscribes to user data of specified user
    var addUser = function (userId) {
        editor.once('userdata:' + userId + ':raw', function (data) {
            loadUserData(userId, data);
        });

        userdata[userId] = editor.call('realtime:subscribe:userdata', config.scene.id, userId);
    };

    // Removes user camera and unsubscribes from userdata
    var removeUser = function (userId) {
        if (userId === config.self.id) return;

        // unsubscribe from realtime userdata
        if (userdata[userId]) {
            userdata[userId].destroy();
            delete userdata[userId];
            editor.unbind('realtime:userdata:' + userId + ':op:cameras');
        }

        // remove user camera
        if (cameras[userId]) {
            cameras[userId].destroy();
            delete cameras[userId];
            editor.call('viewport:render');
        }
    };

    var close = .25;
    var far = .5;
    var horiz = .5;
    var vert = .375;

    var createCameraModel = function() {
        var vertexFormat = new pc.gfx.VertexFormat(app.graphicsDevice, [
            { semantic: pc.gfx.SEMANTIC_POSITION, components: 3, type: pc.gfx.ELEMENTTYPE_FLOAT32 }
        ]);
        // box
        var buffer = new pc.gfx.VertexBuffer(app.graphicsDevice, vertexFormat, 12 * 2);
        var iterator = new pc.gfx.VertexIterator(buffer);

        // top
        iterator.element[pc.SEMANTIC_POSITION].set(close * horiz, close * vert, 0);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(horiz, vert, -far);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(horiz, vert, -far);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(-horiz, vert, -far);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(-horiz, vert, -far);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(-close * horiz, close * vert, 0);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(-close * horiz, close * vert, 0);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(close * horiz, close * vert, 0);
        iterator.next();
        // bottom
        iterator.element[pc.SEMANTIC_POSITION].set(close * horiz, -close * vert, 0);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(horiz, -vert, -far);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(horiz, -vert, -far);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(-horiz, -vert, -far);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(-horiz, -vert, -far);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(-close * horiz, -close * vert, 0);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(-close * horiz, -close * vert, 0);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(close * horiz, -close * vert, 0);
        iterator.next();
        // sides
        iterator.element[pc.SEMANTIC_POSITION].set(close * horiz, -close * vert, 0);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(close * horiz, close * vert, 0);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(horiz, -vert, -far);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(horiz, vert, -far);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(-horiz, -vert, -far);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(-horiz, vert, -far);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(-close * horiz, -close * vert, 0);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(-close * horiz, close * vert, 0);
        iterator.next();
        iterator.end();
        // node
        var node = new pc.GraphNode();
        // mesh
        var mesh = new pc.Mesh();
        mesh.vertexBuffer = buffer;
        mesh.indexBuffer[0] = null;
        mesh.primitive[0].type = pc.PRIMITIVE_LINES;
        mesh.primitive[0].base = 0;
        mesh.primitive[0].count = buffer.getNumVertices();
        mesh.primitive[0].indexed = false;
        // meshInstance
        var meshInstance = new pc.MeshInstance(node, mesh, materialDefault);
        meshInstance.updateKey();
        // model
        cameraModel = new pc.Model();
        cameraModel.graph = node;
        cameraModel.meshInstances = [ meshInstance ];
    };

    // Creates user camera and binds to real time events
    var loadUserData = function (userId, data) {
        if (! cameraModel)
            createCameraModel();

        // add user camera
        var camera = cameras[userId] = new pc.Entity(app);
        camera.addComponent('model', {
            castShadowsLightmap: false
        });
        camera.model.model = cameraModel.clone();
        container.addChild(camera);

        var cameraInner = new pc.Entity(app);
        cameraInner.addComponent('model', {
            castShadowsLightmap: false
        });
        cameraInner.model.model = cameraModel.clone();
        cameraInner.model.model.meshInstances[0].material = materialBehind;
        camera.addChild(cameraInner);

        var cameraQuad = new pc.Entity(app);
        cameraQuad._userCamera = userId;
        cameraQuad.addComponent('model', {
            type: 'plane',
            castShadowsLightmap: false
        });
        cameraQuad.model.material = materialQuad;
        cameraQuad.rotate(90, 0, 0);
        cameraQuad.setLocalScale(close * horiz * 2, 1, close * vert * 2);
        camera.addChild(cameraQuad);

        var pos = data.cameras.perspective.position || [ 0, 0, 0 ];
        camera.setPosition(pos[0], pos[1], pos[2]);

        var rot = data.cameras.perspective.rotation || [ 0, 0, 0 ];
        camera.setEulerAngles(rot[0], rot[1], rot[2]);

        camera.pos = camera.getPosition().clone();
        camera.rot = camera.getRotation().clone();

        editor.call('viewport:render');

        // server > client
        var evt = editor.on('realtime:userdata:' + userId + ':op:cameras', function(op) {
            if (op.p.length !== 3 || ! op.oi || op.p[1] !== 'perspective')
                return;

            if (op.p[2] === 'position') {
                camera.pos.set(op.oi[0], op.oi[1], op.oi[2]);
                editor.call('viewport:render');
            } else if (op.p[2] === 'rotation') {
                camera.rot.setFromEulerAngles(op.oi[0], op.oi[1], op.oi[2]);
                editor.call('viewport:render');
            }
        });

        var unload = function () {
            if (evt) {
                evt.unbind();
                evt = null;
            }

            removeUser(userId);
        };

        editor.once('scene:unload', unload);
        editor.once('realtime:disconnected', unload);

    };

    // Add user who comes online
    editor.on('whoisonline:add', function (userId) {
        // ignore the logged in user
        if (userId === config.self.id) return;

        var add = function () {
            // do not add users without read access
            if (editor.call('permissions:read', userId))
                addUser(userId);

            // subscribe to project permission changes
            editor.on('permissions:set:' + userId, function () {
                if (editor.call('permissions:read', userId)) {
                    if (! userdata[userId]) {
                        // WORKAROUND
                        // wait a bit before adding, for userdata to be created at sharejs
                        setTimeout(function () {
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
    editor.on('whoisonline:remove', function (userId) {
        if (userId === config.self.id) return;

        removeUser(userId);
        editor.unbind('permissions:set:' + userId);
    });

    var vecA = new pc.Vec3();
    var vecB = new pc.Vec3();
    var quat = new pc.Quat();

    editor.on('viewport:update', function(dt) {
        var render = false;

        for(var id in cameras) {
            var camera = cameras[id];

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
                quat = camera.getRotation().slerp(camera.getRotation(), camera.rot, 8 * dt);
                camera.setRotation(quat);
                render = true;
            } else {
                camera.setRotation(camera.rot);
            }
        }

        if (render)
            editor.call('viewport:render');
    });
});
