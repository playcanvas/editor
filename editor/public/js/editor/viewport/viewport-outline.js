editor.once('load', function () {
    'use strict';

    const app = editor.call('viewport:app');
    if (!app) return; // webgl not available

    const renderer = app.renderer;
    const device = renderer.device;

    const users = [];
    const selection = { };
    const colors = { };
    const colorUniform = new Float32Array(3);

    let render = 0;
    let cleared = false;
    let visible = true;
    let viewportLayer = null;

    let targets = [];
    let textures = [];

    const createSolidTex = function (name, r, g, b, a) {
        const result = new pc.Texture(app.graphicsDevice, { width: 1, height: 1, format: pc.PIXELFORMAT_R8_G8_B8_A8 });
        result.name = name;
        const pixels = result.lock();
        pixels.set(new Uint8Array([r, g, b, a]));
        result.unlock();
        return result;
    };

    const whiteTex = createSolidTex('outline-tex', 255, 255, 255, 255);

    const SHADER_OUTLINE = 24;

    const isSelectableEntity = function (item) {

        if (item && item.entity) {

            // model component
            const modelType = item.get('components.model.type');
            if ((modelType === 'asset' && item.get('components.model.asset')) || modelType !== 'asset') {
                return true;
            }

            // render component
            const renderType = item.get('components.render.type');
            if ((renderType === 'asset' && item.get('components.render.asset')) || renderType !== 'asset') {
                return true;
            }
        }

        return false;
    };

    editor.on('selector:change', function (type, items) {
        if (selection[config.self.id])
            render -= selection[config.self.id].length;

        if (!selection[config.self.id])
            users.unshift(config.self.id);

        selection[config.self.id] = [];

        if (type === 'entity') {
            for (let i = 0; i < items.length; i++) {

                if (isSelectableEntity(items[i])) {
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

    editor.on('selector:sync', function (user, data) {
        if (selection[user])
            render -= selection[user].length;

        if (!selection[user])
            users.push(user);

        selection[user] = [];

        if (data.type === 'entity') {
            for (let i = 0; i < data.ids.length; i++) {
                const entity = editor.call('entities:get', data.ids[i]);

                if (isSelectableEntity(entity)) {
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

    editor.on('whoisonline:remove', function (id) {
        if (!selection[id])
            return;

        render -= selection[id].length;

        delete selection[id];
        delete colors[id];
        const ind = users.indexOf(id);
        users.splice(ind, 1);
    });

    editor.method('viewport:outline:visible', function (state) {
        if (state !== visible) {
            visible = state;
            render++;
            editor.call('viewport:render');
        }
    });

    // ### OVERLAY QUAD MATERIAL ###
    const chunks = pc.shaderChunks;
    const shaderFinal = chunks.createShaderFromCode(device, chunks.fullscreenQuadVS, chunks.outputTex2DPS, "outputTex2D");

    // ### OUTLINE EXTEND SHADER H ###
    const shaderBlurHPS = `
precision ${device.precision} float;

varying vec2 vUv0;

uniform float uOffset;
uniform sampler2D source;

void main(void)
{
    float diff = 0.0;
    vec4 pixel;
    vec4 texel = texture2D(source, vUv0);
    vec4 firstTexel = texel;

    pixel = texture2D(source, vUv0 + vec2(uOffset * -2.0, 0.0));
    texel = max(texel, pixel);
    diff = max(diff, length(firstTexel.rgb - pixel.rgb));

    pixel = texture2D(source, vUv0 + vec2(uOffset * -1.0, 0.0));
    texel = max(texel, pixel);
    diff = max(diff, length(firstTexel.rgb - pixel.rgb));

    pixel = texture2D(source, vUv0 + vec2(uOffset * +1.0, 0.0));
    texel = max(texel, pixel);
    diff = max(diff, length(firstTexel.rgb - pixel.rgb));

     pixel = texture2D(source, vUv0 + vec2(uOffset * +2.0, 0.0));
    texel = max(texel, pixel);
    diff = max(diff, length(firstTexel.rgb - pixel.rgb));

    gl_FragColor = vec4(texel.rgb, min(diff, 1.0));
}
        `.trim();
    const shaderBlurH = chunks.createShaderFromCode(device, chunks.fullscreenQuadVS, shaderBlurHPS, "editorOutlineH");

    // ### OUTLINE EXTEND SHADER V ###
    const shaderBlurVPS = `
precision ${device.precision} float;

varying vec2 vUv0;

uniform float uOffset;
uniform sampler2D source;

void main(void)
{
    vec4 pixel;
    vec4 texel = texture2D(source, vUv0);
    vec4 firstTexel = texel;
    float diff = texel.a;

    pixel = texture2D(source, vUv0 + vec2(0.0, uOffset * -2.0));
    texel = max(texel, pixel);
    diff = max(diff, length(firstTexel.rgb - pixel.rgb));

    pixel = texture2D(source, vUv0 + vec2(0.0, uOffset * -1.0));
    texel = max(texel, pixel);
    diff = max(diff, length(firstTexel.rgb - pixel.rgb));

    pixel = texture2D(source, vUv0 + vec2(0.0, uOffset * +1.0));
    texel = max(texel, pixel);
    diff = max(diff, length(firstTexel.rgb - pixel.rgb));

    pixel = texture2D(source, vUv0 + vec2(0.0, uOffset * +2.0));
    texel = max(texel, pixel);
    diff = max(diff, length(firstTexel.rgb - pixel.rgb));

    gl_FragColor = vec4(texel.rgb, min(diff, 1.0));
}
        `.trim();
    const shaderBlurV = chunks.createShaderFromCode(device, chunks.fullscreenQuadVS, shaderBlurVPS, "editorOutlineV");


    // ### SETUP THE LAYER ###
    viewportLayer = editor.call('gizmo:layers', 'Viewport Outline');
    viewportLayer.onPostRender = function () {
        const uColorBuffer = device.scope.resolve('source');
        uColorBuffer.setValue(textures[0]);
        device.setBlending(true);
        device.setBlendFunction(pc.BLENDMODE_SRC_ALPHA, pc.BLENDMODE_ONE_MINUS_SRC_ALPHA);
        pc.drawQuadWithShader(device, null, shaderFinal, null, null, true);
    };

    const outlineLayer = new pc.Layer({
        name: "Outline",
        opaqueSortMode: pc.SORTMODE_NONE,
        passThrough: true,
        overrideClear: true,
        clearColorBuffer: true,
        clearDepthBuffer: true,
        clearColor: new pc.Color(0, 0, 0, 0),
        shaderPass: SHADER_OUTLINE,

        onPostRender: function () {
            // extend pass X
            const uOffset = device.scope.resolve('uOffset');
            const uColorBuffer = device.scope.resolve('source');
            uOffset.setValue(1.0 / device.width / 2.0);
            uColorBuffer.setValue(textures[0]);
            pc.drawQuadWithShader(device, targets[1], shaderBlurH);

            // extend pass Y
            uOffset.setValue(1.0 / device.height / 2.0);
            uColorBuffer.setValue(textures[1]);
            pc.drawQuadWithShader(device, targets[0], shaderBlurV);
        }
    });
    const outlineComp = new pc.LayerComposition("viewport-outline");
    outlineComp.pushOpaque(outlineLayer);

    const onUpdateShaderOutline = function (options) {
        if (options.pass !== SHADER_OUTLINE) return options;
        const outlineOptions = {
            opacityMap: options.opacityMap,
            opacityMapUv: options.opacityMapUv,
            opacityMapChannel: options.opacityMapChannel,
            opacityMapTransform: options.opacityMapTransform,
            opacityVertexColor: options.opacityVertexColor,
            opacityVertexColorChannel: options.opacityVertexColorChannel,
            vertexColors: options.vertexColors,
            alphaTest: options.alphaTest,
            skin: options.skin
        };
        return outlineOptions;
    };

    // ### RENDER EVENT ###
    editor.on('viewport:postUpdate', function () {
        if (!render && cleared) return;

        if (!render && !cleared) {
            viewportLayer.enabled = false;
        }

        // ### INIT/RESIZE RENDERTARGETS ###
        if (targets[0] && (targets[0].width !== device.width || targets[1].height !== device.height)) {
            for (let i = 0; i < 2; i++) {
                targets[i].destroy();
                textures[i].destroy();
            }
            targets = [];
            textures = [];
        }
        if (!targets[0]) {
            for (let i = 0; i < 2; i++) {
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


        const camera = editor.call('camera:current').camera;


        if (render) {
            // ### RENDER COLORED MESHINSTANCES TO RT0 ###

            outlineLayer.renderTarget = targets[0];
            outlineLayer.clearMeshInstances();
            if (outlineLayer.cameras[0] !== camera) {
                outlineLayer.clearCameras();
                outlineLayer.addCamera(camera);
            }
            const meshInstances = outlineLayer.opaqueMeshInstances;

            if (visible) {
                for (let u = 0; u < users.length; u++) {
                    const id = parseInt(users[u], 10);

                    if (!selection.hasOwnProperty(id) || !selection[id].length)
                        continue;

                    let color = colors[id];
                    if (!color) {
                        let data = editor.call('users:color', id, 'data');

                        if (config.self.id === id)
                            data = [1, 1, 1];

                        colors[id] = new pc.Color(data[0], data[1], data[2]);
                        color = colors[id];
                    }

                    for (let i = 0; i < selection[id].length; i++) {
                        if (!selection[id][i])
                            continue;

                        let srcMeshInstances = null;

                        const modelComp = selection[id][i].model;
                        if (modelComp && modelComp.model) {
                            srcMeshInstances = modelComp.meshInstances;
                        }

                        const renderComp = selection[id][i].render;
                        if (renderComp) {
                            srcMeshInstances = renderComp.meshInstances;
                        }

                        if (!srcMeshInstances)
                            continue;

                        for (let m = 0; m < srcMeshInstances.length; m++) {
                            // let opChan = 'r';
                            const instance = srcMeshInstances[m];

                            // if (! instance.command && instance.drawToDepth && instance.material && instance.layer === pc.LAYER_WORLD) {
                            if (!instance.command && instance.material) {

                                instance.onUpdateShader = onUpdateShaderOutline;
                                colorUniform[0] = color.r;
                                colorUniform[1] = color.g;
                                colorUniform[2] = color.b;
                                instance.setParameter("material_emissive", colorUniform, 1 << SHADER_OUTLINE);
                                instance.setParameter("texture_emissiveMap", whiteTex, 1 << SHADER_OUTLINE);
                                meshInstances.push(instance);
                            }
                        }
                    }
                }
            }

            // add camera to layer
            const backupLayers = camera.layers.slice();
            const newLayers = camera.layers;
            newLayers.push(outlineLayer.id);
            camera.layers = newLayers;

            app.renderer.renderComposition(outlineComp);

            // restore camera layers
            camera.layers = backupLayers;

            cleared = false;
        } else {
            cleared = true;
        }
    });
});
