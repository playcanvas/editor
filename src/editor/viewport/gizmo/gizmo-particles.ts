import { GIZMO_MASK } from '@/core/constants';

import { createColorMaterial } from '../viewport-color-material';

editor.once('load', () => {
    let app;
    // selected entity gizmos
    let entities = { };
    // pool of gizmos
    const pool = [];
    // colors
    const colorBehind = new pc.Color(1, 1, 1, 0.15);
    const colorPrimary = new pc.Color(1, 1, 1);
    let container;
    let materialDefault;
    const materialBehind = createColorMaterial();
    materialBehind.color = colorBehind;
    materialBehind.blendState = new pc.BlendState(true, pc.BLENDEQUATION_ADD, pc.BLENDMODE_SRC_ALPHA, pc.BLENDMODE_ONE_MINUS_SRC_ALPHA);
    materialBehind.depthTest = false;
    materialBehind.update();
    const models = { };
    const poolModels = { 'box': [], 'sphere': [] };
    const shapes = { 0: 'box', 1: 'sphere' };

    const layerBack = editor.call('gizmo:layers', 'Bright Gizmo');
    const layerFront = editor.call('gizmo:layers', 'Dim Gizmo');

    // hack: override addModelToLayers to selectively put some
    // mesh instances to the front and others to the back layer depending
    // on the __useFrontLayer property
    const addModelToLayers = function () {
        const frontMeshInstances = this.meshInstances.filter((mi) => {
            return mi.__useFrontLayer;
        });
        const backMeshInstances = this.meshInstances.filter((mi) => {
            return !mi.__useFrontLayer;
        });

        layerFront.addMeshInstances(frontMeshInstances);
        layerBack.addMeshInstances(backMeshInstances);
    };

    // gizmo class
    function Gizmo() {
        this._link = null;
        this.events = [];
        this.type = '';
        this.entity = null;
    }
    // update lines
    Gizmo.prototype.update = function () {
        if (!app) {
            return;
        } // webgl not available

        if (!this._link || !this._link.entity) {
            return;
        }

        const particles = this._link.entity.particlesystem;
        this.entity.enabled = this._link.entity.enabled && particles && particles.enabled;
        if (!this.entity.enabled) {
            return;
        }

        this.entity.setPosition(this._link.entity.getPosition());
        this.entity.setRotation(this._link.entity.getRotation());

        const type = shapes[particles.emitterShape];

        if (this.type !== type) {
            this.type = type;

            // set new model based on type
            if (models[this.type]) {
                // get current model
                let model = this.entity.model.model;
                if (model) {
                    // put back in pool
                    this.entity.removeChild(model.getGraph());
                    if (poolModels[model._type]) {
                        poolModels[model._type].push(model);
                    }
                }
                // get from pool
                model = null;
                if (poolModels[this.type]) {
                    model = poolModels[this.type].shift();
                }

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
                // mask meshinstance from camera preview
                model.meshInstances.forEach((mi) => {
                    mi.mask = GIZMO_MASK;
                });
                this.entity.setLocalScale(1, 1, 1);
            } else {
                this.entity.enabled = false;
                this.entity.model.model = null;
                return;
            }
        }

        switch (this.type) {
            case 'sphere':
                this.entity.setLocalScale(particles.emitterRadius || 0.000001, particles.emitterRadius || 0.000001, particles.emitterRadius || 0.000001);
                break;
            case 'box':
                this.entity.setLocalScale(particles.emitterExtents.x / 2 || 0.00001, particles.emitterExtents.y / 2 || 0.00001, particles.emitterExtents.z / 2 || 0.00001);
                break;
        }
    };
    // link to entity
    Gizmo.prototype.link = function (obj) {
        if (!app) {
            return;
        } // webgl not available

        this.unlink();
        this._link = obj;

        const self = this;

        this.events.push(this._link.once('destroy', () => {
            self.unlink();
        }));

        this.entity = new pc.Entity();
        this.entity.addComponent('model', {
            castShadows: false,
            receiveShadows: false,
            castShadowsLightmap: false,
            layers: [layerFront.id, layerBack.id]
        });
        this.entity.model.addModelToLayers = addModelToLayers;

        container.addChild(this.entity);
    };
    // unlink
    Gizmo.prototype.unlink = function () {
        if (!app) {
            return;
        } // webgl not available

        if (!this._link) {
            return;
        }

        for (let i = 0; i < this.events.length; i++) {
            if (this.events[i] && this.events[i].unbind) {
                this.events[i].unbind();
            }
        }

        this.events = [];
        this._link = null;
        this.type = '';

        const model = this.entity.model.model;
        if (model) {
            // put back in pool
            this.entity.removeChild(model.getGraph());
            if (model._type) {
                poolModels[model._type].push(model);
            }
        }

        this.entity.destroy();
    };

    editor.on('selector:change', (type, items) => {
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
        for (let i = 0; i < items.length; i++) {
            ids[items[i].get('resource_id')] = items[i];
        }

        let render = false;

        // remove
        for (const key in entities) {
            if (ids[key]) {
                continue;
            }

            pool.push(entities[key]);
            entities[key].unlink();
            delete entities[key];
            render = true;
        }

        // add
        for (const key in ids) {
            if (entities[key]) {
                continue;
            }

            let gizmo = pool.shift();
            if (!gizmo) {
                gizmo = new Gizmo();
            }

            gizmo.link(ids[key]);
            entities[key] = gizmo;
            render = true;
        }

        if (render) {
            editor.call('viewport:render');
        }
    });

    editor.once('viewport:load', (application) => {
        app = application;
        const device = app.graphicsDevice;

        container = new pc.Entity(app);
        app.root.addChild(container);

        // material
        materialDefault = createColorMaterial();
        materialDefault.color = colorPrimary;
        materialDefault.update();

        let buffer, iterator, node, mesh, meshInstance, model;
        const vertexFormat = new pc.VertexFormat(device, [
            { semantic: pc.SEMANTIC_POSITION, components: 3, type: pc.TYPE_FLOAT32 }
        ]);
        const rad = Math.PI / 180;


        // ================
        // box
        buffer = new pc.VertexBuffer(device, vertexFormat, 12 * 2);
        iterator = new pc.VertexIterator(buffer);
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
        mesh = new pc.Mesh(device);
        mesh.vertexBuffer = buffer;
        mesh.indexBuffer[0] = null;
        mesh.primitive[0].type = pc.PRIMITIVE_LINES;
        mesh.primitive[0].base = 0;
        mesh.primitive[0].count = buffer.getNumVertices();
        mesh.primitive[0].indexed = false;
        // meshInstance
        meshInstance = new pc.MeshInstance(mesh, materialDefault, node);
        meshInstance.mask = GIZMO_MASK;
        meshInstance.updateKey();

        let meshInstanceBehind = new pc.MeshInstance(mesh, materialBehind, node);
        meshInstanceBehind.mask = GIZMO_MASK;
        meshInstanceBehind.__useFrontLayer = true;

        // model
        model = new pc.Model();
        model.graph = node;
        model.meshInstances = [meshInstance, meshInstanceBehind];
        models.box = model;


        // ================
        // sphere
        const segments = 72;
        buffer = new pc.VertexBuffer(device, vertexFormat, segments * 2 * 3);
        iterator = new pc.VertexIterator(buffer);
        // circles
        for (let i = 0; i < segments; i++) {
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
        mesh = new pc.Mesh(device);
        mesh.vertexBuffer = buffer;
        mesh.indexBuffer[0] = null;
        mesh.primitive[0].type = pc.PRIMITIVE_LINES;
        mesh.primitive[0].base = 0;
        mesh.primitive[0].count = buffer.getNumVertices();
        mesh.primitive[0].indexed = false;
        // meshInstance
        meshInstance = new pc.MeshInstance(mesh, materialDefault, node);
        meshInstance.updateKey();

        meshInstanceBehind = new pc.MeshInstance(mesh, materialBehind, node);
        meshInstanceBehind.__useFrontLayer = true;

        // model
        model = new pc.Model();
        model.graph = node;
        model.meshInstances = [meshInstance, meshInstanceBehind];
        models.sphere = model;
    });

    editor.on('viewport:gizmoUpdate', (dt) => {
        for (const key in entities) {

            // mark particle system when running inside Editor - allow it to render screenspace particles in world space
            const entity = app.root.findByGuid(key);
            entity?.particlesystem?.setInTools?.(true);

            entities[key].update();
        }
    });
});
