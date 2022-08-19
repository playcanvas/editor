editor.once('load', function () {
    'use strict';

    let app;
    // selected entity gizmos
    const entities = { };
    let selected = { };
    // pool of gizmos
    const pool = [];
    // colors
    const alphaFront = 0.6;
    const alphaBehind = 0.2;
    const colorBehind = new pc.Color(1, 1, 1, 0.05);
    const colorPrimary = new pc.Color(1, 1, 1);
    const colorOccluder = new pc.Color(1, 1, 1, 1);
    const colorDefault = [1, 1, 1];
    let container;
    const vecA = new pc.Vec3();
    const vecB = new pc.Vec3();

    const materialDefault = new pc.BasicMaterial();
    materialDefault.name = 'collision';
    materialDefault.color = colorPrimary;
    materialDefault.blend = true;
    materialDefault.blendSrc = pc.BLENDMODE_SRC_ALPHA;
    materialDefault.blendDst = pc.BLENDMODE_ONE_MINUS_SRC_ALPHA;
    materialDefault.update();

    const materialBehind = new pc.BasicMaterial();
    materialBehind.name = 'collision behind';
    materialBehind.color = colorBehind;
    materialBehind.blend = true;
    materialBehind.blendSrc = pc.BLENDMODE_SRC_ALPHA;
    materialBehind.blendDst = pc.BLENDMODE_ONE_MINUS_SRC_ALPHA;
    materialBehind.depthWrite = false;
    materialBehind.depthTest = true;
    materialBehind.update();

    const materialOccluder = new pc.BasicMaterial();
    materialOccluder.name = 'collision occluder';
    materialOccluder.color = colorOccluder;
    materialOccluder.redWrite = false;
    materialOccluder.greenWrite = false;
    materialOccluder.blueWrite = false;
    materialOccluder.alphaWrite = false;
    materialOccluder.depthWrite = true;
    materialOccluder.depthTest = true;
    materialOccluder.update();

    const models = { };
    const materials = { };
    const poolModels = { 'box': [], 'sphere': [], 'capsule-x': [], 'capsule-y': [], 'capsule-z': [], 'cylinder-x': [], 'cylinder-y': [], 'cylinder-z': [], 'cone-x': [], 'cone-y': [], 'cone-z': [] };
    const axesNames = { 0: 'x', 1: 'y', 2: 'z' };
    const shaderCapsule = { };

    const layerFront = editor.call('gizmo:layers', 'Bright Collision');
    const layerBack = editor.call('gizmo:layers', 'Dim Gizmo');

    let visible = false;
    editor.method('gizmo:collision:visible', function (state) {
        if (state === undefined)
            return visible;

        if (visible === !!state)
            return;

        visible = !!state;

        if (visible) {
            editor.call('gizmo:zone:visible', false);
        }

        editor.emit('gizmo:collision:visible', visible);
        editor.call('viewport:render');
    });

    // gizmo class
    function Gizmo() {
        this._link = null;
        this.lines = [];
        this.events = [];
        this.type = '';
        this.asset = 0;
        this.entity = null;
        this.color = null;
    }

    // update lines
    Gizmo.prototype.update = function () {
        if (!app) return; // webgl not available

        if (!this._link || !this._link.entity)
            return;

        const select = selected[this._link.get('resource_id')];
        const collision = this._link.entity.collision;
        this.entity.enabled = this._link.entity.enabled && collision && collision.enabled && (select || visible);
        if (!this.entity.enabled) {
            this._link.entity.__noIcon = false;
            return;
        }

        this._link.entity.__noIcon = true;
        this.entity.setPosition(this._link.entity.getPosition());
        this.entity.setRotation(this._link.entity.getRotation());

        let type = collision.type;

        if (type === 'cylinder' || type === 'capsule' || type === 'cone') {
            type += '-' + axesNames[collision.axis];
        }

        if (this.type !== type) {
            this.type = type;

            if (!this.color) {
                let hash = 0;
                const string = this._link.entity.getGuid();
                for (let i = 0; i < string.length; i++)
                    hash += string.charCodeAt(i);

                this.color = editor.call('color:hsl2rgb', (hash % 128) / 128, 0.5, 0.5);
            }

            this.wireframeMesh = null;

            // set new model based on type
            if (models[this.type]) {
                // get current model
                let model = this.entity.model.model;
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

                if (!model) {
                    // no in pool
                    model = models[this.type].clone();
                    model._type = this.type;

                    const color = this.color || colorDefault;

                    let old = model.meshInstances[0].material;
                    model.meshInstances[0].setParameter('offset', 0);
                    // model.meshInstances[0].layer = 12;
                    // model.meshInstances[0].updateKey();
                    model.meshInstances[0].__editor = true;
                    model.meshInstances[0].__collision = true;
                    model.meshInstances[0].material = old.clone();
                    model.meshInstances[0].material.getShaderVariant = old.getShaderVariant;
                    model.meshInstances[0].material.depthBias = -8;
                    model.meshInstances[0].material.color.set(color[0], color[1], color[2], alphaFront);
                    model.meshInstances[0].material.update();

                    old = model.meshInstances[1].material;
                    model.meshInstances[1].setParameter('offset', 0.001);
                    // model.meshInstances[1].layer = 2;
                    model.meshInstances[1].pick = false;
                    // model.meshInstances[1].updateKey();
                    model.meshInstances[1].__editor = true;
                    model.meshInstances[1].material = old.clone();
                    model.meshInstances[1].material.getShaderVariant = old.getShaderVariant;
                    model.meshInstances[1].material.color.set(color[0], color[1], color[2], alphaBehind);
                    model.meshInstances[1].material.update();
                    model.meshInstances[1].__useFrontLayer = true;

                    model.meshInstances[2].setParameter('offset', 0);
                    // model.meshInstances[2].layer = 9;
                    model.meshInstances[2].pick = false;
                    // model.meshInstances[2].updateKey();
                    model.meshInstances[2].__editor = true;

                    switch (this.type) {
                        case 'capsule-x':
                        case 'capsule-y':
                        case 'capsule-z':
                            for (let i = 0; i < model.meshInstances.length; i++) {
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
                const isRender = !!collision.renderAsset;
                this.asset = isRender ? collision.renderAsset : collision.asset;
                this.entity.setLocalScale(this._link.entity.getWorldTransform().getScale());
                this.createWireframe(this.asset, isRender);
                if (!this.asset) {
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

        const radius = collision.radius || 0.00001;
        const height = collision.height || 0.00001;

        switch (this.type) {
            case 'sphere':
                this.entity.setLocalScale(radius, radius, radius);
                break;
            case 'box':
                this.entity.setLocalScale(collision.halfExtents.x || 0.00001, collision.halfExtents.y || 0.00001, collision.halfExtents.z || 0.00001);
                break;
            case 'cylinder-x':
            case 'cone-x':
            case 'capsule-x':
                this.entity.setLocalScale(height, radius, radius);
                break;
            case 'cylinder-y':
            case 'cone-y':
            case 'capsule-y':
                this.entity.setLocalScale(radius, height, radius);
                break;
            case 'cylinder-z':
            case 'cone-z':
            case 'capsule-z':
                this.entity.setLocalScale(radius, radius, height);
                break;
            case 'mesh':
                {
                    this.entity.setLocalScale(this._link.entity.getWorldTransform().getScale());

                    // if the asset has changed
                    const isRender = !!collision.renderAsset;
                    const asset = isRender ? collision.renderAsset : collision.asset;
                    if (asset !== this.asset) {

                        this.asset = asset;
                        this.createWireframe(this.asset, isRender);
                        if (!this.asset) {
                            this.entity.enabled = false;

                            if (isRender) {
                                this.entity.render.meshInstances = [];
                            } else {
                                this.entity.model.model = null;
                            }
                            return;
                        }
                    }

                    // when model collision mesh gets clicked on again, the mesh instance of the model is selected
                    // Note: render does not have an equivalent of this and so this is not implemented
                    if (this.entity.model.model) {
                        const picking = !visible && this._link.entity.model && this._link.entity.model.enabled && this._link.entity.model.type === 'asset' && this._link.entity.model.asset === collision.asset;
                        if (picking !== this.entity.model.model.__picking) {
                            this.entity.model.model.__picking = picking;

                            const meshes = this.entity.model.meshInstances;
                            for (let i = 0; i < meshes.length; i++) {
                                if (!meshes[i].__collision)
                                    continue;

                                meshes[i].pick = !picking;
                            }
                        }
                    }
                }
                break;
        }
    };
    // link to entity
    Gizmo.prototype.link = function (obj) {
        if (!app) return; // webgl not available

        this.unlink();
        this._link = obj;

        const self = this;

        this.events.push(this._link.once('destroy', function () {
            self.unlink();
        }));

        this.color = null;

        // hack: override addModelToLayers to selectively put some
        // mesh instances to the front and others to the back layer depending
        // on the __useFrontLayer property
        const customAddMeshInstancesToLayers = function () {
            const frontMeshInstances = this.meshInstances.filter(function (mi) {
                return mi.__useFrontLayer;
            });
            const backMeshInstances = this.meshInstances.filter(function (mi) {
                return !mi.__useFrontLayer;
            });

            layerBack.addMeshInstances(frontMeshInstances);
            layerFront.addMeshInstances(backMeshInstances);
        };

        this.entity = new pc.Entity();
        this.entity.__editor = true;

        // model component
        this.entity.addComponent('model', {
            castShadows: false,
            receiveShadows: false,
            castShadowsLightmap: false,
            layers: [layerFront.id, layerBack.id]
        });
        this.entity.model.addModelToLayers = customAddMeshInstancesToLayers;

        // render component
        this.entity.addComponent('render', {
            castShadows: false,
            receiveShadows: false,
            castShadowsLightmap: false,
            layers: [layerFront.id, layerBack.id]
        });
        this.entity.render.addToLayers = customAddMeshInstancesToLayers;

        this.entity._getEntity = function () {
            return self._link.entity;
        };

        container.addChild(this.entity);
    };

    // unlink
    Gizmo.prototype.unlink = function () {
        if (!app) return; // webgl not available

        if (!this._link)
            return;

        for (let i = 0; i < this.events.length; i++) {
            if (this.events[i] && this.events[i].unbind)
                this.events[i].unbind();
        }

        this.events = [];
        this._link = null;
        this.color = null;
        this.type = '';
        this.asset = 0;

        const model = this.entity.model.model;
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
    Gizmo.prototype.createWireframe = function (asset, isRender) {
        if (!app) return; // webgl not available

        asset = app.assets.get(asset);
        if (!asset)
            return null;

        if (asset.resource) {
            if (isRender) {
                this.entity.render.meshInstances = createRenderCopy(asset.resource, this.color);
            } else {
                this.entity.model.model = createModelCopy(asset.resource, this.color);
            }
        } else {
            const self = this;

            this.events.push(asset.once('load', function (asset) {
                if (self.asset !== asset.id)
                    return;

                if (isRender) {
                    this.entity.render.meshInstances = createRenderCopy(asset.resource, this.color);
                } else {
                    self.entity.model.model = createModelCopy(asset.resource, this.color);
                }
            }));
        }
    };

    editor.on('entities:add', function (entity) {
        const key = entity.get('resource_id');

        const addGizmo = function () {
            if (entities[key])
                return;

            let gizmo = pool.shift();
            if (!gizmo)
                gizmo = new Gizmo();

            gizmo.link(entity);
            entities[key] = gizmo;

            editor.call('viewport:render');
        };

        const removeGizmo = function () {
            if (!entities[key])
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

    editor.on('selector:change', function (type, items) {
        selected = { };

        if (type === 'entity' && items && items.length) {
            for (let i = 0; i < items.length; i++)
                selected[items[i].get('resource_id')] = true;
        }
    });

    editor.once('viewport:load', function () {
        app = editor.call('viewport:app');
        if (!app) return; // webgl not available

        container = new pc.Entity(app);
        app.root.addChild(container);

        // material
        const defaultVShader = `
attribute vec3 aPosition;
attribute vec3 aNormal;

uniform float offset;
uniform mat4 matrix_model;
uniform mat3 matrix_normal;
uniform mat4 matrix_view;
uniform mat4 matrix_viewProjection;

varying vec3 vNormal;
varying vec3 vPosition;

void main(void)
{
    vec4 posW = matrix_model * vec4(aPosition, 1.0);
    vNormal = normalize(matrix_normal * aNormal);
    posW += vec4(vNormal * offset, 0.0);
    gl_Position = matrix_viewProjection * posW;
    vPosition = posW.xyz;
}
            `.trim();
        const defaultFShader = `
precision ${app.graphicsDevice.precision} float;

varying vec3 vNormal;
varying vec3 vPosition;

uniform vec4 uColor;
uniform vec3 view_position;

void main(void)
{
    vec3 viewNormal = normalize(view_position - vPosition);
    float light = dot(vNormal, viewNormal);
    gl_FragColor = vec4(uColor.rgb * light * 2.0, uColor.a);
}
            `.trim();

        let shaderDefault;

        const origFunc = materialDefault.getShaderVariant;

        materialDefault.getShaderVariant = function (device, scene, objDefs, staticLightList, pass, sortedLights) {
            if (pass === pc.SHADER_FORWARD) {
                if (!shaderDefault) {
                    shaderDefault = new pc.Shader(device, {
                        attributes: {
                            aPosition: pc.SEMANTIC_POSITION,
                            aNormal: pc.SEMANTIC_NORMAL
                        },
                        vshader: defaultVShader,
                        fshader: defaultFShader
                    });
                }
                return shaderDefault;
            }
            return origFunc.call(this, device, scene, objDefs, staticLightList, pass, sortedLights);

        };
        materialDefault.update();

        materialBehind.getShaderVariant = materialDefault.getShaderVariant;
        materialOccluder.getShaderVariant = materialDefault.getShaderVariant;

        const capsuleVShader = `
attribute vec3 aPosition;
attribute vec3 aNormal;
attribute float aSide;

uniform float offset;
uniform mat4 matrix_model;
uniform mat3 matrix_normal;
uniform mat4 matrix_viewProjection;
uniform float radius;
uniform float height;

varying vec3 vNormal;
varying vec3 vPosition;

void main(void)
{
    vec3 pos = aPosition * radius;
    pos.{axis} += aSide * max(height / 2.0 - radius, 0.0);
    vec4 posW = matrix_model * vec4(pos, 1.0);
    vNormal = normalize(matrix_normal * aNormal);
    posW += vec4(vNormal * offset, 0.0);
    gl_Position = matrix_viewProjection * posW;
    vPosition = posW.xyz;
}
            `.trim();

        const capsuleFShader = `
precision ${app.graphicsDevice.precision} float;

varying vec3 vNormal;
varying vec3 vPosition;

uniform vec4 uColor;
uniform vec3 view_position;

void main(void)
{
    vec3 viewNormal = normalize(view_position - vPosition);
    float light = dot(vNormal, viewNormal);
    gl_FragColor = vec4(uColor.rgb * light * 2.0, uColor.a);
}
            `.trim();

        const capsuleVShaderPick = `
attribute vec3 aPosition;
attribute vec3 aNormal;
attribute float aSide;

uniform mat4 matrix_model;
uniform mat4 matrix_viewProjection;
uniform float radius;
uniform float height;

void main(void)
{
    vec3 pos = aPosition * radius;
    pos.{axis} += aSide * max(height / 2.0 - radius, 0.0);
    vec4 posW = matrix_model * vec4(pos, 1.0);
    gl_Position = matrix_viewProjection * posW;
}
            `.trim();

        const capsuleFShaderPick = `
precision ${app.graphicsDevice.precision} float;

uniform vec4 uColor;

void main(void)
{
    gl_FragColor = uColor;
}
            `.trim();

        const makeCapsuleMaterial = function (a) {
            const matDefault = materials['capsule-' + a] = materialDefault.clone();
            const _getShaderVariant = matDefault.getShaderVariant;
            matDefault.getShaderVariant = function (device, scene, objDefs, staticLightList, pass, sortedLights) {
                if (pass === pc.SHADER_FORWARD) {
                    if (!shaderCapsule[a]) {
                        shaderCapsule[a] = new pc.Shader(device, {
                            attributes: {
                                aPosition: pc.SEMANTIC_POSITION,
                                aNormal: pc.SEMANTIC_NORMAL,
                                aSide: pc.SEMANTIC_ATTR15
                            },
                            vshader: capsuleVShader.replace('{axis}', a),
                            fshader: capsuleFShader
                        });
                    }
                    return shaderCapsule[a];
                } else if (pass === pc.SHADER_PICK) {
                    const shaderName = 'pick-' + a;
                    if (!shaderCapsule[shaderName]) {
                        shaderCapsule[shaderName] = new pc.Shader(device, {
                            attributes: {
                                aPosition: pc.SEMANTIC_POSITION,
                                aNormal: pc.SEMANTIC_NORMAL,
                                aSide: pc.SEMANTIC_ATTR15
                            },
                            vshader: capsuleVShaderPick.replace('{axis}', a),
                            fshader: capsuleFShaderPick
                        });
                    }
                    return shaderCapsule[shaderName];
                }
                _getShaderVariant.call(this, device, scene, objDefs, staticLightList, pass, sortedLights);

            };

            matDefault.update();

            const matBehind = materials['capsuleBehind-' + a] = materialBehind.clone();
            matBehind.getShaderVariant = matDefault.getShaderVariant;
            matBehind.update();

            const matOccluder = materials['capsuleOcclude-' + a] = materialOccluder.clone();
            matOccluder.getShaderVariant = matDefault.getShaderVariant;
            matOccluder.update();
        };

        for (const key in axesNames)
            makeCapsuleMaterial(axesNames[key]);

        const rad = Math.PI / 180;

        const createModel = function (args) {
            let mesh;

            if (args.mesh) {
                mesh = args.mesh;
            } else if (args.vertices) {
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
            const node = new pc.GraphNode();
            // meshInstance
            const meshInstance = new pc.MeshInstance(node, mesh, args.matDefault);
            meshInstance.__editor = true;
            meshInstance.__collision = true;
            // meshInstance.layer = 12;
            meshInstance.castShadow = false;
            // meshInstance.castLightmapShadow = false;
            meshInstance.receiveShadow = false;
            // meshInstance.updateKey();
            // meshInstanceBehind
            const meshInstanceBehind = new pc.MeshInstance(node, mesh, args.matBehind);
            meshInstanceBehind.__editor = true;
            meshInstanceBehind.pick = false;
            // meshInstanceBehind.layer = 2;
            meshInstanceBehind.drawToDepth = false;
            meshInstanceBehind.castShadow = false;
            // meshInstanceBehind.castLightmapShadow = false;
            meshInstanceBehind.receiveShadow = false;
            // meshInstanceBehind.updateKey();
            // meshInstanceOccluder
            const meshInstanceOccluder = new pc.MeshInstance(node, mesh, args.matOccluder);
            meshInstanceOccluder.__editor = true;
            meshInstanceOccluder.pick = false;
            // meshInstanceOccluder.layer = 9;
            meshInstanceOccluder.castShadow = false;
            // meshInstanceOccluder.castLightmapShadow = false;
            meshInstanceOccluder.receiveShadow = false;
            // meshInstanceOccluder.updateKey();
            // model
            const model = new pc.Model();
            model.graph = node;
            model.meshInstances = [meshInstance, meshInstanceBehind, meshInstanceOccluder];

            return model;
        };


        // ================
        // box
        let positions = [
            1, 1, 1,   1, 1, -1,   -1, 1, -1,   -1, 1, 1, // top
            1, 1, 1,   -1, 1, 1,   -1, -1, 1,   1, -1, 1, // front
            1, 1, 1,   1, -1, 1,   1, -1, -1,   1, 1, -1, // right
            1, 1, -1,   1, -1, -1,   -1, -1, -1,   -1, 1, -1, // back
            -1, 1, 1,   -1, 1, -1,   -1, -1, -1,   -1, -1, 1, // left
            1, -1, 1,   -1, -1, 1,   -1, -1, -1,   1, -1, -1 // bottom
        ];
        let normals = [
            0, 1, 0,   0, 1, 0,   0, 1, 0,   0, 1, 0,
            0, 0, 1,   0, 0, 1,   0, 0, 1,   0, 0, 1,
            1, 0, 0,   1, 0, 0,   1, 0, 0,   1, 0, 0,
            0, 0, -1,   0, 0, -1,   0, 0, -1,   0, 0, -1,
            -1, 0, 0,   -1, 0, 0,   -1, 0, 0,   -1, 0, 0,
            0, -1, 0,   0, -1, 0,   0, -1, 0,   0, -1, 0
        ];
        let indices = [
            0, 1, 2, 2, 3, 0,
            4, 5, 6, 6, 7, 4,
            8, 9, 10, 10, 11, 8,
            12, 13, 14, 14, 15, 12,
            16, 17, 18, 18, 19, 16,
            20, 21, 22, 22, 23, 20
        ];
        models.box = createModel({
            positions: positions,
            normals: normals,
            indices: indices,
            matDefault: materialDefault,
            matBehind: materialBehind,
            matOccluder: materialOccluder
        });


        // ================
        // sphere
        const segments = 64;
        positions = [];
        normals = [];
        indices = [];

        for (let y = 1; y < segments / 2; y++) {
            for (let i = 0; i < segments; i++) {
                const l = Math.sin((y * (180 / (segments / 2)) + 90) * rad);
                const c = Math.cos((y * (180 / (segments / 2)) + 90) * rad);
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

        for (let y = 0; y < segments / 2 - 2; y++) {
            for (let i = 0; i < segments; i++) {
                indices.push(y * segments + i, (y + 1) * segments + i, y * segments + (i + 1) % segments);
                indices.push((y + 1) * segments + i, (y + 1) * segments + (i + 1) % segments, y * segments + (i + 1) % segments);
            }
        }

        for (let i = 0; i < segments; i++) {
            indices.push(i, (i + 1) % segments, (segments / 2 - 1) * segments);
            indices.push((segments / 2 - 2) * segments + i, (segments / 2 - 1) * segments + 1, (segments / 2 - 2) * segments + (i + 1) % segments);
        }

        models.sphere = createModel({
            positions: positions,
            normals: normals,
            indices: indices,
            matDefault: materialDefault,
            matBehind: materialBehind,
            matOccluder: materialOccluder
        });

        // ================
        // cones
        models['cone-x'] = createModel({
            mesh: pc.createCone(app.graphicsDevice),
            matDefault: materialDefault,
            matBehind: materialBehind,
            matOccluder: materialOccluder
        });
        models['cone-x'].graph.setLocalEulerAngles(0, 0, -90);
        models['cone-x'].graph.setLocalScale(2, 1, 2);
        models['cone-y'] = createModel({
            mesh: pc.createCone(app.graphicsDevice),
            matDefault: materialDefault,
            matBehind: materialBehind,
            matOccluder: materialOccluder
        });
        models['cone-y'].graph.setLocalScale(2, 1, 2);
        models['cone-z'] = createModel({
            mesh: pc.createCone(app.graphicsDevice),
            matDefault: materialDefault,
            matBehind: materialBehind,
            matOccluder: materialOccluder
        });
        models['cone-z'].graph.setLocalEulerAngles(90, 0, 0);
        models['cone-z'].graph.setLocalScale(2, 1, 2);

        // ================
        // cylinders
        const axes = {
            'x': ['z', 'y', 'x'],
            'y': ['x', 'z', 'y'],
            'z': ['y', 'x', 'z']
        };
        for (const a in axes) {
            positions = [];
            indices = [];
            normals = [];
            const segments = 72;

            // side
            for (let v = 1; v >= -1; v -= 2) {
                for (let i = 0; i < segments; i++) {
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
            for (let v = 1; v >= -1; v -= 2) {
                vecA.set(0, 0, 0);
                vecA[axes[a][2]] = v;
                positions.push(vecA.x * 0.5, vecA.y * 0.5, vecA.z * 0.5);
                normals.push(vecA.x, vecA.y, vecA.z);

                for (let i = 0; i < segments; i++) {
                    vecA[axes[a][0]] = Math.sin(360 / segments * i * rad);
                    vecA[axes[a][1]] = Math.cos(360 / segments * i * rad);
                    vecA[axes[a][2]] = v * 0.5;

                    vecB.set(0, 0, 0);
                    vecB[axes[a][2]] = v;

                    positions.push(vecA.x, vecA.y, vecA.z);
                    normals.push(vecB.x, vecB.y, vecB.z);
                }
            }

            for (let i = 0; i < segments; i++) {
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

        models['capsule-x'] = createModel({
            mesh: pc.createCapsule(app.graphicsDevice, {
                height: 2.0,
                radius: 0.5
            }),
            matDefault: materialDefault,
            matBehind: materialBehind,
            matOccluder: materialOccluder
        });
        models['capsule-x'].graph.setLocalEulerAngles(0.0, 0.0, -90.0);
        models['capsule-x'].graph.setLocalScale(2.0, 0.5, 2.0);

        models['capsule-y'] = createModel({
            mesh: pc.createCapsule(app.graphicsDevice, {
                height: 2.0,
                radius: 0.5
            }),
            matDefault: materialDefault,
            matBehind: materialBehind,
            matOccluder: materialOccluder
        });
        models['capsule-y'].graph.setLocalScale(2.0, 0.5, 2.0);

        models['capsule-z'] = createModel({
            mesh: pc.createCapsule(app.graphicsDevice, {
                height: 2.0,
                radius: 0.5
            }),
            matDefault: materialDefault,
            matBehind: materialBehind,
            matOccluder: materialOccluder
        });
        models['capsule-z'].graph.setLocalEulerAngles(90.0, 0.0, 0.0);
        models['capsule-z'].graph.setLocalScale(2.0, 0.5, 2.0);
    });

    // prepares mesh instances to be rendered as collision meshes
    var prepareMeshInstances = function (meshInstances, color) {

        const meshesExtra = [];

        for (let i = 0; i < meshInstances.length; i++) {

            // clone original instance and set it up
            meshInstances[i].material = materialDefault.clone();
            meshInstances[i].material.getShaderVariant = materialDefault.getShaderVariant;
            meshInstances[i].material.color.set(color[0], color[1], color[2], alphaFront);
            meshInstances[i].material.update();
            meshInstances[i].__editor = true;
            meshInstances[i].__collision = true;
            meshInstances[i].castShadow = false;
            meshInstances[i].receiveShadow = false;
            meshInstances[i].setParameter('offset', 0);

            const node = meshInstances[i].node;
            const mesh = meshInstances[i].mesh;

            // additional instance for behind the mesh
            const meshInstanceBehind = new pc.MeshInstance(mesh, materialBehind.clone(), node);
            meshInstanceBehind.material.getShaderVariant = materialBehind.getShaderVariant;
            meshInstanceBehind.material.color.set(color[0], color[1], color[2], alphaBehind);
            meshInstanceBehind.material.update();
            meshInstanceBehind.setParameter('offset', 0);
            meshInstanceBehind.__editor = true;
            meshInstanceBehind.pick = false;
            meshInstanceBehind.drawToDepth = false;
            meshInstanceBehind.castShadow = false;
            meshInstanceBehind.receiveShadow = false;
            meshInstanceBehind.__useFrontLayer = true;

            // additional instance for meshInstanceOccluder
            const meshInstanceOccluder = new pc.MeshInstance(mesh, materialOccluder, node);
            meshInstanceOccluder.setParameter('offset', 0);
            meshInstanceOccluder.__editor = true;
            meshInstanceOccluder.pick = false;
            meshInstanceOccluder.castShadow = false;
            meshInstanceOccluder.receiveShadow = false;

            meshesExtra.push(meshInstanceBehind, meshInstanceOccluder);
        }

        return meshInstances.concat(meshesExtra);
    };

    // returns an array of meshInstances
    var createRenderCopy = function (resource, color) {
        let meshInstances = [];
        const meshes = resource.meshes;
        for (let i = 0; i < meshes.length; i++) {
            const material = materialDefault.clone();
            const meshInstance = new pc.MeshInstance(meshes[i], material);
            meshInstances.push(meshInstance);
        }

        meshInstances = prepareMeshInstances(meshInstances, color);
        return meshInstances;
    };

    var createModelCopy = function (resource, color) {
        const model = resource.clone();
        const meshInstances = prepareMeshInstances(model.meshInstances, color);
        model.meshInstances = meshInstances;
        return model;
    };

    editor.on('viewport:gizmoUpdate', function (dt) {
        for (const key in entities)
            entities[key].update();
    });
});
