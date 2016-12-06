editor.once('load', function() {
    'use strict';

    var app = editor.call('viewport:app');
    var renderer = app.renderer;
    var device = renderer.device;
    var scene = app.scene;

    var users = [ ];
    var selection = { };
    var colors = { };
    var render = 0;
    var cleared = false;

    var targets = [ ];
    var textures = [ ];


    editor.on('selector:change', function(type, items) {
        if (selection[config.self.id])
            render -= selection[config.self.id].length;

        if (! selection[config.self.id])
            users.unshift(config.self.id);

        selection[config.self.id] = [ ];

        if (type === 'entity') {
            for(var i = 0; i < items.length; i++) {
                var modelType = items[i].get('components.model.type');
                if (items[i].entity && (modelType === 'asset' && items[i].get('components.model.asset')) || modelType !== 'asset') {
                    selection[config.self.id].push(items[i].entity);
                    render++;
                }
            }
        }

        if (render)
            editor.call('viewport:render');
    });

    editor.on('selector:sync', function(user, data) {
        if (selection[user])
            render -= selection[user].length;

        if (! selection[user])
            users.push(user);

        selection[user] = [ ];

        if (data.type === 'entity') {
            for(var i = 0; i < data.ids.length; i++) {
                var entity = editor.call('entities:get', data.ids[i]);
                if (! entity) continue;

                var modelType = entity.get('components.model.type');
                if (entity.entity && (modelType === 'asset' && entity.get('components.model.asset')) || modelType !== 'asset') {
                    selection[user].push(entity.entity);
                    render++;
                }
            }
        }

        if (render)
            editor.call('viewport:render');
    });

    editor.on('whoisonline:remove', function(id) {
        if (! selection[id])
            return;

        render -= selection[id].length;

        delete selection[id];
        delete colors[id];
        var ind = users.indexOf(id);
        users.splice(ind, 1);
    });


    // material final
    var materialFinal = new pc.BasicMaterial();
    var shaderFinal;
    materialFinal.updateShader = function(device) {
        if (! shaderFinal) {
            shaderFinal = new pc.Shader(device, {
                attributes: {
                    aPosition: pc.SEMANTIC_POSITION
                },

                vshader: ' \
                    attribute vec2 aPosition;\n \
                    varying vec2 vUv0;\n \
                    void main(void)\n \
                    {\n \
                        gl_Position = vec4(aPosition, 0.0, 1.0);\n \
                        vUv0 = (aPosition.xy + 1.0) * 0.5;\n \
                    }\n',

                fshader: ' \
                    precision ' + device.precision + ' float;\n \
                    varying vec2 vUv0;\n \
                    uniform sampler2D uColorBuffer;\n \
                    void main(void)\n \
                    {\n \
                        gl_FragColor = texture2D(uColorBuffer, vUv0);\n \
                    }\n'
            });
        }
        this.shader = shaderFinal;
    };
    materialFinal.blend = true;
    materialFinal.blendDst = 8;
    materialFinal.blendEquation = 0;
    materialFinal.blendSrc = 6;
    materialFinal.blendType = 2;
    materialFinal.depthWrite = false;
    materialFinal.depthTest = false;
    materialFinal.update();


    var shaderBlurH = new pc.Shader(device, {
        attributes: {
            aPosition: pc.SEMANTIC_POSITION
        },

        vshader: ' \
            attribute vec2 aPosition;\n \
            varying vec2 vUv0;\n \
            void main(void)\n \
            {\n \
                gl_Position = vec4(aPosition, 0.0, 1.0);\n \
                vUv0 = (aPosition.xy + 1.0) * 0.5;\n \
            }\n',

        fshader: ' \
            precision ' + device.precision + ' float;\n \
            varying vec2 vUv0;\n \
            uniform float uOffset;\n \
            uniform sampler2D uColorBuffer;\n \
            void main(void)\n \
            {\n \
                float diff = 0.0;\n \
                vec4 pixel;\n \
                vec4 texel = texture2D(uColorBuffer, vUv0);\n \
                vec4 firstTexel = texel;\n \
                \n \
                pixel = texture2D(uColorBuffer, vUv0 + vec2(uOffset * -2.0, 0.0));\n \
                texel = max(texel, pixel);\n \
                diff = max(diff, length(firstTexel.rgb - pixel.rgb));\n \
                \n \
                pixel = texture2D(uColorBuffer, vUv0 + vec2(uOffset * -1.0, 0.0));\n \
                texel = max(texel, pixel);\n \
                diff = max(diff, length(firstTexel.rgb - pixel.rgb));\n \
                \n \
                pixel = texture2D(uColorBuffer, vUv0 + vec2(uOffset * +1.0, 0.0));\n \
                texel = max(texel, pixel);\n \
                diff = max(diff, length(firstTexel.rgb - pixel.rgb));\n \
                \n \
                pixel = texture2D(uColorBuffer, vUv0 + vec2(uOffset * +2.0, 0.0));\n \
                texel = max(texel, pixel);\n \
                diff = max(diff, length(firstTexel.rgb - pixel.rgb));\n \
                \n \
                gl_FragColor = vec4(texel.rgb, min(diff, 1.0));\n \
            }\n'
    });
    var shaderBlurV = new pc.Shader(device, {
        attributes: {
            aPosition: pc.SEMANTIC_POSITION
        },

        vshader: ' \
            attribute vec2 aPosition;\n \
            varying vec2 vUv0;\n \
            void main(void)\n \
            {\n \
                gl_Position = vec4(aPosition, 0.0, 1.0);\n \
                vUv0 = (aPosition.xy + 1.0) * 0.5;\n \
            }\n',

        fshader: ' \
            precision ' + device.precision + ' float;\n \
            varying vec2 vUv0;\n \
            uniform float uOffset;\n \
            uniform sampler2D uColorBuffer;\n \
            void main(void)\n \
            {\n \
                vec4 pixel;\n \
                vec4 texel = texture2D(uColorBuffer, vUv0);\n \
                vec4 firstTexel = texel;\n \
                float diff = texel.a;\n \
                \n \
                pixel = texture2D(uColorBuffer, vUv0 + vec2(0.0, uOffset * -2.0));\n \
                texel = max(texel, pixel);\n \
                diff = max(diff, length(firstTexel.rgb - pixel.rgb));\n \
                \n \
                pixel = texture2D(uColorBuffer, vUv0 + vec2(0.0, uOffset * -1.0));\n \
                texel = max(texel, pixel);\n \
                diff = max(diff, length(firstTexel.rgb - pixel.rgb));\n \
                \n \
                pixel = texture2D(uColorBuffer, vUv0 + vec2(0.0, uOffset * +1.0));\n \
                texel = max(texel, pixel);\n \
                diff = max(diff, length(firstTexel.rgb - pixel.rgb));\n \
                \n \
                pixel = texture2D(uColorBuffer, vUv0 + vec2(0.0, uOffset * +2.0));\n \
                texel = max(texel, pixel);\n \
                diff = max(diff, length(firstTexel.rgb - pixel.rgb));\n \
                \n \
                gl_FragColor = vec4(texel.rgb, min(diff, 1.0));\n \
            }\n'
    });


    var node = new pc.GraphNode();
    var mesh = new pc.Mesh();

    var vertexFormat = new pc.gfx.VertexFormat(device, [
        { semantic: pc.gfx.SEMANTIC_POSITION, components: 2, type: pc.gfx.ELEMENTTYPE_FLOAT32 }
    ]);
    var vertexBuffer = new pc.gfx.VertexBuffer(device, vertexFormat, 4);
    var iterator = new pc.gfx.VertexIterator(vertexBuffer);
    iterator.element[pc.SEMANTIC_POSITION].set(-1, -1);
    iterator.next();
    iterator.element[pc.SEMANTIC_POSITION].set(1, -1);
    iterator.next();
    iterator.element[pc.SEMANTIC_POSITION].set(-1, 1);
    iterator.next();
    iterator.element[pc.SEMANTIC_POSITION].set(1, 1);
    iterator.end();
    mesh.vertexBuffer = vertexBuffer;


    var indices = [ 0, 1, 2, 1, 3, 2 ];
    var indexBuffer = new pc.IndexBuffer(device, pc.INDEXFORMAT_UINT16, indices.length);
    var dst = new Uint16Array(indexBuffer.lock());
    dst.set(indices);
    indexBuffer.unlock();
    mesh.indexBuffer[0] = indexBuffer;

    mesh.primitive[0].type = pc.PRIMITIVE_TRIANGLES;
    mesh.primitive[0].base = 0;
    mesh.primitive[0].count = indices.length;
    mesh.primitive[0].indexed = true;

    var meshInstance = new pc.MeshInstance(node, mesh, materialFinal);
    meshInstance.updateKey = function() {
        this.key = pc._getDrawcallSortKey(14, this.material.blendType, false, 0);
    };
    meshInstance.layer = 14;
    meshInstance.updateKey();
    meshInstance.cull = false;
    meshInstance.pick = false;
    meshInstance.drawToDepth = false;

    scene.drawCalls.push(meshInstance);

    // add program lib with outline shader
    device.programLib.register('outline', {
        generateKey: function(device, options) {
            var key = 'outline';
            if (options.skin) key += '_skin';
            if (options.opacityMap) key += '_opam';
            if (options.instancing) key += '_inst';
            return key;
        },
        createShaderDefinition: function(device, options) {
            // attributes
            var attributes = {
                vertex_position: pc.SEMANTIC_POSITION
            };

            if (options.skin) {
                attributes.vertex_boneWeights = pc.SEMANTIC_BLENDWEIGHT;
                attributes.vertex_boneIndices = pc.SEMANTIC_BLENDINDICES;
            }

            if (options.opacityMap)
                attributes.vertex_texCoord0 = pc.SEMANTIC_TEXCOORD0;

            // vertex shader
            var chunks = pc.shaderChunks;
            var code = '';

            // vertex start
            code += chunks.transformDeclVS;
            if (options.skin) {
                code += pc.programlib.skinCode(device);
                code += chunks.transformSkinnedVS;
            } else if (options.instancing) {
                attributes.instance_line1 = pc.SEMANTIC_TEXCOORD2;
                attributes.instance_line2 = pc.SEMANTIC_TEXCOORD3;
                attributes.instance_line3 = pc.SEMANTIC_TEXCOORD4;
                attributes.instance_line4 = pc.SEMANTIC_TEXCOORD5;
                code += chunks.instancingVS;
                code += chunks.transformInstancedVS;
            } else {
                code += chunks.transformVS;
            }
            if (options.opacityMap) {
                code += "attribute vec2 vertex_texCoord0;\n\n";
                code += 'varying vec2 vUv0;\n\n';
            }

            // vertex body
            code += pc.programlib.begin();
            code += "   gl_Position = getPosition();\n";
            if (options.opacityMap)
                code += '    vUv0 = vertex_texCoord0;\n';
            code += pc.programlib.end();

            var vshader = code;

            // fragment shader
            code = pc.programlib.precisionCode(device);

            if (options.opacityMap) {
                code += 'varying vec2 vUv0;\n\n';
                code += 'uniform sampler2D texture_opacityMap;\n\n';
                code += chunks.alphaTestPS;
            }

            code += 'uniform vec4 uColor;\n';

            code += pc.programlib.begin();

            if (options.opacityMap) {
                code += '    alphaTest(texture2D(texture_opacityMap, vUv0).' + options.opacityChannel + ' );\n\n';
            }

            code += "float depth = gl_FragCoord.z / gl_FragCoord.w;\n";
            code += "gl_FragColor = uColor;\n";

            code += pc.programlib.end();
            var fshader = code;

            return {
                attributes: attributes,
                vshader: vshader,
                fshader: fshader
            };
        }
    });

    var shaderStatic = device.programLib.getProgram('outline', {
        skin: false
    });
    var shaderSkin = device.programLib.getProgram('outline', {
        skin: true
    });
    var shaderStaticOp = { };
    var shaderSkinOp = { };

    var chan = [ 'r', 'g', 'b', 'a' ];
    for(var c = 0; c < chan.length; c++) {
        shaderStaticOp[chan[c]] = device.programLib.getProgram('outline', {
            skin: false,
            opacityMap: true,
            opacityChannel: chan[c]
        });
        shaderSkinOp[chan[c]] = device.programLib.getProgram('outline', {
            skin: true,
            opacityMap: true,
            opacityChannel: chan[c]
        });
        shaderStaticOp[chan[c]] = device.programLib.getProgram('outline', {
            skin: false,
            opacityMap: true,
            opacityChannel: chan[c]
        });
        shaderSkinOp[chan[c]] = device.programLib.getProgram('outline', {
            skin: true,
            opacityMap: true,
            opacityChannel: chan[c]
        });
    }


    editor.on('viewport:preRender', function() {
        if (! render && cleared) return;

        if (targets[0] && (targets[0].width !== device.width || targets[1].height !== device.height)) {
            for(var i = 0; i < 2; i++) {
                targets[i].destroy();
                textures[i].destroy();
            }
            targets = [ ];
            textures = [ ];
        }

        if (! targets[0]) {
            for(var i = 0; i < 2; i++) {
                textures[i] = new pc.Texture(device, {
                    format: pc.PIXELFORMAT_R8_G8_B8_A8,
                    width: device.width,
                    height: device.height
                });
                textures[i].minFilter = pc.FILTER_NEAREST;
                textures[i].magFilter = pc.FILTER_NEAREST;
                textures[i].addressU = pc.ADDRESS_CLAMP_TO_EDGE;
                textures[i].addressV = pc.ADDRESS_CLAMP_TO_EDGE;

                targets[i] = new pc.RenderTarget(device, textures[i]);
            }

            meshInstance.setParameter('uColorBuffer', textures[0]);
        }


        var camera = editor.call('camera:current').camera.camera;

        var oldTarget = camera.renderTarget;

        if (render) {
            meshInstance.visible = true;
            camera.renderTarget = targets[0];
            renderer.setCamera(camera);

            device.clear({
                color: [ 0, 0, 0, 0 ],
                depth: 1.0,
                flags: pc.CLEARFLAG_COLOR | pc.CLEARFLAG_DEPTH
            });

            var ind = scene.drawCalls.indexOf(meshInstance);
            scene.drawCalls.splice(ind, 1);
            scene.drawCalls.push(meshInstance);

            var oldBlending = device.getBlending();
            device.setBlending(false);

            for(var u = 0; u < users.length; u++) {
                var id = parseInt(users[u], 10);

                if (! selection.hasOwnProperty(id) || ! selection[id].length)
                    continue;

                var color = colors[id];
                if (! color) {
                    var data = editor.call('whoisonline:color', id, 'data');
                    if (config.self.id === id)
                        data = [ 1, 1, 1 ];

                    colors[id] = new pc.Color(data[0], data[1], data[2]);
                    color = colors[id];
                }

                for(var i = 0; i < selection[id].length; i++) {
                    if (! selection[id][i])
                        continue;

                    var model = selection[id][i].model;
                    if (! model || ! model.model)
                        continue;

                    var meshes = model.meshInstances;
                    for(var m = 0; m < meshes.length; m++) {
                        var opChan = 'r';
                        var instance = meshes[m];

                        if (! instance.command && instance.drawToDepth && instance.material && instance.layer === pc.LAYER_WORLD) {
                            var mesh = instance.mesh;

                            var uColor = device.scope.resolve('uColor');
                            uColor.setValue(color.data);

                            renderer.modelMatrixId.setValue(instance.node.worldTransform.data);

                            var material = instance.material;
                            if (material.opacityMap) {
                                renderer.opacityMapId.setValue(material.opacityMap);
                                renderer.alphaTestId.setValue(material.alphaTest);
                                if (material.opacityMapChannel) opChan = material.opacityMapChannel;
                            }

                            if (instance.skinInstance) {
                                renderer._skinDrawCalls++;
                                renderer.skinPosOffsetId.setValue(instance.skinInstance.rootNode.getPosition().data);
                                if (device.supportsBoneTextures) {
                                    var boneTexture = instance.skinInstance.boneTexture;
                                    renderer.boneTextureId.setValue(boneTexture);
                                    renderer.boneTextureSizeId.setValue([boneTexture.width, boneTexture.height]);
                                } else {
                                    renderer.poseMatrixId.setValue(instance.skinInstance.matrixPalette);
                                }
                                device.setShader(material.opacityMap ? shaderSkinOp[opChan] : shaderSkin);
                            } else {
                                device.setShader(material.opacityMap ? shaderStaticOp[opChan] : shaderStatic);
                            }

                            var style = instance.renderStyle;

                            device.setVertexBuffer(mesh.vertexBuffer, 0);
                            device.setIndexBuffer(mesh.indexBuffer[style]);
                            device.draw(mesh.primitive[style]);
                            renderer._depthDrawCalls++;
                        }
                    }
                }
            }

            // blur pass X
            camera.renderTarget = targets[1];
            renderer.setCamera(camera);
            var mesh = meshInstance.mesh;
            var uOffset = device.scope.resolve('uOffset');
            var uColorBuffer = device.scope.resolve('uColorBuffer');
            uOffset.setValue(1.0 / device.width / 2.0);
            uColorBuffer.setValue(textures[0]);
            device.setShader(shaderBlurH);
            device.setVertexBuffer(mesh.vertexBuffer, 0);
            device.setIndexBuffer(mesh.indexBuffer[0]);
            device.draw(mesh.primitive[0]);
            renderer._depthDrawCalls++;

            // blur pass Y
            camera.renderTarget = targets[0];
            renderer.setCamera(camera);
            var mesh = meshInstance.mesh;
            var uOffset = device.scope.resolve('uOffset');
            var uColorBuffer = device.scope.resolve('uColorBuffer');
            uOffset.setValue(1.0 / device.height / 2.0);
            uColorBuffer.setValue(textures[1]);
            device.setShader(shaderBlurV);
            device.setVertexBuffer(mesh.vertexBuffer, 0);
            device.setIndexBuffer(mesh.indexBuffer[0]);
            device.draw(mesh.primitive[0]);
            renderer._depthDrawCalls++;

            device.setBlending(oldBlending);
            cleared = false;
        } else {
            meshInstance.visible = false;
            cleared = true;
        }

        camera.renderTarget = oldTarget;
    });
});
