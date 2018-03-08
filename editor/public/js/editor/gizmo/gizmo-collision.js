editor.once('load', function () {
    'use strict';

    var app;
    // selected entity gizmos
    var entities = { };
    var selected = { };
    // pool of gizmos
    var pool = [ ];
    var poolVec3 = [ ];
    // colors
    var alphaFront = 0.6;
    var alphaBehind = 0.2;
    var colorBehind = new pc.Color(1, 1, 1, .05);
    var colorPrimary = new pc.Color(1, 1, 1);
    var colorOccluder = new pc.Color(1, 1, 1, 1);
    var colorDefault = [ 1, 1, 1 ];
    var container;
    var vecA = new pc.Vec3();
    var vecB = new pc.Vec3();

    var materialDefault = new pc.BasicMaterial();
    materialDefault.name = 'collision';
    materialDefault.color = colorPrimary;
    materialDefault.blend = true;
    materialDefault.blendSrc = pc.BLENDMODE_SRC_ALPHA;
    materialDefault.blendDst = pc.BLENDMODE_ONE_MINUS_SRC_ALPHA;
    materialDefault.update();

    var materialBehind = new pc.BasicMaterial();
    materialBehind.name = 'collision behind';
    materialBehind.color = colorBehind;
    materialBehind.blend = true;
    materialBehind.blendSrc = pc.BLENDMODE_SRC_ALPHA;
    materialBehind.blendDst = pc.BLENDMODE_ONE_MINUS_SRC_ALPHA;
    materialBehind.depthWrite = false;
    materialBehind.depthTest = true;
    materialBehind.update();

    var materialOccluder = new pc.BasicMaterial();
    materialOccluder.name = 'collision occluder'
    materialOccluder.color = colorOccluder;
    materialOccluder.redWrite = false;
    materialOccluder.greenWrite = false;
    materialOccluder.blueWrite = false;
    materialOccluder.alphaWrite = false;
    materialOccluder.depthWrite = true;
    materialOccluder.depthTest = true;
    materialOccluder.update();

    var models = { };
    var materials = { };
    var poolModels = { 'box': [ ], 'sphere': [ ], 'capsule-x': [ ], 'capsule-y': [ ], 'capsule-z': [ ], 'cylinder-x': [ ], 'cylinder-y': [ ], 'cylinder-z': [ ] };
    var axesNames = { 0: 'x', 1: 'y', 2: 'z' };
    var shaderCapsule = { };

    var layerFront = editor.call('gizmo:layers', 'Bright Collision');
    var layerBack = editor.call('gizmo:layers', 'Dim Gizmo');

    var filterPicker = function(drawCall) {
        if (drawCall.command)
            return true;

        return (drawCall.__editor && drawCall.__collision) || drawCall.layer === pc.LAYER_GIZMO;
    };

    var visible = false;
    editor.method('gizmo:collision:visible', function(state) {
        if (state === undefined)
            return visible;

        if (visible === !! state)
            return;

        visible = !! state;

        if (visible) {
            editor.call('gizmo:zone:visible', false);
            editor.call('viewport:pick:filter', filterPicker);
        } else {
            editor.call('viewport:pick:filter', null);
        }

        editor.emit('gizmo:collision:visible', visible);
        editor.call('viewport:render');
    });

    // gizmo class
    function Gizmo() {
        this._link = null;
        this.lines = [ ];
        this.events = [ ];
        this.type = '';
        this.asset = 0;
        this.entity = null;
        this.color;
    };

    // update lines
    Gizmo.prototype.update = function() {
        if (! app) return; // webgl not available

        if (! this._link || ! this._link.entity)
            return;

        var select = selected[this._link.get('resource_id')];
        var collision = this._link.entity.collision;
        this.entity.enabled = this._link.entity.enabled && collision && collision.enabled && (select || visible);
        if (! this.entity.enabled) {
            this._link.entity.__noIcon = false;
            return;
        }

        this._link.entity.__noIcon = true;
        this.entity.setPosition(this._link.entity.getPosition());
        this.entity.setRotation(this._link.entity.getRotation());

        var type = collision.type;

        if (type === 'cylinder' || type === 'capsule') {
            type += '-' + axesNames[collision.axis];
        }

        if (this.type !== type) {
            this.type = type;

            if (! this.color) {
                var hash = 0;
                var string = this._link.entity._guid;
                for(var i = 0; i < string.length; i++)
                    hash += string.charCodeAt(i);

                this.color = editor.call('color:hsl2rgb', (hash % 128) / 128, 0.5, 0.5);
            }

            this.wireframeMesh = null;

            // set new model based on type
            if (models[this.type]) {
                // get current model
                var model = this.entity.model.model;
                if (model) {
                    // put back in pool
                    layerFront.removeMeshInstances(model.meshInstances);
                    layerBack.removeMeshInstances(model.meshInstances);

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

                    var color = this.color || colorDefault;

                    var old = model.meshInstances[0].material;
                    model.meshInstances[0].setParameter('offset', 0);
                    // model.meshInstances[0].layer = 12;
                    // model.meshInstances[0].updateKey();
                    model.meshInstances[0].__editor = true;
                    model.meshInstances[0].__collision = true;
                    model.meshInstances[0].pick = false;
                    model.meshInstances[0].material = old.clone();
                    model.meshInstances[0].material.updateShader = old.updateShader;
                    model.meshInstances[0].material.depthBias = -8;
                    model.meshInstances[0].material.color.set(color[0], color[1], color[2], alphaFront);
                    model.meshInstances[0].material.update();

                    var old = model.meshInstances[1].material;
                    model.meshInstances[1].setParameter('offset', 0.001);
                    // model.meshInstances[1].layer = 2;
                    model.meshInstances[1].pick = false;
                    // model.meshInstances[1].updateKey();
                    model.meshInstances[1].__editor = true;
                    model.meshInstances[1].material = old.clone();
                    model.meshInstances[1].material.updateShader = old.updateShader;
                    model.meshInstances[1].material.color.set(color[0], color[1], color[2], alphaBehind);
                    model.meshInstances[1].material.update();
                    model.meshInstances[1].__useFrontLayer = true;

                    model.meshInstances[2].setParameter('offset', 0);
                    // model.meshInstances[2].layer = 9;
                    model.meshInstances[2].pick = false;
                    // model.meshInstances[2].updateKey();
                    model.meshInstances[2].__editor = true;

                    switch(this.type) {
                        case 'capsule-x':
                        case 'capsule-y':
                        case 'capsule-z':
                            model.meshInstances[0]._shader[pc.SHADER_PICK] = shaderCapsule['pick-' + axesNames[collision.axis]];

                            for(var i = 0; i < model.meshInstances.length; i++) {
                                model.meshInstances[i].setParameter('radius', collision.radius || 0.5);
                                model.meshInstances[i].setParameter('height', collision.height || 2);
                            }
                            break;
                    }
                }
                // set to model
                this.entity.model.model = model;

                // set masks after model is assigned to ensure they are correct
                model.meshInstances.forEach(function (mi) {
                    mi.mask = GIZMO_MASK;
                });

                this.entity.setLocalScale(1, 1, 1);
            } else if (this.type === 'mesh') {
                this.asset = collision.asset;
                this.entity.setLocalScale(this._link.entity.getWorldTransform().getScale());
                this.createWireframe(collision.asset);
                if (! this.asset) {
                    this.entity.enabled = false;
                    this.entity.model.model = null;
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

        if (this.entity.model.model && this.entity.model.meshInstances[1])
            mat = null;

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
                for(var i = 0; i < this.entity.model.meshInstances.length; i++) {
                    this.entity.model.meshInstances[i].setParameter('radius', collision.radius || 0.5);
                    this.entity.model.meshInstances[i].setParameter('height', collision.height || 2);
                }
                break;
            case 'mesh':
                this.entity.setLocalScale(this._link.entity.getWorldTransform().getScale());

                if (collision.asset !== this.asset) {
                    this.asset = collision.asset;
                    this.createWireframe(collision.asset);
                    if (! this.asset) {
                        this.entity.enabled = false;
                        this.entity.model.model = null;
                        return;
                    }
                }

                if (this.entity.model.model) {
                    var picking = ! visible && this._link.entity.model && this._link.entity.model.enabled && this._link.entity.model.type === 'asset' && this._link.entity.model.asset === collision.asset;
                    if (picking !== this.entity.model.model.__picking) {
                        this.entity.model.model.__picking = picking;

                        var meshes = this.entity.model.meshInstances;
                        for(var i = 0; i < meshes.length; i++) {
                            if (! meshes[i].__collision)
                                continue;

                            meshes[i].pick = ! picking;
                        }
                    }
                }
                break;
        }
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

        this.color = null;

        this.entity = new pc.Entity();
        this.entity.__editor = true;
        this.entity.addComponent('model', {
            castShadows: false,
            receiveShadows: false,
            castShadowsLightmap: false,
            layers: [layerFront.id, layerBack.id]
        });

        // hack: override addModelToLayers to selectively put some
        // mesh instances to the front and others to the back layer depending
        // on the __useFrontLayer property
        this.entity.model.addModelToLayers = function () {
            var frontMeshInstances = this.meshInstances.filter(function (mi) {
                return mi.__useFrontLayer;
            });
            var backMeshInstances = this.meshInstances.filter(function (mi) {
                return ! mi.__useFrontLayer;
            });

            layerBack.addMeshInstances(frontMeshInstances);
            layerFront.addMeshInstances(backMeshInstances);
        };

        this.entity._getEntity = function() {
            return self._link.entity;
        };

        container.addChild(this.entity);
    };
    // unlink
    Gizmo.prototype.unlink = function() {
        if (! app) return; // webgl not available

        if (! this._link)
            return;

        for(var i = 0; i < this.events.length; i++) {
            if (this.events[i] && this.events[i].unbind)
                this.events[i].unbind();
        }

        this.events = [ ];
        this._link = null;
        this.color = null;
        this.type = '';
        this.asset = 0;

        var model = this.entity.model.model;
        if (model) {
            // put back in pool
            layerFront.removeMeshInstances(model.meshInstances);
            layerBack.removeMeshInstances(model.meshInstances);
            this.entity.removeChild(model.getGraph());
            if (model._type)
                poolModels[model._type].push(model);
        }

        this.entity.destroy();
    };
    // create wireframe
    Gizmo.prototype.createWireframe = function(asset) {
        if (! app) return; // webgl not available

        asset = app.assets.get(asset);
        if (! asset)
            return null;

        if (asset.resource) {
            this.entity.model.model = createModelCopy(asset.resource, this.color);
        } else {
            var self = this;

            this.events.push(asset.once('load', function(asset) {
                if (self.asset !== asset.id)
                    return;

                self.entity.model.model = createModelCopy(asset.resource, this.color);
            }));
        }
    };

    editor.on('entities:add', function(entity) {
        var key = entity.get('resource_id');

        var addGizmo = function() {
            if (entities[key])
                return;

            var gizmo = pool.shift();
            if (! gizmo)
                gizmo = new Gizmo();

            gizmo.link(entity);
            entities[key] = gizmo;

            editor.call('viewport:render');
        };

        var removeGizmo = function() {
            if (! entities[key])
                return;

            pool.push(entities[key]);
            entities[key].unlink();
            delete entities[key];

            editor.call('viewport:render');
        };

        if (entity.has('components.collision'))
            addGizmo();

        entity.on('components.collision:set', addGizmo);
        entity.on('components.collision:unset', removeGizmo);
        entity.on('destroy', removeGizmo);
    });

    editor.on('selector:change', function(type, items) {
        selected = { };

        if (type === 'entity' && items && items.length) {
            for(var i = 0; i < items.length; i++)
                selected[items[i].get('resource_id')] = true;
        }
    });

    editor.once('viewport:load', function() {
        app = editor.call('viewport:app');
        if (! app) return; // webgl not available

        container = new pc.Entity(app);
        app.root.addChild(container);

        // material
        var defaultVShader = ' \
            attribute vec3 aPosition;\n \
            attribute vec3 aNormal;\n \
            varying vec3 vNormal;\n \
            varying vec3 vPosition;\n \
            uniform float offset;\n \
            uniform mat4 matrix_model;\n \
            uniform mat3 matrix_normal;\n \
            uniform mat4 matrix_view;\n \
            uniform mat4 matrix_viewProjection;\n \
            void main(void)\n \
            {\n \
                vec4 posW = matrix_model * vec4(aPosition, 1.0);\n \
                vNormal = normalize(matrix_normal * aNormal);\n \
                posW += vec4(vNormal * offset, 0.0);\n \
                gl_Position = matrix_viewProjection * posW;\n \
                vPosition = posW.xyz;\n \
            }\n';
        var defaultFShader = ' \
            precision ' + app.graphicsDevice.precision + ' float;\n \
            varying vec3 vNormal;\n \
            varying vec3 vPosition;\n \
            uniform vec4 uColor;\n \
            uniform vec3 view_position;\n \
            void main(void)\n \
            {\n \
                vec3 viewNormal = normalize(view_position - vPosition);\n \
                float light = dot(vNormal, viewNormal);\n \
                gl_FragColor = vec4(uColor.rgb * light * 2.0, uColor.a);\n \
            }\n';

        var shaderDefault;

        materialDefault.updateShader = function(device) {
            if (! shaderDefault) {
                shaderDefault = new pc.Shader(device, {
                    attributes: {
                        aPosition: pc.SEMANTIC_POSITION,
                        aNormal: pc.SEMANTIC_NORMAL
                    },
                    vshader: defaultVShader,
                    fshader: defaultFShader,
                });
            }

            this.shader = shaderDefault;
        };
        materialDefault.update();

        materialBehind.updateShader = materialDefault.updateShader;
        materialOccluder.updateShader = materialDefault.updateShader;

        var capsuleVShader = ' \
            attribute vec3 aPosition;\n \
            attribute vec3 aNormal;\n \
            attribute float aSide;\n \
            varying vec3 vNormal;\n \
            varying vec3 vPosition;\n \
            uniform float offset;\n \
            uniform mat4 matrix_model;\n \
            uniform mat3 matrix_normal;\n \
            uniform mat4 matrix_viewProjection;\n \
            uniform float radius;\n \
            uniform float height;\n \
            void main(void) {\n \
                vec3 pos = aPosition * radius;\n \
                pos.{axis} += aSide * max(height / 2.0 - radius, 0.0);\n \
                vec4 posW = matrix_model * vec4(pos, 1.0);\n \
                vNormal = normalize(matrix_normal * aNormal);\n \
                posW += vec4(vNormal * offset, 0.0);\n \
                gl_Position = matrix_viewProjection * posW;\n \
                vPosition = posW.xyz;\n \
            }\n';
        var capsuleFShader = ' \
            precision ' + app.graphicsDevice.precision + ' float;\n \
            varying vec3 vNormal;\n \
            varying vec3 vPosition;\n \
            uniform vec4 uColor;\n \
            uniform vec3 view_position;\n \
            void main(void) {\n \
                vec3 viewNormal = normalize(view_position - vPosition);\n \
                float light = dot(vNormal, viewNormal);\n \
                gl_FragColor = vec4(uColor.rgb * light * 2.0, uColor.a);\n \
            }\n';

        var capsuleVShaderPick = ' \
            attribute vec3 aPosition;\n \
            attribute vec3 aNormal;\n \
            attribute float aSide;\n \
            uniform mat4 matrix_model;\n \
            uniform mat4 matrix_viewProjection;\n \
            uniform float radius;\n \
            uniform float height;\n \
            void main(void) {\n \
                vec3 pos = aPosition * radius;\n \
                pos.{axis} += aSide * max(height / 2.0 - radius, 0.0);\n \
                vec4 posW = matrix_model * vec4(pos, 1.0);\n \
                gl_Position = matrix_viewProjection * posW;\n \
            }\n';

        var capsuleFShaderPick = ' \
            precision ' + app.graphicsDevice.precision + ' float;\n \
            uniform vec4 uColor;\n \
            void main(void) {\n \
                gl_FragColor = uColor;\n \
            }\n';


        var makeMaterial = function(a) {
            var matDefault = materials['capsule-' + a] = materialDefault.clone();
            matDefault.updateShader = function(device) {
                if (! shaderCapsule[a]) {
                    shaderCapsule[a] = new pc.Shader(device, {
                        attributes: {
                            aPosition: pc.SEMANTIC_POSITION,
                            aNormal: pc.SEMANTIC_NORMAL,
                            aSide: pc.SEMANTIC_ATTR0
                        },
                        vshader: capsuleVShader.replace('{axis}', a),
                        fshader: capsuleFShader,
                    });
                }
                this.shader = shaderCapsule[a];
            };

            matDefault.update();

            var matBehind = materials['capsuleBehind-' + a] = materialBehind.clone();
            matBehind.updateShader = matDefault.updateShader;
            matBehind.update();

            var matOccluder = materials['capsuleOcclude-' + a] = materialOccluder.clone();
            matOccluder.updateShader = matDefault.updateShader;
            matOccluder.update();

            if (! shaderCapsule['pick-' + a]) {
                shaderCapsule['pick-' + a] = new pc.Shader(app.graphicsDevice, {
                    attributes: {
                        aPosition: pc.SEMANTIC_POSITION,
                        aNormal: pc.SEMANTIC_NORMAL,
                        aSide: pc.SEMANTIC_ATTR0
                    },
                    vshader: capsuleVShaderPick.replace('{axis}', a),
                    fshader: capsuleFShaderPick
                });
            }
        }

        for(var key in axesNames)
            makeMaterial(axesNames[key]);

        var buffer, iterator, size, length, node, mesh, meshInstance, model, indexBuffer, indices;
        var vertexFormat = new pc.VertexFormat(app.graphicsDevice, [
            { semantic: pc.SEMANTIC_POSITION, components: 3, type: pc.ELEMENTTYPE_FLOAT32 }
        ]);
        var vertexFormatAttr0 = new pc.VertexFormat(app.graphicsDevice, [
            { semantic: pc.SEMANTIC_POSITION, components: 3, type: pc.ELEMENTTYPE_FLOAT32 },
            { semantic: pc.SEMANTIC_NORMAL, components: 3, type: pc.ELEMENTTYPE_FLOAT32 },
            { semantic: pc.SEMANTIC_ATTR0, components: 1, type: pc.ELEMENTTYPE_FLOAT32 }
        ]);
        var rad = Math.PI / 180;

        var createModel = function(args) {
            var mesh;

            if (args.vertices) {
                // mesh
                mesh = new pc.Mesh();
                mesh.vertexBuffer = args.vertices;
                mesh.indexBuffer[0] = args.indices;
                mesh.primitive[0].type = pc.PRIMITIVE_TRIANGLES;
                mesh.primitive[0].base = 0;
                mesh.primitive[0].count = args.count;
                mesh.primitive[0].indexed = true;
            } else {
                mesh = pc.createMesh(app.graphicsDevice, args.positions, {
                    normals: args.normals,
                    indices: args.indices
                });
            }

            // node
            var node = new pc.GraphNode();
            // meshInstance
            var meshInstance = new pc.MeshInstance(node, mesh, args.matDefault);
            meshInstance.__editor = true;
            meshInstance.__collision = true;
            // meshInstance.layer = 12;
            meshInstance.castShadow = false;
            // meshInstance.castLightmapShadow = false;
            meshInstance.receiveShadow = false;
            // meshInstance.updateKey();
            // meshInstanceBehind
            var meshInstanceBehind = new pc.MeshInstance(node, mesh, args.matBehind);
            meshInstanceBehind.__editor = true;
            meshInstanceBehind.pick = false;
            // meshInstanceBehind.layer = 2;
            meshInstanceBehind.drawToDepth = false;
            meshInstanceBehind.castShadow = false;
            // meshInstanceBehind.castLightmapShadow = false;
            meshInstanceBehind.receiveShadow = false;
            // meshInstanceBehind.updateKey();
            // meshInstanceOccluder
            var meshInstanceOccluder = new pc.MeshInstance(node, mesh, args.matOccluder);
            meshInstanceOccluder.__editor = true;
            meshInstanceOccluder.pick = false;
            // meshInstanceOccluder.layer = 9;
            meshInstanceOccluder.castShadow = false;
            // meshInstanceOccluder.castLightmapShadow = false;
            meshInstanceOccluder.receiveShadow = false;
            // meshInstanceOccluder.updateKey();
            // model
            var model = new pc.Model();
            model.graph = node;
            model.meshInstances = [ meshInstance, meshInstanceBehind, meshInstanceOccluder ];

            return model;
        };


        // ================
        // box
        var positions = [
            1, 1, 1,   1, 1, -1,   -1, 1, -1,   -1, 1, 1, // top
            1, 1, 1,   -1, 1, 1,   -1, -1, 1,   1, -1, 1, // front
            1, 1, 1,   1, -1, 1,   1, -1, -1,   1, 1, -1, // right
            1, 1, -1,   1, -1, -1,   -1, -1, -1,   -1, 1, -1, // back
            -1, 1, 1,   -1, 1, -1,   -1, -1, -1,   -1, -1, 1, // left
            1, -1, 1,   -1, -1, 1,   -1, -1, -1,   1, -1, -1 // bottom
        ];
        var normals = [
            0, 1, 0,   0, 1, 0,   0, 1, 0,   0, 1, 0,
            0, 0, 1,   0, 0, 1,   0, 0, 1,   0, 0, 1,
            1, 0, 0,   1, 0, 0,   1, 0, 0,   1, 0, 0,
            0, 0, -1,   0, 0, -1,   0, 0, -1,   0, 0, -1,
            -1, 0, 0,   -1, 0, 0,   -1, 0, 0,   -1, 0, 0,
            0, -1, 0,   0, -1, 0,   0, -1, 0,   0, -1, 0
        ];
        var indices = [
            0, 1, 2, 2, 3, 0,
            4, 5, 6, 6, 7, 4,
            8, 9, 10, 10, 11, 8,
            12, 13, 14, 14, 15, 12,
            16, 17, 18, 18, 19, 16,
            20, 21, 22, 22, 23, 20
        ];
        models['box'] = createModel({
            positions: positions,
            normals: normals,
            indices: indices,
            matDefault: materialDefault,
            matBehind: materialBehind,
            matOccluder: materialOccluder
        });


        // ================
        // sphere
        var segments = 64;
        positions = [ ];
        normals = [ ];
        indices = [ ];

        for(var y = 1; y < segments / 2; y++) {
            for(var i = 0; i < segments; i++) {
                var l = Math.sin((y * (180 / (segments / 2)) + 90) * rad);
                var c = Math.cos((y * (180 / (segments / 2)) + 90) * rad);
                vecA.set(Math.sin(360 / segments * i * rad) * Math.abs(c), l, Math.cos(360 / segments * i * rad) * Math.abs(c));
                positions.push(vecA.x, vecA.y, vecA.z);
                vecA.normalize();
                normals.push(vecA.x, vecA.y, vecA.z);
            }
        }

        positions.push(0, 1, 0);
        normals.push(0, 1, 0);
        positions.push(0, -1, 0);
        normals.push(0, -1, 0);

        for(var y = 0; y < segments / 2 - 2; y++) {
            for(var i = 0; i < segments; i++) {
                indices.push(y * segments + i, (y + 1) * segments + i, y * segments + (i + 1) % segments);
                indices.push((y + 1) * segments + i, (y + 1) * segments + (i + 1) % segments, y * segments + (i + 1) % segments);
            }
        }

        for(var i = 0; i < segments; i++) {
            indices.push(i, (i + 1) % segments, (segments / 2 - 1) * segments);
            indices.push((segments / 2 - 2) * segments + i, (segments / 2 - 1) * segments + 1, (segments / 2 - 2) * segments + (i + 1) % segments);
        }

        models['sphere'] = createModel({
            positions: positions,
            normals: normals,
            indices: indices,
            matDefault: materialDefault,
            matBehind: materialBehind,
            matOccluder: materialOccluder
        });


        // ================
        // cylinders
        var axes = {
            'x': [ 'z', 'y', 'x' ],
            'y': [ 'x', 'z', 'y' ],
            'z': [ 'y', 'x', 'z' ]
        };
        for(var a in axes) {
            positions = [ ];
            indices = [ ];
            normals = [ ];
            var segments = 72;

            // side
            for(var v = 1; v >= -1; v -= 2) {
                for(var i = 0; i < segments; i++) {
                    vecA[axes[a][0]] = Math.sin(360 / segments * i * rad);
                    vecA[axes[a][1]] = Math.cos(360 / segments * i * rad);
                    vecA[axes[a][2]] = v * 0.5;

                    vecB.copy(vecA);
                    vecB[axes[a][2]] = 0;
                    positions.push(vecA.x, vecA.y, vecA.z);
                    normals.push(vecB.x, vecB.y, vecB.z);
                }
            }

            // top/bottom
            for(var v = 1; v >= -1; v -= 2) {
                vecA.set(0, 0, 0);
                vecA[axes[a][2]] = v;
                positions.push(vecA.x * 0.5, vecA.y * 0.5, vecA.z * 0.5);
                normals.push(vecA.x, vecA.y, vecA.z);

                for(var i = 0; i < segments; i++) {
                    vecA[axes[a][0]] = Math.sin(360 / segments * i * rad);
                    vecA[axes[a][1]] = Math.cos(360 / segments * i * rad);
                    vecA[axes[a][2]] = v * 0.5;

                    vecB.set(0, 0, 0);
                    vecB[axes[a][2]] = v;

                    positions.push(vecA.x, vecA.y, vecA.z);
                    normals.push(vecB.x, vecB.y, vecB.z);
                }
            }

            for(var i = 0; i < segments; i++) {
                // sides
                indices.push(i, i + segments, (i + 1) % segments);
                indices.push(i + segments, (i + 1) % segments + segments, (i + 1) % segments);

                // lids
                indices.push(segments * 2, segments * 2 + i + 1, segments * 2 + (i + 1) % segments + 1);
                indices.push(segments * 3 + 1, segments * 3 + (i + 1) % segments + 2, segments * 3 + i + 2);
            }
            models['cylinder-' + a] = createModel({
                positions: positions,
                normals: normals,
                indices: indices,
                matDefault: materialDefault,
                matBehind: materialBehind,
                matOccluder: materialOccluder
            });
        }


        // ================
        // capsules
        for(var a in axes) {
            positions = [ ];
            indices = [ ];
            var segments = 32;

            for(var y = 1; y < segments / 2 + 1; y++) {
                for(var i = 0; i < segments; i++) {
                    var k = y;
                    if (y === Math.floor(segments / 4) || y === Math.floor(segments / 4) + 1)
                        k = Math.floor(segments / 4);
                    var l = Math.sin((k * (180 / (segments / 2)) + 90) * rad);
                    var c = Math.cos((k * (180 / (segments / 2)) + 90) * rad);
                    vecA[axes[a][0]] = Math.sin(360 / segments * i * rad) * Math.abs(c);
                    vecA[axes[a][1]] = Math.cos(360 / segments * i * rad) * Math.abs(c);
                    vecA[axes[a][2]] = l;
                    positions.push(vecA.x, vecA.y, vecA.z);
                    vecA.normalize();
                    positions.push(vecA.x, vecA.y, vecA.z);
                    positions.push(y < segments / 4 ? 1 : -1);
                }
            }

            vecA.set(0, 0, 0);
            vecA[axes[a][2]] = 1;
            // top
            positions.push(vecA.x, vecA.y, vecA.z);
            positions.push(vecA.x, vecA.y, vecA.z);
            positions.push(1);
            // bottom
            vecA.scale(-1);
            positions.push(vecA.x, vecA.y, vecA.z);
            positions.push(vecA.x, vecA.y, vecA.z);
            positions.push(-1);

            // sides
            for(var y = 0; y < segments / 2 - 1; y++) {
                for(var i = 0; i < segments; i++) {
                    indices.push(y * segments + i, (y + 1) * segments + i, y * segments + (i + 1) % segments);
                    indices.push((y + 1) * segments + i, (y + 1) * segments + (i + 1) % segments, y * segments + (i + 1) % segments);
                }
            }

            // lids
            for(var i = 0; i < segments; i++) {
                indices.push(i, (i + 1) % segments, (segments / 2) * segments);
                indices.push((segments / 2 - 1) * segments + i, (segments / 2) * segments + 1, (segments / 2 - 1) * segments + (i + 1) % segments);
            }

            var bufferVertex = new pc.VertexBuffer(app.graphicsDevice, vertexFormatAttr0, positions.length / 7);
            var dst = new Float32Array(bufferVertex.lock());
            dst.set(positions);
            bufferVertex.unlock();

            var bufferIndex = new pc.IndexBuffer(app.graphicsDevice, pc.INDEXFORMAT_UINT16, indices.length);
            var dst = new Uint16Array(bufferIndex.lock());
            dst.set(indices);
            bufferIndex.unlock();

            models['capsule-' + a] = createModel({
                vertices: bufferVertex,
                indices: bufferIndex,
                count: indices.length,
                matDefault: materials['capsule-' + a],
                matBehind: materials['capsuleBehind-' + a],
                matOccluder: materials['capsuleOcclude-' + a]
            });

            var meshInstance = models['capsule-' + a].meshInstances[0];
            // TODO
        }
    });

    var createModelCopy = function(resource, color) {
        var model = resource.clone();

        var meshesExtra = [ ];

        for(var i = 0; i < model.meshInstances.length; i++) {
            model.meshInstances[i].material = materialDefault.clone();
            model.meshInstances[i].material.updateShader = materialDefault.updateShader;
            model.meshInstances[i].material.color.set(color[0], color[1], color[2], alphaFront);
            model.meshInstances[i].material.update();
            // model.meshInstances[i].layer = 12;
            model.meshInstances[i].__editor = true;
            model.meshInstances[i].__collision = true;
            model.meshInstances[i].castShadow = false;
            // model.meshInstances[i].castLightmapShadow = false;
            model.meshInstances[i].receiveShadow = false;
            model.meshInstances[i].setParameter('offset', 0);
            // model.meshInstances[i].updateKey();

            var node = model.meshInstances[i].node;
            var mesh = model.meshInstances[i].mesh;

            var meshInstanceBehind = new pc.MeshInstance(node, mesh, materialBehind.clone());
            meshInstanceBehind.material.updateShader = materialBehind.updateShader;
            meshInstanceBehind.material.color.set(color[0], color[1], color[2], alphaBehind);
            meshInstanceBehind.material.update();
            meshInstanceBehind.setParameter('offset', 0);
            meshInstanceBehind.__editor = true;
            meshInstanceBehind.pick = false;
            // meshInstanceBehind.layer = 2;
            meshInstanceBehind.drawToDepth = false;
            meshInstanceBehind.castShadow = false;
            // meshInstanceBehind.castLightmapShadow = false;
            meshInstanceBehind.receiveShadow = false;
            // meshInstanceBehind.updateKey();
            meshInstanceBehind.__useFrontLayer = true;

            // meshInstanceOccluder
            var meshInstanceOccluder = new pc.MeshInstance(node, mesh, materialOccluder);
            meshInstanceOccluder.setParameter('offset', 0);
            meshInstanceOccluder.__editor = true;
            meshInstanceOccluder.pick = false;
            // meshInstanceOccluder.layer = 9;
            meshInstanceOccluder.castShadow = false;
            // meshInstanceOccluder.castLightmapShadow = false;
            meshInstanceOccluder.receiveShadow = false;
            // meshInstanceOccluder.updateKey();

            meshesExtra.push(meshInstanceBehind, meshInstanceOccluder);
        }

        model.meshInstances = model.meshInstances.concat(meshesExtra);

        return model;
    };

    editor.on('viewport:gizmoUpdate', function(dt) {
        for(var key in entities)
            entities[key].update();
    });
});
