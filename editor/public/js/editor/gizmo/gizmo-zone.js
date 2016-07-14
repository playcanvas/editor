editor.once('viewport:load', function () {
    'use strict';

    var app = editor.call('viewport:framework');

    var container = new pc.Entity();
    container.name = 'zones';
    container.__editor = true;
    app.root.addChild(container);

    // entity gizmos
    var entities = { };
    var selected = { };

    // pool of gizmos
    var pool = [ ];
    var models = { };
    var poolModels = {
        'box': [ ]
    };
    var zones = 0;
    var lastZone = null;
    var historyPositon = new pc.Vec3();
    var historySize = new pc.Vec3();
    var points = [ ];
    var hoverPoint = null;
    var dragPoint = null;
    var dragLength = 0;
    var dragPos = new pc.Vec3();
    var dragGizmoType = '';
    var events = [ ];

    var vecA = new pc.Vec3();
    var vecB = new pc.Vec3();
    var vecC = new pc.Vec3();
    var vecD = new pc.Vec3();
    var quatA = new pc.Quat();
    var quatB = new pc.Quat();
    var quatC = new pc.Quat();

    var axesInd = { 'x': 0, 'y': 1, 'z': 2 };
    var axes = [ 'z', 'x', 'z', 'x', 'y', 'y' ];
    var direction = [ -1, 1, 1, -1, 1, -1 ];
    var eulers = [
        [ -90, 0, 0 ], // front
        [ 90, 90, 0 ], // right
        [ 90, 0, 0 ], // back
        [ 90, -90, 0 ], // left
        [ 0, 0, 0 ], // top
        [ 180, 0, 0 ]  // bottom
    ];
    var scales = [
        [ 'x', 'y', ], // front
        [ 'z', 'y', ], // right
        [ 'x', 'y', ], // back
        [ 'z', 'y', ], // left
        [ 'x', 'z', ], // top
        [ 'x', 'z', ]  // bottom
    ];
    var materials = [
        new pc.Color(0, 0, 1),
        new pc.Color(1, 0, 0),
        new pc.Color(0, 0, 1),
        new pc.Color(1, 0, 0),
        new pc.Color(0, 1, 0),
        new pc.Color(0, 1, 0)
    ];
    for(var i = 0; i < materials.length; i++) {
        var color = materials[i];
        materials[i] = new pc.BasicMaterial();
        materials[i].color = color;
        materials[i].update();
    }

    var colorPrimary = new pc.Color(1, 1, 1);
    var colorBehind = new pc.Color(1, 1, 1, 0.15);

    var materialDefault = new pc.BasicMaterial();
    materialDefault.color = colorPrimary;
    materialDefault.update();

    var materialBehind = new pc.BasicMaterial();
    materialBehind.color = colorBehind;
    materialBehind.blend = true;
    materialBehind.blendSrc = pc.BLENDMODE_SRC_ALPHA;
    materialBehind.blendDst = pc.BLENDMODE_ONE_MINUS_SRC_ALPHA;
    materialBehind.depthTest = false;
    materialBehind.update();

    var materialPlaneBehind = new pc.BasicMaterial();
    materialPlaneBehind.color = new pc.Color(1, 1, 1, 0.4);
    materialPlaneBehind.blend = true;
    materialPlaneBehind.blendSrc = pc.BLENDMODE_SRC_ALPHA;
    materialPlaneBehind.blendDst = pc.BLENDMODE_ONE_MINUS_SRC_ALPHA;
    materialPlaneBehind.cull = pc.CULLFACE_NONE;
    materialPlaneBehind.update();

    var materialPlane = new pc.BasicMaterial();
    materialPlane.color = new pc.Color(1, 1, 1, 0.1);
    materialPlane.blend = true;
    materialPlane.blendSrc = pc.BLENDMODE_SRC_ALPHA;
    materialPlane.blendDst = pc.BLENDMODE_ONE_MINUS_SRC_ALPHA;
    materialPlane.depthTest = false;
    materialPlane.cull = pc.CULLFACE_NONE;
    materialPlane.update();

    var plane = new pc.Entity();
    plane.enabled = false;
    plane.__editor = true;
    plane.addComponent('model', {
        type: 'plane',
        receiveShadows: false,
        castShadowsLightmap: false,
        castShadows: false
    });
    var instance = plane.model.meshInstances[0];
    instance.material = materialPlane;
    plane.model.meshInstances.push(new pc.MeshInstance(instance.node, instance.mesh, materialPlaneBehind));

    // gizmo class
    function Gizmo() {
        this._link = null;
        this.events = [ ];
        this.entity = null;
        this.type = '';
    }

    // update lines
    Gizmo.prototype.update = function() {
        if (! this._link || ! this._link.entity)
            return;

        var zone = this._link.entity.zone;
        var select = selected[this._link.get('resource_id')] === this._link;

        this.entity.enabled = this._link.entity.enabled && zone && zone.enabled && select;
        if (! this.entity.enabled)
            return;

        if (this.type !== 'box') {
            this.type = 'box';

            if (models[this.type]) {
                var model = this.entity.model.model;
                if (model) {
                    app.scene.removeModel(model);
                    this.entity.removeChild(model.getGraph());
                    poolModels[model._type].push(model);
                }

                model = poolModels[this.type].shift();
                if (! model) {
                    model = models[this.type].clone();
                    model._type = this.type;
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
    Gizmo.prototype.link = function(obj) {
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
            castShadowsLightmap: false
        });
        this.entity.setLocalScale(1, 1, 1);
        this.entity.__editor = true;

        container.addChild(this.entity);
    };

    // unlink
    Gizmo.prototype.unlink = function() {
        if (! this._link)
            return;

        for(var i = 0; i < this.events.length; i++)
            this.events[i].unbind();

        this.events = [ ];
        this._link = null;

        var model = this.entity.model.model;
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

    var onPointFocus = function() {
        if (hoverPoint)
            hoverPoint.entity.model.meshInstances[0].material = materials[hoverPoint.ind];

        hoverPoint = this;
        hoverPoint.entity.model.meshInstances[0].material = materialDefault;
        plane.enabled = true;
    };

    var onPointBlur = function() {
        if (hoverPoint === this) {
            hoverPoint.entity.model.meshInstances[0].material = materials[hoverPoint.ind];
            hoverPoint = null;
            plane.enabled = false;
        }
    };

    var onPointDragStart = function() {
        dragPoint = hoverPoint;
        dragLength = lastZone._link.entity.zone.size[dragPoint.axis];
        dragPos.copy(lastZone._link.entity.getLocalPosition());
        dragGizmoType = editor.call('gizmo:type');
        editor.call('gizmo:' + dragGizmoType + ':toggle', false);

        for(var i = 0; i < points.length; i++)
            points[i].entity.enabled = false;

        lastZone.entity.model.meshInstances[1].visible = false;
        editor.call('viewport:render');

        lastZone._link.history.enabled = false;

        var position = lastZone._link.get('position');
        var size = lastZone._link.get('components.zone.size');
        historyPositon.set(position[0], position[1], position[2]);
        historySize.set(size[0], size[1], size[2]);
    };

    var onPointDragEnd = function() {
        dragPoint = null;
        editor.call('gizmo:' + dragGizmoType + ':toggle', true);

        for(var i = 0; i < points.length; i++)
            points[i].entity.enabled = true;

        lastZone.entity.model.meshInstances[1].visible = true;
        editor.call('viewport:render');

        lastZone._link.history.enabled = true;

        var getItem = lastZone._link.history._getItemFn;

        var newPosition = lastZone._link.get('position');
        var newSize = lastZone._link.get('components.zone.size');

        var prevPosition = [ historyPositon.x, historyPositon.y, historyPositon.z ];
        var prevSize = [ historySize.x, historySize.y, historySize.z ];

        editor.call('history:add', {
            name: 'entity.zone',
            undo: function() {
                var item = getItem();
                if (! item) return;

                item.history.enabled = false;
                item.set('position', prevPosition);
                item.set('components.zone.size', prevSize);
                item.history.enabled = true;
            },
            redo: function() {
                var item = getItem();
                if (! item) return;

                item.history.enabled = false;
                item.set('position', newPosition);
                item.set('components.zone.size', newSize);
                item.history.enabled = true;
            }
        });
    };

    var onPointDragMove = function(length) {
        var size = Math.max(0.000000001, dragLength + length);
        lastZone._link.set('components.zone.size.' + axesInd[dragPoint.axis], size);

        quatA.copy(lastZone._link.entity.getRotation());
        vecA.set(0, 0, 0);
        vecA[dragPoint.axis] = (Math.max(0.000000001, dragLength + length * 0.5) - dragLength) * dragPoint.dir;
        quatA.transformVector(vecA, vecA);
        vecB.copy(dragPos).add(vecA);

        lastZone._link.set('position', [ vecB.x, vecB.y, vecB.z ]);

        pointsUpdate();
        editor.call('viewport:render');
    };

    var pointsCreate = function() {
        for(var i = 0; i < 6; i++) {
            var point = editor.call('gizmo:point:create', axes[i], null, direction[i]);
            point.ind = i;
            point.entity.model.meshInstances[0].material = materials[i];
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

    var pointsDestroy = function() {
        for(var i = 0; i < points.length; i++)
            editor.call('gizmo:point:recycle', points[i]);

        for(var i = 0; i < events.length; i++)
            events[i].unbind();

        events = [ ];
        points = [ ];
        container.removeChild(plane);
    };

    var pointsUpdate = function() {
        var transform = lastZone.entity.getWorldTransform();
        var position = transform.getTranslation();
        var rotation = quatA.setFromMat4(transform);
        var scale = vecB.copy(lastZone._link.entity.zone.size.clone());

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

            var angles = eulers[hoverPoint.ind];
            quatB.setFromEulerAngles(angles[0], angles[1], angles[2]);
            quatC.copy(rotation).mul(quatB);
            plane.setLocalRotation(quatC);

            var axes = scales[hoverPoint.ind];
            plane.setLocalScale(scale[axes[0]], 1, scale[axes[1]]);
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

        if (entity.has('components.zone'))
            addGizmo();

        entity.on('components.zone:set', addGizmo);
        entity.on('components.zone:unset', removeGizmo);

        entity.once('destroy', function() {
            removeGizmo();
        });
    });

    editor.on('selector:change', function(type, items) {
        selected = { };
        if (items) {
            for(var i = 0; i < items.length; i++)
                selected[items[i].get('resource_id')] = items[i];
        }

        editor.call('viewport:render');
    });

    editor.on('viewport:gizmoUpdate', function(dt) {
        zones = 0;

        for(var key in entities)
            entities[key].update();

        if (zones === 1) {
            if (! points.length)
                pointsCreate();

            pointsUpdate();
        } else if (points.length) {
            pointsDestroy();
        }

        if (dragPoint) {
            var camera = editor.call('camera:current');
            var transform = lastZone._link.entity.getWorldTransform();
            var rotation = lastZone.entity.getRotation();
            var position = dragPoint.entity.getLocalPosition();
            var scale = lastZone._link.entity.zone.size;

            var a = scales[dragPoint.ind];

            for(var i = 0; i < a.length; i++) {
                for(var l = 0; l <= 2; l++) {
                    vecA.set(0, 0, 0);
                    vecA[a[i]] = scale[a[i]] * 0.5;
                    rotation.transformVector(vecA, vecA);

                    vecD.set(0, 0, 0);
                    vecD[a[i ? 0 : 1]] = scale[a[i ? 0 : 1]] * (l - 1) * 0.5;
                    rotation.transformVector(vecD, vecD);

                    vecB.copy(position).add(vecD).add(vecA);
                    vecC.copy(position).add(vecD).sub(vecA);

                    app.renderLine(vecB, vecC, colorBehind, pc.LINEBATCH_GIZMO);
                    app.renderLine(vecB, vecC, colorPrimary, pc.LINEBATCH_WORLD);
                }
            }
        }
    });


    var createModels = function() {
        var vertexFormat = new pc.gfx.VertexFormat(app.graphicsDevice, [
            { semantic: pc.gfx.SEMANTIC_POSITION, components: 3, type: pc.gfx.ELEMENTTYPE_FLOAT32 }
        ]);
        var buffer = buffer = new pc.gfx.VertexBuffer(app.graphicsDevice, vertexFormat, 12 * 2);
        var iterator = new pc.gfx.VertexIterator(buffer);

        // top
        iterator.element[pc.SEMANTIC_POSITION].set(0.5, 0.5, 0.5);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(0.5, 0.5, -0.5);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(0.5, 0.5, -0.5);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(-0.5, 0.5, -0.5);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(-0.5, 0.5, -0.5);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(-0.5, 0.5, 0.5);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(-0.5, 0.5, 0.5);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(0.5, 0.5, 0.5);
        iterator.next();
        // bottom
        iterator.element[pc.SEMANTIC_POSITION].set(0.5, -0.5, 0.5);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(0.5, -0.5, -0.5);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(0.5, -0.5, -0.5);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(-0.5, -0.5, -0.5);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(-0.5, -0.5, -0.5);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(-0.5, -0.5, 0.5);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(-0.5, -0.5, 0.5);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(0.5, -0.5, 0.5);
        iterator.next();
        // sides
        iterator.element[pc.SEMANTIC_POSITION].set(0.5, -0.5, 0.5);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(0.5, 0.5, 0.5);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(0.5, -0.5, -0.5);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(0.5, 0.5, -0.5);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(-0.5, -0.5, -0.5);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(-0.5, 0.5, -0.5);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(-0.5, -0.5, 0.5);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(-0.5, 0.5, 0.5);
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
        var meshInstanceBehind = new pc.MeshInstance(node, mesh, materialBehind);
        meshInstance.updateKey();
        meshInstanceBehind.updateKey();
        // model
        var model = new pc.Model();
        model.graph = node;
        model.meshInstances = [ meshInstanceBehind, meshInstance ];

        models['box'] = model;
    };
    createModels();
});
