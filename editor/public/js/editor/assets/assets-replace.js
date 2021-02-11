editor.once('load', function () {
    'use strict';

    var slots = ['aoMap', 'diffuseMap', 'emissiveMap', 'glossMap', 'lightMap', 'metalnessMap', 'opacityMap', 'specularMap', 'normalMap', 'sphereMap'];

    /**
     * Replaces the specified asset with the replacement asset everywhere
     *
     * @param {Observer} asset - The original asset
     * @param {Observer} replacement - The replacement asset
     */
    var AssetReplace = function (asset, replacement) {
        this.asset = asset;
        this.replacement = replacement;

        this.oldId = parseInt(asset.get('id'), 10);
        this.newId = parseInt(replacement.get('id'), 10);

        this.entities = editor.call('entities:list');
        this.assets = editor.call('assets:list');

        this.records = [];
    };

    /**
     * Set the replacement asset for the specified object at the specified path
     *
     * @param {Observer} obj - The object
     * @param {string} path - The path that we are replacing
     */
    AssetReplace.prototype.set = function (obj, path) {
        var history = obj.history.enabled;
        obj.history.enabled = false;
        obj.set(path, this.newId);
        obj.history.enabled = history;

        if (history) {
            this.records.push({
                get: obj.history._getItemFn,
                path: path
            });
        }
    };

    AssetReplace.prototype.handleAnimation = function () {
        // entity
        for (let i = 0; i < this.entities.length; i++) {
            var obj = this.entities[i];

            // animation
            var animation = obj.get('components.animation');
            if (animation && animation.assets) {
                for (var ind = 0; ind < animation.assets.length; ind++) {
                    if (animation.assets[ind] !== this.oldId)
                        continue;

                    // components.animation.assets.?
                    this.set(obj, 'components.animation.assets.' + ind);
                }
            }
        }
    };

    AssetReplace.prototype.handleAudio = function () {
        // entity
        for (let i = 0; i < this.entities.length; i++) {
            var obj = this.entities[i];

            // sound
            var sound = obj.get('components.sound');
            if (sound) {
                for (const ind in sound.slots) {
                    if (!sound.slots[ind] || sound.slots[ind].asset !== this.oldId)
                        continue;

                    // components.sound.slots.?.asset
                    this.set(obj, 'components.sound.slots.' + ind + '.asset');
                }
            }

            // audiosource
            var audiosource = obj.get('components.audiosource');
            if (audiosource && audiosource.assets) {
                for (var a = 0; a < audiosource.assets.length; a++) {
                    if (audiosource.assets[a] !== this.oldId)
                        continue;

                    // components.audiosource.assets.?
                    this.set(obj, 'components.audiosource.assets.' + a);
                }
            }
        }
    };

    AssetReplace.prototype.handleCubemap = function () {
        var i;
        var obj;

        // entity
        for (i = 0; i < this.entities.length; i++) {
            obj = this.entities[i];

            // light
            var light = obj.get('components.light');
            if (light && light.cookieAsset === this.oldId) {
                // components.light.cookieAsset
                this.set(obj, 'components.light.cookieAsset');
            }
        }

        // asset
        for (i = 0; i < this.assets.length; i++) {
            obj = this.assets[i];

            if (obj.get('type') === 'material' && obj.get('data.cubeMap') === this.oldId) {
                // data.cubeMap
                this.set(obj, 'data.cubeMap');
            }
        }

        // sceneSettings
        obj = editor.call('sceneSettings');
        if (obj.get('render.skybox') === this.oldId) {
            // render.skybox
            this.set(obj, 'render.skybox');
        }
    };

    AssetReplace.prototype.handleMaterial = function () {
        var obj;
        var i;
        var ind;

        // entity
        for (i = 0; i < this.entities.length; i++) {
            obj = this.entities[i];

            // model
            var model = obj.get('components.model');
            if (model) {
                if (model.materialAsset === this.oldId) {
                    // components.model.materialAsset
                    this.set(obj, 'components.model.materialAsset');
                }
                if (model.mapping) {
                    for (ind in model.mapping) {
                        if (model.mapping[ind] === this.oldId) {
                            // components.model.mapping.?
                            this.set(obj, 'components.model.mapping.' + ind);
                        }
                    }
                }
            }

            // element
            var element = obj.get('components.element');
            if (element && element.materialAsset === this.oldId) {
                // components.element.materialAsset
                this.set(obj, 'components.element.materialAsset');
            }
        }

        // asset
        for (i = 0; i < this.assets.length; i++) {
            obj = this.assets[i];

            if (obj.get('type') === 'model') {
                var mapping = obj.get('data.mapping');
                if (mapping) {
                    for (ind = 0; ind < mapping.length; ind++) {
                        if (mapping[ind].material !== this.oldId)
                            continue;

                        // data.mapping.?.material
                        this.set(obj, 'data.mapping.' + ind + '.material');

                        // change meta.userMapping as well
                        var history = obj.history.enabled;
                        obj.history.enabled = false;
                        if (!obj.get('meta')) {
                            obj.set('meta', {
                                userMapping: {}
                            });
                        } else {
                            if (!obj.has('meta.userMapping'))
                                obj.set('meta.userMapping', {});
                        }

                        obj.set('meta.userMapping.' + ind, true);

                        obj.history.enabled = history;
                    }
                }
            }
        }
    };

    AssetReplace.prototype.handleModel = function () {
        var obj;
        var i;

        // entity
        for (i = 0; i < this.entities.length; i++) {
            obj = this.entities[i];

            // model
            var model = obj.get('components.model');
            if (model && model.asset === this.oldId) {
                // components.model.asset
                this.set(obj, 'components.model.asset');
            }

            // collision
            var collision = obj.get('components.collision');
            if (collision && collision.asset === this.oldId) {
                // components.collision.asset
                this.set(obj, 'components.collision.asset');
            }

            // particlesystem
            var particlesystem = obj.get('components.particlesystem');
            if (particlesystem && particlesystem.mesh === this.oldId) {
                // components.particlesystem.mesh
                this.set(obj, 'components.particlesystem.mesh');
            }
        }
    };

    AssetReplace.prototype.handleSprite = function () {
        var obj;
        var i;

        // entity
        for (i = 0; i < this.entities.length; i++) {
            obj = this.entities[i];

            // sprite component
            var sprite = obj.get('components.sprite');
            if (sprite) {
                if (sprite.spriteAsset && sprite.spriteAsset === this.oldId) {
                    this.set(obj, 'components.sprite.spriteAsset');
                }

                if (sprite.clips) {
                    for (const key in sprite.clips) {
                        if (sprite.clips[key].spriteAsset && sprite.clips[key].spriteAsset === this.oldId) {
                            this.set(obj, 'components.sprite.clips.' + key + '.spriteAsset');
                        }
                    }
                }
            }

            // button component
            var button = obj.get('components.button');
            if (button) {
                if (button.hoverSpriteAsset && button.hoverSpriteAsset === this.oldId) {
                    this.set(obj, 'components.button.hoverSpriteAsset');
                }

                if (button.pressedSpriteAsset && button.pressedSpriteAsset === this.oldId) {
                    this.set(obj, 'components.button.pressedSpriteAsset');
                }

                if (button.inactiveSpriteAsset && button.inactiveSpriteAsset === this.oldId) {
                    this.set(obj, 'components.button.inactiveSpriteAsset');
                }
            }

            // element component
            var element = obj.get('components.element');
            if (element) {
                if (element.spriteAsset && element.spriteAsset === this.oldId) {
                    this.set(obj, 'components.element.spriteAsset');
                }
            }
        }
    };

    AssetReplace.prototype.handleTexture = function () {
        var i;
        var obj;

        // entity
        for (i = 0; i < this.entities.length; i++) {
            obj = this.entities[i];

            // light
            var light = obj.get('components.light');
            if (light && light.cookieAsset === this.oldId) {
                // components.light.cookieAsset
                this.set(obj, 'components.light.cookieAsset');
            }

            // particlesystem
            var particlesystem = obj.get('components.particlesystem');
            if (particlesystem) {
                if (particlesystem.colorMapAsset === this.oldId) {
                    // components.particlesystem.colorMapAsset
                    this.set(obj, 'components.particlesystem.colorMapAsset');
                }
                if (particlesystem.normalMapAsset === this.oldId) {
                    // components.particlesystem.normalMapAsset
                    this.set(obj, 'components.particlesystem.normalMapAsset');
                }
            }

            // element
            var element = obj.get('components.element');
            if (element && element.textureAsset === this.oldId) {
                // components.element.textureAsset
                this.set(obj, 'components.element.textureAsset');
            }

            // button component
            var button = obj.get('components.button');
            if (button) {
                if (button.hoverTextureAsset && button.hoverTextureAsset === this.oldId) {
                    this.set(obj, 'components.button.hoverTextureAsset');
                }

                if (button.pressedTextureAsset && button.pressedTextureAsset === this.oldId) {
                    this.set(obj, 'components.button.pressedTextureAsset');
                }

                if (button.inactiveTextureAsset && button.inactiveTextureAsset === this.oldId) {
                    this.set(obj, 'components.button.inactiveTextureAsset');
                }
            }

        }

        // asset
        for (i = 0; i < this.assets.length; i++) {
            obj = this.assets[i];

            if (obj.get('type') === 'cubemap') {
                var textures = obj.get('data.textures');
                if (textures && textures instanceof Array) {
                    for (var ind = 0; ind < textures.length; ind++) {
                        if (textures[ind] !== this.oldId)
                            continue;

                        // data.mapping.?.material
                        this.set(obj, 'data.textures.' + ind);
                    }
                }
            } else if (obj.get('type') === 'material') {
                var data = obj.get('data');
                if (data) {
                    for (var s = 0; s < slots.length; s++) {
                        if (data[slots[s]] !== this.oldId)
                            continue;

                        this.set(obj, 'data.' + slots[s]);
                    }
                }
            }
        }
    };

    AssetReplace.prototype.handleTextureAtlas = function () {
        var obj;
        var i;

        // asset
        for (i = 0; i < this.assets.length; i++) {
            obj = this.assets[i];

            if (obj.get('type') === 'sprite') {
                var atlas = obj.get('data.textureAtlasAsset');
                if (atlas !== this.oldId) {
                    continue;
                }

                this.set(obj, 'data.textureAtlasAsset');
            }
        }
    };

    AssetReplace.prototype.handleTextureToSprite = function () {
        var obj;
        var i;

        var oldId = this.oldId;
        var newId = this.newId;
        var changed = [];

        for (i = 0; i < this.entities.length; i++) {
            obj = this.entities[i];

            var element = obj.get('components.element');
            if (element && element.textureAsset === oldId) {
                changed.push(obj);
                var history = obj.history.enabled;
                obj.history.enabled = false;
                obj.set('components.element.textureAsset', null);
                obj.set('components.element.spriteAsset', newId);
                obj.history.enabled = history;

                if (history) {
                    // set up undo
                    editor.call('history:add', {
                        name: 'asset texture to sprite',
                        undo: function () {
                            for (let i = 0; i < changed.length; i++) {
                                var obj = changed[i];
                                var history = obj.history.enabled;
                                obj.history.enabled = false;
                                obj.set('components.element.textureAsset', oldId);
                                obj.set('components.element.spriteAsset', null);
                                obj.history.enabled = history;
                            }
                        },

                        redo: function () {
                            for (let i = 0; i < changed.length; i++) {
                                var obj = changed[i];
                                var history = obj.history.enabled;
                                obj.history.enabled = false;
                                obj.set('components.element.textureAsset', null);
                                obj.set('components.element.spriteAsset', newId);
                                obj.history.enabled = history;
                            }
                        }
                    });
                }
            }
        }

    };

    AssetReplace.prototype.replaceScriptAttributes = function () {
        // entity.components.script
        for (let i = 0; i < this.entities.length; i++) {
            var obj = this.entities[i];

            // script
            var scripts = obj.get('components.script.scripts');
            if (scripts) {
                for (const script in scripts) {
                    var assetScript = editor.call('assets:scripts:assetByScript', script);
                    if (!assetScript)
                        continue;

                    var assetScripts = assetScript.get('data.scripts');
                    if (!assetScripts || !assetScripts[script] || !assetScripts[script].attributes)
                        continue;

                    var attributes = assetScripts[script].attributes;

                    for (const attrName in scripts[script].attributes) {
                        if (!attributes[attrName] || attributes[attrName].type !== 'asset')
                            continue;

                        if (attributes[attrName].array) {
                            var attrArray = scripts[script].attributes[attrName];
                            for (var j = 0; j < attrArray.length; j++) {
                                if (attrArray[j] !== this.oldId) continue;
                                this.set(obj, 'components.script.scripts.' + script + '.attributes.' + attrName + '.' + j);
                            }
                        } else {
                            if (scripts[script].attributes[attrName] !== this.oldId)
                                continue;

                            this.set(obj, 'components.script.scripts.' + script + '.attributes.' + attrName);
                        }
                    }
                }
            }
        }
    };

    AssetReplace.prototype.saveChanges = function () {
        var records = this.records;
        if (! records.length) return;

        var asset = this.asset;
        var oldId = this.oldId;
        var newId = this.newId;

        editor.call('history:add', {
            name: 'asset replace',
            undo: function () {
                for (let i = 0; i < records.length; i++) {
                    var obj = records[i].get();
                    if (!obj || !obj.has(records[i].path))
                        continue;

                    var history = asset.history.enabled;
                    obj.history.enabled = false;

                    obj.set(records[i].path, oldId);

                    // if we changed data.mapping also change meta.userMapping
                    if (/^data.mapping/.test(records[i].path)) {
                        if (obj.has('meta.userMapping')) {
                            var parts = records[i].path.split('.');
                            obj.unset('meta.userMapping.' + parts[2], true);
                            if (Object.keys(obj.get('meta.userMapping')).length === 0)
                                obj.unset('meta.userMapping');
                        }
                    }

                    obj.history.enabled = history;
                }
            },
            redo: function () {
                for (let i = 0; i < records.length; i++) {
                    var obj = records[i].get();
                    if (!obj || !obj.has(records[i].path))
                        continue;

                    var history = asset.history.enabled;
                    obj.history.enabled = false;
                    obj.set(records[i].path, newId);

                    // if we changed data.mapping also change meta.userMapping
                    if (/^data.mapping/.test(records[i].path)) {
                        if (!obj.get('meta')) {
                            obj.set('meta', {
                                userMapping: {}
                            });
                        } else {
                            if (!obj.has('meta.userMapping'))
                                obj.set('meta.userMapping', {});
                        }


                        var parts = records[i].path.split('.');
                        obj.set('meta.userMapping.' + parts[2], true);
                    }

                    obj.history.enabled = history;
                }
            }
        });
    };

    /**
     * Replaces the asset in all assets and components that it's referenced
     */
    AssetReplace.prototype.replace = function () {
        switch (this.asset.get('type')) {
            case 'animation':
                this.handleAnimation();
                break;
            case 'audio':
                this.handleAudio();
                break;
            case 'cubemap':
                this.handleCubemap();
                break;
            case 'material':
                this.handleMaterial();
                break;
            case 'model':
                this.handleModel();
                break;
            case 'sprite':
                this.handleSprite();
                break;
            case 'texture':
                this.handleTexture();
                break;
            case 'textureatlas':
                this.handleTextureAtlas();
                break;
        }

        this.replaceScriptAttributes();
        this.saveChanges();
    };

    // Special-case where we want to replace textures with sprites
    // This will only work on Element components and will replace a texture asset with sprite asset
    // It is not available generally only behind a user flag
    AssetReplace.prototype.replaceTextureToSprite = function () {
        var srcType = this.asset.get('type');
        var dstType = this.replacement.get('type');

        if (srcType !== 'texture' || dstType !== 'sprite') {
            log.error('replaceTextureToSprite must take texture and replace with sprite');
        }

        this.handleTextureToSprite();
        this.saveChanges();
    };

    editor.method('assets:replace', function (asset, replacement) {
        new AssetReplace(asset, replacement).replace();
    });

    editor.method('assets:replaceTextureToSprite', function (asset, replacement) {
        new AssetReplace(asset, replacement).replaceTextureToSprite();
    });

});
