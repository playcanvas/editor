import { GIZMO_MASK } from '@/core/constants';

import { cloneColorMaterial, createColorMaterial } from '../viewport-color-material';

editor.once('load', () => {
    let app;
    let container;
    let selected = {};

    const entities: Record<string, Gizmo> = {};
    const pool = [];

    const alphaFront = 0.6;
    const alphaBehind = 0.2;
    const colorBehind = new pc.Color(1, 1, 1, 0.05);
    const colorPrimary = new pc.Color(1, 1, 1);
    const colorOccluder = new pc.Color(1, 1, 1, 1);
    const colorDefault = [1, 1, 1];

    const materialDefault = createColorMaterial();
    materialDefault.name = 'collision';
    materialDefault.color = colorPrimary;
    materialDefault.blendState = new pc.BlendState(true, pc.BLENDEQUATION_ADD, pc.BLENDMODE_SRC_ALPHA, pc.BLENDMODE_ONE_MINUS_SRC_ALPHA);
    materialDefault.update();

    const materialBehind = createColorMaterial();
    materialBehind.name = 'collision behind';
    materialBehind.color = colorBehind;
    materialBehind.blendState = new pc.BlendState(true, pc.BLENDEQUATION_ADD, pc.BLENDMODE_SRC_ALPHA, pc.BLENDMODE_ONE_MINUS_SRC_ALPHA);
    materialBehind.depthWrite = false;
    materialBehind.depthTest = true;
    materialBehind.update();

    const materialOccluder = createColorMaterial();
    materialOccluder.name = 'collision occluder';
    materialOccluder.color = colorOccluder;
    materialOccluder.redWrite = false;
    materialOccluder.greenWrite = false;
    materialOccluder.blueWrite = false;
    materialOccluder.alphaWrite = false;
    materialOccluder.depthWrite = true;
    materialOccluder.depthTest = true;
    materialOccluder.update();

    const models = {};
    const materials = {};
    const shaderCapsule = {};
    const axesNames = { 0: 'x', 1: 'y', 2: 'z' };
    const poolModels = {
        'box': [], 'sphere': [],
        'capsule-x': [], 'capsule-y': [], 'capsule-z': [],
        'cylinder-x': [], 'cylinder-y': [], 'cylinder-z': [],
        'cone-x': [], 'cone-y': [], 'cone-z': []
    };

    const layerFront = editor.call('gizmo:layers', 'Bright Collision');
    const layerBack = editor.call('gizmo:layers', 'Dim Gizmo');

    let visible = false;
    editor.method('gizmo:collision:visible', (state) => {
        if (state === undefined) {
            return visible;
        }

        const newState = !!state;
        if (visible === newState) {
            return;
        }

        visible = newState;
        if (visible) {
            editor.call('gizmo:zone:visible', false);
        }

        editor.emit('gizmo:collision:visible', visible);
        editor.call('viewport:render');
    });

    class Gizmo {
        _link: any = null;
        entity: any = null;
        color: any = null;
        wireframeMesh: any = null;
        events: any[] = [];
        type = '';
        asset = 0;

        update() {
            if (!app || !this._link?.entity) {
                return;
            }

            const select = selected[this._link.get('resource_id')];
            const { collision } = this._link.entity;
            this.entity.enabled = this._link.entity.enabled && collision?.enabled && (select || visible);
            if (!this.entity.enabled) {
                this._link.entity.__noIcon = false;
                return;
            }

            this._link.entity.__noIcon = true;
            this.entity.setPosition(collision.getShapePosition());
            this.entity.setRotation(collision.getShapeRotation());

            let type = collision.type;
            if (type === 'cylinder' || type === 'capsule' || type === 'cone') {
                type += `-${axesNames[collision.axis]}`;
            }

            if (this.type !== type) {
                this.type = type;

                if (!this.color) {
                    const guid = this._link.entity.getGuid();
                    let hash = 0;
                    for (const char of guid) {
                        hash += char.charCodeAt(0);
                    }
                    this.color = editor.call('color:hsl2rgb', (hash % 128) / 128, 0.5, 0.5);
                }

                this.wireframeMesh = null;

                if (models[this.type]) {
                    // return current model to pool
                    let model = this.entity.model.model;
                    if (model) {
                        layerFront.removeMeshInstances(model.meshInstances);
                        layerBack.removeMeshInstances(model.meshInstances);
                        this.entity.removeChild(model.getGraph());
                        poolModels[model._type]?.push(model);
                    }

                    // get from pool or clone
                    model = poolModels[this.type]?.shift();
                    if (!model) {
                        model = models[this.type].clone();
                        model._type = this.type;

                        const color = this.color ?? colorDefault;
                        const colorArray = new Float32Array([color[0], color[1], color[2], alphaFront]);

                        // setup front mesh instance
                        const mi0 = model.meshInstances[0];
                        const mat0 = mi0.material.clone();
                        mat0.getShaderVariant = mi0.material.getShaderVariant;
                        mat0.depthBias = -8;
                        mat0.setParameter('uColor', colorArray);
                        mat0.update();
                        mi0.material = mat0;
                        mi0.setParameter('offset', 0);
                        mi0.__editor = true;
                        mi0.__collision = true;

                        // setup behind mesh instance
                        const mi1 = model.meshInstances[1];
                        const mat1 = mi1.material.clone();
                        mat1.getShaderVariant = mi1.material.getShaderVariant;
                        mat1.setParameter('uColor', colorArray);
                        mat1.update();
                        mi1.material = mat1;
                        mi1.setParameter('offset', 0.001);
                        mi1.pick = false;
                        mi1.__editor = true;
                        mi1.__useFrontLayer = true;

                        // setup occluder mesh instance
                        const mi2 = model.meshInstances[2];
                        mi2.setParameter('offset', 0);
                        mi2.pick = false;
                        mi2.__editor = true;

                        // set capsule-specific parameters
                        if (this.type.startsWith('capsule-')) {
                            for (const mi of model.meshInstances) {
                                mi.setParameter('radius', collision.radius || 0.5);
                                mi.setParameter('height', collision.height || 2);
                            }
                        }
                    }

                    this.entity.model.model = model;

                    // set masks after model is assigned
                    for (const mi of model.meshInstances) {
                        mi.mask = GIZMO_MASK;
                    }

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
                    this.entity.setLocalScale(
                        collision.halfExtents.x || 0.00001,
                        collision.halfExtents.y || 0.00001,
                        collision.halfExtents.z || 0.00001
                    );
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
                case 'mesh': {
                    this.entity.setLocalScale(this._link.entity.getWorldTransform().getScale());

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

                    // when model collision mesh gets clicked on again, select the mesh instance
                    // Note: render does not have an equivalent of this
                    if (this.entity.model.model) {
                        const { model: entityModel } = this._link.entity;
                        const picking = !visible && entityModel?.enabled && entityModel.type === 'asset' && entityModel.asset === collision.asset;
                        if (picking !== this.entity.model.model.__picking) {
                            this.entity.model.model.__picking = picking;
                            for (const mesh of this.entity.model.meshInstances) {
                                if (mesh.__collision) {
                                    mesh.pick = !picking;
                                }
                            }
                        }
                    }
                    break;
                }
            }
        }

        // link to entity
        link(obj) {
            if (!app) {
                return;
            }

            this.unlink();
            this._link = obj;

            this.events.push(this._link.once('destroy', () => {
                this.unlink();
            }));

            this.color = null;

            // override addModelToLayers to selectively put some mesh instances
            // to the front and others to the back layer depending on __useFrontLayer
            const customAddMeshInstancesToLayers = function () {
                const frontMeshInstances = this.meshInstances.filter(mi => mi.__useFrontLayer);
                const backMeshInstances = this.meshInstances.filter(mi => !mi.__useFrontLayer);

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

            this.entity._getEntity = () => this._link.entity;

            container.addChild(this.entity);
        }

        unlink() {
            if (!app || !this._link) {
                return;
            }

            for (const event of this.events) {
                event?.unbind?.();
            }

            this.events = [];
            this._link = null;
            this.color = null;
            this.type = '';
            this.asset = 0;

            const model = this.entity.model.model;
            if (model) {
                layerFront.removeMeshInstances(model.meshInstances);
                layerBack.removeMeshInstances(model.meshInstances);
                this.entity.removeChild(model.getGraph());
                if (model._type) {
                    poolModels[model._type].push(model);
                }
            }

            this.entity.destroy();
        }

        createWireframe(assetId, isRender) {
            if (!app) {
                return;
            }

            const asset = app.assets.get(assetId);
            if (!asset) {
                return null;
            }

            if (asset.resource) {
                if (isRender) {
                    this.entity.render.meshInstances = createRenderCopy(asset.resource, this.color);
                } else {
                    this.entity.model.model = createModelCopy(asset.resource, this.color);
                }
            } else {
                this.events.push(asset.once('load', (loadedAsset) => {
                    if (this.asset !== loadedAsset.id) {
                        return;
                    }

                    if (isRender) {
                        this.entity.render.meshInstances = createRenderCopy(loadedAsset.resource, this.color);
                    } else {
                        this.entity.model.model = createModelCopy(loadedAsset.resource, this.color);
                    }
                }));
            }
        }
    }

    editor.on('entities:add', (entity) => {
        const key = entity.get('resource_id');

        const addGizmo = () => {
            if (entities[key]) {
                return;
            }

            const gizmo = pool.shift() ?? new Gizmo();
            gizmo.link(entity);
            entities[key] = gizmo;

            editor.call('viewport:render');
        };

        const removeGizmo = () => {
            if (!entities[key]) {
                return;
            }

            pool.push(entities[key]);
            entities[key].unlink();
            delete entities[key];

            editor.call('viewport:render');
        };

        if (entity.has('components.collision')) {
            addGizmo();
        }

        entity.on('components.collision:set', addGizmo);
        entity.on('components.collision:unset', removeGizmo);
        entity.on('destroy', removeGizmo);
    });

    editor.on('selector:change', (type, items) => {
        selected = {};

        if (type === 'entity' && items?.length) {
            for (const item of items) {
                selected[item.get('resource_id')] = true;
            }
        }
    });

    editor.once('viewport:load', (application) => {
        app = application;

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

        materialDefault.getShaderVariant = function (params) {
            if (params.pass === pc.SHADER_FORWARD) {
                if (!shaderDefault) {
                    shaderDefault = new pc.Shader(params.device, {
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
            return origFunc.call(this, params);

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

        const makeCapsuleMaterial = (axis) => {
            const matDefault = materials[`capsule-${axis}`] = cloneColorMaterial(materialDefault);
            const _getShaderVariant = matDefault.getShaderVariant;
            matDefault.getShaderVariant = function (params) {
                if (params.pass === pc.SHADER_FORWARD) {
                    if (!shaderCapsule[axis]) {
                        shaderCapsule[axis] = new pc.Shader(params.device, {
                            attributes: {
                                aPosition: pc.SEMANTIC_POSITION,
                                aNormal: pc.SEMANTIC_NORMAL,
                                aSide: pc.SEMANTIC_ATTR15
                            },
                            vshader: capsuleVShader.replace('{axis}', axis),
                            fshader: capsuleFShader
                        });
                    }
                    return shaderCapsule[axis];
                }
                if (params.pass === pc.SHADER_PICK) {
                    const shaderName = `pick-${axis}`;
                    if (!shaderCapsule[shaderName]) {
                        shaderCapsule[shaderName] = new pc.Shader(params.device, {
                            attributes: {
                                aPosition: pc.SEMANTIC_POSITION,
                                aNormal: pc.SEMANTIC_NORMAL,
                                aSide: pc.SEMANTIC_ATTR15
                            },
                            vshader: capsuleVShaderPick.replace('{axis}', axis),
                            fshader: capsuleFShaderPick
                        });
                    }
                    return shaderCapsule[shaderName];
                }
                return _getShaderVariant.call(this, params);
            };

            matDefault.update();

            const matBehind = materials[`capsuleBehind-${axis}`] = materialBehind.clone();
            matBehind.getShaderVariant = matDefault.getShaderVariant;
            matBehind.update();

            const matOccluder = materials[`capsuleOcclude-${axis}`] = materialOccluder.clone();
            matOccluder.getShaderVariant = matDefault.getShaderVariant;
            matOccluder.update();
        };

        for (const axis of Object.values(axesNames)) {
            makeCapsuleMaterial(axis);
        }

        const createModel = (args) => {
            const { mesh, matDefault, matBehind, matOccluder } = args;
            const node = new pc.GraphNode();

            const meshInstance = new pc.MeshInstance(mesh, matDefault, node);
            meshInstance.__editor = true;
            meshInstance.__collision = true;
            meshInstance.castShadow = false;
            meshInstance.receiveShadow = false;

            const meshInstanceBehind = new pc.MeshInstance(mesh, matBehind, node);
            meshInstanceBehind.__editor = true;
            meshInstanceBehind.pick = false;
            meshInstanceBehind.drawToDepth = false;
            meshInstanceBehind.castShadow = false;
            meshInstanceBehind.receiveShadow = false;

            const meshInstanceOccluder = new pc.MeshInstance(mesh, matOccluder, node);
            meshInstanceOccluder.__editor = true;
            meshInstanceOccluder.pick = false;
            meshInstanceOccluder.castShadow = false;
            meshInstanceOccluder.receiveShadow = false;

            const model = new pc.Model();
            model.graph = node;
            model.meshInstances = [meshInstance, meshInstanceBehind, meshInstanceOccluder];

            return model;
        };


        // ================
        // box
        models.box = createModel({
            mesh: pc.Mesh.fromGeometry(app.graphicsDevice, new pc.BoxGeometry({
                halfExtents: new pc.Vec3(1, 1, 1)
            })),
            matDefault: materialDefault,
            matBehind: materialBehind,
            matOccluder: materialOccluder
        });


        // ================
        // sphere
        models.sphere = createModel({
            mesh: pc.Mesh.fromGeometry(app.graphicsDevice, new pc.SphereGeometry({
                radius: 1,
                latitudeBands: 32,
                longitudeBands: 64
            })),
            matDefault: materialDefault,
            matBehind: materialBehind,
            matOccluder: materialOccluder
        });

        // ================
        // cones
        models['cone-x'] = createModel({
            mesh: pc.Mesh.fromGeometry(app.graphicsDevice, new pc.ConeGeometry()),
            matDefault: materialDefault,
            matBehind: materialBehind,
            matOccluder: materialOccluder
        });
        models['cone-x'].graph.setLocalEulerAngles(0, 0, -90);
        models['cone-x'].graph.setLocalScale(2, 1, 2);
        models['cone-y'] = createModel({
            mesh: pc.Mesh.fromGeometry(app.graphicsDevice, new pc.ConeGeometry()),
            matDefault: materialDefault,
            matBehind: materialBehind,
            matOccluder: materialOccluder
        });
        models['cone-y'].graph.setLocalScale(2, 1, 2);
        models['cone-z'] = createModel({
            mesh: pc.Mesh.fromGeometry(app.graphicsDevice, new pc.ConeGeometry()),
            matDefault: materialDefault,
            matBehind: materialBehind,
            matOccluder: materialOccluder
        });
        models['cone-z'].graph.setLocalEulerAngles(90, 0, 0);
        models['cone-z'].graph.setLocalScale(2, 1, 2);

        // ================
        // cylinders
        models['cylinder-x'] = createModel({
            mesh: pc.Mesh.fromGeometry(app.graphicsDevice, new pc.CylinderGeometry({
                radius: 1,
                height: 1,
                capSegments: 72
            })),
            matDefault: materialDefault,
            matBehind: materialBehind,
            matOccluder: materialOccluder
        });
        models['cylinder-x'].graph.setLocalEulerAngles(0, 0, -90);
        models['cylinder-y'] = createModel({
            mesh: pc.Mesh.fromGeometry(app.graphicsDevice, new pc.CylinderGeometry({
                radius: 1,
                height: 1,
                capSegments: 72
            })),
            matDefault: materialDefault,
            matBehind: materialBehind,
            matOccluder: materialOccluder
        });
        models['cylinder-z'] = createModel({
            mesh: pc.Mesh.fromGeometry(app.graphicsDevice, new pc.CylinderGeometry({
                radius: 1,
                height: 1,
                capSegments: 72
            })),
            matDefault: materialDefault,
            matBehind: materialBehind,
            matOccluder: materialOccluder
        });
        models['cylinder-z'].graph.setLocalEulerAngles(90, 0, 0);

        // ================
        // capsules

        models['capsule-x'] = createModel({
            mesh: pc.Mesh.fromGeometry(app.graphicsDevice, new pc.CapsuleGeometry({
                height: 2.0,
                radius: 0.5
            })),
            matDefault: materialDefault,
            matBehind: materialBehind,
            matOccluder: materialOccluder
        });
        models['capsule-x'].graph.setLocalEulerAngles(0.0, 0.0, -90.0);
        models['capsule-x'].graph.setLocalScale(2.0, 0.5, 2.0);

        models['capsule-y'] = createModel({
            mesh: pc.Mesh.fromGeometry(app.graphicsDevice, new pc.CapsuleGeometry({
                height: 2.0,
                radius: 0.5
            })),
            matDefault: materialDefault,
            matBehind: materialBehind,
            matOccluder: materialOccluder
        });
        models['capsule-y'].graph.setLocalScale(2.0, 0.5, 2.0);

        models['capsule-z'] = createModel({
            mesh: pc.Mesh.fromGeometry(app.graphicsDevice, new pc.CapsuleGeometry({
                height: 2.0,
                radius: 0.5
            })),
            matDefault: materialDefault,
            matBehind: materialBehind,
            matOccluder: materialOccluder
        });
        models['capsule-z'].graph.setLocalEulerAngles(90.0, 0.0, 0.0);
        models['capsule-z'].graph.setLocalScale(2.0, 0.5, 2.0);
    });

    // prepares mesh instances to be rendered as collision meshes
    const prepareMeshInstances = (meshInstances, color) => {
        const meshesExtra = [];

        for (const mi of meshInstances) {
            // clone original instance and set it up
            mi.material = cloneColorMaterial(materialDefault);
            mi.material.getShaderVariant = materialDefault.getShaderVariant;
            mi.material.color = new pc.Color(color[0], color[1], color[2], alphaFront);
            mi.material.update();
            mi.__editor = true;
            mi.__collision = true;
            mi.castShadow = false;
            mi.receiveShadow = false;
            mi.setParameter('offset', 0);

            const { node, mesh } = mi;

            // additional instance for behind the mesh
            const meshInstanceBehind = new pc.MeshInstance(mesh, cloneColorMaterial(materialBehind), node);
            meshInstanceBehind.material.getShaderVariant = materialBehind.getShaderVariant;
            meshInstanceBehind.material.color = new pc.Color(color[0], color[1], color[2], alphaBehind);
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
    const createRenderCopy = (resource, color) => {
        let meshInstances = resource.meshes.map((mesh) => {
            return new pc.MeshInstance(mesh, cloneColorMaterial(materialDefault));
        });
        meshInstances = prepareMeshInstances(meshInstances, color);
        return meshInstances;
    };

    const createModelCopy = (resource, color) => {
        const model = resource.clone();
        model.meshInstances = prepareMeshInstances(model.meshInstances, color);
        return model;
    };

    editor.on('viewport:gizmoUpdate', () => {
        for (const gizmo of Object.values(entities)) {
            gizmo.update();
        }
    });
});
