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
    var materialDefault;
    var materialBehind = new pc.BasicMaterial();
    materialBehind.color = colorBehind;
    materialBehind.blend = true;
    materialBehind.blendSrc = pc.BLENDMODE_SRC_ALPHA;
    materialBehind.blendDst = pc.BLENDMODE_ONE_MINUS_SRC_ALPHA;
    materialBehind.depthTest = false;
    materialBehind.update();
    var models = { };
    var poolModels = { 'box': [ ], 'sphere': [ ] };
    var shapes = { 0: 'box', 1: 'sphere' };

    // gizmo class
    function Gizmo() {
        this._link = null;
        this.events = [ ];
        this.type = '';
        this.entity = null;
    }
    // update lines
    Gizmo.prototype.update = function() {
        if (! this._link)
            return;

        var particles = this._link.entity.particlesystem;
        this.entity.enabled = this._link.entity.enabled && particles && particles.enabled;
        if (! this.entity.enabled)
            return;

        this.entity.setPosition(this._link.entity.getPosition());
        this.entity.setRotation(this._link.entity.getRotation());

        var type = shapes[particles.emitterShape];

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
            } else {
                this.entity.enabled = false;
                this.entity.model.model = null;
                return;
            }
        }

        var mat = materialBehind;

        switch(this.type) {
            case 'sphere':
                this.entity.setLocalScale(particles.emitterRadius || .000001, particles.emitterRadius || .000001, particles.emitterRadius || .000001);
                break;
            case 'box':
                this.entity.setLocalScale(particles.emitterExtents.x / 2 || .00001, particles.emitterExtents.y / 2 || .00001, particles.emitterExtents.z / 2 || .00001);
                break;
        }

        // render behind model
        if (this.entity.enabled && this.entity.model.model) {
            var instance = new pc.MeshInstance(this.entity.model.model.meshInstances[0].node, this.entity.model.model.meshInstances[0].mesh, mat);
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
    });

    editor.on('viewport:gizmoUpdate', function(dt) {
        for(var key in entities)
            entities[key].update();
    });
});
