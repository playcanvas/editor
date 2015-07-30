editor.once('load', function () {
    'use strict';

    var app;
    // selected entity gizmos
    var entities = { };
    // pool of gizmos
    var pool = [ ];
    var poolVec3 = [ ];
    // colors
    var colorBehind = new pc.Color(1, 1, 1, .15);
    var colorPrimary = new pc.Color(1, 1, 1);
    var container;
    var vec = new pc.Vec3();
    var materialBehind = new pc.BasicMaterial();
    materialBehind.color = colorBehind;
    materialBehind.blend = true;
    materialBehind.blendSrc = pc.BLENDMODE_SRC_ALPHA;
    materialBehind.blendDst = pc.BLENDMODE_ONE_MINUS_SRC_ALPHA;
    materialBehind.depthTest = false;
    materialBehind.update();
    var materialDefault, materialSpot, materialSpotBehind;
    var models = { };
    var materials = { };
    var poolModels = { 'box': [ ], 'sphere': [ ], 'capsule-x': [ ], 'capsule-y': [ ], 'capsule-z': [ ], 'cylinder-x': [ ], 'cylinder-y': [ ], 'cylinder-z': [ ] };
    var axesNames = { 0: 'x', 1: 'y', 2: 'z' };

    // gizmo class
    function Gizmo() {
        this._link = null;
        this.lines = [ ];
        this.events = [ ];
        this.type = '';
        this.asset = 0;
        this.entity = null;
    }
    // update lines
    Gizmo.prototype.update = function() {
        if (! this._link)
            return;

        var collision = this._link.entity.collision;
        this.entity.enabled = this._link.entity.enabled && collision && collision.enabled;
        if (! this.entity.enabled)
            return;

        this.entity.setPosition(this._link.entity.getPosition());
        this.entity.setRotation(this._link.entity.getRotation());

        var type = collision.type;

        if (type === 'cylinder' || type === 'capsule')
            type += '-' + axesNames[collision.axis];

        if (this.type !== type) {
            this.type = type;

            // set new model based on type
            if (models[this.type]) {
                // get current model
                var model = this.entity.model.model;
                if (model) {
                    // put back in pool
                    app.scene.removeModel(model);
                    this.entity.removeChild(model.getGraph());
                    if (poolModels[model._type])
                        poolModels[model._type].push(model);
                }
                // get from pool
                model = null;
                if (poolModels[this.type])
                    model = poolModels[this.type].shift();

                if (! model) {
                    // no in pool
                    model = models[this.type].clone();
                    model._type = this.type;
                }
                // set to model
                this.entity.model.model = model;
                this.entity.setLocalScale(1, 1, 1);
            } else if (this.type === 'mesh') {
                this.asset = collision.asset;
                this.createWireframe(collision.asset)
                this.entity.setLocalScale(1, 1, 1);
                if (! this.entity.model.model) {
                    this.entity.enabled = false;
                    return;
                }
            } else {
                this.entity.enabled = false;
                this.entity.model.model = null;
                return;
            }
        }

        var mat = materialBehind;
        var radius = collision.radius || .00001;
        var height = collision.height || .00001;

        switch(this.type) {
            case 'sphere':
                this.entity.setLocalScale(radius, radius, radius);
                break;
            case 'box':
                this.entity.setLocalScale(collision.halfExtents.x || .00001, collision.halfExtents.y || .00001, collision.halfExtents.z || .00001);
                break;
            case 'cylinder-x':
                this.entity.setLocalScale(height, radius, radius);
                break;
            case 'cylinder-y':
                this.entity.setLocalScale(radius, height, radius);
                break;
            case 'cylinder-z':
                this.entity.setLocalScale(radius, radius, height);
                break;
            case 'capsule-x':
            case 'capsule-y':
            case 'capsule-z':
                if (this.entity.model.model) {
                    this.entity.model.model.meshInstances[0].setParameter('radius', collision.radius || .5);
                    this.entity.model.model.meshInstances[0].setParameter('height', collision.height || 2);
                }
                mat = materials['capsuleBehind-' + axesNames[collision.axis]];
                break;
            case 'mesh':
                if (collision.asset !== this.asset) {
                    this.asset = collision.asset;
                    this.createWireframe(collision.asset);
                    this.entity.setLocalScale(1, 1, 1);
                    if (! this.entity.model.model) {
                        this.entity.enabled = false;
                        return;
                    }
                }
                break;
        }

        // render behind model
        if (this.entity.enabled && this.entity.model.model) {
            var instance = new pc.MeshInstance(this.entity.model.model.meshInstances[0].node, this.entity.model.model.meshInstances[0].mesh, mat);

            switch(this.type) {
                case 'capsule-x':
                case 'capsule-y':
                case 'capsule-z':
                    instance.setParameter('radius', collision.radius || .5);
                    instance.setParameter('height', collision.height || 2);
                    break;
            }

            app.scene.immediateDrawCalls.push(instance);
        }
    };
    // link to entity
    Gizmo.prototype.link = function(obj) {
        this.unlink();
        this._link = obj;

        var self = this;

        this.events.push(this._link.once('destroy', function() {
            self.unlink();
        }));

        this.entity = new pc.Entity();
        this.entity.addComponent('model');

        container.addChild(this.entity);
    };
    // unlink
    Gizmo.prototype.unlink = function() {
        if (! this._link)
            return;

        for(var i = 0; i < this.events.length; i++) {
            if (this.events[i] && this.events[i].unbind)
                this.events[i].unbind();
        }

        this.events = [ ];
        this._link = null;
        this.type = '';
        this.asset = 0;

        var model = this.entity.model.model;
        if (model) {
            // put back in pool
            app.scene.removeModel(model);
            this.entity.removeChild(model.getGraph());
            if (model._type)
                poolModels[model._type].push(model);
        }

        this.entity.destroy();
    };
    // create wireframe
    Gizmo.prototype.createWireframe = function(asset) {
        asset = app.assets.get(asset);
        if (! asset)
            return null;

        if (asset.resource) {
            this.entity.model.model = createModelWireframe(asset.resource);
        } else {
            var self = this;

            this.events.push(asset.once('load', function(asset) {
                if (self.asset !== asset.id)
                    return;

                self.entity.model.model = createModelWireframe(asset.resource);
            }));
        }
    };

    editor.on('selector:change', function(type, items) {
        // clear gizmos
        if (type !== 'entity') {
            for(var key in entities) {
                entities[key].unlink();
                pool.push(entities[key]);
            }
            entities = { };
            return;
        }

        // index selection
        var ids = { };
        for(var i = 0; i < items.length; i++)
            ids[items[i].get('resource_id')] = items[i];

        // remove
        for(var key in entities) {
            if (ids[key])
                continue;

            pool.push(entities[key]);
            entities[key].unlink();
            delete entities[key];
        }

        // add
        for(var key in ids) {
            if (entities[key])
                continue;

            var gizmo = pool.shift();
            if (! gizmo)
                gizmo = new Gizmo();

            gizmo.link(ids[key]);
            entities[key] = gizmo;
        }
    });

    editor.once('viewport:load', function() {
        app = editor.call('viewport:framework');

        container = new pc.Entity(app);
        app.root.addChild(container);

        // material
        materialDefault = new pc.BasicMaterial();
        materialDefault.color = colorPrimary;
        materialDefault.update();

        var capsuleVShader = ' \
            attribute vec3 vertex_position;\n \
            attribute float side;\n \
            uniform mat4 matrix_model;\n \
            uniform mat4 matrix_viewProjection;\n \
            uniform float radius;\n \
            uniform float height;\n \
            void main(void)\n \
            {\n \
                vec3 pos = vertex_position * radius;\n \
                pos.{axis} += side * max(height / 2.0 - radius, 0.0);\n \
                gl_Position = matrix_viewProjection * matrix_model * vec4(pos, 1.0);\n \
            }\n';
        var capsuleFShader = ' \
            precision highp float;\n \
            uniform vec4 uColor;\n \
            void main(void)\n \
            {\n \
                gl_FragColor = uColor;\n \
                gl_FragColor = clamp(gl_FragColor, 0.0, 1.0);\n \
            }\n';

        var makeMaterial = function(a) {
            materials['capsule-' + a] = new pc.BasicMaterial();
            materials['capsule-' + a].updateShader = function(device) {
                this.shader = new pc.Shader(device, {
                    attributes: {
                        vertex_position: 'POSITION',
                        side: 'ATTR0'
                    },
                    vshader: capsuleVShader.replace('{axis}', a),
                    fshader: capsuleFShader,
                });
            };
            materials['capsule-' + a].color = colorPrimary;
            materials['capsule-' + a].update();

            materials['capsuleBehind-' + a] = new pc.BasicMaterial();
            materials['capsuleBehind-' + a].updateShader = materials['capsule-' + a].updateShader;
            materials['capsuleBehind-' + a].color = colorBehind;
            materials['capsuleBehind-' + a].blend = true;
            materials['capsuleBehind-' + a].blendSrc = pc.BLENDMODE_SRC_ALPHA;
            materials['capsuleBehind-' + a].blendDst = pc.BLENDMODE_ONE_MINUS_SRC_ALPHA;
            materials['capsuleBehind-' + a].depthTest = false;
            materials['capsuleBehind-' + a].update();
        }

        for(var key in axesNames)
            makeMaterial(axesNames[key]);

        var buffer, iterator, size, length, node, mesh, meshInstance, model;
        var vertexFormat = new pc.gfx.VertexFormat(app.graphicsDevice, [
            { semantic: pc.gfx.SEMANTIC_POSITION, components: 3, type: pc.gfx.ELEMENTTYPE_FLOAT32 }
        ]);
        var vertexFormatAttr0 = new pc.gfx.VertexFormat(app.graphicsDevice, [
            { semantic: pc.gfx.SEMANTIC_POSITION, components: 3, type: pc.gfx.ELEMENTTYPE_FLOAT32 },
            { semantic: pc.gfx.SEMANTIC_ATTR0, components: 1, type: pc.gfx.ELEMENTTYPE_FLOAT32 }
        ]);
        var rad = Math.PI / 180;


        // ================
        // box
        buffer = new pc.gfx.VertexBuffer(app.graphicsDevice, vertexFormat, 12 * 2);
        iterator = new pc.gfx.VertexIterator(buffer);
        // top
        iterator.element[pc.SEMANTIC_POSITION].set(1, 1, 1);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(1, 1, -1);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(1, 1, -1);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(-1, 1, -1);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(-1, 1, -1);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(-1, 1, 1);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(-1, 1, 1);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(1, 1, 1);
        iterator.next();
        // bottom
        iterator.element[pc.SEMANTIC_POSITION].set(1, -1, 1);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(1, -1, -1);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(1, -1, -1);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(-1, -1, -1);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(-1, -1, -1);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(-1, -1, 1);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(-1, -1, 1);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(1, -1, 1);
        iterator.next();
        // sides
        iterator.element[pc.SEMANTIC_POSITION].set(1, -1, 1);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(1, 1, 1);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(1, -1, -1);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(1, 1, -1);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(-1, -1, -1);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(-1, 1, -1);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(-1, -1, 1);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(-1, 1, 1);
        iterator.next();
        iterator.end();
        // node
        node = new pc.GraphNode();
        // mesh
        mesh = new pc.Mesh();
        mesh.vertexBuffer = buffer;
        mesh.indexBuffer[0] = null;
        mesh.primitive[0].type = pc.PRIMITIVE_LINES;
        mesh.primitive[0].base = 0;
        mesh.primitive[0].count = buffer.getNumVertices();
        mesh.primitive[0].indexed = false;
        // meshInstance
        meshInstance = new pc.MeshInstance(node, mesh, materialDefault);
        meshInstance.updateKey();
        // model
        model = new pc.Model();
        model.graph = node;
        model.meshInstances = [ meshInstance ];
        models['box'] = model;


        // ================
        // sphere
        var segments = 72;
        buffer = new pc.gfx.VertexBuffer(app.graphicsDevice, vertexFormat, segments * 2 * 3);
        iterator = new pc.gfx.VertexIterator(buffer);
        // circles
        for(var i = 0; i < segments; i++) {
            iterator.element[pc.SEMANTIC_POSITION].set(Math.sin(360 / segments * i * rad), 0, Math.cos(360 / segments * i * rad));
            iterator.next();
            iterator.element[pc.SEMANTIC_POSITION].set(Math.sin(360 / segments * (i + 1) * rad), 0, Math.cos(360 / segments * (i + 1) * rad));
            iterator.next();
            iterator.element[pc.SEMANTIC_POSITION].set(Math.sin(360 / segments * i * rad), Math.cos(360 / segments * i * rad), 0);
            iterator.next();
            iterator.element[pc.SEMANTIC_POSITION].set(Math.sin(360 / segments * (i + 1) * rad), Math.cos(360 / segments * (i + 1) * rad), 0);
            iterator.next();
            iterator.element[pc.SEMANTIC_POSITION].set(0, Math.cos(360 / segments * i * rad), Math.sin(360 / segments * i * rad));
            iterator.next();
            iterator.element[pc.SEMANTIC_POSITION].set(0, Math.cos(360 / segments * (i + 1) * rad), Math.sin(360 / segments * (i + 1) * rad));
            iterator.next();
        }
        iterator.end();
        // node
        node = new pc.GraphNode();
        // mesh
        mesh = new pc.Mesh();
        mesh.vertexBuffer = buffer;
        mesh.indexBuffer[0] = null;
        mesh.primitive[0].type = pc.PRIMITIVE_LINES;
        mesh.primitive[0].base = 0;
        mesh.primitive[0].count = buffer.getNumVertices();
        mesh.primitive[0].indexed = false;
        // meshInstance
        meshInstance = new pc.MeshInstance(node, mesh, materialDefault);
        meshInstance.updateKey();
        // model
        model = new pc.Model();
        model.graph = node;
        model.meshInstances = [ meshInstance ];
        models['sphere'] = model;


        // ================
        // cylinder-x
        var segments = 72;
        buffer = new pc.gfx.VertexBuffer(app.graphicsDevice, vertexFormat, segments * 2 * 2 + 4 * 2);
        iterator = new pc.gfx.VertexIterator(buffer);
        // circles
        for(var i = 0; i < segments; i++) {
            iterator.element[pc.SEMANTIC_POSITION].set(.5, Math.sin(360 / segments * i * rad), Math.cos(360 / segments * i * rad));
            iterator.next();
            iterator.element[pc.SEMANTIC_POSITION].set(.5, Math.sin(360 / segments * (i + 1) * rad), Math.cos(360 / segments * (i + 1) * rad));
            iterator.next();
            iterator.element[pc.SEMANTIC_POSITION].set(-.5, Math.sin(360 / segments * i * rad), Math.cos(360 / segments * i * rad));
            iterator.next();
            iterator.element[pc.SEMANTIC_POSITION].set(-.5, Math.sin(360 / segments * (i + 1) * rad), Math.cos(360 / segments * (i + 1) * rad));
            iterator.next();
        }
        for(var i = 0; i < 4; i++) {
            iterator.element[pc.SEMANTIC_POSITION].set(.5, Math.sin(90 * i * rad), Math.cos(90 * i * rad));
            iterator.next();
            iterator.element[pc.SEMANTIC_POSITION].set(-.5, Math.sin(90 * i * rad), Math.cos(90 * i * rad));
            iterator.next();
        }
        iterator.end();
        // node
        node = new pc.GraphNode();
        // mesh
        mesh = new pc.Mesh();
        mesh.vertexBuffer = buffer;
        mesh.indexBuffer[0] = null;
        mesh.primitive[0].type = pc.PRIMITIVE_LINES;
        mesh.primitive[0].base = 0;
        mesh.primitive[0].count = buffer.getNumVertices();
        mesh.primitive[0].indexed = false;
        // meshInstance
        meshInstance = new pc.MeshInstance(node, mesh, materialDefault);
        meshInstance.updateKey();
        // model
        model = new pc.Model();
        model.graph = node;
        model.meshInstances = [ meshInstance ];
        models['cylinder-x'] = model;

        // ================
        // cylinder-y
        var segments = 72;
        buffer = new pc.gfx.VertexBuffer(app.graphicsDevice, vertexFormat, segments * 2 * 2 + 4 * 2);
        iterator = new pc.gfx.VertexIterator(buffer);
        // circles
        for(var i = 0; i < segments; i++) {
            iterator.element[pc.SEMANTIC_POSITION].set(Math.sin(360 / segments * i * rad), .5, Math.cos(360 / segments * i * rad));
            iterator.next();
            iterator.element[pc.SEMANTIC_POSITION].set(Math.sin(360 / segments * (i + 1) * rad), .5, Math.cos(360 / segments * (i + 1) * rad));
            iterator.next();
            iterator.element[pc.SEMANTIC_POSITION].set(Math.sin(360 / segments * i * rad), -.5, Math.cos(360 / segments * i * rad));
            iterator.next();
            iterator.element[pc.SEMANTIC_POSITION].set(Math.sin(360 / segments * (i + 1) * rad), -.5, Math.cos(360 / segments * (i + 1) * rad));
            iterator.next();
        }
        for(var i = 0; i < 4; i++) {
            iterator.element[pc.SEMANTIC_POSITION].set(Math.sin(90 * i * rad), .5, Math.cos(90 * i * rad));
            iterator.next();
            iterator.element[pc.SEMANTIC_POSITION].set(Math.sin(90 * i * rad), -.5, Math.cos(90 * i * rad));
            iterator.next();
        }
        iterator.end();
        // node
        node = new pc.GraphNode();
        // mesh
        mesh = new pc.Mesh();
        mesh.vertexBuffer = buffer;
        mesh.indexBuffer[0] = null;
        mesh.primitive[0].type = pc.PRIMITIVE_LINES;
        mesh.primitive[0].base = 0;
        mesh.primitive[0].count = buffer.getNumVertices();
        mesh.primitive[0].indexed = false;
        // meshInstance
        meshInstance = new pc.MeshInstance(node, mesh, materialDefault);
        meshInstance.updateKey();
        // model
        model = new pc.Model();
        model.graph = node;
        model.meshInstances = [ meshInstance ];
        models['cylinder-y'] = model;

        // ================
        // cylinder-z
        var segments = 72;
        buffer = new pc.gfx.VertexBuffer(app.graphicsDevice, vertexFormat, segments * 2 * 2 + 4 * 2);
        iterator = new pc.gfx.VertexIterator(buffer);
        // circles
        for(var i = 0; i < segments; i++) {
            iterator.element[pc.SEMANTIC_POSITION].set(Math.sin(360 / segments * i * rad), Math.cos(360 / segments * i * rad), .5);
            iterator.next();
            iterator.element[pc.SEMANTIC_POSITION].set(Math.sin(360 / segments * (i + 1) * rad), Math.cos(360 / segments * (i + 1) * rad), .5);
            iterator.next();
            iterator.element[pc.SEMANTIC_POSITION].set(Math.sin(360 / segments * i * rad), Math.cos(360 / segments * i * rad), -.5);
            iterator.next();
            iterator.element[pc.SEMANTIC_POSITION].set(Math.sin(360 / segments * (i + 1) * rad), Math.cos(360 / segments * (i + 1) * rad), -.5);
            iterator.next();
        }
        for(var i = 0; i < 4; i++) {
            iterator.element[pc.SEMANTIC_POSITION].set(Math.sin(90 * i * rad), Math.cos(90 * i * rad), .5);
            iterator.next();
            iterator.element[pc.SEMANTIC_POSITION].set(Math.sin(90 * i * rad), Math.cos(90 * i * rad), -.5);
            iterator.next();
        }
        iterator.end();
        // node
        node = new pc.GraphNode();
        // mesh
        mesh = new pc.Mesh();
        mesh.vertexBuffer = buffer;
        mesh.indexBuffer[0] = null;
        mesh.primitive[0].type = pc.PRIMITIVE_LINES;
        mesh.primitive[0].base = 0;
        mesh.primitive[0].count = buffer.getNumVertices();
        mesh.primitive[0].indexed = false;
        // meshInstance
        meshInstance = new pc.MeshInstance(node, mesh, materialDefault);
        meshInstance.updateKey();
        // model
        model = new pc.Model();
        model.graph = node;
        model.meshInstances = [ meshInstance ];
        models['cylinder-z'] = model;


        // ================
        // capsule y
        var segments = 72;
        buffer = new pc.gfx.VertexBuffer(app.graphicsDevice, vertexFormatAttr0, segments * 2 * 2 + segments / 2 * 2 * 4 + 4 + 2 * 4);
        iterator = new pc.gfx.VertexIterator(buffer);

        for(var i = 0; i <= segments; i++) {
            // circles
            if (i < segments) {
                for(var n = 0; n <= 1; n++) {
                    for(var k = i; k <= i + 1; k++) {
                        iterator.element[pc.SEMANTIC_POSITION].set(Math.sin(360 / segments * k * rad), 0, Math.cos(360 / segments * k * rad));
                        iterator.element[pc.SEMANTIC_ATTR0].set(n ? -1 : 1);
                        iterator.next();
                    }
                }
            }
            // domes
            var n = i % (segments / 2);
            var side = i > segments / 2;
            for(var k = n; k <= n + 1; k++) {
                iterator.element[pc.SEMANTIC_POSITION].set(Math.sin((360 / segments * k + (side ? -90 : 90)) * rad), Math.cos((360 / segments * k + (side ? -90 : 90)) * rad), 0);
                iterator.element[pc.SEMANTIC_ATTR0].set(side ? 1 : -1);
                iterator.next();
            }
            for(var k = n; k <= n + 1; k++) {
                iterator.element[pc.SEMANTIC_POSITION].set(0, Math.cos((360 / segments * k + (side ? -90 : 90)) * rad), Math.sin((360 / segments * k + (side ? -90 : 90)) * rad));
                iterator.element[pc.SEMANTIC_ATTR0].set(side ? 1 : -1);
                iterator.next();
            }
        }
        // lines
        for(var i = 0; i < 4; i++) {
            for(var n = 0; n <= 1; n++) {
                iterator.element[pc.SEMANTIC_POSITION].set(Math.sin(90 * i * rad), 0, Math.cos(90 * i * rad));
                iterator.element[pc.SEMANTIC_ATTR0].set(n ? -1 : 1);
                iterator.next();
            }
        }
        iterator.end();
        // node
        node = new pc.GraphNode();
        // mesh
        mesh = new pc.Mesh();
        mesh.vertexBuffer = buffer;
        mesh.indexBuffer[0] = null;
        mesh.primitive[0].type = pc.PRIMITIVE_LINES;
        mesh.primitive[0].base = 0;
        mesh.primitive[0].count = buffer.getNumVertices();
        mesh.primitive[0].indexed = false;
        // meshInstance
        meshInstance = new pc.MeshInstance(node, mesh, materials['capsule-y']);
        meshInstance.updateKey();
        // model
        model = new pc.Model();
        model.graph = node;
        model.meshInstances = [ meshInstance ];
        models['capsule-y'] = model;

        // ================
        // capsule x
        var segments = 72;
        buffer = new pc.gfx.VertexBuffer(app.graphicsDevice, vertexFormatAttr0, segments * 2 * 2 + segments / 2 * 2 * 4 + 4 + 2 * 4);
        iterator = new pc.gfx.VertexIterator(buffer);

        for(var i = 0; i <= segments; i++) {
            // circles
            if (i < segments) {
                for(var n = 0; n <= 1; n++) {
                    for(var k = i; k <= i + 1; k++) {
                        iterator.element[pc.SEMANTIC_POSITION].set(0, Math.sin(360 / segments * k * rad), Math.cos(360 / segments * k * rad));
                        iterator.element[pc.SEMANTIC_ATTR0].set(n ? -1 : 1);
                        iterator.next();
                    }
                }
            }
            // domes
            var n = i % (segments / 2);
            var side = i > segments / 2;
            for(var k = n; k <= n + 1; k++) {
                iterator.element[pc.SEMANTIC_POSITION].set(Math.sin((360 / segments * k + (side ? 0 : 180)) * rad), Math.cos((360 / segments * k + (side ? 0 : 180)) * rad), 0);
                iterator.element[pc.SEMANTIC_ATTR0].set(side ? 1 : -1);
                iterator.next();
            }
            for(var k = n; k <= n + 1; k++) {
                iterator.element[pc.SEMANTIC_POSITION].set(Math.cos((360 / segments * k + (side ? -90 : 90)) * rad), 0, Math.sin((360 / segments * k + (side ? -90 : 90)) * rad));
                iterator.element[pc.SEMANTIC_ATTR0].set(side ? 1 : -1);
                iterator.next();
            }
        }
        // lines
        for(var i = 0; i < 4; i++) {
            for(var n = 0; n <= 1; n++) {
                iterator.element[pc.SEMANTIC_POSITION].set(0, Math.sin(90 * i * rad), Math.cos(90 * i * rad));
                iterator.element[pc.SEMANTIC_ATTR0].set(n ? -1 : 1);
                iterator.next();
            }
        }
        iterator.end();
        // node
        node = new pc.GraphNode();
        // mesh
        mesh = new pc.Mesh();
        mesh.vertexBuffer = buffer;
        mesh.indexBuffer[0] = null;
        mesh.primitive[0].type = pc.PRIMITIVE_LINES;
        mesh.primitive[0].base = 0;
        mesh.primitive[0].count = buffer.getNumVertices();
        mesh.primitive[0].indexed = false;
        // meshInstance
        meshInstance = new pc.MeshInstance(node, mesh, materials['capsule-x']);
        meshInstance.updateKey();
        // model
        model = new pc.Model();
        model.graph = node;
        model.meshInstances = [ meshInstance ];
        models['capsule-x'] = model;

        // ================
        // capsule z
        var segments = 72;
        buffer = new pc.gfx.VertexBuffer(app.graphicsDevice, vertexFormatAttr0, segments * 2 * 2 + segments / 2 * 2 * 4 + 4 + 2 * 4);
        iterator = new pc.gfx.VertexIterator(buffer);

        for(var i = 0; i <= segments; i++) {
            // circles
            if (i < segments) {
                for(var n = 0; n <= 1; n++) {
                    for(var k = i; k <= i + 1; k++) {
                        iterator.element[pc.SEMANTIC_POSITION].set(Math.sin(360 / segments * k * rad), Math.cos(360 / segments * k * rad), 0);
                        iterator.element[pc.SEMANTIC_ATTR0].set(n ? -1 : 1);
                        iterator.next();
                    }
                }
            }
            // domes
            var n = i % (segments / 2);
            var side = i > segments / 2;
            for(var k = n; k <= n + 1; k++) {
                iterator.element[pc.SEMANTIC_POSITION].set(0, Math.cos((360 / segments * k + (side ? 0 : 180)) * rad), Math.sin((360 / segments * k + (side ? 0 : 180)) * rad));
                iterator.element[pc.SEMANTIC_ATTR0].set(side ? 1 : -1);
                iterator.next();
            }
            for(var k = n; k <= n + 1; k++) {
                iterator.element[pc.SEMANTIC_POSITION].set(Math.cos((360 / segments * k + (side ? 0 : 180)) * rad), 0, Math.sin((360 / segments * k + (side ? 0 : 180)) * rad));
                iterator.element[pc.SEMANTIC_ATTR0].set(side ? 1 : -1);
                iterator.next();
            }
        }
        // lines
        for(var i = 0; i < 4; i++) {
            for(var n = 0; n <= 1; n++) {
                iterator.element[pc.SEMANTIC_POSITION].set(Math.sin(90 * i * rad), Math.cos(90 * i * rad), 0);
                iterator.element[pc.SEMANTIC_ATTR0].set(n ? -1 : 1);
                iterator.next();
            }
        }
        iterator.end();
        // node
        node = new pc.GraphNode();
        // mesh
        mesh = new pc.Mesh();
        mesh.vertexBuffer = buffer;
        mesh.indexBuffer[0] = null;
        mesh.primitive[0].type = pc.PRIMITIVE_LINES;
        mesh.primitive[0].base = 0;
        mesh.primitive[0].count = buffer.getNumVertices();
        mesh.primitive[0].indexed = false;
        // meshInstance
        meshInstance = new pc.MeshInstance(node, mesh, materials['capsule-z']);
        meshInstance.updateKey();
        // model
        model = new pc.Model();
        model.graph = node;
        model.meshInstances = [ meshInstance ];
        models['capsule-z'] = model;
    });

    var createModelWireframe = function(model) {
        var vertexFormat = new pc.gfx.VertexFormat(app.graphicsDevice, [
            { semantic: pc.gfx.SEMANTIC_POSITION, components: 3, type: pc.gfx.ELEMENTTYPE_FLOAT32 }
        ]);

        // model
        var modelLines = new pc.Model();
        modelLines.graph = new pc.GraphNode();
        modelLines.meshInstances = [ ];

        var wtm = model.graph.getWorldTransform();
        modelLines.graph.setPosition(wtm.getTranslation());
        modelLines.graph.setEulerAngles(wtm.getEulerAngles());
        modelLines.graph.setLocalScale(wtm.getScale());

        for(var m = 0; m < model.meshInstances.length; m++) {
            var mesh = model.meshInstances[m].mesh;


            var vertices = mesh.vertexBuffer;
            var format = vertices.getFormat();
            var indices = mesh.indexBuffer[pc.RENDERSTYLE_SOLID];

            var stride = format.size / 4;
            var offset = 0;
            var indicesView = new Uint16Array(indices.lock());

            for(var i = 0; i < format.elements.length; i++) {
                if (format.elements[i].name !== 'POSITION')
                    continue;

                offset = format.elements[i].offset;
                break;
            }

            var verticesView = new Float32Array(vertices.lock(), offset);

            var numTriangles = mesh.primitive[0].count / 3;
            var base = mesh.primitive[0].base;

            var buffer = new pc.gfx.VertexBuffer(app.graphicsDevice, vertexFormat, numTriangles * 3 * 2);
            var iterator = new pc.gfx.VertexIterator(buffer);

            var i1, i2, i3;
            var pairs = { };
            for (var j = 0; j < numTriangles; j++) {
                i1 = indicesView[ base + j * 3 ] * stride;
                i2 = indicesView[ base + j * 3 + 1 ] * stride;
                i3 = indicesView[ base + j * 3 + 2 ] * stride;

                if (! pairs[i1 + '-' + i2] && ! pairs[i2 + '-' + i1]) {
                    pairs[i1 + '-' + i2] = true;
                    iterator.element[pc.SEMANTIC_POSITION].set(verticesView[i1], verticesView[i1 + 1], verticesView[i1 + 2]);
                    iterator.next();
                    iterator.element[pc.SEMANTIC_POSITION].set(verticesView[i2], verticesView[i2 + 1], verticesView[i2 + 2]);
                    iterator.next();
                }

                if (! pairs[i2 + '-' + i3] && ! pairs[i3 + '-' + i2]) {
                    pairs[i2 + '-' + i3] = true;
                    iterator.element[pc.SEMANTIC_POSITION].set(verticesView[i2], verticesView[i2 + 1], verticesView[i2 + 2]);
                    iterator.next();
                    iterator.element[pc.SEMANTIC_POSITION].set(verticesView[i3], verticesView[i3 + 1], verticesView[i3 + 2]);
                    iterator.next();
                }

                if (! pairs[i3 + '-' + i1] && ! pairs[i1 + '-' + i3]) {
                    pairs[i3 + '-' + i1] = true;
                    iterator.element[pc.SEMANTIC_POSITION].set(verticesView[i3], verticesView[i3 + 1], verticesView[i3 + 2]);
                    iterator.next();
                    iterator.element[pc.SEMANTIC_POSITION].set(verticesView[i1], verticesView[i1 + 1], verticesView[i1 + 2]);
                    iterator.next();
                }
            }

            vertices.unlock();
            indices.unlock();

            iterator.end();

            // mesh
            var meshLines = new pc.Mesh();
            meshLines.vertexBuffer = buffer;
            meshLines.indexBuffer[0] = null;
            meshLines.primitive[0].type = pc.PRIMITIVE_LINES;
            meshLines.primitive[0].base = 0;
            meshLines.primitive[0].count = buffer.getNumVertices();
            meshLines.primitive[0].indexed = false;
            // meshInstance
            var wtm = model.meshInstances[m].node.getWorldTransform();
            var node = new pc.GraphNode();
            var meshInstance = new pc.MeshInstance(node, meshLines, materialDefault);
            node.setPosition(wtm.getTranslation());
            node.setEulerAngles(wtm.getEulerAngles());
            node.setLocalScale(wtm.getScale());
            meshInstance.updateKey();
            modelLines.meshInstances.push(meshInstance);
            modelLines.graph.addChild(node);
        }

        return modelLines;
    };

    editor.on('viewport:gizmoUpdate', function(dt) {
        for(var key in entities)
            entities[key].update();
    });
});
