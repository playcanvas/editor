editor.once('load', function () {
    'use strict';

    var app;
    // selected entity gizmos
    var entities = { };
    // pool of gizmos
    var pool = [ ];
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
    var materialSpot, materialSpotBehind;
    var models = { };
    var poolModels = { 'directional': [ ], 'point': [ ], 'point-close': [ ], 'spot': [ ] };

    var layerFront = editor.call('gizmo:layers', 'Bright Gizmo');
    var layerBack = editor.call('gizmo:layers', 'Dim Gizmo');

    // hack: override addModelToLayers to selectively put some
    // mesh instances to the front and others to the back layer depending
    // on the __useFrontLayer property
    var addModelToLayers = function () {
        var frontMeshInstances = this.meshInstances.filter(function (mi) {
            return mi.__useFrontLayer;
        });
        var backMeshInstances = this.meshInstances.filter(function (mi) {
            return ! mi.__useFrontLayer;
        });

        layerBack.addMeshInstances(frontMeshInstances);
        layerFront.addMeshInstances(backMeshInstances);
    };

    // gizmo class
    function Gizmo() {
        this._link = null;
        this.lines = [ ];
        this.events = [ ];
        this.type = '';
        this.entity = null;
    }
    // update lines
    Gizmo.prototype.update = function() {
        if (! app) return; // webgl not available

        if (! this._link || ! this._link.entity)
            return;

        var light = this._link.entity.light;
        this.entity.enabled = this._link.entity.enabled && light && light.enabled;
        if (! this.entity.enabled)
            return;

        this.entity.setPosition(this._link.entity.getPosition());

        var type = light.type;

        // close point light, switch to triple circle
        if (type === 'point' && vec.copy(this.entity.getPosition()).sub(editor.call('camera:current').getPosition()).length() < light.range)
            type += '-close';

        if (this.type !== type) {
            this.type = type;

            // set new model based on type
            if (models[this.type]) {
                // get current model
                var model = this.entity.model.model;
                if (model) {
                    // put back in pool
                    layerBack.removeMeshInstances(model.meshInstances);
                    layerFront.removeMeshInstances(model.meshInstances);
                    this.entity.removeChild(model.getGraph());
                    poolModels[model._type].push(model);
                }
                // get from pool
                model = poolModels[this.type].shift();
                if (! model) {
                    // no in pool
                    model = models[this.type].clone();
                    for (var i = 0; i < model.meshInstances.length; i++) {
                        model.meshInstances[i].__useFrontLayer = models[this.type].meshInstances[i].__useFrontLayer;
                        // model.meshInstances[i].mask = GIZMO_MASK;
                    }
                    model._type = this.type;
                }
                // set to model
                this.entity.model.model = model;
                model.meshInstances.forEach(function (mi) {
                    mi.mask = GIZMO_MASK;
                });
                this.entity.setLocalScale(1, 1, 1);
                this.entity.setEulerAngles(0, 0, 0);
            } else {
                this.entity.model.model = null;
                this.entity.enabled = false;
                return;
            }
        }

        var material = materialBehind;

        switch(this.type) {
            case 'directional':
                this.entity.setRotation(this._link.entity.getRotation());
                break;
            case 'point':
                this.entity.setLocalScale(light.range, light.range, light.range);
                this.entity.lookAt(editor.call('camera:current').getPosition());
                break;
            case 'point-close':
                this.entity.setLocalScale(light.range, light.range, light.range);
                break;
            case 'spot':
                this.entity.setRotation(this._link.entity.getRotation());
                this.entity.model.model.meshInstances[0].setParameter('range', light.range);
                this.entity.model.model.meshInstances[0].setParameter('innerAngle', light.innerConeAngle);
                this.entity.model.model.meshInstances[0].setParameter('outerAngle', light.outerConeAngle);
                this.entity.model.model.meshInstances[1].setParameter('range', light.range);
                this.entity.model.model.meshInstances[1].setParameter('innerAngle', light.innerConeAngle);
                this.entity.model.model.meshInstances[1].setParameter('outerAngle', light.outerConeAngle);
                material = materialSpotBehind;
                break;
        }

        // // render behind model
        // if (this.entity.enabled && this.entity.model.model) {
        //     // var instance = new pc.MeshInstance(this.entity, this.entity.model.model.meshInstances[0].mesh, material);
        //     // instance.__useFrontLayer = true;
        //     // instance.mask = 8;
        //     // instance.pick = false;
        //     if (this.type === 'spot') {
        //         // instance.layer = pc.LAYER_GIZMO;
        //         this.entity.model.model.meshInstances[1]
        //         instance.setParameter('range', light.range);
        //         instance.setParameter('innerAngle', light.innerConeAngle);
        //         instance.setParameter('outerAngle', light.outerConeAngle);
        //     }

        //     // app.scene.immediateDrawCalls.push(instance);
        // }
    };
    // link to entity
    Gizmo.prototype.link = function(obj) {
        if (! app) return; // webgl not available

        this.unlink();
        this._link = obj;

        var self = this;

        this.events.push(this._link.once('destroy', function() {
            self.unlink();
        }));

        this.entity = new pc.Entity();
        this.entity.addComponent('model', {
            castShadows: false,
            receiveShadows: false,
            castShadowsLightmap: false,
            layers: [layerBack.id, layerFront.id]
        });
        this.entity.model.addModelToLayers = addModelToLayers;

        container.addChild(this.entity);
    };
    // unlink
    Gizmo.prototype.unlink = function() {
        if (! app) return; // webgl not available

        if (! this._link)
            return;

        for(var i = 0; i < this.events.length; i++)
            this.events[i].unbind();

        this.events = [ ];
        this._link = null;
        this.type = '';

        var model = this.entity.model.model;
        if (model) {
            // put back in pool
            layerBack.removeMeshInstances(model.meshInstances);
            layerFront.removeMeshInstances(model.meshInstances);
            this.entity.removeChild(model.getGraph());
            poolModels[model._type].push(model);
        }

        this.entity.destroy();
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

        var render = false;

        // remove
        for(var key in entities) {
            if (ids[key])
                continue;

            pool.push(entities[key]);
            entities[key].unlink();
            delete entities[key];
            render = true;
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

            render = true;
        }

        if (render)
            editor.call('viewport:render');
    });

    editor.once('viewport:load', function() {
        app = editor.call('viewport:app');
        if (! app) return; // webgl not available

        container = new pc.Entity(app);
        app.root.addChild(container);

        // material
        var material = new pc.BasicMaterial();
        material.color = colorPrimary;
        material.update();

        var shaderSpot;

        materialSpot = new pc.BasicMaterial();
        materialSpot.updateShader = function(device) {
            if (! shaderSpot) {
                shaderSpot = new pc.Shader(device, {
                    attributes: {
                        vertex_position: 'POSITION',
                        outer: 'ATTR0'
                    },
                    vshader: ' \
                        attribute vec3 vertex_position;\n \
                        attribute float outer;\n \
                        uniform mat4 matrix_model;\n \
                        uniform mat4 matrix_viewProjection;\n \
                        uniform float range;\n \
                        uniform float innerAngle;\n \
                        uniform float outerAngle;\n \
                        void main(void)\n \
                        {\n \
                            mat4 modelMatrix = matrix_model;\n \
                            vec4 positionW = vec4(vertex_position, 1.0);\n \
                            float radius = (outer * (sin(radians(outerAngle)) * range)) + ((1.0 - outer) * (sin(radians(innerAngle)) * range));\n \
                            positionW.xz *= radius;\n \
                            positionW.y *= range * ((outer * cos(radians(outerAngle))) + ((1.0 - outer) * cos(radians(innerAngle))));\n \
                            positionW = modelMatrix * positionW;\n \
                            gl_Position = matrix_viewProjection * positionW;\n \
                        }\n',
                    fshader: ' \
                        precision ' + device.precision + ' float;\n \
                        uniform vec4 uColor;\n \
                        void main(void)\n \
                        {\n \
                            gl_FragColor = uColor;\n \
                            gl_FragColor = clamp(gl_FragColor, 0.0, 1.0);\n \
                        }\n',
                });
            }
            this.shader = shaderSpot;
        };
        materialSpot.color = colorPrimary;
        materialSpot.update();

        materialSpotBehind = new pc.BasicMaterial();
        materialSpotBehind.updateShader = materialSpot.updateShader;
        materialSpotBehind.color = colorBehind;
        materialSpotBehind.blend = true;
        materialSpotBehind.blendSrc = pc.BLENDMODE_SRC_ALPHA;
        materialSpotBehind.blendDst = pc.BLENDMODE_ONE_MINUS_SRC_ALPHA;
        materialSpotBehind.depthTest = false;
        materialSpotBehind.update();

        var buffer, iterator, size, length, node, mesh, material, meshInstance, model;
        var vertexFormat = new pc.VertexFormat(app.graphicsDevice, [
            { semantic: pc.SEMANTIC_POSITION, components: 3, type: pc.TYPE_FLOAT32 }
        ]);
        var vertexFormatSpot = new pc.VertexFormat(app.graphicsDevice, [
            { semantic: pc.SEMANTIC_POSITION, components: 3, type: pc.TYPE_FLOAT32 },
            { semantic: pc.SEMANTIC_ATTR0, components: 1, type: pc.TYPE_FLOAT32 }
        ]);
        var rad = Math.PI / 180;

        // ================
        // directional light
        buffer = new pc.VertexBuffer(app.graphicsDevice, vertexFormat, 14);
        iterator = new pc.VertexIterator(buffer);
        size = .2;
        length = -(2 - size * 2);
        // line
        iterator.element[pc.SEMANTIC_POSITION].set(0, 0, 0);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(0, length, 0);
        iterator.next();
        // triangle
        iterator.element[pc.SEMANTIC_POSITION].set(Math.sin(0 * rad) * size, length, Math.cos(0 * rad) * size);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(Math.sin(120 * rad) * size, length, Math.cos(120 * rad) * size);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(Math.sin(120 * rad) * size, length, Math.cos(120 * rad) * size);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(Math.sin(240 * rad) * size, length, Math.cos(240 * rad) * size);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(Math.sin(240 * rad) * size, length, Math.cos(240 * rad) * size);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(Math.sin(0 * rad) * size, length, Math.cos(0 * rad) * size);
        iterator.next();
        // triangle corners
        iterator.element[pc.SEMANTIC_POSITION].set(Math.sin(0 * rad) * size, length, Math.cos(0 * rad) * size);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(0, length - (size * 2), 0);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(Math.sin(120 * rad) * size, length, Math.cos(120 * rad) * size);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(0, length - (size * 2), 0);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(Math.sin(240 * rad) * size, length, Math.cos(240 * rad) * size);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(0, length - (size * 2), 0);
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
        meshInstance = new pc.MeshInstance(node, mesh, material);
        meshInstance.mask = GIZMO_MASK;
        meshInstance.pick = false;
        // meshInstance.updateKey();

        var meshInstanceBehind = new pc.MeshInstance(node, mesh, materialBehind);
        meshInstanceBehind.__useFrontLayer = true;
        meshInstanceBehind.mask = GIZMO_MASK;
        meshInstanceBehind.pick = false;

        // model
        model = new pc.Model();
        model.graph = node;
        model.meshInstances = [ meshInstance, meshInstanceBehind ];
        models['directional'] = model;

        // ================
        // point light
        var segments = 72;
        buffer = new pc.VertexBuffer(app.graphicsDevice, vertexFormat, segments * 2);
        iterator = new pc.VertexIterator(buffer);
        // xz axis
        for(var i = 0; i < segments; i++) {
            iterator.element[pc.SEMANTIC_POSITION].set(Math.sin(360 / segments * i * rad), Math.cos(360 / segments * i * rad), 0);
            iterator.next();
            iterator.element[pc.SEMANTIC_POSITION].set(Math.sin(360 / segments * (i + 1) * rad), Math.cos(360 / segments * (i + 1) * rad), 0);
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
        meshInstance = new pc.MeshInstance(node, mesh, material);
        meshInstance.mask = GIZMO_MASK;
        meshInstance.pick = false;
        // meshInstance.updateKey();

        meshInstanceBehind = new pc.MeshInstance(node, mesh, materialBehind);
        meshInstanceBehind.__useFrontLayer = true;
        meshInstanceBehind.mask = GIZMO_MASK;
        meshInstanceBehind.pick = false;

        // model
        model = new pc.Model();
        model.graph = node;
        model.meshInstances = [ meshInstance, meshInstanceBehind ];
        models['point'] = model;


        // ================
        // point light close
        var segments = 72;
        buffer = new pc.VertexBuffer(app.graphicsDevice, vertexFormat, segments * 2 * 3);
        iterator = new pc.VertexIterator(buffer);
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
        meshInstance = new pc.MeshInstance(node, mesh, material);
        meshInstance.mask = GIZMO_MASK;
        meshInstance.pick = false;
        meshInstance.updateKey();

        meshInstanceBehind = new pc.MeshInstance(node, mesh, materialBehind);
        meshInstanceBehind.__useFrontLayer = true;
        meshInstanceBehind.mask = GIZMO_MASK;
        meshInstanceBehind.pick = false;

        // model
        model = new pc.Model();
        model.graph = node;
        model.meshInstances = [ meshInstance, meshInstanceBehind ];
        models['point-close'] = model;


        // ================
        // spot light
        var segments = 72;
        buffer = new pc.VertexBuffer(app.graphicsDevice, vertexFormatSpot, segments * 2 * 2 + 8);
        iterator = new pc.VertexIterator(buffer);
        // lines
        //      left
        iterator.element[pc.SEMANTIC_POSITION].set(0, 0, 0);
        iterator.element[pc.SEMANTIC_ATTR0].set(1);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(Math.sin(0 * rad), -1, Math.cos(0 * rad));
        iterator.element[pc.SEMANTIC_ATTR0].set(1);
        iterator.next();
        //      right
        iterator.element[pc.SEMANTIC_POSITION].set(0, 0, 0);
        iterator.element[pc.SEMANTIC_ATTR0].set(1);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(Math.sin(180 * rad), -1, Math.cos(180 * rad));
        iterator.element[pc.SEMANTIC_ATTR0].set(1);
        iterator.next();
        // circles
        for(var i = 0; i < segments; i++) {
            // inner
            iterator.element[pc.SEMANTIC_POSITION].set(Math.sin(360 / segments * i * rad), -1, Math.cos(360 / segments * i * rad));
            iterator.element[pc.SEMANTIC_ATTR0].set(0);
            iterator.next();
            iterator.element[pc.SEMANTIC_POSITION].set(Math.sin(360 / segments * (i + 1) * rad), -1, Math.cos(360 / segments * (i + 1) * rad));
            iterator.element[pc.SEMANTIC_ATTR0].set(0);
            iterator.next();
            // outer
            iterator.element[pc.SEMANTIC_POSITION].set(Math.sin(360 / segments * i * rad), -1, Math.cos(360 / segments * i * rad));
            iterator.element[pc.SEMANTIC_ATTR0].set(1);
            iterator.next();
            iterator.element[pc.SEMANTIC_POSITION].set(Math.sin(360 / segments * (i + 1) * rad), -1, Math.cos(360 / segments * (i + 1) * rad));
            iterator.element[pc.SEMANTIC_ATTR0].set(1);
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
        meshInstance = new pc.MeshInstance(node, mesh, materialSpot);
        meshInstance.mask = GIZMO_MASK;
        meshInstance.pick = false;
        // meshInstance.updateKey();

        meshInstanceBehind = new pc.MeshInstance(node, mesh, materialSpotBehind);
        meshInstanceBehind.__useFrontLayer = true;
        meshInstanceBehind.mask = GIZMO_MASK;
        meshInstanceBehind.pick = false;

        // model
        model = new pc.Model();
        model.graph = node;
        model.meshInstances = [ meshInstance, meshInstanceBehind ];
        models['spot'] = model;
    });

    editor.on('viewport:gizmoUpdate', function(dt) {
        for(var key in entities)
            entities[key].update();
    });
});
