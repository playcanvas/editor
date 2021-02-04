editor.once('load', function () {
    'use strict';

    var app;
    // selected entity gizmos
    var entities = { };
    // pool of gizmos
    var pool = [];
    // colors
    var colorBehind = new pc.Color(1, 1, 1, 0.15);
    var colorPrimary = new pc.Color(1, 1, 1);

    var immediateRenderOptions;
    var noDepthImmediateRenderOptions;

    // gizmo class
    function Gizmo() {
        this._link = null;
        this.lines = [];
        this.events = [];
        this.visible = false;

        for (var i = 0; i < 24; i++)
            this.lines.push(new pc.Vec3());
    }
    // update lines
    Gizmo.prototype.update = function () {
        if (! app) return; // webgl not available

        if (! this._link || ! this._link.entity || editor.call('camera:current') === this._link.entity) {
            this.visible = false;
            return;
        }

        var camera = this._link.entity.camera;
        this.visible = camera && this._link.get('enabled') && this._link.get('components.camera.enabled') && editor.call('camera:current') !== this._link.entity;
        if (! this.visible)
            return;

        var nearClip = camera.nearClip || 0.0001;
        var farClip = camera.farClip;
        var fov = camera.fov * Math.PI / 180.0;
        var projection = camera.projection;

        var device = app.graphicsDevice;
        var rect = camera.rect;
        var aspectRatio = (device.width * rect.z) / (device.height * rect.w);

        var nx, ny, fx, fy;
        if (projection === pc.PROJECTION_PERSPECTIVE) {
            ny = Math.tan(fov / 2.0) * nearClip;
            fy = Math.tan(fov / 2.0) * farClip;
            nx = ny * aspectRatio;
            fx = fy * aspectRatio;
        } else {
            ny = camera.camera._orthoHeight;
            fy = ny;
            nx = ny * aspectRatio;
            fx = nx;
        }

        // near plane
        this.lines[0].set(nx, -ny, -nearClip);
        this.lines[1].set(nx, ny, -nearClip);
        this.lines[2].set(nx, ny, -nearClip);
        this.lines[3].set(-nx, ny, -nearClip);
        this.lines[4].set(-nx, ny, -nearClip);
        this.lines[5].set(-nx, -ny, -nearClip);
        this.lines[6].set(-nx, -ny, -nearClip);
        this.lines[7].set(nx, -ny, -nearClip);
        // far plane
        this.lines[8].set(fx, -fy, -farClip);
        this.lines[9].set(fx, fy, -farClip);
        this.lines[10].set(fx, fy, -farClip);
        this.lines[11].set(-fx, fy, -farClip);
        this.lines[12].set(-fx, fy, -farClip);
        this.lines[13].set(-fx, -fy, -farClip);
        this.lines[14].set(-fx, -fy, -farClip);
        this.lines[15].set(fx, -fy, -farClip);
        // parallel lines
        this.lines[16].set(nx, -ny, -nearClip);
        this.lines[17].set(fx, -fy, -farClip);
        this.lines[18].set(nx, ny, -nearClip);
        this.lines[19].set(fx, fy, -farClip);
        this.lines[20].set(-nx, ny, -nearClip);
        this.lines[21].set(-fx, fy, -farClip);
        this.lines[22].set(-nx, -ny, -nearClip);
        this.lines[23].set(-fx, -fy, -farClip);

        // transform lines according to camera transform
        var wtm = new pc.Mat4().setTRS(this._link.entity.getPosition(), this._link.entity.getRotation(), pc.Vec3.ONE);
        for (var i = 0; i < this.lines.length; i++)
            wtm.transformPoint(this.lines[i], this.lines[i]);

        this.visible = true;
    };
    // render lines
    Gizmo.prototype.render = function () {
        if (! app) return; // webgl not available

        if (! this.visible)
            return;

        app.renderLines(this.lines, colorBehind, noDepthImmediateRenderOptions);
        app.renderLines(this.lines, colorPrimary, immediateRenderOptions);
    };
    // link to entity
    Gizmo.prototype.link = function (obj) {
        this.unlink();
        this._link = obj;

        var self = this;

        this.events.push(this._link.once('destroy', function () {
            self.unlink();
        }));
    };
    // unlink
    Gizmo.prototype.unlink = function () {
        if (! this._link)
            return;

        for (var i = 0; i < this.events.length; i++)
            this.events[i].unbind();

        this.events = [];
        this._link = null;
        this.visible = false;
    };

    editor.on('selector:change', function (type, items) {
        // clear gizmos
        if (type !== 'entity') {
            for (var key in entities) {
                entities[key].unlink();
                pool.push(entities[key]);
            }
            entities = { };
            return;
        }

        // index selection
        var ids = { };
        for (var i = 0; i < items.length; i++)
            ids[items[i].get('resource_id')] = items[i];

        var render = false;

        // remove
        for (var key in entities) {
            if (ids[key])
                continue;

            pool.push(entities[key]);
            entities[key].unlink();
            delete entities[key];
            render = true;
        }

        // add
        for (var key in ids) {
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

    editor.once('viewport:load', function () {
        app = editor.call('viewport:app');

        noDepthImmediateRenderOptions = {
            layer: editor.call('gizmo:layers', 'Axis Gizmo Immediate'),
            mask: GIZMO_MASK,
            depthTest: false
        };

        immediateRenderOptions = {
            layer: editor.call('gizmo:layers', 'Bright Gizmo'),
            mask: GIZMO_MASK
        };
    });

    editor.on('viewport:gizmoUpdate', function (dt) {
        for (var key in entities) {
            entities[key].update();
            entities[key].render();
        }
    });
});
