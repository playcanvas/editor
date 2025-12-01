import { GIZMO_MASK } from '@/core/constants';

editor.once('load', () => {
    let app;
    let iconsEntity;
    const textureNames = ['animation', 'audiolistener', 'audiosource', 'sound', 'camera', 'collision', 'light-point', 'light-directional', 'light-spot', 'particlesystem', 'rigidbody', 'script', 'unknown'];
    const components = ['camera', 'light', 'audiolistener', 'audiosource', 'sound', 'particlesystem', 'script', 'animation', 'model'];
    const icons = [];
    const pool = [];
    const dirtifyKeys = [
        'enabled:set',
        'components.model.type:set',
        'components.model.asset:set'
    ];
    const dirtifyLocalKeys = {
        'light': [
            'components.light.color.0:set',
            'components.light.color.1:set',
            'components.light.color.2:set',
            'components.light.type:set'
        ]
    };
    let material = null;
    let materialBehind = null;
    const iconColor = new pc.Color(1, 1, 1, 1);
    const textures = { };
    let scale = 0.5;
    const cameraRotation = new pc.Quat();
    let selectedIds = { };

    // icon class
    class ViewportIcon {
        entity: any = null;
        behind: any = null;
        color = new pc.Color();
        colorUniform = new Float32Array(4);
        _link: any = null;
        events: any[] = [];
        eventsLocal: any[] = [];
        local = '';
        dirty = true;

        dirtify = () => {
            this.dirty = true;
        };

        entityCreate() {
            if (this.entity) {
                return;
            }

            if (!app) {
                return;
            } // webgl not available

            this.entity = new pc.Entity('front', app);
            this.entity._icon = true;
            this.entity._getEntity = () => {
                return this._link && this._link.entity || null;
            };

            const layerFront = editor.call('gizmo:layers', 'Bright Gizmo');
            const layerBehind = editor.call('gizmo:layers', 'Dim Gizmo');

            this.entity.addComponent('render', {
                type: 'plane',
                castShadows: false,
                receiveShadows: false,
                castShadowsLightmap: false,
                layers: [layerFront.id]
            });
            this.entity.render.meshInstances[0].__editor = true;
            this.entity.render.meshInstances[0].mask = GIZMO_MASK;

            if (this._link && this._link.entity) {
                this.entity.setPosition(this._link.entity.getPosition());
            }

            this.entity.setLocalScale(scale, scale, scale);
            this.entity.setRotation(cameraRotation);
            this.entity.rotateLocal(90, 0, 0);

            this.behind = new pc.Entity('behind', app);
            this.behind._icon = true;
            this.behind._getEntity = this.entity._getEntity;
            this.entity.addChild(this.behind);
            this.behind.addComponent('render', {
                type: 'plane',
                castShadows: false,
                receiveShadows: false,
                castShadowsLightmap: false,
                layers: [layerBehind.id]
            });
            this.behind.render.meshInstances[0].mask = GIZMO_MASK;
            this.behind.render.meshInstances[0].pick = false;

            iconsEntity.addChild(this.entity);
        }

        entityDelete() {
            if (!this.entity) {
                return;
            }

            this.entity.destroy();

            this.entity = null;
            this.behind = null;
        }

        update() {
            if (!this._link || !this._link.entity) {
                return;
            }

            // don't render if selected or disabled
            if (!this._link.entity._enabled || !this._link.entity._enabledInHierarchy || this._link.entity.__noIcon || scale === 0 || selectedIds[this._link.entity.getGuid()]) {
                if (this.entity) {
                    this.entityDelete();
                }

                this.dirty = true;
                return;
            }

            if (this.entity) {
                // position
                this.entity.setPosition(this._link.entity.getPosition());
                this.entity.setLocalScale(scale, scale, scale);
                this.entity.setRotation(cameraRotation);
                this.entity.rotateLocal(90, 0, 0);
            }

            if (!this.dirty) {
                return;
            }
            this.dirty = false;

            // hide icon if model is set
            if (this._link.has('components.model') && this._link.get('components.model.enabled') && (this._link.get('components.model.type') !== 'asset' || this._link.get('components.model.asset'))) {
                if (this.entity) {
                    this.entityDelete();
                }
                return;
            }

            // hide icon if element is set
            if (this._link.has('components.element') && this._link.get('components.element.enabled')) {
                if (this.entity) {
                    this.entityDelete();
                }
                return;
            }

            let component = '';
            for (let i = 0; i < components.length; i++) {
                if (!this._link.has(`components.${components[i]}`)) {
                    continue;
                }

                component = components[i];
                break;
            }

            if (component) {
                if (!this.entity) {
                    this.entityCreate();
                }

                this.entity.enabled = true;
                this.entity.render.material = material;
                this.behind.render.material = materialBehind;

                this.color.copy(iconColor);
                let textureName = component;
                if (component === 'light') {
                    textureName += `-${this._link.entity.light.type}`;
                    this.color.copy(this._link.entity.light.color);
                }

                if (!textureName || !textures[textureName]) {
                    textureName = 'unknown';
                }

                this.entity.render.meshInstances[0].setParameter('texture_diffuseMap', textures[textureName]);
                this.colorUniform[0] = this.color.r;
                this.colorUniform[1] = this.color.g;
                this.colorUniform[2] = this.color.b;
                this.colorUniform[3] = this.color.a;
                this.entity.render.meshInstances[0].setParameter('uColor', this.colorUniform);

                this.behind.render.meshInstances[0].setParameter('texture_diffuseMap', textures[textureName]);
                this.color.a = 0.25;
                this.colorUniform[3] = this.color.a;
                this.behind.render.meshInstances[0].setParameter('uColor', this.colorUniform);

                if (this.local !== component) {
                    // clear local binds
                    for (let n = 0; n < this.eventsLocal.length; n++) {
                        this.eventsLocal[n].unbind();
                    }
                    this.eventsLocal = [];

                    // add local binds
                    if (dirtifyLocalKeys[component]) {
                        for (let n = 0; n < dirtifyLocalKeys[component].length; n++) {
                            this.eventsLocal.push(this._link.on(dirtifyLocalKeys[component][n], this.dirtify));
                        }
                    }
                }
            } else if (this.entity) {
                this.entityDelete();
            }
        }

        link(obj) {
            this.unlink();

            this._link = obj;
            for (let i = 0; i < dirtifyKeys.length; i++) {
                this.events.push(obj.on(dirtifyKeys[i], this.dirtify));
            }

            for (let i = 0; i < components.length; i++) {
                this.events.push(obj.on(`components.${components[i]}:set`, this.dirtify));
                this.events.push(obj.on(`components.${components[i]}:unset`, this.dirtify));
            }

            this.events.push(obj.once('destroy', () => {
                this.unlink();
            }));

            icons.push(this);

            this.dirty = true;
        }

        unlink() {
            if (!this._link) {
                return;
            }

            for (let i = 0; i < this.events.length; i++) {
                this.events[i].unbind();
            }

            if (this.entity) {
                this.entityDelete();
            }

            this.events = [];
            this._link = null;

            const ind = icons.indexOf(this);
            icons.splice(ind, 1);
            pool.push(this);
        }
    }

    editor.once('viewport:load', (application) => {
        app = application;

        const vshader = `
            attribute vec3 vertex_position;

            uniform mat4 matrix_model;
            uniform mat4 matrix_viewProjection;

            varying vec2 vUv0;

            void main(void)
            {
                mat4 modelMatrix = matrix_model;
                vec4 positionW = modelMatrix * vec4(vertex_position, 1.0);
                gl_Position = matrix_viewProjection * positionW;
                vUv0 = vertex_position.xz + vec2(0.5);
            }`;

        const fshader = `
            varying vec2 vUv0;

            uniform vec4 uColor;
            uniform sampler2D texture_diffuseMap;

            void main(void)
            {
                float alpha = texture2D(texture_diffuseMap, vUv0).b;
                if (alpha < 0.5) discard;
                gl_FragColor = vec4(uColor.rgb, uColor.a * alpha);
            }`;

        const shaderDesc = {
            uniqueName: 'EntitiesIconShader',
            vertexGLSL: vshader,
            fragmentGLSL: fshader,
            attributes: {
                vertex_position: pc.SEMANTIC_POSITION
            }
        };

        material = new pc.ShaderMaterial(shaderDesc);
        material.update();

        materialBehind = new pc.ShaderMaterial(shaderDesc);
        materialBehind.blendState = new pc.BlendState(true, pc.BLENDEQUATION_ADD, pc.BLENDMODE_SRC_ALPHA, pc.BLENDMODE_ONE_MINUS_SRC_ALPHA);
        materialBehind.update();

        iconsEntity = new pc.Entity(app);
        app.root.addChild(iconsEntity);

        for (let i = 0; i < textureNames.length; i++) {
            textures[textureNames[i]] = new pc.Texture(app.graphicsDevice, {
                width: 64,
                height: 64
            });
            textures[textureNames[i]].anisotropy = 16;
            textures[textureNames[i]].addressU = pc.ADDRESS_CLAMP_TO_EDGE;
            textures[textureNames[i]].addressV = pc.ADDRESS_CLAMP_TO_EDGE;

            const img = new Image();
            img.textureName = textureNames[i];
            img.onload = function () {
                textures[this.textureName].setSource(this);
            };
            img.src = `/editor/scene/img/entity-icons/${textureNames[i]}.png`;
        }

        editor.on('entities:add', (obj) => {
            let icon = pool.shift();
            if (!icon) {
                icon = new ViewportIcon();
            }

            icon.link(obj);
        });
    });

    editor.on('selector:change', (type, items) => {
        selectedIds = { };

        if (type !== 'entity') {
            return;
        }

        for (let i = 0; i < items.length; i++) {
            selectedIds[items[i].get('resource_id')] = true;
        }
    });

    editor.on('viewport:postUpdate', () => {
        if (app) {
            cameraRotation.copy(editor.call('camera:current').getRotation());
        }

        for (let i = 0; i < icons.length; i++) {
            icons[i].update();
        }
    });

    editor.method('viewport:icons:size', (size) => {
        if (size === undefined) {
            return scale;
        }

        scale = size;
        editor.call('viewport:render');
    });

    const settings = editor.call('settings:user');
    editor.call('viewport:icons:size', settings.get('editor.iconSize'));
    settings.on('editor.iconSize:set', (size) => {
        editor.call('viewport:icons:size', size);
    });
});
