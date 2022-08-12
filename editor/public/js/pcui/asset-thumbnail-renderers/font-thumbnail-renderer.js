Object.assign(pcui, (function () {
    'use strict';

    const scene = {
        cameraEntity: null,
        model: null,
        meshInstances: null,
        previewRoot: null,
        positions: null,
        uvs: null,
        defaultScreenSpaceTextMaterial: null
    };

    let sceneInitialized = false;

    function initializeScene() {
        const app = pc.Application.getApplication();

        // camera
        scene.cameraEntity = new pc.Entity();
        scene.cameraEntity.addComponent('camera', {
            nearClip: 1,
            farClip: 32,
            clearColor: [0, 0, 0, 0],
            fov: 75,
            frustumCulling: false
        });
        scene.cameraEntity.setLocalPosition(0, 0, 1);

        const defaultTexture = new pc.Texture(app.graphicsDevice, {
            width: 1,
            height: 1,
            format: pc.PIXELFORMAT_R8_G8_B8_A8
        });
        const pixels = defaultTexture.lock();
        const pixelData = new Uint8Array(4);
        pixelData[0] = 255.0;
        pixelData[1] = 255.0;
        pixelData[2] = 255.0;
        pixelData[3] = 0.0;
        pixels.set(pixelData);
        defaultTexture.unlock();

        scene.defaultScreenSpaceTextMaterial = new pc.StandardMaterial();
        scene.defaultScreenSpaceTextMaterial.msdfMap = defaultTexture;
        scene.defaultScreenSpaceTextMaterial.useLighting = false;
        scene.defaultScreenSpaceTextMaterial.useGammaTonemap = false;
        scene.defaultScreenSpaceTextMaterial.useFog = false;
        scene.defaultScreenSpaceTextMaterial.useSkybox = false;
        scene.defaultScreenSpaceTextMaterial.diffuse = new pc.Color(0, 0, 0, 1); // black diffuse color to prevent ambient light being included
        scene.defaultScreenSpaceTextMaterial.emissive = new pc.Color(1, 1, 1, 1);
        scene.defaultScreenSpaceTextMaterial.opacity = 1;
        scene.defaultScreenSpaceTextMaterial.blendType = pc.BLEND_PREMULTIPLIED;
        scene.defaultScreenSpaceTextMaterial.depthWrite = false;
        scene.defaultScreenSpaceTextMaterial.depthTest = false;
        scene.defaultScreenSpaceTextMaterial.update();

        scene.positions = [];
        scene.uvs = [];

        const normals = [];
        const indices = [];

        // creates text mesh
        function createMesh(length) {
            scene.positions.length = 0;
            normals.length = 0;
            scene.uvs.length = 0;
            indices.length = 0;

            for (let i = 0; i < length; i++) {
                scene.positions.push(0, 0, 0);
                scene.positions.push(0, 0, 0);
                scene.positions.push(0, 0, 0);
                scene.positions.push(0, 0, 0);

                normals.push(0, 0, -1);
                normals.push(0, 0, -1);
                normals.push(0, 0, -1);
                normals.push(0, 0, -1);

                scene.uvs.push(0, 1);
                scene.uvs.push(1, 0);
                scene.uvs.push(1, 1);
                scene.uvs.push(0, 1);

                indices.push(i * 4, i * 4 + 1, i * 4 + 3);
                indices.push(i * 4 + 1, i * 4 + 2, i * 4 + 3);
            }

            return pc.createMesh(app.graphicsDevice, scene.positions, {
                normals: normals,
                uvs: scene.uvs,
                indices: indices
            });
        }

        // create one mesh per letter and add them to a scene.model
        const node = new pc.GraphNode();
        scene.model = new pc.Model();
        const meshes = [createMesh(1), createMesh(1)];
        scene.meshInstances = [
            new pc.MeshInstance(node, meshes[0], scene.defaultScreenSpaceTextMaterial),
            new pc.MeshInstance(node, meshes[1], scene.defaultScreenSpaceTextMaterial)
        ];
        scene.meshInstances[0].screenSpace = true;
        scene.meshInstances[1].screenSpace = true;
        scene.model.meshInstances.push(scene.meshInstances[0]);
        scene.model.meshInstances.push(scene.meshInstances[1]);

        // All preview objects live under this root
        scene.previewRoot = new pc.Entity();
        scene.previewRoot.enabled = true;
        scene.previewRoot.addChild(node);
        scene.previewRoot.addChild(scene.cameraEntity);
        scene.previewRoot.syncHierarchy();
        scene.previewRoot.enabled = false;

        sceneInitialized = true;
    }

    function hasChars(chars, font) {
        for (let i = 0; i < chars.length; i++)
            if (! font.data.chars[chars[i]])
                return false;

        return true;
    }

    // updates mesh scene.positions and scene.uvs based on the font and the character specified
    function updateMeshes(text, font) {
        const height = 1;
        let maxScale = -1;
        let maxYOffset = 1;
        let maxWidth = 0;

        // find maxScale and maxYOffset
        for (let i = 0; i < 2; i++) {
            const char = text[i]; // TODO: use symbol not char

            const charData = font.data.chars[char];
            if (! charData) {
                scene.meshInstances[i].visible = false;
                continue;
            }

            scene.meshInstances[i].visible = true;

            // find max character scale
            // so that we scale all smaller characters based on that value
            maxScale = Math.max(maxScale, 1 / (charData.scale || 1));

            // find max yoffset so that we line up characters a bit better in the preview
            maxYOffset = Math.min(maxYOffset, charData.yoffset / charData.height || 0);
        }

        scene.positions.length = 0;
        scene.uvs.length = 0;

        const GSCALE = 2; // global font preview scale

        for (let i = 0; i < 2; i++) {
            const char = text[i]; // TODO: use symbol not char
            const charData = font.data.chars[char];
            if (! charData) continue;

            const map = charData.map || 0;

            // scale of character relative to max scale
            let scale = 1 / (charData.scale || 1);
            scale = GSCALE * scale / maxScale;

            // yoffset of character relative to maxYOffset
            const yoffset = GSCALE * (maxYOffset - height / 2) * maxScale;

            // char offsets combined
            const ox = charData.xoffset + (charData.bounds ? charData.bounds[0] : 0);
            const oy = charData.yoffset + (charData.bounds ? charData.bounds[1] : 0);

            // char width
            const dw = GSCALE * charData.xadvance / charData.width;

            // calculate position for character
            scene.positions.push(maxWidth, yoffset, 0);
            scene.positions.push(maxWidth + dw, yoffset, 0);
            scene.positions.push(maxWidth + dw, yoffset + scale * (height - 2 * oy * charData.scale / charData.height) * maxScale, 0);
            scene.positions.push(maxWidth, yoffset + scale * (height - 2 * oy * charData.scale / charData.height) * maxScale, 0);

            // increment total width
            maxWidth += dw;

            // calculate scene.uvs
            const x1 = (charData.x + ox * charData.scale) / font.data.info.maps[map].width;
            const y1 = (charData.y + charData.height - oy * charData.scale) / font.data.info.maps[map].height;
            const x2 = (charData.x + (ox + charData.xadvance) * charData.scale) / font.data.info.maps[map].width;
            const y2 = (charData.y + oy * charData.scale) / font.data.info.maps[map].height;

            scene.uvs.push(x1, y1);
            scene.uvs.push(x2, y1);
            scene.uvs.push(x2, y2);
            scene.uvs.push(x1, y2);

            // set correct texture for character
            scene.meshInstances[i].setParameter("texture_msdfMap", font.textures[map]);
        }

        // offset scene.positions to be centered vertically
        const offset = -maxWidth / 2;
        for (let i = 0; i < scene.positions.length; i += 3) {
            scene.positions[i] += offset;
        }

        // update vertices
        for (let i = 0; i < 2; i++) {
            const vb = scene.meshInstances[i].mesh.vertexBuffer;
            const it = new pc.VertexIterator(vb);

            const numVertices = 4;
            for (let v = 0; v < numVertices; v++) {
                it.element[pc.SEMANTIC_POSITION].set(scene.positions[i * 4 * 3 + v * 3 + 0], scene.positions[i * 4 * 3 + v * 3 + 1], scene.positions[i * 4 * 3 + v * 3 + 2]);
                it.element[pc.SEMANTIC_TEXCOORD0].set(scene.uvs[i * 4 * 2 + v * 2 + 0], scene.uvs[i * 4 * 2 + v * 2 + 1]);
                it.next();
            }
            it.end();

        }

        return true;
    }

    class FontThumbnailRenderer {

        constructor(asset, canvas) {
            this._asset = asset;
            this._canvas = canvas;

            this._queueRenderHandler = this.queueRender.bind(this);

            this._watch = editor.call('assets:font:watch', {
                asset: asset,
                autoLoad: true,
                callback: this._queueRenderHandler
            });

            this._queuedRender = false;
            this._frameRequest = null;
        }

        queueRender() {
            if (this._queuedRender) return;
            if (!this._asset) return;

            this._queuedRender = true;
            this._frameRequest = requestAnimationFrame(() => {
                this.render();
            });
        }

        render() {
            this._queuedRender = false;

            if (!this._asset) return;

            if (!sceneInitialized) {
                initializeScene();
            }

            const app = pc.Application.getApplication();

            let width = this._canvas.width;
            let height = this._canvas.height;

            if (width > height)
                width = height;
            else
                height = width;

            const rt = pcui.ThumbnailRendererUtils.getRenderTarget(app, width, height);
            const layerComposition = pcui.ThumbnailRendererUtils.layerComposition;
            const layer = pcui.ThumbnailRendererUtils.layer;

            scene.previewRoot.enabled = true;
            scene.previewRoot._notifyHierarchyStateChanged(scene.previewRoot, true);

            scene.cameraEntity.camera.aspectRatio = height / width;
            layer.renderTarget = rt;

            const engineAsset = app.assets.get(this._asset.get('id'));

            // skip if the font isn't ready
            if (! engineAsset || ! engineAsset.resource || ! engineAsset.resource.textures || ! engineAsset.resource.textures.length || ! engineAsset.resource.data || ! engineAsset.resource.data.chars) {
                app.renderComposition(layerComposition);
            } else {
                // try to use Aa as the text in different languages
                // and if that is not found try the first two characters of the font
                let text;

                // latin
                if (hasChars('Aa', engineAsset.resource)) {
                    text = 'Aa';
                }
                // greek
                else if (hasChars('Αα', engineAsset.resource)) {
                    text = 'Αα';
                }
                // cyrillic
                else if (hasChars('Аа', engineAsset.resource)) {
                    text = 'Аа';
                }
                // rest
                else {
                    text = '';
                    const chars = this._asset.get('meta.chars');
                    for (let i = 0, len = chars.length; i < len && text.length < 2; i++) {

                        // skip space character
                        if (/\s/.test(chars[i]))
                            continue;

                        // skip characters which doesn't exists in character set
                        if (!engineAsset.resource.data.chars.hasOwnProperty(chars[i]))
                            continue;

                        text += chars[i];
                    }
                }

                // set the font texture based on which characters we chose to display
                // scene.defaultScreenSpaceTextMaterial.msdfMap = engineAsset.resource.textures[0];
                scene.defaultScreenSpaceTextMaterial.setParameter('font_sdfIntensity', this._asset.get('data.intensity'));

                if (text){

                    const char = engineAsset.resource.data.chars[text[0]];
                    const pxRange = (char && char.range) ? ((char.scale || 1) * char.range) : 2;
                    scene.defaultScreenSpaceTextMaterial.setParameter('font_pxrange', pxRange);

                    const map = char.map || 0;
                    scene.defaultScreenSpaceTextMaterial.setParameter('font_textureWidth', engineAsset.resource.data.info.maps[map].width);

                    scene.defaultScreenSpaceTextMaterial.setParameter('outline_thickness', 0);

                    const shadowOffsetUniform = new Float32Array([0, 0]);
                    scene.defaultScreenSpaceTextMaterial.setParameter('shadow_offset', shadowOffsetUniform);

                    scene.defaultScreenSpaceTextMaterial.update();

                    updateMeshes(text, engineAsset.resource);

                    layer.addMeshInstances(scene.model.meshInstances);
                    layer.addCamera(scene.cameraEntity.camera);

                    // add camera to layer
                    let backupLayers = scene.cameraEntity.camera.layers.slice();
                    let newLayers = scene.cameraEntity.camera.layers;
                    newLayers.push(layer.id);
                    scene.cameraEntity.camera.layers = newLayers;

                    app.renderComposition(layerComposition);

                    // restore camera layers
                    scene.cameraEntity.camera.layers = backupLayers;


                    // read pixels from texture
                    const device = app.graphicsDevice;
                    device.gl.bindFramebuffer(device.gl.FRAMEBUFFER, rt.impl._glFrameBuffer);
                    device.gl.readPixels(0, 0, width, height, device.gl.RGBA, device.gl.UNSIGNED_BYTE, rt.pixels);

                    // render to canvas
                    const ctx = this._canvas.getContext('2d');
                    ctx.putImageData(new ImageData(rt.pixelsClamped, width, height), (this._canvas.width - width) / 2, (this._canvas.height - height) / 2);

                    layer.removeMeshInstances(scene.model.meshInstances);
                    layer.removeCamera(scene.cameraEntity.camera);
                }
            }

            scene.previewRoot.enabled = false;
            layer.renderTarget = null;
        }

        destroy() {
            if (this._watch) {
                editor.call('assets:font:unwatch', this._asset, this._watch);
                this._watch = null;
            }

            if (this._frameRequest) {
                cancelAnimationFrame(this._frameRequest);
                this._frameRequest = null;
            }

            this._asset = null;
            this._canvas = null;
        }
    }

    return {
        FontThumbnailRenderer: FontThumbnailRenderer
    };
})());
