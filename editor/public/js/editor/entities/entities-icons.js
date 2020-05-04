editor.once('load', function() {
    'use strict';

    var app;
    var iconsEntity;
    var textureNames = [ 'animation', 'audiolistener', 'audiosource', 'sound', 'camera', 'collision', 'light-point', 'light-directional', 'light-spot', 'particlesystem', 'rigidbody', 'script', 'unknown' ];
    var components = [ 'camera', 'light', 'audiolistener', 'audiosource', 'sound', 'particlesystem', 'script', 'animation', 'model' ];
    var icons = [ ];
    var pool = [ ];
    var dirtifyKeys = [
        'enabled:set',
        'components.model.type:set',
        'components.model.asset:set'
    ];
    var dirtifyLocalKeys = {
        'light': [
            'components.light.color.0:set',
            'components.light.color.1:set',
            'components.light.color.2:set',
            'components.light.type:set'
        ]
    };
    var material = null;
    var materialBehind = null;
    var iconColor = new pc.Color(1, 1, 1, 1);
    var textures = { };
    var scale = .5;
    var cameraRotation = new pc.Quat();
    var rotateMatrix = new pc.Mat4().setFromAxisAngle(pc.Vec3.LEFT, -90);
    var quadMaterial = new pc.Material();
    var selectedIds = { };

    // icon class
    function Icon() {
        var self = this;

        this.entity = null;
        this.behind = null;
        this.color = new pc.Color();
        this.colorUniform = new Float32Array(4);

        this._link = null;
        this.events = [ ];
        this.eventsLocal = [ ];
        this.local = '';
        this.dirty = true;
        this.dirtify = function() {
            self.dirty = true;
        };
    }

    Icon.prototype.entityCreate = function() {
        if (this.entity)
            return;

        if (! app) return; // webgl not available

        var self = this;

        this.entity = new pc.Entity('front', app);
        this.entity._icon = true;
        this.entity._getEntity = function() {
            return self._link && self._link.entity || null;
        };

        var layerFront = editor.call('gizmo:layers', 'Bright Gizmo');
        var layerBehind = editor.call('gizmo:layers', 'Dim Gizmo');

        this.entity.addComponent('model', {
            type: 'plane',
            castShadows: false,
            receiveShadows: false,
            castShadowsLightmap: false,
            layers: [layerFront.id],
        });
        this.entity.model.meshInstances[0].__editor = true;
        this.entity.model.meshInstances[0].mask = GIZMO_MASK;

        if (this._link && this._link.entity)
            this.entity.setPosition(this._link.entity.getPosition());

        this.entity.setLocalScale(scale, scale, scale);
        this.entity.setRotation(cameraRotation);
        this.entity.rotateLocal(90, 0, 0);

        this.behind = new pc.Entity('behind', app);
        this.behind._icon = true;
        this.behind._getEntity = this.entity._getEntity;
        this.entity.addChild(this.behind);
        this.behind.addComponent('model', {
            type: 'plane',
            castShadows: false,
            receiveShadows: false,
            castShadowsLightmap: false,
            layers: [layerBehind.id]
        });
        // this.behind.model.model.meshInstances[0].layer = pc.LAYER_GIZMO;
        this.behind.model.model.meshInstances[0].mask = GIZMO_MASK;
        this.behind.model.model.meshInstances[0].pick = false;

        iconsEntity.addChild(this.entity);
        console.log(this);
    };

    Icon.prototype.entityDelete = function() {
        if (! this.entity)
            return;

        this.entity.destroy();

        this.entity = null;
        this.behind = null;
    };

    Icon.prototype.update = function(dt) {
        if (! this._link || ! this._link.entity)
            return;

        // don't render if selected or disabled
        if (! this._link.entity._enabled || ! this._link.entity._enabledInHierarchy || this._link.entity.__noIcon || scale === 0 || selectedIds[this._link.entity.getGuid()]) {
            if (this.entity)
                this.entityDelete();

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

        if (! this.dirty) return;
        this.dirty = false;

        // hide icon if model is set
        if (this._link.has('components.model') && this._link.get('components.model.enabled') && (this._link.get('components.model.type') !== 'asset' || this._link.get('components.model.asset'))) {
            if (this.entity)
                this.entityDelete();
            return;
        }

        // hide icon if element is set
        if (this._link.has('components.element') && this._link.get('components.element.enabled')) {
            if (this.entity)
                this.entityDelete();
            return;
        }

        var component = '';
        for(var i = 0; i < components.length; i++) {
            if (! this._link.has('components.' + components[i]))
                continue;

            component = components[i];
            break;
        }

        if (component) {
            if (! this.entity)
                this.entityCreate();

            this.entity.enabled = true;
            this.entity.model.material = material;
            this.behind.model.material = materialBehind;

            this.color.copy(iconColor);
            var textureName = components[i];
            if (components[i] === 'light') {
                textureName += '-' + this._link.entity.light.type;
                this.color.copy(this._link.entity.light.color);
            }

            if (! textureName || ! textures[textureName])
                textureName = 'unknown';

            this.entity.model.model.meshInstances[0].setParameter('texture_diffuseMap', textures[textureName]);
            this.colorUniform[0] = this.color.r;
            this.colorUniform[1] = this.color.g;
            this.colorUniform[2] = this.color.b;
            this.colorUniform[3] = this.color.a;
            this.entity.model.model.meshInstances[0].setParameter('uColor', this.colorUniform);

            this.behind.model.model.meshInstances[0].setParameter('texture_diffuseMap', textures[textureName]);
            this.color.a = 0.25;
            this.colorUniform[3] = this.color.a;
            this.behind.model.model.meshInstances[0].setParameter('uColor', this.colorUniform);

            if (this.local !== components[i]) {
                // clear local binds
                for(var n = 0; n < this.eventsLocal.length; n++)
                    this.eventsLocal[n].unbind();
                this.eventsLocal = [ ];

                // add local binds
                if (dirtifyLocalKeys[components[i]]) {
                    for(var n = 0; n < dirtifyLocalKeys[components[i]].length; n++)
                        this.eventsLocal.push(this._link.on(dirtifyLocalKeys[components[i]][n], this.dirtify));
                }
            }
        } else if (this.entity) {
            this.entityDelete();
        }
    };
    Icon.prototype.link = function(obj) {
        this.unlink();

        this._link = obj;
        for(var i = 0; i < dirtifyKeys.length; i++)
            this.events.push(obj.on(dirtifyKeys[i], this.dirtify));

        for(var i = 0; i < components.length; i++) {
            this.events.push(obj.on('components.' + components[i] + ':set', this.dirtify));
            this.events.push(obj.on('components.' + components[i] + ':unset', this.dirtify));
        }

        var self = this;
        this.events.push(obj.once('destroy', function() {
            self.unlink();
        }));

        icons.push(this);

        this.dirty = true;
    };
    Icon.prototype.unlink = function() {
        if (! this._link)
            return;

        for(var i = 0; i < this.events.length; i++)
            this.events[i].unbind();

        if (this.entity)
            this.entityDelete();

        this.events = [ ];
        this._link = null;

        var ind = icons.indexOf(this);
        icons.splice(ind, 1);
        pool.push(this);
    };

    editor.once('viewport:load', function() {
        app = editor.call('viewport:app');
        if (! app) return; // webgl not available

        var shader;

        material = new pc.BasicMaterial();
        material.updateShader = function(device) {
            if (! shader) {
                shader = new pc.Shader(device, {
                    attributes: {
                        vertex_position: 'POSITION'
                    },
                    vshader: ' \
                        attribute vec3 vertex_position;\n \
                        uniform mat4 matrix_model;\n \
                        uniform mat4 matrix_viewProjection;\n \
                        varying vec2 vUv0;\n \
                        void main(void)\n \
                        {\n \
                            mat4 modelMatrix = matrix_model;\n \
                            vec4 positionW = modelMatrix * vec4(vertex_position, 1.0);\n \
                            gl_Position = matrix_viewProjection * positionW;\n \
                            vUv0 = vertex_position.xz + vec2(0.5);\n \
                            vUv0.y = 1.0 - vUv0.y;\n \
                        }\n',
                    fshader: ' \
                        precision ' + device.precision + ' float;\n \
                        uniform vec4 uColor;\n \
                        varying vec2 vUv0;\n \
                        uniform sampler2D texture_diffuseMap;\n \
                        void main(void)\n \
                        {\n \
                            float alpha = texture2D(texture_diffuseMap, vUv0).b;\n \
                            if (alpha < 0.5) discard;\n \
                            gl_FragColor = vec4(uColor.rgb, uColor.a * alpha);\n \
                        }\n'
                });
            }

            this.shader = shader;
        };
        material.update();

        materialBehind = new pc.BasicMaterial();
        materialBehind.blend = true;
        materialBehind.blendSrc = pc.BLENDMODE_SRC_ALPHA;
        materialBehind.blendDst = pc.BLENDMODE_ONE_MINUS_SRC_ALPHA;
        materialBehind.updateShader = material.updateShader;
        materialBehind.update();

        iconsEntity = new pc.Entity(app);
        app.root.addChild(iconsEntity);

        for(var i = 0; i < textureNames.length; i++) {
            textures[textureNames[i]] = new pc.Texture(app.graphicsDevice, {
                width: 64,
                height: 64
            });
            textures[textureNames[i]].anisotropy = 16;
            textures[textureNames[i]].addressU = pc.ADDRESS_CLAMP_TO_EDGE;
            textures[textureNames[i]].addressV = pc.ADDRESS_CLAMP_TO_EDGE;

            var img = new Image();
            img.textureName = textureNames[i];
            img.onload = function() {
                textures[this.textureName].setSource(this);
            };
            img.src = '/editor/scene/img/entity-icons/' + textureNames[i] + '.png';
        }

        editor.on('entities:add', function(obj) {
            var icon = pool.shift();
            if (! icon)
                icon = new Icon();

            icon.link(obj);
        });
    });

    editor.on('selector:change', function(type, items) {
        selectedIds = { };

        if (type !== 'entity')
            return;

        for(var i = 0; i < items.length; i++)
            selectedIds[items[i].get('resource_id')] = true;
    });

    editor.on('viewport:postUpdate', function() {
        if (app) cameraRotation.copy(editor.call('camera:current').getRotation());

        for(var i = 0; i < icons.length; i++)
            icons[i].update();
    });

    editor.method('viewport:icons:size', function(size) {
        if (size === undefined)
            return scale;

        scale = size;
        editor.call('viewport:render');
    });

    var settings = editor.call('settings:user');
    editor.call('viewport:icons:size', settings.get('editor.iconSize'));
    settings.on('editor.iconSize:set', function(size) {
        editor.call('viewport:icons:size', size);
    });
});
