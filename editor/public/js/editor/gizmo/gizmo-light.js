editor.once('load', function () {
    'use strict';

    let app;
    // selected entity gizmos
    let entities = { };
    // pool of gizmos
    const pool = [];

    const _circleSegments = 72;

    // colors
    const colorBehind = new pc.Color(1, 1, 1, 0.8);
    const colorPrimary = new pc.Color(1, 1, 1);
    let container;
    const vec = new pc.Vec3();
    let material, materialBehind, materialSpot, materialSpotBehind;
    const models = { };
    const poolModels = { 'directional': [], 'point': [], 'pointclose': [], 'spot': [], 'rectangle': [], 'disk': [], 'sphere': [] };

    const layerFront = editor.call('gizmo:layers', 'Bright Gizmo');
    const layerBack = editor.call('gizmo:layers', 'Dim Gizmo');

    // hack: override addModelToLayers to selectively put some
    // mesh instances to the front and others to the back layer depending
    // on the __useFrontLayer property
    const addModelToLayers = function () {
        const frontMeshInstances = this.meshInstances.filter(function (mi) {
            return mi.__useFrontLayer;
        });
        const backMeshInstances = this.meshInstances.filter(function (mi) {
            return !mi.__useFrontLayer;
        });

        layerBack.addMeshInstances(frontMeshInstances);
        layerFront.addMeshInstances(backMeshInstances);
    };

    // gizmo class
    class Gizmo {
        constructor() {
            this._link = null;
            this.lines = [];
            this.events = [];
            this.type = '';
            this.entity = null;
        }

        // update lines
        update() {
            if (!app) return; // webgl not available

            if (!this._link || !this._link.entity)
                return;

            const light = this._link.entity.light;
            this.entity.enabled = this._link.entity.enabled && light && light.enabled;
            if (!this.entity.enabled)
                return;

            this.entity.setPosition(this._link.entity.getPosition());

            let type = light.type;

            // close point light, switch to triple circle
            if (type === 'point' && vec.copy(this.entity.getPosition()).sub(editor.call('camera:current').getPosition()).length() < light.range)
                type += 'close';

            // area lights
            if (light.shape !== pc.LIGHTSHAPE_PUNCTUAL) {
                switch (light.shape) {
                    case pc.LIGHTSHAPE_RECT:
                        type = 'rectangle';
                        break;
                    case pc.LIGHTSHAPE_DISK:
                        type = 'disk';
                        break;
                    case pc.LIGHTSHAPE_SPHERE:
                        type = 'sphere';
                        break;
                }
            }

            if (this.type !== type) {
                this.type = type;

                // set new model based on type
                if (models[this.type]) {
                    // get current model
                    let model = this.entity.model.model;
                    if (model) {
                        // put back in pool
                        layerBack.removeMeshInstances(model.meshInstances);
                        layerFront.removeMeshInstances(model.meshInstances);
                        this.entity.removeChild(model.getGraph());
                        poolModels[model._type].push(model);
                    }
                    // get from pool
                    model = poolModels[this.type].shift();
                    if (!model) {
                        // no in pool
                        model = models[this.type].clone();
                        for (let i = 0; i < model.meshInstances.length; i++) {
                            model.meshInstances[i].__useFrontLayer = models[this.type].meshInstances[i].__useFrontLayer;
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

            switch (this.type) {
                case 'directional':
                    this.entity.setRotation(this._link.entity.getRotation());
                    break;
                case 'point':
                    this.entity.setLocalScale(light.range, light.range, light.range);
                    this.entity.lookAt(editor.call('camera:current').getPosition());
                    break;
                case 'pointclose':
                    this.entity.setLocalScale(light.range, light.range, light.range);
                    break;
                case 'spot':
                    this.entity.setRotation(this._link.entity.getRotation());
                    this.entity.model.meshInstances[0].setParameter('range', light.range);
                    this.entity.model.meshInstances[0].setParameter('innerAngle', light.innerConeAngle);
                    this.entity.model.meshInstances[0].setParameter('outerAngle', light.outerConeAngle);
                    this.entity.model.meshInstances[1].setParameter('range', light.range);
                    this.entity.model.meshInstances[1].setParameter('innerAngle', light.innerConeAngle);
                    this.entity.model.meshInstances[1].setParameter('outerAngle', light.outerConeAngle);
                    break;
                case 'rectangle':
                case 'disk':
                case 'sphere':
                    this.entity.setRotation(this._link.entity.getRotation());
                    this.entity.setLocalScale(this._link.entity.getLocalScale());
                    break;
            }
        }

        // link to entity
        link(obj) {
            if (!app) return; // webgl not available

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

            container.addChild(this.entity);
        }

        // unlink
        unlink() {
            if (!app) return; // webgl not available

            if (!this._link)
                return;

            for (let i = 0; i < this.events.length; i++)
                this.events[i].unbind();

            this.events = [];
            this._link = null;
            this.type = '';

            const model = this.entity.model.model;
            if (model) {
                // put back in pool
                layerBack.removeMeshInstances(model.meshInstances);
                layerFront.removeMeshInstances(model.meshInstances);
                this.entity.removeChild(model.getGraph());
                poolModels[model._type].push(model);
                this.entity.model.model = null;
            }

            this.entity.destroy();
        }

        static createMaterials() {

            // material
            material = new pc.BasicMaterial();
            material.color = colorPrimary;
            material.update();

            // materialBehind
            materialBehind = new pc.BasicMaterial();
            materialBehind.color = colorBehind;
            materialBehind.blend = true;
            materialBehind.blendSrc = pc.BLENDMODE_SRC_ALPHA;
            materialBehind.blendDst = pc.BLENDMODE_ONE_MINUS_SRC_ALPHA;
            materialBehind.depthTest = false;
            materialBehind.update();

            let shaderSpot;
            materialSpot = new pc.BasicMaterial();
            materialSpot.updateShader = function (device) {
                if (!shaderSpot) {
                    shaderSpot = new pc.Shader(device, {
                        attributes: {
                            vertex_position: 'POSITION',
                            outer: 'ATTR15'
                        },
                        vshader: `
                            attribute vec3 vertex_position;
                            attribute float outer;
                            
                            uniform mat4 matrix_model;
                            uniform mat4 matrix_viewProjection;
                            uniform float range;
                            uniform float innerAngle;
                            uniform float outerAngle;
                            
                            void main(void)
                            {
                                mat4 modelMatrix = matrix_model;
                                vec4 positionW = vec4(vertex_position, 1.0);
                                float radius = (outer * (sin(radians(outerAngle)) * range)) + ((1.0 - outer) * (sin(radians(innerAngle)) * range));
                                positionW.xz *= radius;
                                positionW.y *= range * ((outer * cos(radians(outerAngle))) + ((1.0 - outer) * cos(radians(innerAngle))));
                                positionW = modelMatrix * positionW;
                                gl_Position = matrix_viewProjection * positionW;
                            }
                        `.trim(),
                        fshader: `
                            precision ${device.precision} float;
                            
                            uniform vec4 uColor;
                            
                            void main(void)
                            {
                                gl_FragColor = uColor;
                                gl_FragColor = clamp(gl_FragColor, 0.0, 1.0);
                            }
                        `.trim()
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
        }

        static createDirectional() {

            const rad = pc.math.DEG_TO_RAD;
            const size = 0.2;
            const length = -(2 - size * 2);
            const positions = [
                0, 0, 0,
                0, length, 0,

                // triangle
                Math.sin(0 * rad) * size, length, Math.cos(0 * rad) * size,
                Math.sin(120 * rad) * size, length, Math.cos(120 * rad) * size,
                Math.sin(120 * rad) * size, length, Math.cos(120 * rad) * size,
                Math.sin(240 * rad) * size, length, Math.cos(240 * rad) * size,
                Math.sin(240 * rad) * size, length, Math.cos(240 * rad) * size,
                Math.sin(0 * rad) * size, length, Math.cos(0 * rad) * size,

                // triangle corners
                Math.sin(0 * rad) * size, length, Math.cos(0 * rad) * size,
                0, length - (size * 2), 0,
                Math.sin(120 * rad) * size, length, Math.cos(120 * rad) * size,
                0, length - (size * 2), 0,
                Math.sin(240 * rad) * size, length, Math.cos(240 * rad) * size,
                0, length - (size * 2), 0
            ];

            return Gizmo.createModel(positions, null, material, materialBehind);
        }

        static createPoint() {

            // xz axis
            const positions = [];
            const factor = 360 / _circleSegments * pc.math.DEG_TO_RAD;
            for (let i = 0; i < _circleSegments; i++) {
                positions.push(Math.sin(factor * i), Math.cos(factor * i), 0);
                positions.push(Math.sin(factor * (i + 1)), Math.cos(factor * (i + 1)), 0);
            }

            return Gizmo.createModel(positions, null, material, materialBehind);
        }

        static createPointClose() {

            // circles
            const positions = [];
            const factor = 360 / _circleSegments * pc.math.DEG_TO_RAD;
            for (let i = 0; i < _circleSegments; i++) {
                positions.push(Math.sin(factor * i), 0, Math.cos(factor * i));
                positions.push(Math.sin(factor * (i + 1)), 0, Math.cos(factor * (i + 1)));
                positions.push(Math.sin(factor * i), Math.cos(factor * i), 0);
                positions.push(Math.sin(factor * (i + 1)), Math.cos(factor * (i + 1)), 0);
                positions.push(0, Math.cos(factor * i), Math.sin(factor * i));
                positions.push(0, Math.cos(factor * (i + 1)), Math.sin(factor * (i + 1)));
            }

            return Gizmo.createModel(positions, null, material, materialBehind);
        }

        static createSpot() {

            const positions = [];
            const outers = [];

            // left line
            positions.push(0, 0, 0, Math.sin(0), -1, Math.cos(0));
            outers.push(1, 1);

            // right line
            positions.push(0, 0, 0, Math.sin(Math.PI), -1, Math.cos(Math.PI));
            outers.push(1, 1);

            // circles
            const factor = 360 / _circleSegments * pc.math.DEG_TO_RAD;
            for (let i = 0; i < _circleSegments; i++) {

                // inner
                positions.push(Math.sin(factor * i), -1, Math.cos(factor * i));
                positions.push(Math.sin(factor * (i + 1)), -1, Math.cos(factor * (i + 1)));
                outers.push(0, 0);

                // outer
                positions.push(Math.sin(factor * i), -1, Math.cos(factor * i));
                positions.push(Math.sin(factor * (i + 1)), -1, Math.cos(factor * (i + 1)));
                outers.push(1, 1);
            }

            return Gizmo.createModel(positions, outers, materialSpot, materialSpotBehind);
        }

        static createRectangle() {

            // 4 lines
            const positions = [
                -0.5, 0, -0.5, 0.5, 0, -0.5,
                -0.5, 0, 0.5, 0.5, 0, 0.5,
                -0.5, 0, -0.5, -0.5, 0, 0.5,
                0.5, 0, -0.5, 0.5, 0, 0.5
            ];

            return Gizmo.createModel(positions, null, material, materialBehind);
        }

        static createDisk() {

            const positions = [];
            const factor = 360 / _circleSegments * pc.math.DEG_TO_RAD;

            for (let i = 0; i < _circleSegments; i++) {
                positions.push(0.5 * Math.sin(factor * i), 0, 0.5 * Math.cos(factor * i));
                positions.push(0.5 * Math.sin(factor * (i + 1)), 0, 0.5 * Math.cos(factor * (i + 1)));
            }

            return Gizmo.createModel(positions, null, material, materialBehind);
        }

        static createSphere() {

            // circles
            const positions = [];
            const factor = 360 / _circleSegments * pc.math.DEG_TO_RAD;
            for (let i = 0; i < _circleSegments; i++) {
                positions.push(0.5 * Math.sin(factor * i), 0, 0.5 * Math.cos(factor * i));
                positions.push(0.5 * Math.sin(factor * (i + 1)), 0, 0.5 * Math.cos(factor * (i + 1)));
                positions.push(0.5 * Math.sin(factor * i), 0.5 * Math.cos(factor * i), 0);
                positions.push(0.5 * Math.sin(factor * (i + 1)), 0.5 * Math.cos(factor * (i + 1)), 0);
                positions.push(0, 0.5 * Math.cos(factor * i), 0.5 * Math.sin(factor * i));
                positions.push(0, 0.5 * Math.cos(factor * (i + 1)), 0.5 * Math.sin(factor * (i + 1)));
            }

            return Gizmo.createModel(positions, null, material, materialBehind);
        }

        static createModel(positions, outers, materialFront, materialBack) {

            // node
            const node = new pc.GraphNode();

            // mesh
            const mesh = new pc.Mesh();
            mesh.setPositions(positions);
            if (outers)
                mesh.setVertexStream(pc.SEMANTIC_ATTR15, outers, 1);
            mesh.update(pc.PRIMITIVE_LINES);

            // meshInstances
            const meshInstance = new pc.MeshInstance(node, mesh, materialFront);
            meshInstance.mask = GIZMO_MASK;
            meshInstance.pick = false;

            const meshInstanceBehind = new pc.MeshInstance(node, mesh, materialBack);
            meshInstanceBehind.__useFrontLayer = true;
            meshInstanceBehind.mask = GIZMO_MASK;
            meshInstanceBehind.pick = false;

            // model
            const model = new pc.Model();
            model.graph = node;
            model.meshInstances = [meshInstance, meshInstanceBehind];

            return model;
        }
    }

    editor.on('selector:change', function (type, items) {
        // clear gizmos
        if (type !== 'entity') {
            for (const key in entities) {
                entities[key].unlink();
                pool.push(entities[key]);
            }
            entities = { };
            return;
        }

        // index selection
        const ids = { };
        for (let i = 0; i < items.length; i++)
            ids[items[i].get('resource_id')] = items[i];

        let render = false;

        // remove
        for (const key in entities) {
            if (ids[key])
                continue;

            pool.push(entities[key]);
            entities[key].unlink();
            delete entities[key];
            render = true;
        }

        // add
        for (const key in ids) {
            if (entities[key])
                continue;

            let gizmo = pool.shift();
            if (!gizmo)
                gizmo = new Gizmo();

            gizmo.link(ids[key]);
            entities[key] = gizmo;

            render = true;
        }

        if (render)
            editor.call('viewport:render');
    });

    editor.once('viewport:load', function () {
        app = editor.call('viewport:app');
        if (!app)
            return; // webgl not available

        container = new pc.Entity(app);
        app.root.addChild(container);

        Gizmo.createMaterials();
        models.directional = Gizmo.createDirectional();
        models.point = Gizmo.createPoint();
        models.pointclose = Gizmo.createPointClose();
        models.spot = Gizmo.createSpot();
        models.rectangle = Gizmo.createRectangle();
        models.disk = Gizmo.createDisk();
        models.sphere = Gizmo.createSphere();
    });

    editor.on('viewport:gizmoUpdate', function (dt) {
        for (const key in entities)
            entities[key].update();
    });
});
