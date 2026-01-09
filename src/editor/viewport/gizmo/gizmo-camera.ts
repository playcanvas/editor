import { Color, Mat4, PROJECTION_PERSPECTIVE, Vec3 } from 'playcanvas';

editor.once('load', () => {
    let app;
    // selected entity gizmos
    let entities = { };
    // pool of gizmos
    const pool = [];
    // colors
    const colorBehind = new Color(1, 1, 1, 0.15);
    const colorsBehind = [];
    for (let i = 0; i < 24; i++) {
        colorsBehind.push(colorBehind);
    }
    const colorPrimary = new Color(1, 1, 1);
    const colorsPrimary = [];
    for (let i = 0; i < 24; i++) {
        colorsPrimary.push(colorPrimary);
    }

    // gizmo class
    class Gizmo {
        _link: any = null;

        lines: any[] = [];

        events: any[] = [];

        visible: boolean = false;

        constructor() {
            for (let i = 0; i < 24; i++) {
                this.lines.push(new Vec3());
            }
        }

        // update lines
        update() {
            if (!app) {
                return;
            } // webgl not available

            if (!this._link || !this._link.entity || editor.call('camera:current') === this._link.entity) {
                this.visible = false;
                return;
            }

            const camera = this._link.entity.camera;
            this.visible = camera && this._link.get('enabled') && this._link.get('components.camera.enabled') && editor.call('camera:current') !== this._link.entity;
            if (!this.visible) {
                return;
            }

            const nearClip = camera.nearClip || 0.0001;
            const farClip = camera.farClip;
            const fov = camera.fov * Math.PI / 180.0;
            const projection = camera.projection;

            const device = app.graphicsDevice;
            const rect = camera.rect;
            const aspectRatio = (device.width * rect.z) / (device.height * rect.w);

            let nx, ny, fx, fy;
            if (projection === PROJECTION_PERSPECTIVE) {
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
            const wtm = new Mat4().setTRS(this._link.entity.getPosition(), this._link.entity.getRotation(), Vec3.ONE);
            for (let i = 0; i < this.lines.length; i++) {
                wtm.transformPoint(this.lines[i], this.lines[i]);
            }

            this.visible = true;
        }

        // render lines
        render() {
            if (!app) {
                return;
            } // webgl not available

            if (!this.visible) {
                return;
            }

            let layer = editor.call('gizmo:layers', 'Axis Gizmo Immediate');
            app.drawLines(this.lines, colorsBehind, false, layer);

            layer = editor.call('gizmo:layers', 'Bright Gizmo');
            app.drawLines(this.lines, colorsPrimary, true, layer);
        }

        // link to entity
        link(obj) {
            this.unlink();
            this._link = obj;

            const self = this;

            this.events.push(this._link.once('destroy', () => {
                self.unlink();
            }));
        }

        // unlink
        unlink() {
            if (!this._link) {
                return;
            }

            for (let i = 0; i < this.events.length; i++) {
                this.events[i].unbind();
            }

            this.events = [];
            this._link = null;
            this.visible = false;
        }
    }

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
    });

    editor.on('viewport:gizmoUpdate', (dt) => {
        for (const key in entities) {
            entities[key].update();
            entities[key].render();
        }
    });
});
