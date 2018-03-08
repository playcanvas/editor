editor.once('load', function() {
    'use strict';

    var app = editor.call('viewport:app');
    if (! app) return; // webgl not available

    var renderer = app.renderer;
    var device = renderer.device;
    var scene = app.scene;

    var users = [ ];
    var selection = { };
    var colors = { };
    var render = 0;
    var cleared = false;
    var viewportLayer = null

    var targets = [ ];
    var textures = [ ];

    var SHADER_OUTLINE = 24;

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
                    if (!viewportLayer.enabled) {
                        viewportLayer.enabled = true;
                    }
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
                    if (!viewportLayer.enabled) {
                        viewportLayer.enabled = true;
                    }
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

    // ### OVERLAY QUAD MATERIAL ###
    var chunks = pc.shaderChunks;
    var shaderFinal = chunks.createShaderFromCode(device, chunks.fullscreenQuadVS, chunks.outputTex2DPS, "outputTex2D");

    // ### OUTLINE EXTEND SHADER H ###
    var shaderBlurHPS = ' \
        precision ' + device.precision + ' float;\n \
        varying vec2 vUv0;\n \
        uniform float uOffset;\n \
        uniform sampler2D source;\n \
        void main(void)\n \
        {\n \
            float diff = 0.0;\n \
            vec4 pixel;\n \
            vec4 texel = texture2D(source, vUv0);\n \
            vec4 firstTexel = texel;\n \
            \n \
            pixel = texture2D(source, vUv0 + vec2(uOffset * -2.0, 0.0));\n \
            texel = max(texel, pixel);\n \
            diff = max(diff, length(firstTexel.rgb - pixel.rgb));\n \
            \n \
            pixel = texture2D(source, vUv0 + vec2(uOffset * -1.0, 0.0));\n \
            texel = max(texel, pixel);\n \
            diff = max(diff, length(firstTexel.rgb - pixel.rgb));\n \
            \n \
            pixel = texture2D(source, vUv0 + vec2(uOffset * +1.0, 0.0));\n \
            texel = max(texel, pixel);\n \
            diff = max(diff, length(firstTexel.rgb - pixel.rgb));\n \
            \n \
            pixel = texture2D(source, vUv0 + vec2(uOffset * +2.0, 0.0));\n \
            texel = max(texel, pixel);\n \
            diff = max(diff, length(firstTexel.rgb - pixel.rgb));\n \
            \n \
            gl_FragColor = vec4(texel.rgb, min(diff, 1.0));\n \
        }\n';
    var shaderBlurH = chunks.createShaderFromCode(device, chunks.fullscreenQuadVS, shaderBlurHPS, "editorOutlineH");

    // ### OUTLINE EXTEND SHADER V ###
    var shaderBlurVPS = ' \
        precision ' + device.precision + ' float;\n \
        varying vec2 vUv0;\n \
        uniform float uOffset;\n \
        uniform sampler2D source;\n \
        void main(void)\n \
        {\n \
            vec4 pixel;\n \
            vec4 texel = texture2D(source, vUv0);\n \
            vec4 firstTexel = texel;\n \
            float diff = texel.a;\n \
            \n \
            pixel = texture2D(source, vUv0 + vec2(0.0, uOffset * -2.0));\n \
            texel = max(texel, pixel);\n \
            diff = max(diff, length(firstTexel.rgb - pixel.rgb));\n \
            \n \
            pixel = texture2D(source, vUv0 + vec2(0.0, uOffset * -1.0));\n \
            texel = max(texel, pixel);\n \
            diff = max(diff, length(firstTexel.rgb - pixel.rgb));\n \
            \n \
            pixel = texture2D(source, vUv0 + vec2(0.0, uOffset * +1.0));\n \
            texel = max(texel, pixel);\n \
            diff = max(diff, length(firstTexel.rgb - pixel.rgb));\n \
            \n \
            pixel = texture2D(source, vUv0 + vec2(0.0, uOffset * +2.0));\n \
            texel = max(texel, pixel);\n \
            diff = max(diff, length(firstTexel.rgb - pixel.rgb));\n \
            \n \
            gl_FragColor = vec4(texel.rgb, min(diff, 1.0));\n \
        }\n';
    var shaderBlurV = chunks.createShaderFromCode(device, chunks.fullscreenQuadVS, shaderBlurVPS, "editorOutlineV");


    // ### SETUP THE LAYER ###
    viewportLayer = editor.call('gizmo:layers', 'Viewport Outline');
    viewportLayer.onPostRender = function () {
        var uColorBuffer = device.scope.resolve('source');
        uColorBuffer.setValue(textures[0]);
        device.setBlending(true);
        device.setBlendFunction(pc.BLENDMODE_SRC_ALPHA, pc.BLENDMODE_ONE_MINUS_SRC_ALPHA);
        pc.drawQuadWithShader(device, null, shaderFinal, null, null, true);
    };

    var outlineLayer = new pc.Layer({
        name: "Outline",
        opaqueSortMode: pc.SORTMODE_NONE,
        passThrough: true,
        overrideClear: true,
        clearColorBuffer: true,
        clearDepthBuffer: true,
        clearColor: new pc.Color(0,0,0,0),
        shaderPass: SHADER_OUTLINE,

        onPostRender: function() {
            // extend pass X
            var uOffset = device.scope.resolve('uOffset');
            var uColorBuffer = device.scope.resolve('source');
            uOffset.setValue(1.0 / device.width / 2.0);
            uColorBuffer.setValue(textures[0]);
            pc.drawQuadWithShader(device, targets[1], shaderBlurH);

            // extend pass Y
            uOffset.setValue(1.0 / device.height / 2.0);
            uColorBuffer.setValue(textures[1]);
            pc.drawQuadWithShader(device, targets[0], shaderBlurV);
        }
    });
    var outlineComp = new pc.LayerComposition();
    outlineComp.pushOpaque(outlineLayer);

    var onUpdateShaderOutline = function(options) {
        if (options.pass !== SHADER_OUTLINE) return options;
        var outlineOptions = {
            opacityMap:                 options.opacityMap,
            opacityMapUv:               options.opacityMapUv,
            opacityMapChannel:          options.opacityMapChannel,
            opacityMapTransform:        options.opacityMapTransform,
            opacityVertexColor:         options.opacityVertexColor,
            opacityVertexColorChannel:  options.opacityVertexColorChannel,
            vertexColors:               options.vertexColors,
            alphaTest:                  options.alphaTest,
            skin:                       options.skin
        }
        return outlineOptions;
    };

    // ### RENDER EVENT ###
    editor.on('viewport:postUpdate', function() {
        if (! render && cleared) return;

        if (!render && !cleared) {
            viewportLayer.enabled = false;
        }

        // ### INIT/RESIZE RENDERTARGETS ###
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
        }


        var camera = editor.call('camera:current').camera;


        if (render) {
            // ### RENDER COLORED MESHINSTANCES TO RT0 ###

            outlineLayer.renderTarget = targets[0];
            outlineLayer.clearMeshInstances();
            if (outlineLayer.cameras[0] !== camera) {
                outlineLayer.clearCameras();
                outlineLayer.addCamera(camera);
            }
            var meshInstances = outlineLayer.opaqueMeshInstances;

            for(var u = 0; u < users.length; u++) {
                var id = parseInt(users[u], 10);

                if (! selection.hasOwnProperty(id) || ! selection[id].length)
                    continue;

                var color = colors[id];
                if (!color) {
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
                        //var opChan = 'r';
                        var instance = meshes[m];

                        //if (! instance.command && instance.drawToDepth && instance.material && instance.layer === pc.LAYER_WORLD) {
                        if (!instance.command && instance.material) {

                            instance.onUpdateShader = onUpdateShaderOutline;
                            instance.setParameter("material_emissive", color.data3, 1<<SHADER_OUTLINE);
                            meshInstances.push(instance);
                        }
                    }
                }
            }

            app.renderer.renderComposition(outlineComp);

            cleared = false;
        } else {
            cleared = true;
        }
    });
});
