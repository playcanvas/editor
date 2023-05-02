editor.once('load', function () {
    let app;
    let visible = false;

    let immediateRenderOptions;

    const layerFront = editor.call('gizmo:layers', 'Bright Collision');
    const layerBack = editor.call('gizmo:layers', 'Dim Gizmo');

    const filterPicker = function (drawCall) {
        if (drawCall.command)
            return true;

        return (drawCall.__editor && drawCall.__zone) || drawCall.layer === pc.LAYER_GIZMO;
    };

    // hack: override addModelToLayers to selectively put some
    // mesh instances to the front and others to the back layer depending
    // on the __useFrontLayer property
    const addModelToLayers = function () {
        const backMeshInstances = this.meshInstances.filter(function (mi) {
            return !mi.__useFrontLayer;
        });

        layerFront.addMeshInstances(backMeshInstances);
    };

    editor.method('gizmo:zone:visible', function (state) {
        if (state === undefined)
            return visible;

        if (visible === !!state)
            return;

        visible = state;

        if (visible) {
            editor.call('gizmo:collision:visible', false);
            editor.call('viewport:pick:filter', filterPicker);
        } else {
            editor.call('viewport:pick:filter', null);
        }

        editor.emit('gizmo:zone:visible', visible);
        editor.call('viewport:render');
    });

    editor.once('viewport:load', function () {
        app = editor.call('viewport:app');
        if (!app) return; // webgl not available

        const container = new pc.Entity();
        container.name = 'zones';
        container.__editor = true;
        app.root.addChild(container);

        // entity gizmos
        const entities = { };
        let selected = { };

        // pool of gizmos
        const pool = [];
        const models = { };
        const poolModels = {
            'box': []
        };
        let zones = 0;
        let lastZone = null;
        const historyPosition = new pc.Vec3();
        const historySize = new pc.Vec3();
        let points = [];
        let hoverPoint = null;
        let dragPoint = null;
        let dragLength = 0;
        const dragPos = new pc.Vec3();
        let dragGizmoType = '';
        let events = [];

        const vecA = new pc.Vec3();
        const vecB = new pc.Vec3();
        const vecC = new pc.Vec3();
        const vecD = new pc.Vec3();
        const quatA = new pc.Quat();
        const quatB = new pc.Quat();
        const quatC = new pc.Quat();

        const axesInd = { 'x': 0, 'y': 1, 'z': 2 };
        const axes = ['z', 'x', 'z', 'x', 'y', 'y'];
        const direction = [-1, 1, 1, -1, 1, -1];
        const eulers = [
            [-90, 0, 0], // front
            [90, 90, 0], // right
            [90, 0, 0], // back
            [90, -90, 0], // left
            [0, 0, 0], // top
            [180, 0, 0]  // bottom
        ];
        const scales = [
            ['x', 'y'], // front
            ['z', 'y'], // right
            ['x', 'y'], // back
            ['z', 'y'], // left
            ['x', 'z'], // top
            ['x', 'z']  // bottom
        ];
        const materials = [
            new pc.Color(0, 0, 1),
            new pc.Color(1, 0, 0),
            new pc.Color(0, 0, 1),
            new pc.Color(1, 0, 0),
            new pc.Color(0, 1, 0),
            new pc.Color(0, 1, 0)
        ];
        for (let i = 0; i < materials.length; i++) {
            const color = materials[i];
            materials[i] = new pc.BasicMaterial();
            materials[i].color = color;
            materials[i].update();
        }

        const alphaFront = 0.6;
        const alphaBehind = 0.1;
        const colorDefault = [1, 1, 1];
        const colorPrimary = new pc.Color(1, 1, 1, alphaFront);
        const colorBehind = new pc.Color(1, 1, 1, alphaBehind);
        const colorOccluder = new pc.Color(1, 1, 1, 1);

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
    float light = abs(dot(vNormal, viewNormal));
    gl_FragColor = vec4(uColor.rgb * light * 2.0, uColor.a);
}
            `.trim();

        let shaderDefault;
        const materialDefault = new pc.BasicMaterial();
        materialDefault.updateShader = function (device) {
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

            this.shader = shaderDefault;
        };
        materialDefault.cull = pc.CULLFACE_NONE;
        materialDefault.color = colorPrimary;
        materialDefault.blendState = new pc.BlendState(true, pc.BLENDEQUATION_ADD, pc.BLENDMODE_SRC_ALPHA, pc.BLENDMODE_ONE_MINUS_SRC_ALPHA);
        materialDefault.update();

        const materialBehind = new pc.BasicMaterial();
        materialBehind.updateShader = materialDefault.updateShader;
        materialBehind.color = colorBehind;
        materialBehind.blendState = new pc.BlendState(true, pc.BLENDEQUATION_ADD, pc.BLENDMODE_SRC_ALPHA, pc.BLENDMODE_ONE_MINUS_SRC_ALPHA);
        materialBehind.depthWrite = false;
        materialBehind.depthTest = true;
        materialBehind.cull = pc.CULLFACE_NONE;
        materialBehind.update();

        const materialOccluder = new pc.BasicMaterial();
        materialOccluder.color = colorOccluder;
        materialOccluder.redWrite = false;
        materialOccluder.greenWrite = false;
        materialOccluder.blueWrite = false;
        materialOccluder.alphaWrite = false;
        materialOccluder.depthWrite = true;
        materialOccluder.depthTest = true;
        materialOccluder.cull = pc.CULLFACE_NONE;
        materialOccluder.update();

        const materialWireframe = new pc.BasicMaterial();
        materialWireframe.color = new pc.Color(1, 1, 1, 0.4);
        materialWireframe.depthWrite = false;
        materialWireframe.depthTest = false;
        materialWireframe.update();

        const materialPlaneBehind = new pc.BasicMaterial();
        materialPlaneBehind.color = new pc.Color(1, 1, 1, 0.4);
        materialPlaneBehind.blendState = new pc.BlendState(true, pc.BLENDEQUATION_ADD, pc.BLENDMODE_SRC_ALPHA, pc.BLENDMODE_ONE_MINUS_SRC_ALPHA);
        materialPlaneBehind.cull = pc.CULLFACE_NONE;
        materialPlaneBehind.update();

        const materialPlane = new pc.BasicMaterial();
        materialPlane.color = new pc.Color(1, 1, 1, 0.1);
        materialPlane.blendState = new pc.BlendState(true, pc.BLENDEQUATION_ADD, pc.BLENDMODE_SRC_ALPHA, pc.BLENDMODE_ONE_MINUS_SRC_ALPHA);
        materialPlane.depthTest = false;
        materialPlane.cull = pc.CULLFACE_NONE;
        materialPlane.update();

        const handleHighlightMaterial = new pc.BasicMaterial();
        handleHighlightMaterial.color = new pc.Color(1, 1, 1, 0.1);
        handleHighlightMaterial.update();

        const plane = new pc.Entity();
        plane.enabled = false;
        plane.__editor = true;
        plane.addComponent('model', {
            type: 'plane',
            receiveShadows: false,
            castShadowsLightmap: false,
            castShadows: false,
            layers: [layerBack.id, layerFront.id]
        });
        plane.model.addModelToLayers = addModelToLayers;

        const instance = plane.model.meshInstances[0];
        instance.material = materialPlane;
        const instanceBehind = new pc.MeshInstance(instance.node, instance.mesh, materialPlaneBehind);
        plane.model.meshInstances.push(instanceBehind);
        instanceBehind.__useFrontLayer = true;

        immediateRenderOptions = {
            layer: editor.call('gizmo:layers', 'Axis Gizmo Immediate')
        };

        // gizmo class
        function Gizmo() {
            this._link = null;
            this.events = [];
            this.entity = null;
            this.type = '';
            this.color = null;
        }

        // update lines
        Gizmo.prototype.update = function () {
            if (!this._link || !this._link.entity)
                return;

            const zone = this._link.entity.zone;
            const select = selected[this._link.get('resource_id')] === this._link;

            this.entity.enabled = this._link.entity.enabled && zone && zone.enabled && (select || visible);
            if (!this.entity.enabled)
                return;

            if (this.type !== 'box') {
                this.type = 'box';

                if (!this.color && this._link.entity) {
                    let hash = 0;
                    const string = this._link.entity.getGuid();
                    for (let i = 0; i < string.length; i++)
                        hash += string.charCodeAt(i);

                    this.color = editor.call('color:hsl2rgb', (hash % 128) / 128, 0.5, 0.5);
                }

                if (models[this.type]) {
                    let model = this.entity.model.model;
                    if (model) {
                        app.scene.removeModel(model);
                        this.entity.removeChild(model.getGraph());
                        poolModels[model._type].push(model);
                    }

                    model = poolModels[this.type].shift();
                    if (!model) {
                        model = models[this.type].clone();
                        model._type = this.type;

                        const color = this.color || colorDefault;

                        let old = model.meshInstances[0].material;
                        model.meshInstances[0].setParameter('offset', 0);
                        // model.meshInstances[0].layer = 12;
                        // model.meshInstances[0].updateKey();
                        model.meshInstances[0].mask = GIZMO_MASK;
                        model.meshInstances[0].__editor = true;
                        model.meshInstances[0].__zone = true;
                        model.meshInstances[0].material = old.clone();
                        model.meshInstances[0].material.updateShader = old.updateShader;
                        model.meshInstances[0].material.color.set(color[0], color[1], color[2], alphaFront);
                        model.meshInstances[0].material.update();

                        old = model.meshInstances[1].material;
                        model.meshInstances[1].setParameter('offset', 0.001);
                        // model.meshInstances[1].layer = 2;
                        model.meshInstances[1].pick = false;
                        // model.meshInstances[1].updateKey();
                        model.meshInstances[1].mask = GIZMO_MASK;
                        model.meshInstances[1].__editor = true;
                        model.meshInstances[1].material = old.clone();
                        model.meshInstances[1].material.updateShader = old.updateShader;
                        model.meshInstances[1].material.color.set(color[0], color[1], color[2], alphaBehind);
                        model.meshInstances[1].material.update();
                        model.meshInstances[1].__useFrontLayer = true;

                        model.meshInstances[2].mask = GIZMO_MASK;

                        model.meshInstances[3].setParameter('offset', 0);
                        model.meshInstances[3].mask = GIZMO_MASK;
                        // model.meshInstances[2].layer = 9;
                        model.meshInstances[3].pick = false;
                        // model.meshInstances[2].updateKey();
                        model.meshInstances[3].__editor = true;
                    }

                    this.entity.model.model = model;
                    this.entity.enabled = true;
                } else {
                    this.entity.model.model = null;
                    this.entity.enabled = false;
                }
            }

            if (this.entity && this.entity.enabled) {
                this.entity.setLocalPosition(this._link.entity.getPosition());
                this.entity.setLocalRotation(this._link.entity.getRotation());
                this.entity.setLocalScale(this._link.entity.zone.size);
            }

            if (select) {
                zones++;
                lastZone = this;
            }
        };

        // link to entity
        Gizmo.prototype.link = function (obj) {
            this.unlink();
            this._link = obj;

            const self = this;

            this.events.push(this._link.once('destroy', function () {
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
            this.entity._getEntity = function () {
                return self._link.entity;
            };
            this.entity.setLocalScale(1, 1, 1);
            this.entity.__editor = true;

            container.addChild(this.entity);
        };

        // unlink
        Gizmo.prototype.unlink = function () {
            if (!this._link)
                return;

            for (let i = 0; i < this.events.length; i++)
                this.events[i].unbind();

            this.events = [];
            this._link = null;

            const model = this.entity.model.model;
            if (model) {
                // put back in pool
                app.scene.removeModel(model);
                this.entity.removeChild(model.getGraph());
                this.entity.model.model = null;
                poolModels[model._type].push(model);
            }

            container.removeChild(this.entity);
            this.entity = null;
            this.type = '';
        };

        const onPointFocus = function () {
            if (hoverPoint)
                hoverPoint.entity.model.meshInstances[0].material = materials[hoverPoint.ind];

            hoverPoint = this;
            hoverPoint.entity.model.meshInstances[0].material = handleHighlightMaterial;
            plane.enabled = true;
        };

        const onPointBlur = function () {
            if (hoverPoint === this) {
                hoverPoint.entity.model.meshInstances[0].material = materials[hoverPoint.ind];
                hoverPoint = null;
                plane.enabled = false;
            }
        };

        const onPointDragStart = function () {
            if (!editor.call('permissions:write'))
                return;

            dragPoint = hoverPoint;
            dragLength = lastZone._link.entity.zone.size[dragPoint.axis];
            dragPos.copy(lastZone._link.entity.getLocalPosition());
            dragGizmoType = editor.call('gizmo:type');
            editor.call('gizmo:' + dragGizmoType + ':toggle', false);

            for (let i = 0; i < points.length; i++)
                points[i].entity.enabled = false;

            lastZone.entity.model.meshInstances[1].visible = false;
            editor.call('viewport:render');

            lastZone._link.history.enabled = false;

            const position = lastZone._link.get('position');
            const size = lastZone._link.get('components.zone.size');
            historyPosition.set(position[0], position[1], position[2]);
            historySize.set(size[0], size[1], size[2]);
        };

        const onPointDragEnd = function () {
            dragPoint = null;
            editor.call('gizmo:' + dragGizmoType + ':toggle', true);

            for (let i = 0; i < points.length; i++)
                points[i].entity.enabled = true;

            lastZone.entity.model.meshInstances[1].visible = true;
            editor.call('viewport:render');

            lastZone._link.history.enabled = true;

            const link = lastZone._link;

            const newPosition = lastZone._link.get('position');
            const newSize = lastZone._link.get('components.zone.size');

            const prevPosition = [historyPosition.x, historyPosition.y, historyPosition.z];
            const prevSize = [historySize.x, historySize.y, historySize.z];

            editor.call('history:add', {
                name: 'entity.zone',
                undo: function () {
                    const item = link.latest();
                    if (!item) return;

                    item.history.enabled = false;
                    item.set('position', prevPosition);
                    item.set('components.zone.size', prevSize);
                    item.history.enabled = true;
                },
                redo: function () {
                    const item = link.latest();
                    if (!item) return;

                    item.history.enabled = false;
                    item.set('position', newPosition);
                    item.set('components.zone.size', newSize);
                    item.history.enabled = true;
                }
            });
        };

        const onPointDragMove = function (length) {
            const size = Math.max(0.000000001, dragLength + length);
            lastZone._link.set('components.zone.size.' + axesInd[dragPoint.axis], size);

            quatA.copy(lastZone._link.entity.getRotation());
            vecA.set(0, 0, 0);
            vecA[dragPoint.axis] = (Math.max(0.000000001, dragLength + length * 0.5) - dragLength) * dragPoint.dir;
            quatA.transformVector(vecA, vecA);
            vecB.copy(dragPos).add(vecA);

            lastZone._link.set('position', [vecB.x, vecB.y, vecB.z]);

            pointsUpdate();
            editor.call('viewport:render');
        };

        const pointsCreate = function () {
            for (let i = 0; i < 6; i++) {
                const point = editor.call('gizmo:point:create', axes[i], null, direction[i]);
                point.ind = i;
                point.entity.model.meshInstances[0].material = materials[i];
                point.scale[scales[i][0]] = 2;
                point.scale[scales[i][1]] = 2;

                point.entity.enabled = editor.call('permissions:write');

                events.push(point.on('focus', onPointFocus));
                events.push(point.on('blur', onPointBlur));
                events.push(point.on('dragStart', onPointDragStart));
                events.push(point.on('dragEnd', onPointDragEnd));
                events.push(point.on('dragMove', onPointDragMove));
                points.push(point);
            }

            container.addChild(plane);
            editor.call('viewport:render');
        };

        editor.on('permissions:writeState', function (state) {
            if (!points || !points.length)
                return;

            for (let i = 0; i < points.length; i++)
                points[i].entity.enabled = state;
        });

        const pointsDestroy = function () {
            for (let i = 0; i < points.length; i++)
                editor.call('gizmo:point:recycle', points[i]);

            for (let i = 0; i < events.length; i++)
                events[i].unbind();

            events = [];
            points = [];
            container.removeChild(plane);
        };

        const pointsUpdate = function () {
            const transform = lastZone.entity.getWorldTransform();
            const position = transform.getTranslation();
            const rotation = quatA.setFromMat4(transform);
            const scale = vecB.copy(lastZone._link.entity.zone.size.clone());

            // front
            vecA.set(0, 0, -0.5);
            transform.transformPoint(vecA, vecA);
            points[0].entity.setLocalPosition(vecA);
            points[0].entity.setLocalRotation(rotation);
            points[0].update();

            // right
            vecA.set(0.5, 0, 0);
            transform.transformPoint(vecA, vecA);
            points[1].entity.setLocalPosition(vecA);
            points[1].entity.setLocalRotation(rotation);
            points[1].update();

            // back
            vecA.set(0, 0, 0.5);
            transform.transformPoint(vecA, vecA);
            points[2].entity.setLocalPosition(vecA);
            points[2].entity.setLocalRotation(rotation);
            points[2].update();

            // left
            vecA.set(-0.5, 0, 0);
            transform.transformPoint(vecA, vecA);
            points[3].entity.setLocalPosition(vecA);
            points[3].entity.setLocalRotation(rotation);
            points[3].update();

            // top
            vecA.set(0, 0.5, 0);
            transform.transformPoint(vecA, vecA);
            points[4].entity.setLocalPosition(vecA);
            points[4].entity.setLocalRotation(rotation);
            points[4].update();

            // bottom
            vecA.set(0, -0.5, 0);
            transform.transformPoint(vecA, vecA);
            points[5].entity.setLocalPosition(vecA);
            points[5].entity.setLocalRotation(rotation);
            points[5].update();

            if (hoverPoint) {
                hoverPoint.rotation.copy(rotation);
                hoverPoint.position.copy(position);

                plane.setLocalPosition(hoverPoint.entity.getPosition());

                const angles = eulers[hoverPoint.ind];
                quatB.setFromEulerAngles(angles[0], angles[1], angles[2]);
                quatC.copy(rotation).mul(quatB);
                plane.setLocalRotation(quatC);

                const axes = scales[hoverPoint.ind];
                plane.setLocalScale(scale[axes[0]], 1, scale[axes[1]]);
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

            if (entity.has('components.zone'))
                addGizmo();

            entity.on('components.zone:set', addGizmo);
            entity.on('components.zone:unset', removeGizmo);

            entity.once('destroy', function () {
                removeGizmo();
            });
        });

        editor.on('selector:change', function (type, items) {
            selected = { };
            if (items) {
                for (let i = 0; i < items.length; i++)
                    selected[items[i].get('resource_id')] = items[i];
            }

            editor.call('viewport:render');
        });

        editor.on('viewport:gizmoUpdate', function (dt) {
            zones = 0;

            for (const key in entities)
                entities[key].update();

            if (zones === 1) {
                if (!points.length)
                    pointsCreate();

                pointsUpdate();
            } else if (points.length) {
                pointsDestroy();
            }

            if (dragPoint) {
                const rotation = lastZone.entity.getRotation();
                const position = dragPoint.entity.getLocalPosition();
                const scale = lastZone._link.entity.zone.size;

                const a = scales[dragPoint.ind];

                for (let i = 0; i < a.length; i++) {
                    for (let l = 0; l <= 2; l++) {
                        vecA.set(0, 0, 0);
                        vecA[a[i]] = scale[a[i]] * 0.5;
                        rotation.transformVector(vecA, vecA);

                        vecD.set(0, 0, 0);
                        vecD[a[i ? 0 : 1]] = scale[a[i ? 0 : 1]] * (l - 1) * 0.5;
                        rotation.transformVector(vecD, vecD);

                        vecB.copy(position).add(vecD).add(vecA);
                        vecC.copy(position).add(vecD).sub(vecA);

                        app.renderLine(vecB, vecC, colorBehind, immediateRenderOptions);
                        app.renderLine(vecB, vecC, colorPrimary, immediateRenderOptions);
                    }
                }
            }
        });


        const createModels = function () {
            // ================
            // box
            const positions = [
                0.5, 0.5, 0.5,   0.5, 0.5, -0.5,   -0.5, 0.5, -0.5,   -0.5, 0.5, 0.5, // top
                0.5, 0.5, 0.5,   -0.5, 0.5, 0.5,   -0.5, -0.5, 0.5,   0.5, -0.5, 0.5, // front
                0.5, 0.5, 0.5,   0.5, -0.5, 0.5,   0.5, -0.5, -0.5,   0.5, 0.5, -0.5, // right
                0.5, 0.5, -0.5,   0.5, -0.5, -0.5,   -0.5, -0.5, -0.5,   -0.5, 0.5, -0.5, // back
                -0.5, 0.5, 0.5,   -0.5, 0.5, -0.5,   -0.5, -0.5, -0.5,   -0.5, -0.5, 0.5, // left
                0.5, -0.5, 0.5,   -0.5, -0.5, 0.5,   -0.5, -0.5, -0.5,   0.5, -0.5, -0.5 // bottom
            ];
            const normals = [
                0, 1, 0,   0, 1, 0,   0, 1, 0,   0, 1, 0,
                0, 0, 1,   0, 0, 1,   0, 0, 1,   0, 0, 1,
                1, 0, 0,   1, 0, 0,   1, 0, 0,   1, 0, 0,
                0, 0, -1,   0, 0, -1,   0, 0, -1,   0, 0, -1,
                -1, 0, 0,   -1, 0, 0,   -1, 0, 0,   -1, 0, 0,
                0, -1, 0,   0, -1, 0,   0, -1, 0,   0, -1, 0
            ];
            const indices = [
                0, 1, 2, 2, 3, 0,
                4, 5, 6, 6, 7, 4,
                8, 9, 10, 10, 11, 8,
                12, 13, 14, 14, 15, 12,
                16, 17, 18, 18, 19, 16,
                20, 21, 22, 22, 23, 20
            ];

            const mesh = pc.createMesh(app.graphicsDevice, positions, {
                normals: normals,
                indices: indices
            });

            const wireframePositions = [
                0.5, 0.5, 0.5,    0.5, 0.5, -0.5,   -0.5, 0.5, -0.5,   -0.5, 0.5, 0.5, // top
                0.5, 0.5, 0.5,   -0.5, 0.5, 0.5,    -0.5, -0.5, 0.5,    0.5, -0.5, 0.5, // front
                0.5, 0.5, 0.5,    0.5, -0.5, 0.5,    0.5, -0.5, -0.5,   0.5, 0.5, -0.5, // right
                0.5, 0.5, -0.5,  -0.5, 0.5, -0.5,   -0.5, -0.5, -0.5,   0.5, -0.5, -0.5, // back
                -0.5, 0.5, 0.5,   -0.5, -0.5, 0.5,   -0.5, -0.5, -0.5,  -0.5, 0.5, -0.5, // right
                0.5, -0.5, 0.5,   0.5, -0.5, -0.5,  -0.5, -0.5, -0.5,  -0.5, -0.5, 0.5 // bottom
            ];
            const meshWireframe = pc.createMesh(app.graphicsDevice, wireframePositions);
            meshWireframe.primitive[0].type = pc.PRIMITIVE_LINES;

            // node
            const node = new pc.GraphNode();
            // meshInstance
            const meshInstance = new pc.MeshInstance(node, mesh, materialDefault);
            // meshInstance.layer = 12;
            meshInstance.mask = GIZMO_MASK;
            meshInstance.__editor = true;
            meshInstance.castShadow = false;
            // meshInstance.castLightmapShadow = false;
            meshInstance.receiveShadow = false;
            meshInstance.setParameter('offset', 0);
            // meshInstance.updateKey();

            const meshInstanceBehind = new pc.MeshInstance(node, mesh, materialBehind);
            // meshInstanceBehind.layer = 2;
            meshInstanceBehind.mask = GIZMO_MASK;
            meshInstanceBehind.__editor = true;
            meshInstanceBehind.pick = false;
            meshInstanceBehind.drawToDepth = false;
            meshInstanceBehind.castShadow = false;
            // meshInstanceBehind.castLightmapShadow = false;
            meshInstanceBehind.receiveShadow = false;
            meshInstanceBehind.setParameter('offset', 0);
            // meshInstanceBehind.updateKey();

            const meshInstanceOccluder = new pc.MeshInstance(node, mesh, materialOccluder);
            // meshInstanceOccluder.layer = 9;
            meshInstanceOccluder.mask = GIZMO_MASK;
            meshInstanceOccluder.__editor = true;
            meshInstanceOccluder.pick = false;
            meshInstanceOccluder.castShadow = false;
            // meshInstanceOccluder.castLightmapShadow = false;
            meshInstanceOccluder.receiveShadow = false;
            meshInstanceOccluder.setParameter('offset', 0);
            // meshInstanceOccluder.updateKey();

            const meshInstanceWireframe = new pc.MeshInstance(node, meshWireframe, materialWireframe);
            // meshInstanceWireframe.layer = pc.LAYER_GIZMO;
            meshInstanceWireframe.mask = GIZMO_MASK;
            meshInstanceWireframe.__editor = true;
            // meshInstanceWireframe.updateKey();
            // model
            const model = new pc.Model();
            model.graph = node;
            model.meshInstances = [meshInstance, meshInstanceBehind, meshInstanceWireframe, meshInstanceOccluder];

            models.box = model;
        };
        createModels();
    });
});
