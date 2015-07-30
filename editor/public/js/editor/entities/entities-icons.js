editor.once('load', function() {
    'use strict';

    var app;
    var iconsEntity;
    var textureNames = [ 'animation', 'audiolistener', 'audiosource', 'camera', 'collision', 'light-point', 'light-directional', 'light-spot', 'particlesystem', 'rigidbody', 'script', 'unknown' ];
    var components = [ 'camera', 'light', 'audiolistener', 'audiosource', 'particlesystem', 'script', 'animation', 'collision', 'rigidbody', 'model' ];
    var icons = [ ];
    var pool = [ ];
    var dirtifyKeys = [
        'enabled:set',
        'components.model.type:set',
        'components.model.asset:set',
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
        this.entity = new pc.Entity(app);
        this.entity._icon = true;
        this.entity._getEntity = function() {
            return self._link && self._link.entity || null;
        };
        this.entity.addComponent('model', {
            type: 'plane'
        });

        this.behind = new pc.Entity(app);
        this.behind._icon = true;
        this.behind._getEntity = this.entity._getEntity;
        this.entity.addChild(this.behind);
        this.behind.addComponent('model', {
            type: 'plane'
        });
        this.behind.model.model.meshInstances[0].layer = pc.LAYER_GIZMO;
        this.behind.model.model.meshInstances[0].pick = false;

        this.color = new pc.Color();

        this._link = null;
        this.events = [ ];
        this.eventsLocal = [ ];
        this.local = '';
        this.dirty = true;
        this.dirtify = function() {
            self.dirty = true;
        };
    }
    Icon.prototype.update = function() {
        if (! this._link || ! this._link.entity)
            return;

        // don't render if selected or disabled
        if (selectedIds[this._link.get('resource_id')] || ! this._link.entity.enabled || scale === 0) {
            this.entity.enabled = false;
            this.dirty = true;
            return;
        }

        // position
        this.entity.setPosition(this._link.entity.getPosition());
        this.entity.setLocalScale(scale, scale, scale);
        this.entity.setRotation(cameraRotation);
        this.entity.rotateLocal(90, 0, 0);


        if (! this.dirty) return;
        this.dirty = false;

        // hide icon if model is set
        if (this._link.has('components.model') && (this._link.get('components.model.type') !== 'asset' || this._link.get('components.model.asset'))) {
            this.entity.enabled = false;
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
            this.entity.model.model.meshInstances[0].setParameter('uColor', this.color.data);

            this.color.a = 0.25;
            this.behind.model.model.meshInstances[0].setParameter('texture_diffuseMap', textures[textureName]);
            this.behind.model.model.meshInstances[0].setParameter('uColor', this.color.data);

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
        } else {
            this.entity.enabled = false;
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
        iconsEntity.addChild(this.entity);
        this.dirty = true;
    };
    Icon.prototype.unlink = function() {
        if (! this._link)
            return;

        for(var i = 0; i < this.events.length; i++)
            this.events[i].unbind();

        this.entity.enabled = false;
        this.events = [ ];
        this._link = null;

        var ind = icons.indexOf(this);
        icons.splice(ind, 1);
        pool.push(this);

        iconsEntity.removeChild(this.entity);
    };

    editor.once('viewport:load', function() {
        app = editor.call('viewport:framework');

        material = new pc.BasicMaterial();
        material.updateShader = function(device) {
            this.shader = new pc.Shader(device, {
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
                    precision highp float;\n \
                    uniform vec4 uColor;\n \
                    varying vec2 vUv0;\n \
                    uniform sampler2D texture_diffuseMap;\n \
                    void main(void)\n \
                    {\n \
                        float alpha = texture2D(texture_diffuseMap, vUv0).b;\n \
                        if (alpha < 0.5) discard;\n \
                        gl_FragColor = vec4(uColor.rgb, uColor.a * alpha);\n \
                    }\n',
            });
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
        if (app) cameraRotation.copy(app.activeCamera.getRotation());

        for(var i = 0; i < icons.length; i++)
            icons[i].update();
    });

    editor.method('viewport:icons:size', function(size) {
        if (size === undefined)
            return scale;

        scale = size;
        editor.call('viewport:render');
    });
});
